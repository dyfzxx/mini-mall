import type { MembershipLevel } from "@/lib/membership";

export interface ShopUser {
  id: number;
  email: string;
  name: string;
  role: string;
  membershipLevel: MembershipLevel;
  totalSpent: number;
}

export interface ProductWithCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  categoryId: number;
  category: { id: number; name: string; slug: string };
  createdAt: Date;
}

export interface CartItemWithProduct {
  id: number;
  quantity: number;
  product: ProductWithCategory;
}

export interface OrderWithItems {
  id: number;
  orderNo: string;
  userId: number;
  originalAmount: number;
  discountRate: number;
  totalAmount: number;
  status: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: { id: number; name: string; imageUrl: string | null };
  }[];
  user: { id: number; name: string; email: string };
  createdAt: Date;
}
