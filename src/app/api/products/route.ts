import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products
 * 查询参数：
 * - search: 按商品名称模糊搜索
 * - category: 按分类 slug 筛选
 * - page: 分页页码（默认 1）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").slice(0, 100);
  const categorySlug = (searchParams.get("category") || "").slice(0, 50);
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 9;

  // 若传了分类 slug，先查分类 ID
  let categoryId: number | undefined;
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    if (category) {
      categoryId = category.id;
    }
  }

  const where = {
    isActive: true,
    ...(search ? { name: { contains: search } } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
