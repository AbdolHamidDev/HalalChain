import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { authRateLimiter } from "./lib/rateLimiter";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import supplierRoutes from "./routes/suppliers";
import productRoutes from "./routes/products";
import certificateRoutes from "./routes/certificates";
import inventoryRoutes from "./routes/inventory";
import purchaseOrderRoutes from "./routes/purchase-orders";
import shipmentRoutes from "./routes/shipments";
import reportRoutes from "./routes/reports";
import auditLogRoutes from "./routes/audit-logs";
import notificationRoutes from "./routes/notifications";
import publicRoutes from "./routes/public";

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
// all other paths get strict default-src 'self'
app.use((req, res, next) => {
  if (req.path.startsWith("/api/docs")) {
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    );
  } else {
    res.setHeader("Content-Security-Policy", "default-src 'self'");
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
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);

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
