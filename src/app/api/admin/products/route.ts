import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/admin/products — 获取所有商品（含已下架）
 * POST /api/admin/products — 新增商品
 */

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: products });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, price, stock, categoryId, imageUrl } = body;

    if (!name || !description || !price || stock === undefined || !categoryId) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        categoryId: Number(categoryId),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({ data: product });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
