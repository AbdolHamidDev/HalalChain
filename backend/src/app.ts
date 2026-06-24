import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import fs from "fs";
import { createServer } from "http";
import { authRateLimiter } from "./lib/rateLimiter";
import { setupWebSocketServer } from "./lib/websocket";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import supplierRoutes from "./routes/suppliers";
import productRoutes from "./routes/products";
import certificateRoutes from "./routes/certificates";
import inventoryRoutes from "./routes/inventory";
import purchaseOrderRoutes from "./routes/purchase-orders";
import warehouseRoutes from "./routes/warehouses";
import shipmentRoutes from "./routes/shipments";
import reportRoutes from "./routes/reports";
import analyticsRoutes from "./routes/analytics";
import auditLogRoutes from "./routes/audit-logs";
import notificationRoutes from "./routes/notifications";
import publicRoutes from "./routes/public";
import profileRoutes from "./routes/profile";
import adminUserRoutes from "./routes/admin-users";
import invitationRoutes from "./routes/invitations";
import demoAdminRoutes from "./routes/demo-admin";
import { notificationsRouter } from "./routes/settings";
import batchLotRoutes from "./routes/batch-lots";
import warehouseZoneRoutes from "./routes/warehouse-zones";
import supplierContactRoutes from "./routes/supplier-contacts";
import tagRoutes from "./routes/tags";
import systemHealthRoutes from "./routes/system-health";
import backupRoutes from "./routes/backups";
import systemConfigRoutes from "./routes/system-config";
import featureFlagRoutes from "./routes/feature-flags";
import automationRuleRoutes from "./routes/automation-rules";
import systemEventsRoutes from "./routes/system-events";
import queueRoutes from "./routes/queues";
import maintenanceRoutes from "./routes/maintenance";

// Ensure the avatar upload directory exists before the app starts handling requests
fs.mkdirSync(path.join(process.cwd(), "uploads", "avatars"), { recursive: true });

let swaggerDocument: object;
try {
  swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));
  if (!(swaggerDocument as { openapi?: string }).openapi?.startsWith("3.")) {
    throw new Error("Invalid OpenAPI version");
  }
} catch (err) {
  console.error("Failed to load swagger spec:", err);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Swagger UI — mounted before CSP middleware so the /api/docs path check in CSP works correctly
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Security headers via helmet (applied before cors)
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by custom CSP middleware below
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
    frameguard: { action: "deny" },
    noSniff: true,
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Custom CSP middleware: /api/docs gets relaxed policy for Swagger UI,
// all other paths get strict policy with img-src 'self' to allow avatar images
app.use((req, res, next) => {
  if (req.path.startsWith("/api/docs")) {
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    );
  } else {
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self'");
  }
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "HalalChain API",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
  });
});

app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/demo-admin", demoAdminRoutes);
app.use("/api/settings/notifications", notificationsRouter);
app.use("/api/batch-lots", batchLotRoutes);
app.use("/api/warehouse-zones", warehouseZoneRoutes);
app.use("/api/supplier-contacts", supplierContactRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/admin/system", systemHealthRoutes);
app.use("/api/admin/system", backupRoutes);
app.use("/api/admin/system", systemConfigRoutes);
app.use("/api/admin/system", systemEventsRoutes);
app.use("/api/admin", featureFlagRoutes);
app.use("/api/admin", automationRuleRoutes);
app.use("/api/admin", queueRoutes);
app.use("/api/admin", maintenanceRoutes);
app.use("/uploads/avatars", express.static(path.join(process.cwd(), "uploads", "avatars")));

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

export default app;
export { httpServer };

// Setup WebSocket server
export const wsServer = setupWebSocketServer(httpServer);