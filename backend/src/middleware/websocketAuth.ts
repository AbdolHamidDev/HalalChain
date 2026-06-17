import { Socket } from "socket.io";
import jwt from "jsonwebtoken";

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      sub: string;
      email: string;
      role: string;
    };
  };
}

export function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error("Server error: JWT_SECRET not configured"));
    }

    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email: string;
      role: string;
    };

    socket.data.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
}