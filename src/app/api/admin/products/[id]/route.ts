import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/admin/products/[id] — 获取商品详情
 * PUT /api/admin/products/[id] — 更新商品
 * DELETE /api/admin/products/[id] — 删除商品
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "商品不存在" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, categoryId, imageUrl, isActive } = body;

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(categoryId !== undefined && { categoryId: Number(categoryId) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ data: product });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.product.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });

  return NextResponse.json({ data: "已下架（软删除）" });
}
