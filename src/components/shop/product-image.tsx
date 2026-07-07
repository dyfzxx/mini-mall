import { cn } from "@/lib/utils";

interface ProductImageProps {
  /** 图片 URL */
  src?: string | null;
  /** 商品名称（无图片时显示纯色占位） */
  alt: string;
  /** 容器样式类名 */
  className?: string;
}

/**
 * 商品图片组件
 * - 有图片时渲染 <img>
 * - 无图片时显示品牌色占位块
 */
export default function ProductImage({ src, alt, className }: ProductImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }

  // 无图片占位：品牌色背景 + 商品名首字
  return (
    <div
      className={cn(
        "w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center",
        className
      )}
    >
      <span className="text-2xl text-primary/40 font-bold">{alt.charAt(0)}</span>
    </div>
  );
}
