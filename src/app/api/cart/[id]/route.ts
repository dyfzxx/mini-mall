import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * PUT /api/cart/[id] — 修改购物车商品数量
 * body: { quantity: number }
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
  const cartItemId = Number(id);
  const body = await request.json();
  const quantity = Number(body.quantity);

  if (!cartItemId || quantity <= 0 || quantity > 999) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  // 验证该购物车项属于当前用户
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: user.id },
    include: { product: true },
  });

  if (!cartItem) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  if (quantity > cartItem.product.stock) {
    return NextResponse.json(
      { error: `库存不足，剩余 ${cartItem.product.stock} 件` },
      { status: 400 }
    );
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  return NextResponse.json({ data: "已更新数量" });
}

/**
 * DELETE /api/cart/[id] — 删除购物车中的某一项
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const cartItemId = Number(id);

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: user.id },
  });

  if (!cartItem) {
    return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });

  return NextResponse.json({ data: "已删除" });
}
