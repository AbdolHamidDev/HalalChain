import { ShipmentUpdatePayload } from "./websocket";

export function publishShipmentUpdate(
  shipmentId: string,
  payload: Omit<ShipmentUpdatePayload, "shipmentId">
) {
  // In production, this would publish to Redis pub/sub for horizontal scaling
  // For now, we'll use an in-memory event emitter pattern
  const event = {
    shipmentId,
    ...payload,
  };

  console.log(`[ShipmentTracking] Update for ${shipmentId}:`, event);

  // TODO: Integrate with WebSocket server for real-time broadcasting
  // wsServer.broadcastShipmentUpdate(shipmentId, event);

  return event;
}

export function getShipmentTrackingHistory(shipmentId: string) {
  // In production, this would fetch from Redis sorted set
  // Key pattern: shipment:{id}:tracking
  console.log(`[ShipmentTracking] Fetching history for ${shipmentId}`);
  return [];
}