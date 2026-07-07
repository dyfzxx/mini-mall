import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { addToCart } from "@/actions/cart";
import { getCurrentUser } from "@/lib/auth";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });

  if (!product || !product.isActive) notFound();

  const user = await getCurrentUser();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-2">/</span>
        <Link
          href={`/?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 商品大图 */}
        <Card className="overflow-hidden">
          <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-2xl">
            {product.name}
          </div>
        </Card>

        {/* 商品信息 */}
        <div className="flex flex-col">
          <div className="mb-6">
            <Badge variant="outline" className="mb-3">
              {product.category.name}
            </Badge>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-4xl font-bold text-primary mb-6">
              &yen;{product.price.toFixed(2)}
            </p>
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mb-6">
              库存状态：<span className={product.stock > 0 ? "text-green-600" : "text-destructive"}>
                {product.stock > 0 ? `${product.stock} 件可售` : "暂时缺货"}
              </span>
            </p>
          </div>

          <div className="mt-auto space-y-3">
            {user ? (
              <form
                action={async () => {
                  "use server";
                  await addToCart(product.id, 1);
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto"
                  disabled={product.stock === 0}
                >
                  加入购物车
                </Button>
              </form>
            ) : (
              <Link href={`/login?redirect=/products/${product.id}`}>
                <Button size="lg" className="w-full md:w-auto">登录后购买</Button>
              </Link>
            )}
            <div>
              <Link href="/">
                <Button variant="link" className="px-0">&larr; 返回商品列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
