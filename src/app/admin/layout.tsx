import Link from "next/link";
import { requireAdmin, clearSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const sidebarLinks = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/products", label: "商品管理" },
  { href: "/admin/categories", label: "分类管理" },
  { href: "/admin/orders", label: "订单管理" },
  { href: "/admin/users", label: "用户管理" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/30 flex-shrink-0">
        <div className="p-4 border-b">
          <Link href="/admin" className="text-lg font-bold">
            Mini Mall
          </Link>
          <p className="text-xs text-muted-foreground mt-1">后台管理</p>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-12 border-b flex items-center justify-between px-4 bg-background">
          <span className="text-sm text-muted-foreground">欢迎，{user.name}</span>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">返回前台</Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await clearSession();
              }}
            >
              <Button variant="ghost" size="sm" type="submit">退出</Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
