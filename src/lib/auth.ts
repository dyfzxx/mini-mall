import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "mini-mall-session";
const SALT_ROUNDS = 10;

export interface SessionUser {
  userId: number;
  role: string;
}

/** 获取 JWT 签名密钥（从环境变量读取，开发环境用 fallback） */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 环境变量未设置");
  }
  return new TextEncoder().encode(secret);
}

/**
 * 对密码进行 bcrypt 哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码与哈希是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 将 session 写入 httpOnly Cookie（JWT 签名）
 */
export async function setSession(userId: number, role: string): Promise<void> {
  const cookieStore = await cookies();
  const secret = getJwtSecret();
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });
}

/**
 * 从 Cookie 读取当前 session 用户（JWT 验证）
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(cookie.value, secret);
    const session = payload as unknown as SessionUser;
    if (typeof session.userId !== "number" || typeof session.role !== "string") {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * 获取当前用户的完整数据库记录
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  return user;
}

/**
 * 清除 session Cookie（退出登录）
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * 要求已登录，否则抛出错误
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("请先登录");
  return user;
}

/**
 * 要求管理员权限，否则抛出错误
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("请先登录");
  if (session.role !== "ADMIN") throw new Error("需要管理员权限");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("用户不存在");
  return user;
}
