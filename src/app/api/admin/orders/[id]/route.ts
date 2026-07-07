import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * PUT /api/admin/orders/[id] — 更新订单状态（发货/完成）
 */

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action as string | undefined;

  if (!action || !["ship", "complete"].includes(action)) {
    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: Number(id) } });
  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (action === "ship" && order.status !== "PAID") {
    return NextResponse.json({ error: "订单状态错误，无法发货" }, { status: 400 });
  }
  if (action === "complete" && order.status !== "SHIPPED") {
    return NextResponse.json({ error: "订单状态错误，无法完成" }, { status: 400 });
  }

  const newStatus = action === "ship" ? "SHIPPED" : "COMPLETED";
  await prisma.order.update({
    where: { id: Number(id) },
    data: { status: newStatus },
  });

  return NextResponse.json({ data: { status: newStatus } });
}
