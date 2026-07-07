"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductImage from "@/components/shop/product-image";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  price: number;
}

interface OrderDetail {
  id: number;
  orderNo: string;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  user?: { name: string; email: string };
  createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待支付", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const fetchOrder = useCallback(async () => {
    // 先通过 admin API 获取订单列表找到该订单（含 user 信息）
    try {
      const listRes = await fetch("/api/admin/orders");
      const listResult = await listRes.json();
      const found = (listResult.data || []).find((o: any) => String(o.id) === id);
      if (found) {
        setOrder({
          id: found.id,
          orderNo: found.orderNo,
          originalAmount: found.originalAmount,
          discountRate: found.discountRate,
          totalAmount: found.totalAmount,
          status: found.status,
          items: (found.items || []).map((i: any) => ({
            id: i.id,
            productId: i.productId || i.product?.id,
            productName: i.product?.name || "商品",
            productImage: i.product?.imageUrl || null,
            quantity: i.quantity,
            price: i.price,
          })),
          user: found.user,
          createdAt: found.createdAt,
        });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handleAction(action: string) {
    setActionLoading(action);
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchOrder();
    } catch { /* ignore */ }
    finally { setActionLoading(""); }
  }

  if (loading) return <div className="text-muted-foreground">加载中...</div>;
  if (!order) return (
    <div className="p-6">
      <p className="text-muted-foreground mb-4">订单不存在</p>
      <Link href="/admin/orders"><Button variant="outline" size="sm">返回</Button></Link>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回订单列表
      </Link>
      <h1 className="text-xl font-bold mb-6">订单详情</h1>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-mono">{order.orderNo}</CardTitle>
            <Badge variant={statusMap[order.status]?.variant}>
              {statusMap[order.status]?.label}
            </Badge>
          </div>
          {order.user && (
            <p className="text-sm text-muted-foreground">
              用户：{order.user.name}（{order.user.email}）
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <ProductImage src={item.productImage} alt={item.productName} />
                </div>
                <span className="flex-1">{item.productName} × {item.quantity}</span>
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

      <div className="flex gap-3">
        {order.status === "PAID" && (
          <Button onClick={() => handleAction("ship")} disabled={actionLoading !== ""}>
            {actionLoading === "ship" ? "处理中..." : "标记为已发货"}
          </Button>
        )}
        {order.status === "SHIPPED" && (
          <Button onClick={() => handleAction("complete")} disabled={actionLoading !== ""}>
            {actionLoading === "complete" ? "处理中..." : "标记为已完成"}
          </Button>
        )}
      </div>
    </div>
  );
}
