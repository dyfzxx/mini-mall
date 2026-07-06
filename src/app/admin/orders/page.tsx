import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待支付", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: { include: { product: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">订单管理</h1>

      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">订单号</th>
              <th className="text-left p-3">用户</th>
              <th className="text-left p-3">商品</th>
              <th className="text-left p-3">金额</th>
              <th className="text-left p-3">状态</th>
              <th className="text-left p-3">时间</th>
              <th className="text-right p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3 font-mono text-xs">{order.orderNo}</td>
                <td className="p-3">{order.user.name}</td>
                <td className="p-3 text-muted-foreground">
                  {order.items.map(i => i.product.name).join(", ").slice(0, 30)}
                </td>
                <td className="p-3">¥{order.totalAmount.toFixed(2)}</td>
                <td className="p-3">
                  <Badge variant={statusMap[order.status]?.variant || "secondary"}>
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{order.createdAt.toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm">详情</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
