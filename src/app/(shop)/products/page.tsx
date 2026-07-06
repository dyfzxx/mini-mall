import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const categoryId = params.category ? Number(params.category) : undefined;
  const page = Number(params.page) || 1;
  const pageSize = 12;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: q } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({
      where: {
        isActive: true,
        ...(q ? { name: { contains: q } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    }),
    prisma.category.findMany(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品列表</h1>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form className="flex-1 flex gap-2">
          <Input
            name="q"
            placeholder="搜索商品..."
            defaultValue={q}
            className="max-w-sm"
          />
          <Button type="submit" variant="secondary">搜索</Button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link href="/products">
            <Button variant={!categoryId ? "default" : "outline"} size="sm">
              全部
            </Button>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/products?category=${cat.id}${q ? `&q=${q}` : ""}`}>
              <Button variant={categoryId === cat.id ? "default" : "outline"} size="sm">
                {cat.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">没有找到商品</p>
          <Link href="/products"><Button variant="link">清除筛选</Button></Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-muted-foreground text-sm">
                      {product.name}
                    </div>
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category.name}</p>
                    <p className="text-lg font-bold text-primary mt-1">&yen;{product.price}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/products?page=${p}${q ? `&q=${q}` : ""}${categoryId ? `&category=${categoryId}` : ""}`}
                >
                  <Button variant={page === p ? "default" : "outline"} size="sm">
                    {p}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
