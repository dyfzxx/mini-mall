"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addToCart(productId: number, quantity: number = 1) {
  const user = await requireAuth();

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: user.id, productId, quantity },
    });
  }

  revalidatePath("/cart");
}

export async function updateCartQuantity(cartItemId: number, quantity: number) {
  const user = await requireAuth();

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId: user.id },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: cartItemId, userId: user.id },
      data: { quantity },
    });
  }

  revalidatePath("/cart");
}

export async function removeFromCart(cartItemId: number) {
  const user = await requireAuth();

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId: user.id },
  });

  revalidatePath("/cart");
}
