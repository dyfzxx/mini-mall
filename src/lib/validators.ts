import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
  name: z.string().min(1, "请输入用户名"),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export const productSchema = z.object({
  name: z.string().min(1, "请输入商品名称"),
  description: z.string().min(1, "请输入商品描述"),
  price: z.number().positive("价格必须大于0"),
  stock: z.number().int().min(0, "库存不能为负数"),
  categoryId: z.number().int().positive("请选择分类"),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "请输入分类名称"),
  slug: z.string().min(1, "请输入分类标识"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"]),
});

export const cartQuantitySchema = z.object({
  quantity: z.number().int().min(1, "数量至少为1").max(999, "数量不能超过999"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
