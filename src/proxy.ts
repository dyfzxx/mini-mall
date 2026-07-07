import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "mini-mall-session";

function decodeSession(value: string): { userId: number; role: string } | null {
  try {
    const payload = Buffer.from(value, "base64").toString("utf-8");
    const session = JSON.parse(payload);
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
  return decodeSession(cookie);
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
