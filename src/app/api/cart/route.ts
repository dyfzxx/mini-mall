import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/cart — 获取当前用户的购物车列表
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = cartItems.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      stock: item.product.stock,
      category: item.product.category,
    },
  }));

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return NextResponse.json({
    data,
    total: Math.round(total * 100) / 100,
  });
}

/**
 * POST /api/cart — 加入购物车
 * body: { productId: number, quantity?: number }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const productId = Number(body.productId);
  const quantity = Number(body.quantity) || 1;

  if (!productId || quantity <= 0) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }
  if (quantity > 999) {
    return NextResponse.json({ error: "数量不能超过999" }, { status: 400 });
  }

  // 检查商品是否存在且有库存
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
  });

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  // 查询当前购物车中该商品的数量
  const existingItem = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  const currentQtyInCart = existingItem ? existingItem.quantity : 0;
  const newTotalQty = currentQtyInCart + quantity;

  if (newTotalQty > product.stock) {
    return NextResponse.json(
      { error: `库存不足，剩余 ${product.stock} 件` },
      { status: 400 }
    );
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newTotalQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: user.id, productId, quantity },
    });
  }

  return NextResponse.json({ data: "已加入购物车" });
}
