import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * DELETE /api/admin/categories/[id] — 删除分类
 */

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;

  // 检查分类下是否有商品
  const count = await prisma.product.count({ where: { categoryId: Number(id) } });
  if (count > 0) {
    return NextResponse.json({ error: `该分类下有 ${count} 件商品，无法删除` }, { status: 400 });
  }

  await prisma.category.delete({ where: { id: Number(id) } });
  return NextResponse.json({ data: "已删除" });
}
