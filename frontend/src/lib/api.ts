const API_BASE =
  typeof window !== "undefined"
    ? ""
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type SupplierStatus = "ACTIVE" | "INACTIVE";
export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "SHIPPING" | "RECEIVED" | "CANCELLED" | "PARTIAL";
export type ShipmentStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "DELAYED";
export type CertificateStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export interface NotificationPreferences {
  id?: string;
  certificateAlerts: boolean;
  inventoryAlerts: boolean;
  shipmentAlerts: boolean;
  invitationEmails: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  lastLoginAt?: string | null;
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
  filePublicId?: string | null;
  status?: CertificateStatus; // computed server-side, not persisted
  supplier?: { id: string; name: string; country: string };
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  _count?: { inventory: number };
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
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT";
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
    totalProducts: number;
    activeSuppliers: number;
    totalSuppliers: number;
    activeCertificates: number;
    expiringSoonCertificates: number;
    inventoryValue: number;
    openPurchaseOrders: number;
    delayedShipments: number;
    pendingShipments: number;
  };
  charts: {
    inventoryTrend: { month: string; quantity: number }[];
    purchaseOrdersPerMonth: { month: string; orders: number }[];
    shipmentStatusDistribution: { status: string; count: number }[];
    certificateExpiryTimeline: { quarter: string; count: number }[];
    shipmentVolumeTrend?: { month: string; shipments: number }[];
  };
  widgets: {
    lowStockAlerts: {
      id: string;
      productName: string;
      sku: string;
      warehouseName: string;
      quantity: number;
      reorderLevel: number;
    }[];
    expiringCertificates: {
      id: string;
      certificateNumber: string;
      supplierName: string;
      expiryDate: string;
    }[];
    shipmentDelays: {
      id: string;
      trackingNumber: string;
      poNumber: string;
      supplierName: string;
      estimatedArrival: string | null;
    }[];
  };
}

export interface Notification {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: "LOW_STOCK" | "CERTIFICATE_EXPIRING" | "SHIPMENT_DELAYED" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
  entityType: string;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
  user?: { name: string } | null;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  unverified: number;
  byRole: { admins: number; managers: number; staff: number };
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
  inviteUrl?: string;
  inviter?: { name: string };
}

export interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryAnalytics {
  inventoryValueTrend: { month: string; value: number }[];
  inventoryMovementTrend: { month: string; value: number }[];
  inboundTrend: { month: string; value: number }[];
  outboundTrend: { month: string; value: number }[];
  lowStockTrend: { month: string; value: number }[];
  inventoryByWarehouse: {
    warehouseId: string;
    warehouseName: string;
    totalQuantity: number;
    totalValue: number;
  }[];
  topStockedProducts: { productId: string; productName: string; sku: string; totalQuantity: number; totalValue: number }[];
  fastMovingProducts: { productId: string; productName: string; sku: string; totalQuantity: number; totalValue: number }[];
  slowMovingProducts: { productId: string; productName: string; sku: string; totalQuantity: number; totalValue: number }[];
}

export interface PurchaseOrderAnalytics {
  ordersPerMonth: { month: string; orders: number }[];
  approvalRate: number;
  fulfillmentRate: number;
  averageProcessingTimeDays: number | null;
  statusBreakdown: { status: string; count: number }[];
}

export interface ShipmentAnalytics {
  onTimeDeliveryRate: number;
  delayedShipmentRate: number;
  shipmentVolumeTrend: { month: string; shipments: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export interface CertificateAnalytics {
  activeCertificates: number;
  expiringCertificates: number;
  expiredCertificates: number;
  supplierComplianceScore: {
    supplierId: string;
    supplierName: string;
    score: number;
    activeCertificates: number;
    totalCertificates: number;
  }[];
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

export type ExportModule =
  | "products"
  | "inventory"
  | "suppliers"
  | "certificates"
  | "purchase-orders"
  | "shipments";

export type ExportFormat = "csv" | "xlsx" | "pdf";

let refreshPromise: Promise<void> | null = null;

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

  if (res.status === 401 && path !== "/api/auth/refresh") {
    if (!refreshPromise) {
      refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
        .then(async (r) => {
          refreshPromise = null;
          if (!r.ok) {
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            throw new Error("Session expired");
          }
        })
        .catch((e) => {
          refreshPromise = null;
          throw e;
        });
    }
    await refreshPromise;
    return request<T>(path, options);
  }

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

  dashboardStats: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<DashboardStats>(`/api/dashboard/stats${qs ? `?${qs}` : ""}`);
  },

  // Suppliers
  getSuppliers: () =>
    request<PaginatedResponse<Supplier>>("/api/suppliers").then((r) => ({
      suppliers: r.data,
    })),
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
  getProducts: () =>
    request<PaginatedResponse<Product>>("/api/products").then((r) => ({
      products: r.data,
    })),
  getProduct: (id: string) =>
    request<{ product: Product; qrCodeUrl: string }>(`/api/products/${id}`),
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
    request<PaginatedResponse<HalalCertificate>>("/api/certificates").then((r) => ({
      certificates: r.data,
    })),
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
  getInventory: (params?: { warehouseId?: string; productId?: string; belowReorder?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
    if (params?.productId) query.set("productId", params.productId);
    if (params?.belowReorder) query.set("belowReorder", "true");
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request<PaginatedResponse<InventoryRow>>(`/api/inventory${qs ? `?${qs}` : ""}`).then((r) => ({
      inventory: r.data,
      page: r.page,
      limit: r.limit,
      total: r.total,
      totalPages: r.totalPages,
    }));
  },
  getInventoryMovements: () =>
    request<PaginatedResponse<InventoryMovement>>("/api/inventory/movements").then((r) => ({
      movements: r.data,
    })),
  getWarehouses: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request<PaginatedResponse<Warehouse>>(`/api/warehouses${qs ? `?${qs}` : ""}`).then((r) => ({
      warehouses: r.data,
      page: r.page,
      limit: r.limit,
      total: r.total,
      totalPages: r.totalPages,
    }));
  },
  getWarehouse: (id: string) =>
    request<{ warehouse: Warehouse & { inventory: InventoryRow[] } }>(`/api/warehouses/${id}`),
  createWarehouse: (data: { name: string; location: string }) =>
    request<{ warehouse: Warehouse }>("/api/warehouses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateWarehouse: (id: string, data: { name?: string; location?: string }) =>
    request<{ warehouse: Warehouse }>(`/api/warehouses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteWarehouse: (id: string) =>
    request<{ message: string }>(`/api/warehouses/${id}`, { method: "DELETE" }),
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
    request<PaginatedResponse<PurchaseOrder>>("/api/purchase-orders").then((r) => ({
      purchaseOrders: r.data,
    })),
  createPurchaseOrder: (data: {
    supplierId: string;
    poNumber?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
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
  getShipments: () =>
    request<PaginatedResponse<Shipment>>("/api/shipments").then((r) => ({
      shipments: r.data,
    })),
  createShipment: (data: {
    purchaseOrderId: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    estimatedArrival?: string | null;
  }) =>
    request<{ shipment: Shipment }>("/api/shipments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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

  // Analytics
  getAnalyticsInventory: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<InventoryAnalytics>(`/api/analytics/inventory${qs ? `?${qs}` : ""}`);
  },
  getAnalyticsPurchaseOrders: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<PurchaseOrderAnalytics>(`/api/analytics/purchase-orders${qs ? `?${qs}` : ""}`);
  },
  getAnalyticsShipments: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<ShipmentAnalytics>(`/api/analytics/shipments${qs ? `?${qs}` : ""}`);
  },
  getAnalyticsCertificates: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    const qs = query.toString();
    return request<CertificateAnalytics>(`/api/analytics/certificates${qs ? `?${qs}` : ""}`);
  },

  // Reports
  getReportSummary: () =>
    request<ReportSummary>("/api/reports/summary"),

  exportInventoryCsv: () =>
    fetch(`${API_BASE}/api/reports/export/inventory`, {
      credentials: "include",
    }),

  exportReport: (moduleName: ExportModule, format: ExportFormat, params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams({ format });
    if (params?.from) query.set("from", params.from);
    if (params?.to) query.set("to", params.to);
    return fetch(`${API_BASE}/api/reports/export/${moduleName}?${query.toString()}`, {
      credentials: "include",
    });
  },

  // Notifications
  getNotifications: (page?: number) => {
    const params = page !== undefined ? `?page=${page}` : "";
    return request<PaginatedResponse<Notification>>(
      `/api/notifications${params}`
    ).then((r) => ({
      notifications: r.data,
      page: r.page,
      limit: r.limit,
      total: r.total,
      totalPages: r.totalPages,
    }));
  },
  markNotificationRead: (id: string) =>
    request<{ notification: Notification }>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),
  markAllNotificationsRead: () =>
    request<{ updated: number }>("/api/notifications/read-all", {
      method: "PATCH",
    }),

  // Audit Logs
  getAuditLogs: (params?: {
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.entityType) query.set("entityType", params.entityType);
    if (params?.entityId) query.set("entityId", params.entityId);
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    const qs = query.toString();
    return request<PaginatedResponse<AuditLog>>(
      `/api/audit-logs${qs ? `?${qs}` : ""}`
    ).then((r) => ({
      auditLogs: r.data,
      page: r.page,
      limit: r.limit,
      total: r.total,
      totalPages: r.totalPages,
    }));
  },

  // Dashboard activity
  getDashboardActivity: () =>
    request<{ activities: ActivityItem[] }>("/api/dashboard/activity"),

  // Profile self-service
  getProfile: () => request<{ user: User }>("/api/profile"),
  updateProfile: (data: { name: string }) =>
    request<{ user: User }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${API_BASE}/api/profile/avatar`, {
      method: "POST",
      credentials: "include",
      body: form,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "Upload failed"
        );
      return data as { user: User };
    });
  },
  deleteAvatar: () =>
    request<{ user: User }>("/api/profile/avatar", { method: "DELETE" }),
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request<{ message: string }>("/api/profile/password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin user management
  adminGetUserStats: () =>
    request<{ stats: UserStats }>("/api/admin/users/stats"),

  adminListUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    return request<{ users: User[]; page: number; limit: number; total: number; totalPages: number }>(
      `/api/admin/users${qs ? `?${qs}` : ""}`
    );
  },
  adminGetUser: (id: string) => request<{ user: User }>(`/api/admin/users/${id}`),
  adminUpdateUser: (id: string, data: { name: string }) =>
    request<{ user: User }>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  adminUploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return fetch(`${API_BASE}/api/admin/users/${id}/avatar`, {
      method: "POST",
      credentials: "include",
      body: form,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "Upload failed"
        );
      return data as { user: User };
    });
  },
  adminResetPassword: (id: string, data: { newPassword: string }) =>
    request<{ message: string }>(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminVerifyUser: (id: string, isVerified: boolean) =>
    request<{ user: User }>(`/api/admin/users/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified }),
    }),

  adminChangeRole: (id: string, role: UserRole) =>
    request<{ user: User }>(`/api/auth/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  adminSetStatus: (id: string, status: UserStatus) =>
    request<{ user: User }>(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Invitations
  adminCreateInvitation: (data: { email: string; role: UserRole }) =>
    request<{ invitation: Invitation }>("/api/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  adminListInvitations: () =>
    request<{ invitations: Invitation[] }>("/api/invitations"),
  adminRevokeInvitation: (id: string) =>
    request<{ message: string }>(`/api/invitations/${id}`, { method: "DELETE" }),
  validateInviteToken: (token: string) =>
    request<{ email: string; role: UserRole }>(`/api/invitations/validate?token=${encodeURIComponent(token)}`),
  acceptInvitation: (data: { token: string; name: string; password: string }) =>
    request<{ user: User }>("/api/invitations/accept", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Notification preferences
  getNotificationPreferences: () =>
    request<{ preferences: NotificationPreferences }>("/api/settings/notifications"),

  updateNotificationPreferences: (data: Partial<NotificationPreferences>) =>
    request<{ preferences: NotificationPreferences }>("/api/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Certificate file upload (uses raw fetch to avoid Content-Type override on FormData)
  uploadCertificate: (certificateId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/api/certificates/${certificateId}/upload`, {
      method: "POST",
      credentials: "include",
      body: form,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "Upload failed"
        );
      return data as { certificate: HalalCertificate & { status: CertificateStatus } };
    });
  },
};
