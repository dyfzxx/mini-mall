import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addToCart } from "@/actions/cart";
import { getSession } from "@/lib/auth";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });

  if (!product || !product.isActive) notFound();

  const user = await getSession();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image placeholder */}
        <div className="aspect-square bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-lg">
          {product.name}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{product.category.name}</p>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-4">&yen;{product.price}</p>
          <p className="text-muted-foreground mb-4">{product.description}</p>
          <p className="text-sm text-muted-foreground mb-6">
            库存: {product.stock > 0 ? `${product.stock} 件` : "已售罄"}
          </p>

          {user ? (
            <form action={async () => {
              "use server";
              await addToCart(product.id, 1);
            }}>
              <Button type="submit" size="lg" disabled={product.stock === 0}>
                加入购物车
              </Button>
            </form>
          ) : (
            <Link href={`/login?redirect=/products/${product.id}`}>
              <Button size="lg">登录后购买</Button>
            </Link>
          )}

          <div className="mt-4">
            <Link href="/products">
              <Button variant="link">&larr; 返回商品列表</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
