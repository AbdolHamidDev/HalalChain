const API_BASE =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";
export type SupplierStatus = "ACTIVE" | "INACTIVE";
export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "SHIPPING" | "RECEIVED";
export type ShipmentStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "DELAYED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  email: string | null;
  phone: string | null;
  status: SupplierStatus;
  createdAt: string;
  _count?: { products: number; halalCertificates: number };
}

export interface Product {
  id: string;
  supplierId: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  unitPrice: string | number;
  createdAt: string;
  supplier?: { id: string; name: string; country: string };
  inventory?: { quantity: number }[];
}

export interface HalalCertificate {
  id: string;
  supplierId: string;
  certificateNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string | null;
  supplier?: { id: string; name: string; country: string };
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface InventoryRow {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reorderLevel: number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    unitPrice: string | number;
    supplier: { name: string; country: string };
  };
  warehouse: { id: string; name: string; location: string };
}

export interface InventoryMovement {
  id: string;
  type: "INBOUND" | "OUTBOUND";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string; sku: string };
  warehouse: { name: string };
  user: { name: string } | null;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  totalAmount: string | number;
  createdAt: string;
  supplier?: { id: string; name: string; country: string };
  shipments?: { id: string; status: string; trackingNumber: string }[];
}

export interface Shipment {
  id: string;
  purchaseOrderId: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedArrival: string | null;
  purchaseOrder?: {
    poNumber: string;
    status: string;
    supplier: { name: string; country: string };
  };
}

export interface DashboardStats {
  kpis: {
    totalSuppliers: number;
    activeCertificates: number;
    expiringSoonCertificates: number;
    inventoryValue: number;
    pendingShipments: number;
  };
  charts: {
    inventoryTrend: { month: string; quantity: number }[];
    purchaseOrdersPerMonth: { month: string; orders: number }[];
    supplierDistribution: { name: string; value: number; color: string }[];
    certificateExpiryTimeline: { month: string; expiring: number }[];
  };
}

export interface ReportSummary {
  summary: {
    activeSuppliers: number;
    suppliersByCountry: Record<string, number>;
    totalInventoryValue: number;
    totalStockUnits: number;
    lowStockCount: number;
    lowStockItems: {
      product: string;
      sku: string;
      warehouse: string;
      quantity: number;
      reorderLevel: number;
    }[];
    certificates: {
      total: number;
      active: number;
      expiringSoon: number;
      items: {
        number: string;
        issuedBy: string;
        supplier: string;
        expiryDate: string;
      }[];
    };
    purchaseOrders: {
      status: string;
      count: number;
      totalAmount: number;
    }[];
    shipments: { status: string; count: number }[];
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err =
      typeof data.error === "string"
        ? data.error
        : "Request failed";
    throw new Error(err);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/api/auth/me"),

  dashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  // Suppliers
  getSuppliers: () => request<{ suppliers: Supplier[] }>("/api/suppliers"),
  createSupplier: (data: {
    name: string;
    country: string;
    email?: string;
    phone?: string;
    status?: SupplierStatus;
  }) =>
    request<{ supplier: Supplier }>("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSupplier: (id: string, data: Partial<Supplier>) =>
    request<{ supplier: Supplier }>(`/api/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteSupplier: (id: string) =>
    request<{ message: string }>(`/api/suppliers/${id}`, { method: "DELETE" }),

  // Products
  getProducts: () => request<{ products: Product[] }>("/api/products"),
  createProduct: (data: {
    supplierId: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    unitPrice?: number;
  }) =>
    request<{ product: Product }>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (
    id: string,
    data: Partial<Omit<Product, "id" | "supplierId" | "createdAt">>
  ) =>
    request<{ product: Product }>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/api/products/${id}`, { method: "DELETE" }),

  // Certificates
  getCertificates: () =>
    request<{ certificates: HalalCertificate[] }>("/api/certificates"),
  createCertificate: (data: {
    supplierId: string;
    certificateNumber: string;
    issuedBy: string;
    issueDate: string;
    expiryDate: string;
    fileUrl?: string;
  }) =>
    request<{ certificate: HalalCertificate }>("/api/certificates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCertificate: (id: string, data: Partial<HalalCertificate>) =>
    request<{ certificate: HalalCertificate }>(`/api/certificates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCertificate: (id: string) =>
    request<{ message: string }>(`/api/certificates/${id}`, {
      method: "DELETE",
    }),

  // Inventory
  getInventory: () =>
    request<{ inventory: InventoryRow[] }>("/api/inventory"),
  getInventoryMovements: () =>
    request<{ movements: InventoryMovement[] }>("/api/inventory/movements"),
  getWarehouses: () =>
    request<{ warehouses: Warehouse[] }>("/api/inventory/warehouses"),
  inbound: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    note?: string;
  }) =>
    request("/api/inventory/inbound", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  outbound: (data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    note?: string;
  }) =>
    request("/api/inventory/outbound", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Purchase Orders
  getPurchaseOrders: () =>
    request<{ purchaseOrders: PurchaseOrder[] }>("/api/purchase-orders"),
  createPurchaseOrder: (data: {
    supplierId: string;
    totalAmount: number;
    poNumber?: string;
  }) =>
    request<{ purchaseOrder: PurchaseOrder }>("/api/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrderStatus) =>
    request<{ purchaseOrder: PurchaseOrder }>(
      `/api/purchase-orders/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    ),
  deletePurchaseOrder: (id: string) =>
    request<{ message: string }>(`/api/purchase-orders/${id}`, {
      method: "DELETE",
    }),

  // Shipments
  getShipments: () => request<{ shipments: Shipment[] }>("/api/shipments"),
  updateShipment: (
    id: string,
    data: Partial<{
      trackingNumber: string;
      origin: string;
      destination: string;
      status: ShipmentStatus;
      estimatedArrival: string | null;
    }>
  ) =>
    request<{ shipment: Shipment }>(`/api/shipments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Reports
  getReportSummary: () =>
    request<ReportSummary>("/api/reports/summary"),

  exportInventoryCsv: () =>
    fetch(`${API_BASE}/api/reports/export/inventory`, {
      credentials: "include",
    }),
};
