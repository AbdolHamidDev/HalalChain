/**
 * Certificate utility functions.
 *
 * computeCertificateStatus is called at response-serialisation time and is
 * never persisted to the database (Requirements 5.4, 5.5).
 */

export type CertificateStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

const MS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Compute the display status of a halal certificate based on its expiry date.
 *
 * - "EXPIRED"       — expiryDate is in the past                  (Requirement 5.2)
 * - "EXPIRING_SOON" — expiryDate is within the next 30 days      (Requirement 5.3)
 * - "VALID"         — expiryDate is more than 30 days away       (Requirement 5.1)
 */
export function computeCertificateStatus(expiryDate: Date): CertificateStatus {
  const now = new Date();
  if (expiryDate < now) return "EXPIRED";
  if (expiryDate.getTime() - now.getTime() <= MS_IN_30_DAYS) return "EXPIRING_SOON";
  return "VALID";
}
