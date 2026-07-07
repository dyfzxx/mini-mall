"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import ProductImageUpload from "@/components/admin/product-image-upload";

interface Category {
  id: number; name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      price: Number((form.elements.namedItem("price") as HTMLInputElement).value),
      stock: Number((form.elements.namedItem("stock") as HTMLInputElement).value),
      categoryId: Number((form.elements.namedItem("categoryId") as HTMLSelectElement).value),
      imageUrl: (form.elements.namedItem("imageUrl") as HTMLInputElement).value || undefined,
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error || "创建失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/products" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
        &larr; 返回商品列表
      </Link>
      <h1 className="text-2xl font-bold mb-6">新增商品</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <ProductImageUpload inputName="imageUrl" />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? "创建中..." : "创建"}
              </Button>
              <Link href="/admin/products"><Button variant="outline" type="button">取消</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
