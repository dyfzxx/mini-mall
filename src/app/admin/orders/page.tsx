"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: number;
  product: { id: number; name: string; imageUrl: string | null };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNo: string;
  totalAmount: number;
  status: string;
  user: { id: number; name: string; email: string };
  items: OrderItem[];
  createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待支付", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      setOrders(result.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">订单管理</h1>

      <div className="border rounded-lg overflow-x-auto">
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
                <td className="p-3">{order.user?.name || "-"}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                  {order.items?.map((i) => i.product.name).join("、")}
                </td>
                <td className="p-3">¥{order.totalAmount.toFixed(2)}</td>
                <td className="p-3">
                  <Badge variant={statusMap[order.status]?.variant || "secondary"}>
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {new Date(order.createdAt).toLocaleDateString("zh-CN")}
                </td>
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
