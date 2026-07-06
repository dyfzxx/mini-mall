import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待支付", color: "bg-yellow-500" },
  PAID: { label: "已支付", color: "bg-blue-500" },
  SHIPPED: { label: "已发货", color: "bg-purple-500" },
  COMPLETED: { label: "已完成", color: "bg-green-500" },
  CANCELLED: { label: "已取消", color: "bg-gray-500" },
};

export default async function OrdersPage() {
  const user = await requireAuth();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">还没有订单</p>
          <Link href="/products"><Button>去购物</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm text-muted-foreground">{order.orderNo}</span>
                    <Badge className={`ml-2 ${statusMap[order.status]?.color || ""}`}>
                      {statusMap[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <span className="font-bold text-primary">&yen;{order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {order.items.slice(0, 3).map((item) => item.product.name).join(", ")}
                  {order.items.length > 3 && ` 等${order.items.length}件商品`}
                </div>
                <div className="flex gap-2">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm">查看详情</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
