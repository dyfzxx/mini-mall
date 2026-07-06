import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrderStatus } from "@/actions/orders";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待支付", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: { include: { product: true } }, user: true },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回订单列表
      </Link>
      <h1 className="text-xl font-bold mb-6">订单详情</h1>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              订单号: {order.orderNo}
            </CardTitle>
            <Badge variant={statusMap[order.status]?.variant}>{statusMap[order.status]?.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">用户: {order.user.name} ({order.user.email})</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>¥{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr className="my-2" />
            {order.discountRate < 1 && (
              <div className="flex justify-between text-muted-foreground">
                <span>折扣率</span>
                <span>{(order.discountRate * 100).toFixed(0)}%</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>实付金额</span>
              <span className="text-primary">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.status === "PAID" && (
        <div className="flex gap-3">
          <form action={updateOrderStatus.bind(null, order.id, "SHIPPED")}>
            <Button type="submit">标记为已发货</Button>
          </form>
        </div>
      )}
      {order.status === "SHIPPED" && (
        <form action={updateOrderStatus.bind(null, order.id, "COMPLETED")}>
          <Button type="submit">标记为已完成</Button>
        </form>
      )}
    </div>
  );
}
