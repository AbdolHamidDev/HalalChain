import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, (_req: AuthRequest, res: Response) => {
  res.json({
    service: "HalalChain WebSocket",
    path: "/ws",
    events: ["shipment_updated", "activity_created", "notification_created"],
  });
});

export default router;