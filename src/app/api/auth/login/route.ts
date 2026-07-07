import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSession } from "@/lib/auth";

/** 简单的内存速率限制：IP → 失败次数 → 锁定时间 */
const LOGIN_LOCKOUT = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 分钟

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = LOGIN_LOCKOUT.get(ip);

  if (entry && entry.lockedUntil > now) {
    return { allowed: false, remaining: 0 };
  }

  if (entry && now >= entry.lockedUntil) {
    LOGIN_LOCKOUT.delete(ip);
  }

  const currentCount = entry ? entry.count : 0;
  return { allowed: true, remaining: MAX_ATTEMPTS - currentCount };
}

function recordAttempt(ip: string, success: boolean) {
  const now = Date.now();
  const entry = LOGIN_LOCKOUT.get(ip);

  if (success) {
    LOGIN_LOCKOUT.delete(ip);
    return;
  }

  const count = (entry ? entry.count : 0) + 1;
  if (count >= MAX_ATTEMPTS) {
    LOGIN_LOCKOUT.set(ip, { count, lockedUntil: now + LOCKOUT_DURATION });
  } else {
    LOGIN_LOCKOUT.set(ip, { count, lockedUntil: 0 });
  }
}

/**
 * POST /api/auth/login
 * 登录（不区分用户不存在和密码错误，防止撞库）
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "登录尝试过于频繁，请 15 分钟后再试" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      recordAttempt(ip, false);
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordAttempt(ip, false);
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      recordAttempt(ip, false);
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    recordAttempt(ip, true);
    await setSession(user.id, user.role);

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        membershipLevel: user.membershipLevel,
      },
    });
  } catch {
    recordAttempt(ip, false);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
