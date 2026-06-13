import cron from "node-cron";
import { prisma } from "./prisma";
import { notifyCertificateExpiring } from "./notificationService";

export function startScheduler(): void {
  cron.schedule("0 8 * * *", async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    try {
      const expiringCerts = await prisma.halalCertificate.findMany({
        where: {
          expiryDate: { lte: thirtyDaysFromNow, gte: now },
        },
        include: { supplier: { select: { name: true } } },
      });

      await prisma.$transaction(async (tx) => {
        for (const cert of expiringCerts) {
          await notifyCertificateExpiring(tx, {
            certificateNumber: cert.certificateNumber,
            supplierName: cert.supplier.name,
            expiryDate: cert.expiryDate,
          });
        }
      });
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });
}
