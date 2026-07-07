"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: number;
  orderNo: string;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  status: string;
  itemCount: number;
  preview: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待付款", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) {
        router.push("/login?redirect=/orders");
        return;
      }
      const result = await res.json();
      setOrders(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">还没有订单</p>
        <Link href="/"><Button>去购物</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {order.orderNo}
                  </span>
                  <Badge variant={statusMap[order.status]?.variant || "secondary"} className="ml-2">
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </div>
                <span className="font-bold text-primary">
                  &yen;{order.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground mb-3">
                {order.preview}
                {order.itemCount > 3 && ` 等${order.itemCount}件`}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </span>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm">查看详情</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
