import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { payOrder, cancelOrder } from "@/actions/orders";
import { getLevelLabel, type MembershipLevel } from "@/lib/membership";

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待支付", color: "bg-yellow-500" },
  PAID: { label: "已支付", color: "bg-blue-500" },
  SHIPPED: { label: "已发货", color: "bg-purple-500" },
  COMPLETED: { label: "已完成", color: "bg-green-500" },
  CANCELLED: { label: "已取消", color: "bg-gray-500" },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id: Number(id), userId: user.id },
    include: { items: { include: { product: true } }, user: true },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/orders" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回订单列表
      </Link>
      <h1 className="text-xl font-bold mb-6">订单详情</h1>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">订单号: {order.orderNo}</CardTitle>
            <Badge className={statusMap[order.status]?.color}>{statusMap[order.status]?.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>&yen;{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr className="my-2" />
            {order.discountRate < 1 && (
              <div className="flex justify-between text-green-600">
                <span>会员折扣</span>
                <span>-{((1 - order.discountRate) * 100).toFixed(0)}%</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>实付金额</span>
              <span className="text-primary">&yen;{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {order.status === "PENDING" && (
          <>
            <form action={async () => { "use server"; await payOrder(order.id); }}>
              <Button type="submit">去支付（模拟）</Button>
            </form>
            <form action={async () => { "use server"; await cancelOrder(order.id); }}>
              <Button type="submit" variant="outline">取消订单</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
