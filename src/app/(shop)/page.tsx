import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({ take: 6 }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: true },
    }),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-muted py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          欢迎来到 Mini Mall
        </h1>
        <p className="text-muted-foreground mb-6">微型电商，品质生活</p>
        <Link href="/products">
          <Button size="lg">开始购物</Button>
        </Link>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-6">商品分类</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="block p-6 text-center rounded-lg border hover:border-primary transition-colors"
            >
              <span className="font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">推荐商品</h2>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            查看全部 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-sm">
                    {product.name}
                  </div>
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
                  <p className="text-lg font-bold text-primary">&yen;{product.price}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
