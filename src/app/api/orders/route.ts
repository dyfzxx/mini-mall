import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDiscountRate, type MembershipLevel } from "@/lib/membership";

/**
 * GET /api/orders — 获取当前用户的订单列表
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    originalAmount: order.originalAmount,
    discountRate: order.discountRate,
    totalAmount: order.totalAmount,
    status: order.status,
    itemCount: order.items.length,
    preview: order.items.slice(0, 3).map((i) => i.product.name).join("、"),
    createdAt: order.createdAt,
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/orders — 从购物车创建订单
 * 事物操作：创建订单 → 扣减库存 → 清空购物车
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 获取购物车
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "购物车为空" }, { status: 400 });
  }

  // 检查库存
  const outOfStock = cartItems.filter(
    (item) => item.product.stock < item.quantity
  );
  if (outOfStock.length > 0) {
    const names = outOfStock.map((i) => i.product.name).join("、");
    return NextResponse.json(
      { error: `库存不足：${names}` },
      { status: 400 }
    );
  }

  // 计算金额
  const originalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discountRate = getDiscountRate(
    user.membershipLevel as MembershipLevel
  );
  const totalAmount = Math.round(originalAmount * discountRate * 100) / 100;
  const orderNo = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

  // 事务：创建订单 + 扣库存 + 清空购物车
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

  return NextResponse.json({
    data: {
      id: order.id,
      orderNo: order.orderNo,
      totalAmount: order.totalAmount,
    },
  });
}
