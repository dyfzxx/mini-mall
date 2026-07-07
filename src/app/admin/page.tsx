import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  await requireAdmin();
  const [productCount, userCount, orderCount, todayOrders, revenue] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const stats = [
    { title: "商品总数", value: String(productCount) },
    { title: "用户总数", value: String(userCount) },
    { title: "订单总数", value: String(orderCount) },
    { title: "今日订单", value: String(todayOrders) },
    { title: "总收入", value: `¥${(revenue._sum.totalAmount || 0).toFixed(2)}` },
  ];

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">最近订单</h2>
      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">订单号</th>
              <th className="text-left p-3">用户</th>
              <th className="text-left p-3">金额</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3 font-mono text-xs">{order.orderNo}</td>
                <td className="p-3">{order.user.name}</td>
                <td className="p-3">¥{order.totalAmount.toFixed(2)}</td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">{order.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
