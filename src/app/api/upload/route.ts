import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 允许的图片类型和最大体积（5MB）
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const MAX_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload — 上传图片
 * 需管理员权限
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG/PNG/WebP/GIF 格式" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件大小不能超过 5MB" }, { status: 400 });
    }

    // 验证扩展名
    const rawName = file.name.replace(/[/\\]/g, ""); // 移除路径分隔符
    const ext = (rawName.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "不支持的文件扩展名" }, { status: 400 });
    }

    // 生成唯一文件名
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadsDir, filename);

    // 确保目录存在
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 返回可访问的 URL 路径
    const url = `/uploads/${filename}`;
    return NextResponse.json({ data: { url } });
  } catch {
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 });
  }
}
