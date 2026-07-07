import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "mini-mall-session";
const SALT_ROUNDS = 10;

export interface SessionUser {
  userId: number;
  role: string;
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
 * 将 session 写入 httpOnly Cookie
 */
export async function setSession(userId: number, role: string): Promise<void> {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString("base64");
  cookieStore.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 天
    path: "/",
  });
}

/**
 * 从 Cookie 读取当前 session 用户
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie?.value) return null;

  try {
    const payload = Buffer.from(cookie.value, "base64").toString("utf-8");
    const session = JSON.parse(payload) as SessionUser;
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
