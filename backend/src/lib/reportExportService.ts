import { Response } from "express";
import { PrismaClient } from "@prisma/client";

type ExportFormat = "csv" | "xlsx" | "pdf";
type ExportModule =
  | "products"
  | "inventory"
  | "suppliers"
  | "certificates"
  | "purchase-orders"
  | "shipments";

export interface ExportRange {
  from?: Date;
  to?: Date;
}

interface Column<T> {
  header: string;
  value: (row: T) => string | number | Date | null | undefined;
}

interface Dataset<T> {
  filename: string;
  title: string;
  rows: T[];
  columns: Column<T>[];
}

export async function exportReport(
  prisma: PrismaClient,
  moduleName: ExportModule,
  format: ExportFormat,
  range: ExportRange,
  res: Response
) {
  const dataset = await loadDataset(prisma, moduleName, range);

  if (format === "csv") return streamCsv(dataset, res);
  if (format === "xlsx") return sendSpreadsheetXml(dataset, res);
  return sendPdf(dataset, res);
}

async function loadDataset(
  prisma: PrismaClient,
  moduleName: ExportModule,
  range: ExportRange
): Promise<Dataset<Record<string, unknown>>> {
  const createdAt = dateWhere(range);

  switch (moduleName) {
    case "products": {
      const rows = await prisma.product.findMany({
        where: createdAt ? { createdAt } : undefined,
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { name: true, country: true } } },
      });
      return {
        filename: "halalchain-products",
        title: "Products",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "Name", value: (r) => String(r.name ?? "") },
          { header: "SKU", value: (r) => String(r.sku ?? "") },
          { header: "Category", value: (r) => String(r.category ?? "") },
          { header: "Unit", value: (r) => String(r.unit ?? "") },
          { header: "Unit Price", value: (r) => String(r.unitPrice ?? "") },
          { header: "Supplier", value: (r) => nested(r, "supplier", "name") },
          { header: "Country", value: (r) => nested(r, "supplier", "country") },
          { header: "Created", value: (r) => dateValue(r.createdAt) },
        ],
      };
    }
    case "inventory": {
      const rows = await prisma.inventory.findMany({
        where: dateWhere(range, "updatedAt") ? { updatedAt: dateWhere(range, "updatedAt") } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          product: { select: { name: true, sku: true, unit: true, unitPrice: true } },
          warehouse: { select: { name: true, location: true } },
        },
      });
      return {
        filename: "halalchain-inventory",
        title: "Inventory",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "Product", value: (r) => nested(r, "product", "name") },
          { header: "SKU", value: (r) => nested(r, "product", "sku") },
          { header: "Warehouse", value: (r) => nested(r, "warehouse", "name") },
          { header: "Location", value: (r) => nested(r, "warehouse", "location") },
          { header: "Quantity", value: (r) => Number(r.quantity ?? 0) },
          { header: "Reorder Level", value: (r) => Number(r.reorderLevel ?? 0) },
          { header: "Unit Price", value: (r) => nested(r, "product", "unitPrice") },
          {
            header: "Value",
            value: (r) => Number(r.quantity ?? 0) * Number(nested(r, "product", "unitPrice") || 0),
          },
        ],
      };
    }
    case "suppliers": {
      const rows = await prisma.supplier.findMany({
        where: createdAt ? { createdAt } : undefined,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { products: true, halalCertificates: true } } },
      });
      return {
        filename: "halalchain-suppliers",
        title: "Suppliers",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "Name", value: (r) => String(r.name ?? "") },
          { header: "Country", value: (r) => String(r.country ?? "") },
          { header: "Email", value: (r) => String(r.email ?? "") },
          { header: "Phone", value: (r) => String(r.phone ?? "") },
          { header: "Status", value: (r) => String(r.status ?? "") },
          { header: "Products", value: (r) => nested(r, "_count", "products") },
          { header: "Certificates", value: (r) => nested(r, "_count", "halalCertificates") },
        ],
      };
    }
    case "certificates": {
      const rows = await prisma.halalCertificate.findMany({
        where: dateWhere(range, "issueDate") ? { issueDate: dateWhere(range, "issueDate") } : undefined,
        orderBy: { expiryDate: "asc" },
        include: { supplier: { select: { name: true, country: true } } },
      });
      return {
        filename: "halalchain-certificates",
        title: "Certificates",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "Certificate Number", value: (r) => String(r.certificateNumber ?? "") },
          { header: "Issued By", value: (r) => String(r.issuedBy ?? "") },
          { header: "Supplier", value: (r) => nested(r, "supplier", "name") },
          { header: "Issue Date", value: (r) => dateValue(r.issueDate) },
          { header: "Expiry Date", value: (r) => dateValue(r.expiryDate) },
          { header: "Status", value: (r) => certificateStatus(r.expiryDate) },
        ],
      };
    }
    case "purchase-orders": {
      const rows = await prisma.purchaseOrder.findMany({
        where: createdAt ? { createdAt } : undefined,
        orderBy: { createdAt: "desc" },
        include: { supplier: { select: { name: true, country: true } }, _count: { select: { items: true } } },
      });
      return {
        filename: "halalchain-purchase-orders",
        title: "Purchase Orders",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "PO Number", value: (r) => String(r.poNumber ?? "") },
          { header: "Supplier", value: (r) => nested(r, "supplier", "name") },
          { header: "Status", value: (r) => String(r.status ?? "") },
          { header: "Items", value: (r) => nested(r, "_count", "items") },
          { header: "Total Amount", value: (r) => String(r.totalAmount ?? "") },
          { header: "Created", value: (r) => dateValue(r.createdAt) },
        ],
      };
    }
    case "shipments": {
      const rows = await prisma.shipment.findMany({
        where: dateWhere(range, "estimatedArrival")
          ? { estimatedArrival: dateWhere(range, "estimatedArrival") }
          : undefined,
        orderBy: { estimatedArrival: "asc" },
        include: {
          purchaseOrder: {
            select: { poNumber: true, supplier: { select: { name: true, country: true } } },
          },
        },
      });
      return {
        filename: "halalchain-shipments",
        title: "Shipments",
        rows: rows as unknown as Record<string, unknown>[],
        columns: [
          { header: "Tracking Number", value: (r) => String(r.trackingNumber ?? "") },
          { header: "PO Number", value: (r) => nested(r, "purchaseOrder", "poNumber") },
          { header: "Supplier", value: (r) => nested2(r, "purchaseOrder", "supplier", "name") },
          { header: "Origin", value: (r) => String(r.origin ?? "") },
          { header: "Destination", value: (r) => String(r.destination ?? "") },
          { header: "Status", value: (r) => String(r.status ?? "") },
          { header: "Estimated Arrival", value: (r) => dateValue(r.estimatedArrival) },
          { header: "Shipped At", value: (r) => dateValue(r.shippedAt) },
        ],
      };
    }
  }
}

function streamCsv<T>(dataset: Dataset<T>, res: Response) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${dataset.filename}.csv"`);
  res.write(`${dataset.columns.map((c) => csvEscape(c.header)).join(",")}\n`);
  for (const row of dataset.rows) {
    res.write(`${dataset.columns.map((c) => csvEscape(formatCell(c.value(row)))).join(",")}\n`);
  }
  res.end();
}

function sendSpreadsheetXml<T>(dataset: Dataset<T>, res: Response) {
  const body = [
    "<?xml version=\"1.0\"?>",
    "<?mso-application progid=\"Excel.Sheet\"?>",
    "<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">",
    `<Worksheet ss:Name="${xmlEscape(dataset.title.slice(0, 31))}"><Table>`,
    rowXml(dataset.columns.map((c) => c.header)),
    ...dataset.rows.map((row) => rowXml(dataset.columns.map((c) => formatCell(c.value(row))))),
    "</Table></Worksheet></Workbook>",
  ].join("");

  res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${dataset.filename}.xlsx"`);
  res.send(body);
}

function sendPdf<T>(dataset: Dataset<T>, res: Response) {
  const lines = [
    dataset.title,
    `Generated: ${new Date().toISOString()}`,
    "",
    dataset.columns.map((c) => c.header).join(" | "),
    ...dataset.rows.slice(0, 500).map((row) => dataset.columns.map((c) => formatCell(c.value(row))).join(" | ")),
  ];
  const pdf = createSimplePdf(lines);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${dataset.filename}.pdf"`);
  res.send(pdf);
}

function createSimplePdf(lines: string[]): Buffer {
  const escaped = lines
    .map((line, index) => `BT /F1 9 Tf 40 ${780 - index * 14} Td (${pdfEscape(line.slice(0, 130))}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(escaped)} >>\nstream\n${escaped}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

function rowXml(values: string[]) {
  return `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`).join("")}</Row>`;
}

function dateWhere(range: ExportRange, _field = "createdAt") {
  if (!range.from && !range.to) return undefined;
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  };
}

function certificateStatus(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 90);
  if (date <= now) return "EXPIRED";
  if (date <= soon) return "EXPIRING_SOON";
  return "VALID";
}

function nested(row: Record<string, unknown>, key: string, child: string): string {
  const value = row[key];
  if (!value || typeof value !== "object") return "";
  return formatCell((value as Record<string, unknown>)[child]);
}

function nested2(row: Record<string, unknown>, key: string, child: string, grandchild: string): string {
  const value = row[key];
  if (!value || typeof value !== "object") return "";
  return nested(value as Record<string, unknown>, child, grandchild);
}

function dateValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return dateValue(value);
  return String(value);
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
