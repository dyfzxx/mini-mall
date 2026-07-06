import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "minimall-dev-secret-change-in-production"
);

const adminPaths = ["/admin"];
const authRequiredPaths = ["/cart", "/checkout", "/orders"];

async function getUserRole(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get("mini-mall-token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.sub ? "USER" : null;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));
  const isAuthRequired = authRequiredPaths.some((p) => pathname.startsWith(p));

  if (isAdminPath || isAuthRequired) {
    const role = await getUserRole(request);
    if (!role) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*"],
};
