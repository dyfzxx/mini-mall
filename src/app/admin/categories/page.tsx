"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: { products: number };
  products?: { id: number }[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const result = await res.json();
      setCategories(result.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const form = event.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      slug: (form.elements.namedItem("slug") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        form.reset();
        fetchCategories();
      } else {
        setError(result.error || "创建失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok) {
        fetchCategories();
      } else {
        alert(result.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setDeleting(null);
    }
  }

  const productCount = (cat: Category) => cat._count?.products ?? cat.products?.length ?? 0;

  if (loading) return <div className="text-muted-foreground">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分类管理</h1>

      {/* 新增分类表单 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">分类名称</Label>
              <Input id="name" name="name" placeholder="如：电子产品" required />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="slug">标识（英文）</Label>
              <Input id="slug" name="slug" placeholder="如：electronics" required />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "添加中..." : "添加分类"}
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* 分类列表 */}
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
                <td className="p-3">{productCount(cat)}</td>
                <td className="p-3 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting === cat.id}
                    onClick={() => {
                      if (confirm(`确定删除分类"${cat.name}"？`)) handleDelete(cat.id);
                    }}
                  >
                    {deleting === cat.id ? "删除中..." : "删除"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
