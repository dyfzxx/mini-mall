"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductImageUploadProps {
  /** 当前图片 URL（编辑模式） */
  currentUrl?: string | null;
  /** 隐藏的 input name，表单提交时的字段名 */
  inputName?: string;
}

/**
 * 商品图片上传 + URL 输入组件
 * - 支持从本地上传（调用 /api/upload）
 * - 也支持直接输入 URL
 */
export default function ProductImageUpload({
  currentUrl,
  inputName = "imageUrl",
}: ProductImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传本地文件
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "上传失败");
        return;
      }

      setPreviewUrl(result.data.url);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>商品图片</Label>

      {/* 预览区域 */}
      {previewUrl && (
        <div className="mb-2">
          <img
            src={previewUrl}
            alt="商品图片预览"
            className="w-40 h-40 object-cover rounded-lg border"
          />
        </div>
      )}

      {/* 本地上传 */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "上传中..." : "选择本地图片"}
        </Button>
        <span className="text-xs text-muted-foreground">
          或输入 URL
        </span>
      </div>

      {/* URL 输入 */}
      <Input
        name={inputName}
        placeholder="https://example.com/image.jpg"
        value={previewUrl}
        onChange={(e) => setPreviewUrl(e.target.value)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        支持 JPG/PNG/WebP/GIF，最大 5MB
      </p>
    </div>
  );
}
