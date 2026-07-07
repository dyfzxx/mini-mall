"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductImage from "@/components/shop/product-image";

interface CheckoutItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
    category: { name: string };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/login?redirect=/checkout");
        return;
      }
      const result = await res.json();
      setItems(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 提交订单
  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", { method: "POST" });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "下单失败");
        return;
      }

      // 跳转到订单详情页
      router.push(`/orders/${result.data.id}`);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">购物车是空的</p>
        <Link href="/"><Button>去逛逛</Button></Link>
      </div>
    );
  }

  const originalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 0
  );
  // 结算页不查折扣（实际提交时服务器端计算），这里仅显示原价

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">确认订单</h1>

      {/* 商品清单 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">商品清单（{items.length}件）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <ProductImage src={item.product.imageUrl} alt={item.product.name} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  &yen;{item.product.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">
                &yen;{(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 金额汇总 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">价格明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品合计</span>
            <span>&yen;{originalAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            会员折扣将在提交时自动计算
          </p>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-destructive mb-4">{error}</p>
      )}

      {/* 提交按钮 */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "提交中..." : "提交订单"}
      </Button>
    </div>
  );
}
