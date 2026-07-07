"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { productSchema, categorySchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const data = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    categoryId: Number(formData.get("categoryId")),
    imageUrl: formData.get("imageUrl") || undefined,
  });

  await prisma.product.create({ data });
  revalidatePath("/admin/products");
}

export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin();
  const data = productSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    categoryId: Number(formData.get("categoryId")),
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") === "true",
  });

  await prisma.product.update({ where: { id }, data });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/admin/products");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const data = categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  await prisma.category.create({ data });
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: number, formData: FormData) {
  await requireAdmin();
  const data = categorySchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
