import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { authenticateSocket } from "../middleware/websocketAuth";

export type ShipmentUpdatePayload = {
  shipmentId: string;
  status: string;
  location?: string;
  timestamp: string;
  notes?: string;
};

export type ActivityPayload = {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export const setupWebSocketServer = (httpServer: ReturnType<typeof createServer>) => {
  const io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.data.user?.sub;
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`[WebSocket] Client connected: ${socket.id} (user=${userId})`);

    socket.on("join_shipment", (shipmentId: string) => {
      socket.join(`shipment:${shipmentId}`);
      console.log(`[WebSocket] ${socket.id} joined shipment:${shipmentId}`);
    });

    socket.on("leave_shipment", (shipmentId: string) => {
      socket.leave(`shipment:${shipmentId}`);
      console.log(`[WebSocket] ${socket.id} left shipment:${shipmentId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return {
    io,
    broadcastShipmentUpdate: (shipmentId: string, payload: ShipmentUpdatePayload) => {
      io.to(`shipment:${shipmentId}`).emit("shipment_updated", payload);
    },
    broadcastActivity: (payload: ActivityPayload) => {
      io.emit("activity_created", payload);
    },
    broadcastNotification: (userId: string, payload: NotificationPayload) => {
      io.to(`user:${userId}`).emit("notification_created", payload);
    },
  };
};

export type WebSocketServer = ReturnType<typeof setupWebSocketServer>;