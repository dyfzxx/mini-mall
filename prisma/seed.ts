import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // 创建管理员
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@minimall.com" },
    update: {},
    create: {
      email: "admin@minimall.com",
      password: adminPassword,
      name: "管理员",
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  // 创建测试用户
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@minimall.com" },
    update: {},
    create: {
      email: "user@minimall.com",
      password: userPassword,
      name: "测试用户",
      membershipLevel: "LEVEL1",
      totalSpent: 9000,
    },
  });
  console.log("User created:", user.email);

  // 创建分类
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "electronics" }, update: {}, create: { name: "电子产品", slug: "electronics" } }),
    prisma.category.upsert({ where: { slug: "clothing" }, update: {}, create: { name: "服装", slug: "clothing" } }),
    prisma.category.upsert({ where: { slug: "food" }, update: {}, create: { name: "食品", slug: "food" } }),
    prisma.category.upsert({ where: { slug: "home" }, update: {}, create: { name: "家居用品", slug: "home" } }),
  ]);
  console.log("Categories created:", categories.length);

  // 创建商品
  const products = [
    { name: "iPhone 16", description: "最新款苹果手机", price: 6999, stock: 50, categoryId: categories[0].id },
    { name: "MacBook Pro", description: "14寸 M4 Pro 芯片", price: 14999, stock: 20, categoryId: categories[0].id },
    { name: "AirPods Pro", description: "主动降噪耳机", price: 1899, stock: 100, categoryId: categories[0].id },
    { name: "男士休闲夹克", description: "春秋款时尚夹克", price: 399, stock: 200, categoryId: categories[1].id },
    { name: "女士连衣裙", description: "夏季碎花连衣裙", price: 299, stock: 150, categoryId: categories[1].id },
    { name: "有机坚果礼盒", description: "精选混合坚果 500g", price: 89, stock: 500, categoryId: categories[2].id },
    { name: "进口咖啡豆", description: "哥伦比亚单品咖啡豆 250g", price: 128, stock: 300, categoryId: categories[2].id },
    { name: "智能台灯", description: "护眼LED台灯，可调色温", price: 259, stock: 80, categoryId: categories[3].id },
    { name: "纯棉四件套", description: "60支长绒棉床上用品", price: 599, stock: 60, categoryId: categories[3].id },
    { name: "机械键盘", description: "Cherry MX 红轴 87键", price: 699, stock: 40, categoryId: categories[0].id },
    { name: "运动跑鞋", description: "透气减震跑步鞋", price: 459, stock: 120, categoryId: categories[1].id },
    { name: "保温杯", description: "316不锈钢 500ml", price: 149, stock: 200, categoryId: categories[3].id },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log("Products created:", products.length);

  console.log("Seed completed!");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
