import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateCartQuantity, removeFromCart } from "@/actions/cart";

export default async function CartPage() {
  const user = await getSession();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg mb-4">请先登录查看购物车</p>
        <Link href="/login?redirect=/cart"><Button>去登录</Button></Link>
      </div>
    );
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">购物车是空的</p>
        <Link href="/products"><Button>去逛逛</Button></Link>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">购物车</h1>

      <div className="space-y-3">
        {cartItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                {item.product.name.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`} className="font-medium hover:underline text-sm">
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">&yen;{item.product.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <form action={updateCartQuantity.bind(null, item.id, item.quantity - 1)}>
                  <Button type="submit" variant="outline" size="icon" className="size-7 text-sm">-</Button>
                </form>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <form action={updateCartQuantity.bind(null, item.id, item.quantity + 1)}>
                  <Button type="submit" variant="outline" size="icon" className="size-7 text-sm">+</Button>
                </form>
              </div>
              <p className="text-sm font-semibold w-20 text-right">
                &yen;{(item.product.price * item.quantity).toFixed(2)}
              </p>
              <form action={removeFromCart.bind(null, item.id)}>
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">删除</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link href="/products">
          <Button variant="outline">继续购物</Button>
        </Link>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">合计</p>
          <p className="text-2xl font-bold text-primary">&yen;{total.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 text-right">
        <Link href="/checkout">
          <Button size="lg">去结算</Button>
        </Link>
      </div>
    </div>
  );
}
