"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema, loginSchema } from "@/lib/validators";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const data = registerSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error("该邮箱已被注册");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function login(formData: FormData) {
  const data = loginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new Error("邮箱或密码错误");
  }

  const isValid = await bcrypt.compare(data.password, user.password);
  if (!isValid) {
    throw new Error("邮箱或密码错误");
  }

  await createSession(user.id);
}
