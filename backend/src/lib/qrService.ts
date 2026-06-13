import QRCode from "qrcode";

/**
 * Generates a QR code data URL for a product's public traceability page.
 * @param productId - The UUID of the product
 * @param frontendUrl - The base URL of the frontend (e.g. "http://localhost:3000")
 * @returns A base64-encoded PNG data URL (data:image/png;base64,...)
 */
export async function generateProductQrCode(
  productId: string,
  frontendUrl: string
): Promise<string> {
  const url = `${frontendUrl}/traceability/product/${productId}`;
  return QRCode.toDataURL(url, { type: "image/png", width: 256 });
}
