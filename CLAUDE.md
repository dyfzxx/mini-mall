# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini Mall — 微型电商全栈项目。Next.js 16 App Router + Prisma 7 + SQLite + Tailwind CSS 4 + shadcn/ui。

## Tech Stack

| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Next.js | **16.2.10** | App Router, React 19.2, Turbopack |
| UI 库 | React | **19.2.4** | Server Components 默认 |
| 语言 | TypeScript | **5.9** | strict 模式 |
| CSS | Tailwind CSS | **4.x** | CSS-first 配置, oklch 色域 |
| 组件库 | shadcn/ui | **latest** | 基于 Radix, 手动复制 |
| ORM | Prisma | **7.8.0** | Driver Adapter 模式 |
| 数据库 | SQLite | **3.x** | 零配置, 文件型 (`better-sqlite3`) |
| 校验 | Zod | **4.4.3** | 前后端共享 schema |
| 密码 | bcryptjs | **3.0.3** | 纯 JS, 无 native 依赖 |
| 会话 | jose | **6.2.3** | JWT 签发/验证 |
| 工具 | clsx | **2.1.1** | 类名合并 |
| 工具 | tailwind-merge | **3.6.0** | 智能类名去重 |
| 工具 | class-variance-authority | **0.7.1** | 组件变体管理 |
| Radix | @radix-ui/react-slot | **1.3.0** | shadcn/ui 依赖 |
| Radix | @radix-ui/react-label | **2.1.11** | shadcn/ui 依赖 |
| Radix | @radix-ui/react-select | **2.3.2** | shadcn/ui 依赖 |
| Radix | @radix-ui/react-dialog | **1.1.18** | shadcn/ui 依赖 |
| 构建 | tsx | **4.23.0** | 执行 TypeScript (seed) |
| 运行时 | Node.js | **24.15.0** | — |

## Commands

```bash
npm run dev          # 开发服务器 (Turbopack, 默认端口3000)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run db:push      # 同步 Prisma schema → SQLite (开发用, 无迁移文件)
npm run db:generate  # 重新生成 Prisma Client
npm run db:seed      # 填充种子数据
npm run db:studio    # 打开 Prisma Studio 可视化数据库
```

`.env`: `DATABASE_URL="file:./dev.db"`、`JWT_SECRET`。
种子账号: `admin@minimall.com` / `admin123` (管理员), `user@minimall.com` / `user123` (心悦1级)。

---

## Architecture

### 目录结构

```
src/
├── app/
│   ├── (shop)/           ← 前台 (route group, URL 无前缀)
│   │   ├── page.tsx         首页
│   │   ├── products/        商品列表/详情
│   │   ├── cart/            购物车
│   │   ├── checkout/        确认下单
│   │   ├── orders/          我的订单
│   │   ├── login/           登录
│   │   └── register/        注册
│   ├── admin/             ← 后台
│   │   ├── page.tsx         仪表盘
│   │   ├── products/        商品管理 (CRUD)
│   │   ├── categories/      分类管理
│   │   ├── orders/          订单管理 (状态变更)
│   │   └── users/           用户管理 (会员等级)
│   └── api/search/        ← Route Handler (客户端搜索)
├── components/ui/           shadcn/ui 基础组件
├── components/shop/         前台业务组件
├── components/admin/        后台业务组件
├── components/shared/       共享组件 (含 membership-badge)
├── lib/                     prisma, auth, membership, validators, utils
├── actions/                 Server Actions (auth, cart, orders, products)
├── types/                   共享类型定义
└── proxy.ts                 Next.js 16 middleware (路由鉴权)
```

### 数据流

- **读数据**: Server Components 直接 `import { prisma }` 查询数据库
- **写数据**: Server Actions (`"use server"` 函数) 作为 `<form action={...}>` handler
- **客户端交互**: 仅在需要 `useState`/`useEffect`/事件处理时用 `"use client"`
- 每个 Action 流程: Zod 校验 → 鉴权 → 数据库操作 → `revalidatePath()`

### 路由表

| 路由 | 数据获取 | 鉴权 |
|------|----------|------|
| `/` | RSC + `"use cache"` | 无 |
| `/products?q=&category=&page=` | RSC + searchParams | 无 |
| `/products/[id]` | RSC | 无 |
| `/cart` | RSC | 需登录 |
| `/checkout` | RSC + Action | 需登录 |
| `/orders`, `/orders/[id]` | RSC | 需登录 |
| `/login`, `/register` | Client + Action | 无 |
| `/admin/*` | RSC + Action | 需管理员 |

### 认证

JWT + httpOnly Cookie。`src/lib/auth.ts`:

- `createSession(userId)` — 签发 7 天 JWT，写入 Cookie
- `getSession()` — 从 Cookie 解析，返回 User 对象
- `clearSession()` — 删除 Cookie
- `requireAuth()` / `requireAdmin()` — 鉴权 guard，失败抛错

密码用 bcryptjs 加盐哈希。

### 会员等级 (`src/lib/membership.ts`)

`computeNewLevel(totalSpent, currentLevel)` 只升不降。

| 等级 | 条件 | 折扣 |
|------|------|------|
| NONE (普通) | 默认 | 原价 |
| LEVEL1 (心悦1) | 累计 ≥ ¥8,000 | 9.8折 |
| LEVEL2 (心悦2) | 累计 ≥ ¥80,000 | 9.5折 |
| LEVEL3 (心悦3) | 累计 ≥ ¥200,000 | 9.0折 |

下单时: `totalAmount = originalAmount × discountRate`，写入 Order。
支付后: `User.totalSpent += totalAmount` → 判定升级。

### 数据库

Prisma 7 + SQLite。6 张表，`prisma.config.ts` 管理连接 URL。

```
User ──1:N──→ CartItem ──N:1──→ Product ──N:1──→ Category
 │                                    │
 └──1:N──→ Order ──1:N──→ OrderItem ──┘
```

- `CartItem.[userId, productId]` 复合唯一索引
- `Order.orderNo` 唯一，格式: `时间戳+4位随机`
- `OrderItem.price` 快照下单时单价
- `Order.originalAmount` 原价 + `discountRate` 折扣率 + `totalAmount` 实付

Prisma 7 注意: 必须用 Driver Adapter，PrismaClient 用 globalThis 单例防 HMR 重复创建。

### 关键业务流程

**搜索与筛选**: SearchBar 防抖 300ms → `router.push('/products?q=xxx')` → RSC 服务端 `where { name: { contains: q } }` + `skip/take` 分页。

**购物车 → 下单**:
1. 加购: `addToCart` → 存在则 +1，否则新建
2. 结算: `/checkout` 展示商品 + 原价 + 会员折扣 + 折后价
3. 提交: `createOrder` → 交易内创建 Order + OrderItem[] → 清空 CartItem → 扣减 stock

**模拟支付** (`payOrder`):
1. `Order.status = "PAID"`
2. `User.totalSpent += order.totalAmount`
3. 根据 new totalSpent 判定升级，返回升级提示
4. 管理员后续可标记 `SHIPPED` → `COMPLETED`

### Component Tree

```
前台 (shop)/layout.tsx
├── Header ("use client")
│   ├── SearchBar → router.push
│   ├── CartIcon (badge)
│   └── UserMenu + MembershipBadge
├── {page}
└── Footer

后台 admin/layout.tsx
├── AdminSidebar (fixed, nav links)
├── AdminHeader
└── {page}
```

### shadcn/ui Component 约定

Components 位于 `src/components/ui/`。使用 `cn()` utility 合并类名。全部组件支持 Tailwind v4 oklch 色域，通过 `globals.css` 中的 `@theme inline` 注入 CSS 变量。已安装的 radix 依赖: `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-dialog`。

---

## Next.js 16 Breaking Changes

- `params` / `searchParams` 是 `Promise`，必须 `await`: `const { id } = await params`
- `middleware.ts` 改名为 `proxy.ts`，导出 `export default async function proxy(request)`
- Tailwind CSS v4: 无 `tailwind.config.js`，CSS 中用 `@import "tailwindcss"` + `@theme inline {}`
- shadcn/ui 使用 oklch 色域，支持 `dark` variant


## 命名规范
- 文件名：kebab-case（如 product-card.tsx）
- 组件：PascalCase（如 ProductCard）
- 函数：camelCase（如 getProducts）

## 约定
- 所有 UI 文案和注释用中文
- 优先使用 Server Components
- API 返回 JSON，错误返回 { error: string }

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用
- **api-crud-generator**: 根据 Prisma 模型自动生成 Next.js API Route + 前端管理页面 (列表/新增/编辑/删除)

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
