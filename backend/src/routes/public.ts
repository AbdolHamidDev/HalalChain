import { Router } from "express";
import { buildTraceabilityTimeline } from "../lib/traceabilityEngine";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /api/public/products/:id/traceability
 * Public endpoint — no authentication required.
 * Returns enriched traceability data including product, supplier, certificates, shipments, and timeline.
 */
router.get("/products/:id/traceability", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Build the timeline (throws Error("PRODUCT_NOT_FOUND") if product doesn't exist)
    const { product, timeline } = await buildTraceabilityTimeline(id);

    // Fetch additional data in parallel: supplier info, certificates, shipments
    const productWithDetails = await prisma.product.findUnique({
      where: { id },
      select: {
        supplier: {
          select: {
            name: true,
            country: true,
            halalCertificates: {
              select: {
                certificateNumber: true,
                expiryDate: true,
                issuedBy: true,
              },
              orderBy: { expiryDate: "desc" },
            },
          },
        },
        purchaseOrderItems: {
          select: {
            purchaseOrder: {
              select: {
                shipments: {
                  select: {
                    trackingNumber: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // productWithDetails will exist because buildTraceabilityTimeline already confirmed product exists
    const supplier = productWithDetails!.supplier;

    // Flatten and deduplicate shipments across all purchase orders
    const shipmentMap = new Map<
      string,
      { trackingNumber: string; status: string }
    >();
    for (const item of productWithDetails!.purchaseOrderItems) {
      for (const shipment of item.purchaseOrder.shipments) {
        if (!shipmentMap.has(shipment.trackingNumber)) {
          shipmentMap.set(shipment.trackingNumber, {
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
          });
        }
      }
    }

    return res.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
      },
      supplier: {
        name: supplier.name,
        country: supplier.country,
      },
      certificates: supplier.halalCertificates.map((cert) => ({
        certificateNumber: cert.certificateNumber,
        expiryDate: cert.expiryDate.toISOString().split("T")[0],
        issuedBy: cert.issuedBy,
      })),
      shipments: Array.from(shipmentMap.values()),
      timeline,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ error: "Product not found" });
    }
    next(err);
  }
});

export default router;
