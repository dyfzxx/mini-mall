"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getDiscountRate, computeNewLevel, type MembershipLevel } from "@/lib/membership";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOrder() {
  const user = await requireAuth();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new Error("购物车为空");
  }

  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      throw new Error(`${item.product.name} 库存不足`);
    }
  }

  const originalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountRate = getDiscountRate(user.membershipLevel as MembershipLevel);
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;
  const orderNo = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNo,
        userId: user.id,
        originalAmount,
        discountRate,
        totalAmount,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: user.id } });

    return newOrder;
  });

  revalidatePath("/cart");
  revalidatePath("/orders");
  redirect(`/orders/${order.id}`);
}

export async function payOrder(orderId: number) {
  const user = await requireAuth();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id, status: "PENDING" },
  });

  if (!order) {
    throw new Error("订单不存在或状态不正确");
  }

  const newTotalSpent = user.totalSpent + order.totalAmount;
  const newLevel = computeNewLevel(newTotalSpent, user.membershipLevel as MembershipLevel);
  const upgraded = newLevel !== user.membershipLevel;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        totalSpent: newTotalSpent,
        membershipLevel: newLevel,
      },
    }),
  ]);

  revalidatePath(`/orders/${orderId}`);

  return { upgraded, newLevel };
}

export async function cancelOrder(orderId: number) {
  const user = await requireAuth();

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id, status: "PENDING" },
    include: { items: true },
  });

  if (!order) {
    throw new Error("订单不存在或无法取消");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function updateOrderStatus(orderId: number, status: string) {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();

  const validStatuses = ["SHIPPED", "COMPLETED"];
  if (!validStatuses.includes(status)) {
    throw new Error("无效的状态");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
