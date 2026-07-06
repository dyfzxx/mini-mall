import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getLevelLabel, type MembershipLevel } from "@/lib/membership";
import { Badge } from "@/components/ui/badge";

function MemberBadge({ level }: { level: MembershipLevel }) {
  const colors: Record<string, string> = {
    LEVEL3: "bg-yellow-500 hover:bg-yellow-600",
    LEVEL2: "bg-purple-500 hover:bg-purple-600",
    LEVEL1: "bg-blue-500 hover:bg-blue-600",
  };
  if (level === "NONE") return null;
  return <Badge className={`text-xs ${colors[level] || ""}`}>{getLevelLabel(level)}</Badge>;
}

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold">
              Mini Mall
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/products" className="hover:text-foreground transition-colors">
                全部商品
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.name}
                  <MemberBadge level={user.membershipLevel as MembershipLevel} />
                </span>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">我的订单</Button>
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">后台管理</Button>
                  </Link>
                )}
                <form action={async () => {
                  "use server";
                  const { clearSession } = await import("@/lib/auth");
                  await clearSession();
                }}>
                  <Button variant="ghost" size="sm" type="submit">退出</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">登录</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </>
            )}
            <Link href="/cart">
              <Button variant="outline" size="sm">购物车</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} Mini Mall. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
