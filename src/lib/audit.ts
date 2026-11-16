import { prisma } from "./prisma";

interface LogAuditParams {
  userId?: string | null;
  userRole?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  userRole,
  action,
  entityName,
  entityId,
  oldValues,
  newValues,
  ipAddress,
}: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userRole: userRole || null,
        action,
        entityName,
        entityId: entityId ? String(entityId) : null,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Gagal mencatat audit log:", err);
  }
}
