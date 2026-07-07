"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: number;
  disabled?: boolean;
  loggedIn?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  disabled = false,
  loggedIn = false,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!loggedIn) {
    return (
      <Button
        size="lg"
        className={className}
        onClick={() => router.push(`/login?redirect=/products/${productId}`)}
      >
        登录后购买
      </Button>
    );
  }

  async function handleAdd() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      className={className}
      disabled={disabled || loading}
      onClick={handleAdd}
    >
      {loading ? "添加中..." : "加入购物车"}
    </Button>
  );
}
