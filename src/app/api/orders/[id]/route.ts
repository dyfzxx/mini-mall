import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { computeNewLevel, type MembershipLevel } from "@/lib/membership";

/**
 * GET /api/orders/[id] — 订单详情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id: Number(id), userId: user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageUrl: true, price: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: order.id,
      orderNo: order.orderNo,
      originalAmount: order.originalAmount,
      discountRate: order.discountRate,
      totalAmount: order.totalAmount,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.imageUrl,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  });
}

/**
 * PUT /api/orders/[id] — 更新订单状态
 * body: { action: "pay" | "cancel" }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string | undefined;

  if (!action || !["pay", "cancel"].includes(action)) {
    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  }

  // 普通用户仅操作自己的订单
  const orderWhere = { id: Number(id), userId: user.id };

  const order = await prisma.order.findFirst({
    where: orderWhere,
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  // 支付操作：PENDING → PAID
  if (action === "pay") {
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: `当前状态 ${order.status} 不能支付` },
        { status: 400 }
      );
    }

    const newTotalSpent = user.totalSpent + order.totalAmount;
    const newLevel = computeNewLevel(
      newTotalSpent,
      user.membershipLevel as MembershipLevel
    );
    const upgraded = newLevel !== user.membershipLevel;

    await prisma.$transaction([
      prisma.order.update({
        where: { id: Number(id) },
        data: { status: "PAID" },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { totalSpent: newTotalSpent, membershipLevel: newLevel },
      }),
    ]);

    return NextResponse.json({
      data: {
        status: "PAID",
        upgraded,
        newLevel: upgraded ? newLevel : undefined,
      },
    });
  }

  // 取消操作：从任意状态可取消（恢复库存）
  if (action === "cancel") {
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "订单已取消" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: Number(id) },
        data: { status: "CANCELLED" },
      });
      // 仅恢复库存（如果已支付才恢复，待支付也会恢复）
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return NextResponse.json({ data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
