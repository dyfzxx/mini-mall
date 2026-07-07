"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductImage from "@/components/shop/product-image";

interface OrderDetailItem {
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
  items: OrderDetailItem[];
  createdAt: string;
  updatedAt: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "待付款", variant: "secondary" },
  PAID: { label: "已支付", variant: "default" },
  SHIPPED: { label: "已发货", variant: "default" },
  COMPLETED: { label: "已完成", variant: "outline" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [message, setMessage] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) return;
      const result = await res.json();
      setOrder(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 支付
  async function handlePay() {
    setActionLoading("pay");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      const result = await res.json();
      if (res.ok) {
        fetchOrder();
        if (result.data.upgraded) {
          setMessage(`支付成功！恭喜升级到 ${result.data.newLevel === "LEVEL1" ? "心悦1级" : result.data.newLevel === "LEVEL2" ? "心悦2级" : "心悦3级"}！`);
        } else {
          setMessage("支付成功！");
        }
      } else {
        setMessage(result.error || "操作失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setActionLoading("");
    }
  }

  // 取消
  async function handleCancel() {
    setActionLoading("cancel");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const result = await res.json();
      if (res.ok) {
        fetchOrder();
        setMessage("订单已取消");
      } else {
        setMessage(result.error || "操作失败");
      }
    } catch {
      setMessage("网络错误");
    } finally {
      setActionLoading("");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">订单不存在</p>
        <Link href="/orders"><Button>返回订单列表</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/orders" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回订单列表
      </Link>
      <h1 className="text-xl font-bold mb-6">订单详情</h1>

      {/* 操作反馈 */}
      {message && (
        <div
          className="mb-4 p-3 rounded-lg bg-muted text-sm cursor-pointer"
          onClick={() => setMessage("")}
        >
          {message}
        </div>
      )}

      {/* 订单头 */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-mono">{order.orderNo}</CardTitle>
            <Badge variant={statusMap[order.status]?.variant}>
              {statusMap[order.status]?.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            创建时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
          </p>
        </CardHeader>
      </Card>

      {/* 商品明细 */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <ProductImage src={item.productImage} alt={item.productName} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  &yen;{item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">
                &yen;{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 金额汇总 */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品原价</span>
            <span>&yen;{order.originalAmount.toFixed(2)}</span>
          </div>
          {order.discountRate < 1 && (
            <div className="flex justify-between text-green-600">
              <span>会员折扣</span>
              <span>{(order.discountRate * 100).toFixed(0)}%</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>实付金额</span>
            <span className="text-primary">&yen;{order.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {order.status === "PENDING" && (
          <>
            <Button onClick={handlePay} disabled={actionLoading !== ""}>
              {actionLoading === "pay" ? "支付中..." : "模拟支付"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={actionLoading !== ""}
            >
              {actionLoading === "cancel" ? "取消中..." : "取消订单"}
            </Button>
          </>
        )}
        {order.status !== "PENDING" && order.status !== "CANCELLED" && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={actionLoading !== ""}
          >
            {actionLoading === "cancel" ? "取消中..." : "取消订单"}
          </Button>
        )}
      </div>
    </div>
  );
}
