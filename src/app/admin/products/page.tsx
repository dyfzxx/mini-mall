import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/actions/products";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Link href="/admin/products/new">
          <Button>新增商品</Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">名称</th>
              <th className="text-left p-3">分类</th>
              <th className="text-left p-3">价格</th>
              <th className="text-left p-3">库存</th>
              <th className="text-left p-3">状态</th>
              <th className="text-right p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3">{product.id}</td>
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 text-muted-foreground">{product.category.name}</td>
                <td className="p-3">¥{product.price}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">
                  <span className={product.isActive ? "text-green-600" : "text-gray-400"}>
                    {product.isActive ? "上架" : "下架"}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm">编辑</Button>
                  </Link>
                  <form action={deleteProduct.bind(null, product.id)} className="inline">
                    <Button type="submit" variant="destructive" size="sm">删除</Button>
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
