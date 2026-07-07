"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProductImage from "@/components/shop/product-image";

interface CartProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  category: { id: number; name: string; slug: string };
}

interface CartItemData {
  id: number;
  quantity: number;
  product: CartProduct;
}

interface CartResponse {
  data: CartItemData[];
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 加载购物车数据
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      if (res.status === 401) {
        router.push("/login?redirect=/cart");
        return;
      }
      const result: CartResponse = await res.json();
      setItems(result.data);
      setTotal(result.total);
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // 修改数量
  async function updateQuantity(itemId: number, newQty: number) {
    if (newQty <= 0) return;
    if (newQty > 999) return;

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) fetchCart();
      else {
        const err = await res.json();
        setError(err.error);
      }
    } catch {
      setError("操作失败");
    }
  }

  // 删除单品
  async function removeItem(itemId: number) {
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchCart();
      else {
        const err = await res.json();
        setError(err.error);
      }
    } catch {
      setError("操作失败");
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">购物车</h1>

      {error && (
        <p className="text-sm text-destructive mb-4" onClick={() => setError("")}>
          {error}（点击关闭）
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center gap-4">
              {/* 商品缩略图 */}
              <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                <ProductImage src={item.product.imageUrl} alt={item.product.name} />
              </div>

              {/* 商品信息 */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.id}`}
                  className="font-medium hover:underline text-sm"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  &yen;{item.product.price.toFixed(2)}
                </p>
              </div>

              {/* 数量调节 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-sm"
                  disabled={item.quantity <= 1}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-sm"
                  disabled={item.quantity >= item.product.stock}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
              </div>

              {/* 小计 */}
              <p className="text-sm font-semibold w-20 text-right">
                &yen;{(item.product.price * item.quantity).toFixed(2)}
              </p>

              {/* 删除 */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeItem(item.id)}
              >
                删除
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 底栏 */}
      <div className="mt-6 flex items-center justify-between">
        <Link href="/">
          <Button variant="outline">继续购物</Button>
        </Link>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">合计</p>
          <p className="text-2xl font-bold text-primary">&yen;{total.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 text-right">
        <Link href="/checkout">
          <Button size="lg">提交订单</Button>
        </Link>
      </div>
    </div>
  );
}
