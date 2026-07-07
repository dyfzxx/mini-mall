import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const categorySlug = params.category || "";
  const page = Number(params.page) || 1;
  const pageSize = 9;

  // 查询当前选中的分类 ID
  let categoryId: number | undefined;
  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });
    categoryId = category?.id;
  }

  // 并行查询分类、商品列表、总数
  const [categories, products, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(search ? { name: { contains: search } } : {}),
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
        ...(search ? { name: { contains: search } } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // 构建带查询参数的链接
  function buildLink(newParams: Record<string, string | undefined>) {
    const merged = { search, category: categorySlug, page: String(page), ...newParams };
    const query = Object.entries(merged)
      .filter(([, value]) => value !== "" && value !== "1")
      .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`)
      .join("&");
    return query ? `/?${query}` : "/";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Mini Mall</h1>
        <p className="text-muted-foreground">发现精选好物，享受品质生活</p>
      </div>

      {/* 搜索框 */}
      <form className="flex gap-2 max-w-xl mx-auto mb-6">
        <Input
          name="search"
          type="search"
          placeholder="搜索商品..."
          defaultValue={search}
          className="flex-1"
        />
        <input type="hidden" name="category" value={categorySlug} />
        <Button type="submit" variant="secondary">搜索</Button>
      </form>

      {/* 分类标签 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Link href={buildLink({ category: undefined, page: undefined })} >
          <Badge
            variant={!categorySlug ? "default" : "outline"}
            className="cursor-pointer px-3 py-1 text-sm"
          >
            全部
          </Badge>
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={buildLink({ category: category.slug, page: undefined })}
          >
            <Badge
              variant={categorySlug === category.slug ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 text-sm"
            >
              {category.name}
              <span className="ml-1 text-xs opacity-70">({category._count.products})</span>
            </Badge>
          </Link>
        ))}
      </div>

      {/* 结果提示 */}
      {(search || categorySlug) && (
        <div className="mb-4 text-sm text-muted-foreground">
          {search && <span>搜索 “{search}”</span>}
          {search && categorySlug && <span className="mx-1">·</span>}
          {categorySlug && (
            <span>
              分类 “
              {categories.find((c) => c.slug === categorySlug)?.name || categorySlug}
              ”
            </span>
          )}
          <span className="mx-1">·</span>
          <span>共 {total} 件商品</span>
        </div>
      )}

      {/* 商品网格 */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">没有找到商品</p>
          <Link href="/">
            <Button variant="link">清除筛选</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground">
                    {product.name}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
                    <h2 className="font-semibold truncate mb-2">{product.name}</h2>
                    <p className="text-lg font-bold text-primary">&yen;{product.price.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {page > 1 && (
                <Link href={buildLink({ page: String(page - 1) })} >
                  <Button variant="outline" size="sm">上一页</Button>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              {page < totalPages && (
                <Link href={buildLink({ page: String(page + 1) })} >
                  <Button variant="outline" size="sm">下一页</Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
