import { Response } from "express";
import { randomUUID } from "crypto";

export type ActivityStreamEvent = "activity_created";

type Client = {
  id: string;
  res: Response;
  heartbeat: NodeJS.Timeout;
};

const clients = new Map<string, Client>();

function send(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function addActivityClient(res: Response): () => void {
  const clientId = randomUUID();
  const heartbeat = setInterval(() => {
    send(res, "heartbeat", { at: new Date().toISOString() });
  }, 25_000);

  const client: Client = { id: clientId, res, heartbeat };
  clients.set(clientId, client);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  send(res, "connected", { at: new Date().toISOString() });

  return () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
  };
}

export function publishActivityEvent(payload: unknown) {
  for (const client of clients.values()) {
    send(client.res, "activity_created", payload);
  }
}