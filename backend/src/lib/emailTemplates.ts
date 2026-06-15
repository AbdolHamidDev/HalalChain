/**
 * Email template functions for HalalChain notification emails.
 *
 * All templates return both an `html` (inline-styled table layout) and
 * a `text` (plain-text multi-line) version of the email body.
 * Every parameter passed to a template MUST appear in both outputs so
 * that property tests can verify field presence.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/** Wraps content in a simple inline-styled HTML email shell. */
function wrapHtml(title: string, bodyRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#1a7f5a;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">HalalChain</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 20px 0;color:#1a1a1a;font-size:18px;">${title}</h2>
              <table role="presentation" width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                ${bodyRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f9f9f9;border-top:1px solid #eeeeee;">
              <p style="margin:0;color:#888888;font-size:12px;">This is an automated message from HalalChain. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Renders a single labelled row in the detail table. */
function row(label: string, value: string): string {
  return `<tr>
                  <td style="border:1px solid #e0e0e0;padding:10px 14px;background-color:#f9f9f9;color:#555555;font-size:13px;font-weight:600;width:40%;">${label}</td>
                  <td style="border:1px solid #e0e0e0;padding:10px 14px;color:#1a1a1a;font-size:13px;">${value}</td>
                </tr>`;
}

// ---------------------------------------------------------------------------
// Template: Certificate Expiring
// ---------------------------------------------------------------------------

/**
 * Email sent when a halal certificate is expiring within 30 days.
 */
export function certExpiringTemplate(p: {
  certificateNumber: string;
  supplierName: string;
  expiryDate: Date;
}): { html: string; text: string } {
  const dateStr = formatDate(p.expiryDate);
  const title = "Certificate Expiring Soon";

  const html = wrapHtml(
    title,
    row("Certificate Number", p.certificateNumber) +
      row("Supplier Name", p.supplierName) +
      row("Expiry Date", dateStr)
  );

  const text = [
    title,
    "=".repeat(title.length),
    "",
    `Certificate Number : ${p.certificateNumber}`,
    `Supplier Name      : ${p.supplierName}`,
    `Expiry Date        : ${dateStr}`,
    "",
    "Please renew this certificate before the expiry date to maintain compliance.",
    "",
    "This is an automated message from HalalChain.",
  ].join("\n");

  return { html, text };
}

// ---------------------------------------------------------------------------
// Template: Certificate Expired
// ---------------------------------------------------------------------------

/**
 * Email sent when a halal certificate has already expired.
 */
export function certExpiredTemplate(p: {
  certificateNumber: string;
  supplierName: string;
  expiryDate: Date;
}): { html: string; text: string } {
  const dateStr = formatDate(p.expiryDate);
  const title = "Certificate Expired";

  const html = wrapHtml(
    title,
    row("Certificate Number", p.certificateNumber) +
      row("Supplier Name", p.supplierName) +
      row("Expiry Date", dateStr)
  );

  const text = [
    title,
    "=".repeat(title.length),
    "",
    `Certificate Number : ${p.certificateNumber}`,
    `Supplier Name      : ${p.supplierName}`,
    `Expiry Date        : ${dateStr}`,
    "",
    "This certificate has expired. Please renew it immediately to maintain halal compliance.",
    "",
    "This is an automated message from HalalChain.",
  ].join("\n");

  return { html, text };
}

// ---------------------------------------------------------------------------
// Template: Low Stock
// ---------------------------------------------------------------------------

/**
 * Email sent when inventory for a product falls below the reorder level.
 */
export function lowStockTemplate(p: {
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  reorderLevel: number;
}): { html: string; text: string } {
  const title = "Low Stock Alert";

  const html = wrapHtml(
    title,
    row("Product Name", p.productName) +
      row("SKU", p.sku) +
      row("Warehouse", p.warehouseName) +
      row("Current Quantity", String(p.quantity)) +
      row("Reorder Level", String(p.reorderLevel))
  );

  const text = [
    title,
    "=".repeat(title.length),
    "",
    `Product Name    : ${p.productName}`,
    `SKU             : ${p.sku}`,
    `Warehouse       : ${p.warehouseName}`,
    `Current Quantity: ${p.quantity}`,
    `Reorder Level   : ${p.reorderLevel}`,
    "",
    "Please reorder this product to avoid stockouts.",
    "",
    "This is an automated message from HalalChain.",
  ].join("\n");

  return { html, text };
}

// ---------------------------------------------------------------------------
// Template: Shipment Delayed
// ---------------------------------------------------------------------------

/**
 * Email sent when a shipment has been marked as delayed.
 */
export function shipmentDelayedTemplate(p: {
  trackingNumber: string;
  poNumber: string;
}): { html: string; text: string } {
  const title = "Shipment Delayed";

  const html = wrapHtml(
    title,
    row("Tracking Number", p.trackingNumber) + row("Purchase Order", p.poNumber)
  );

  const text = [
    title,
    "=".repeat(title.length),
    "",
    `Tracking Number : ${p.trackingNumber}`,
    `Purchase Order  : ${p.poNumber}`,
    "",
    "This shipment has been marked as delayed. Please contact your supplier for further information.",
    "",
    "This is an automated message from HalalChain.",
  ].join("\n");

  return { html, text };
}

// ---------------------------------------------------------------------------
// Template: Invitation
// ---------------------------------------------------------------------------

/**
 * Email sent when a user is invited to join the HalalChain platform.
 */
export function invitationTemplate(p: {
  inviterName: string;
  role: string;
  acceptanceUrl: string;
}): { html: string; text: string } {
  const title = "You've Been Invited to HalalChain";

  const html = wrapHtml(
    title,
    row("Invited By", p.inviterName) +
      row("Role", p.role) +
      row(
        "Accept Invitation",
        `<a href="${p.acceptanceUrl}" style="color:#1a7f5a;text-decoration:underline;">${p.acceptanceUrl}</a>`
      )
  );

  const text = [
    title,
    "=".repeat(title.length),
    "",
    `Invited By      : ${p.inviterName}`,
    `Role            : ${p.role}`,
    `Accept Invitation: ${p.acceptanceUrl}`,
    "",
    "Click the link above to accept your invitation and set up your account.",
    "",
    "This is an automated message from HalalChain.",
  ].join("\n");

  return { html, text };
}
