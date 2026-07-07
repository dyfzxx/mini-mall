import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "mini-mall-session";

/** 获取 JWT 签名密钥 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 环境变量未设置");
  }
  return new TextEncoder().encode(secret);
}

async function verifySessionFromCookie(value: string): Promise<{ userId: number; role: string } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(value, secret);
    const session = payload as { userId: number; role: string };
    if (typeof session.userId !== "number" || typeof session.role !== "string") {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function getSessionFromRequest(request: NextRequest): Promise<{ userId: number; role: string } | null> {
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  return verifySessionFromCookie(cookie);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith("/admin");
  const isAuthRequired = ["/cart", "/checkout", "/orders"].some((p) =>
    pathname.startsWith(p)
  );

  if (isAdminPath || isAuthRequired) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminPath && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*"],
};
