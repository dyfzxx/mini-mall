import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createCategory, updateCategory, deleteCategory } from "@/actions/products";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>

      {/* New Category Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form action={createCategory} className="flex gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">分类名称</Label>
              <Input id="name" name="name" placeholder="如: 电子产品" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="slug">标识 (英文)</Label>
              <Input id="slug" name="slug" placeholder="如: electronics" required />
            </div>
            <Button type="submit">添加分类</Button>
          </form>
        </CardContent>
      </Card>

      {/* Category List */}
      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">名称</th>
              <th className="text-left p-3">标识</th>
              <th className="text-left p-3">商品数</th>
              <th className="text-right p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t">
                <td className="p-3">{cat.id}</td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                <td className="p-3">{cat._count.products}</td>
                <td className="p-3 text-right">
                  <form action={deleteCategory.bind(null, cat.id)} className="inline">
                    <Button type="submit" variant="destructive" size="sm"
                      disabled={cat._count.products > 0}>
                      删除
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
