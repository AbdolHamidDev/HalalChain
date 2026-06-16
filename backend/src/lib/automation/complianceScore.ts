import { PrismaClient, ShipmentStatus } from "@prisma/client";
import type { ComplianceFactor, ComplianceScore } from "./types";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export interface ComplianceScoreParams {
  expiredCertsCount: number;
  expiringCertsCount: number;
  delayedShipmentsCount: number;
  totalShipmentsCount: number;
  lowStockItemsCount: number;
  totalInventoryItemsCount: number;
  totalSuppliers: number;
  suppliersWithoutCerts: number;
}

/**
 * Compute the overall platform compliance score (0–100).
 *
 * Formula:
 *   Score = 100 - Total Deductions
 *
 * Factors:
 *   1. Expired Certificates    — 30pt penalty if ANY expired
 *   2. Expiring Certificates   — 15pt penalty if ANY expiring within 30 days
 *   3. Delayed Shipments       — Proportional penalty up to 20pt
 *   4. Low Inventory           — Proportional penalty up to 15pt
 *   5. Certificate Coverage    — Proportional penalty up to 20pt
 *
 * The score is transparent: each factor's deduction is returned with an explanation.
 */
export function computeComplianceScore(params: ComplianceScoreParams): ComplianceScore {
  const factors: ComplianceFactor[] = [];
  let totalDeductions = 0;

  // Factor 1: Expired Certificates (weight: 30)
  const expiredDeduction = params.expiredCertsCount > 0
    ? Math.min(30, 30) // Full 30 if any expired
    : 0;
  factors.push({
    factor: "Expired Certificates",
    weight: 30,
    deduction: expiredDeduction,
    detail: params.expiredCertsCount > 0
      ? `${params.expiredCertsCount} expired certificate(s) — full penalty applied`
      : "No expired certificates",
  });
  totalDeductions += expiredDeduction;

  // Factor 2: Expiring Certificates (weight: 15)
  const expiringDeduction = params.expiringCertsCount > 0
    ? Math.min(15, 15) // Full 15 if any expiring
    : 0;
  factors.push({
    factor: "Expiring Certificates",
    weight: 15,
    deduction: expiringDeduction,
    detail: params.expiringCertsCount > 0
      ? `${params.expiringCertsCount} certificate(s) expiring within 30 days — full penalty applied`
      : "No certificates expiring within 30 days",
  });
  totalDeductions += expiringDeduction;

  // Factor 3: Delayed Shipments (weight: 20, proportional)
  const delayedRatio = params.totalShipmentsCount > 0
    ? params.delayedShipmentsCount / params.totalShipmentsCount
    : 0;
  const delayedDeduction = Math.round(delayedRatio * 20 * 10) / 10; // Round to 1 decimal
  factors.push({
    factor: "Delayed Shipments",
    weight: 20,
    deduction: Math.min(delayedDeduction, 20),
    detail: params.totalShipmentsCount > 0
      ? `${params.delayedShipmentsCount}/${params.totalShipmentsCount} shipments delayed (${(delayedRatio * 100).toFixed(0)}%)`
      : "No shipments tracked",
  });
  totalDeductions += Math.min(delayedDeduction, 20);

  // Factor 4: Low Inventory (weight: 15, proportional)
  const lowStockRatio = params.totalInventoryItemsCount > 0
    ? params.lowStockItemsCount / params.totalInventoryItemsCount
    : 0;
  const lowStockDeduction = Math.round(lowStockRatio * 15 * 10) / 10;
  factors.push({
    factor: "Low Inventory Items",
    weight: 15,
    deduction: Math.min(lowStockDeduction, 15),
    detail: params.totalInventoryItemsCount > 0
      ? `${params.lowStockItemsCount}/${params.totalInventoryItemsCount} items below reorder level (${(lowStockRatio * 100).toFixed(0)}%)`
      : "No inventory items tracked",
  });
  totalDeductions += Math.min(lowStockDeduction, 15);

  // Factor 5: Certificate Coverage (weight: 20, proportional)
  const uncoveredRatio = params.totalSuppliers > 0
    ? params.suppliersWithoutCerts / params.totalSuppliers
    : 0;
  const coverageDeduction = Math.round(uncoveredRatio * 20 * 10) / 10;
  factors.push({
    factor: "Certificate Coverage",
    weight: 20,
    deduction: Math.min(coverageDeduction, 20),
    detail: params.totalSuppliers > 0
      ? `${params.suppliersWithoutCerts}/${params.totalSuppliers} suppliers without active certificates (${(uncoveredRatio * 100).toFixed(0)}%)`
      : "No suppliers tracked",
  });
  totalDeductions += Math.min(coverageDeduction, 20);

  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

  return { score, factors };
}

/**
 * Load the data needed for compliance scoring from the database.
 */
export async function loadComplianceScoreData(
  tx: TxClient,
): Promise<ComplianceScoreParams> {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    expiredCertsCount,
    expiringCertsCount,
    delayedShipmentsCount,
    totalShipmentsCount,
    lowStockItemsCount,
    totalInventoryItemsCount,
    totalSuppliers,
    suppliersWithCerts,
  ] = await Promise.all([
    tx.halalCertificate.count({ where: { expiryDate: { lt: now } } }),
    tx.halalCertificate.count({
      where: { expiryDate: { gte: now, lte: thirtyDaysFromNow } },
    }),
    tx.shipment.count({ where: { status: ShipmentStatus.DELAYED } }),
    tx.shipment.count(),
    tx.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count
      FROM inventory
      WHERE quantity <= reorder_level
    `.then((rows) => Number(rows[0]?.count ?? 0)),
    tx.inventory.count(),
    tx.supplier.count({ where: { status: "ACTIVE" } }),
    tx.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT s.id)::bigint AS count
      FROM suppliers s
      JOIN halal_certificates hc ON hc.supplier_id = s.id
      WHERE s.status = 'ACTIVE' AND hc.expiry_date > ${now}
    `.then((rows) => Number(rows[0]?.count ?? 0)),
  ]);

  const suppliersWithoutCerts = Math.max(0, totalSuppliers - suppliersWithCerts);

  return {
    expiredCertsCount,
    expiringCertsCount,
    delayedShipmentsCount,
    totalShipmentsCount,
    lowStockItemsCount,
    totalInventoryItemsCount,
    totalSuppliers,
    suppliersWithoutCerts,
  };
}