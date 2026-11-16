import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "anf_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 jam

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  employeeId?: string;
  employeeCode?: string;
  fullName?: string;
  departmentId?: string;
  departmentName?: string;
}

// Simple signed session token using Base64 + HMAC signature
import crypto from "crypto";
const SESSION_SECRET = process.env.SESSION_SECRET || "anf-group-super-secret-key-production-2026";

function signToken(payload: SessionUser): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("base64url");
    if (expected !== signature) return null;
    const json = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;
  const payload = verifyToken(cookie.value);
  if (!payload?.id) return null;

  // Verifikasi keaktifan akun di database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id,
    employeeCode: user.employee?.employeeCode,
    fullName: user.employee?.fullName || user.username,
    departmentId: user.employee?.departmentId,
    departmentName: user.employee?.department?.name,
  };
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
