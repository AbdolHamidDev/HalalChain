import { prisma } from "./prisma";

export interface TimelineEvent {
  type:
    | "SUPPLIER"
    | "CERTIFICATE"
    | "PRODUCT"
    | "PURCHASE_ORDER"
    | "SHIPMENT"
    | "INVENTORY";
  date: string; // ISO 8601
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

export async function buildTraceabilityTimeline(productId: string): Promise<{
  product: { id: string; name: string; sku: string };
  timeline: TimelineEvent[];
}> {
  // Query product with supplier (include halalCertificates) and inventoryMovements (include warehouse)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      supplier: {
        include: { halalCertificates: true },
      },
      inventoryMovements: {
        include: { warehouse: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  // Query purchaseOrderItem where productId, include purchaseOrder (include shipments)
  const poItems = await prisma.purchaseOrderItem.findMany({
    where: { productId },
    include: {
      purchaseOrder: {
        include: { shipments: true },
      },
    },
  });

  const events: TimelineEvent[] = [];

  // SUPPLIER event
  events.push({
    type: "SUPPLIER",
    date: product.supplier.createdAt.toISOString(),
    title: `Supplier: ${product.supplier.name}`,
    description: `${product.supplier.country} · ${product.supplier.status}`,
    metadata: {
      supplierId: product.supplier.id,
      supplierName: product.supplier.name,
      country: product.supplier.country,
      status: product.supplier.status,
    },
  });

  // CERTIFICATE events (one per cert linked to the supplier)
  for (const cert of product.supplier.halalCertificates) {
    events.push({
      type: "CERTIFICATE",
      date: cert.issueDate.toISOString(),
      title: `Certificate: ${cert.certificateNumber}`,
      description: `Issued by ${cert.issuedBy} · Expires ${cert.expiryDate.toISOString().split("T")[0]}`,
      metadata: {
        certificateId: cert.id,
        certificateNumber: cert.certificateNumber,
        issuedDate: cert.issueDate.toISOString(),
        expiryDate: cert.expiryDate.toISOString(),
        issuingBody: cert.issuedBy,
      },
    });
  }

  // PRODUCT event
  events.push({
    type: "PRODUCT",
    date: product.createdAt.toISOString(),
    title: `Product: ${product.name}`,
    description: `SKU: ${product.sku}`,
    metadata: {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    },
  });

  // Deduplicate purchase orders (a product can appear in multiple items of the same PO)
  const seenPoIds = new Set<string>();
  for (const item of poItems) {
    const po = item.purchaseOrder;

    // PURCHASE_ORDER event (once per unique PO)
    if (!seenPoIds.has(po.id)) {
      seenPoIds.add(po.id);
      events.push({
        type: "PURCHASE_ORDER",
        date: po.createdAt.toISOString(),
        title: `Purchase Order: ${po.poNumber}`,
        description: `Status: ${po.status} · Total: ${po.totalAmount.toString()}`,
        metadata: {
          poId: po.id,
          poNumber: po.poNumber,
          status: po.status,
          totalAmount: po.totalAmount.toString(),
        },
      });

      // SHIPMENT events for this PO
      for (const shipment of po.shipments) {
        // Use shippedAt if available, fall back to estimatedArrival, then current date
        const shipmentDate =
          shipment.shippedAt ??
          shipment.estimatedArrival ??
          new Date();

        events.push({
          type: "SHIPMENT",
          date: shipmentDate.toISOString(),
          title: `Shipment: ${shipment.trackingNumber}`,
          description: `${shipment.origin} → ${shipment.destination} · ${shipment.status}`,
          metadata: {
            shipmentId: shipment.id,
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            origin: shipment.origin,
            destination: shipment.destination,
          },
        });
      }
    }
  }

  // INVENTORY events
  for (const movement of product.inventoryMovements) {
    events.push({
      type: "INVENTORY",
      date: movement.createdAt.toISOString(),
      title: `Inventory ${movement.type}: ${movement.quantity} units`,
      description: `Warehouse: ${movement.warehouse.name}`,
      metadata: {
        movementId: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        warehouseName: movement.warehouse.name,
      },
    });
  }

  // Sort events ascending by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
    },
    timeline: events,
  };
}
