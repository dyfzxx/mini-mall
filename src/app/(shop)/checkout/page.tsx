import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDiscountRate, getLevelLabel, type MembershipLevel } from "@/lib/membership";
import { createOrder } from "@/actions/orders";

export default async function CheckoutPage() {
  const user = await requireAuth();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    redirect("/cart");
  }

  const originalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountRate = getDiscountRate(user.membershipLevel as MembershipLevel);
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">确认订单</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">商品清单</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.product.name} x {item.quantity}</span>
              <span>&yen;{(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">价格明细</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">商品原价</span>
            <span>&yen;{originalAmount.toFixed(2)}</span>
          </div>
          {discountRate < 1 && (
            <div className="flex justify-between text-green-600">
              <span>
                会员折扣 ({getLevelLabel(user.membershipLevel as MembershipLevel)})
              </span>
              <span>-{((1 - discountRate) * 100).toFixed(0)}%</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>应付金额</span>
            <span className="text-primary">&yen;{totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <form action={createOrder}>
        <Button type="submit" size="lg" className="w-full">提交订单</Button>
      </form>
    </div>
  );
}
