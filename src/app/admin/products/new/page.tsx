import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProduct } from "@/actions/products";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回商品列表
      </Link>
      <h1 className="text-2xl font-bold mb-6">新增商品</h1>

      <Card>
        <CardContent className="pt-6">
          <form action={createProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">商品名称</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">商品描述</Label>
              <Textarea id="description" name="description" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">价格</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">库存</Label>
                <Input id="stock" name="stock" type="number" min="0" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">分类</Label>
              <select id="categoryId" name="categoryId" required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">图片URL（可选）</Label>
              <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
            </div>
            <div className="flex gap-3">
              <Button type="submit">创建</Button>
              <Link href="/admin/products"><Button variant="outline" type="button">取消</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
