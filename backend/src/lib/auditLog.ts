import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function logAudit(
  tx: TxClient,
  params: {
    userId: string | null;
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
    entityType: string;
    entityId: string;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
  }
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldData:
        params.oldData != null
          ? (params.oldData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      newData:
        params.newData != null
          ? (params.newData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });
}
