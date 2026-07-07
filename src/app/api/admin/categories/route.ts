import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/admin/categories — 获取全部分类（含商品数）
 * POST /api/admin/categories — 新增分类
 */

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "请填写完整信息" }, { status: 400 });
    }

    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json({ data: category });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
