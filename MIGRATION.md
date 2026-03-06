# Manga Platform Next.js 迁移需求文档

> 从 React + FastAPI 迁移到 Next.js 全栈
> 创建日期：2026-03-06
> 状态：进行中

## 项目信息

| 项目 | 说明 |
|-----|------|
| 原仓库 | `frxiaobei/manga-character-platform` |
| 新仓库 | `frxiaobei/manga-platform-nextjs` |
| 原技术栈 | React + Vite + FastAPI + SQLAlchemy |
| 新技术栈 | Next.js + Prisma + Supabase |

## 技术栈选择（Elvis 标准）

| 层 | 技术 | 说明 |
|---|------|------|
| 框架 | **Next.js 14+ (App Router)** | 前后端统一 |
| 语言 | **TypeScript** | 100% TS |
| ORM | **Prisma** | 替代 SQLAlchemy |
| 数据库 | **Supabase PostgreSQL** | 替代 Render PostgreSQL |
| 认证 | **Supabase Auth** | 替代自定义 OAuth |
| 图片存储 | **Cloudinary**（保持） | 已有配置，迁移零成本 |
| 状态管理 | **TanStack Query** | 数据 fetching |
| 样式 | **Tailwind + shadcn/ui** | 已有 Tailwind |
| 部署 | **Vercel** | 替代 Render |
| CI | **GitHub Actions** | lint + typecheck + e2e |
| 测试 | **Playwright** | e2e 测试 |

## 迁移阶段

### Phase 1：基础配置 ✅ (Codex 进行中)

- [ ] Prisma 初始化 + Schema
- [ ] Supabase 客户端配置
- [ ] shadcn/ui 组件安装
- [ ] TanStack Query Provider
- [ ] 环境变量模板

### Phase 2：API Routes 迁移 (Codex 进行中)

| 原 FastAPI | 新 Next.js Route | 状态 |
|------------|-----------------|------|
| `auth.py` | `api/auth/` + Supabase Auth | ⏳ |
| `characters.py` | `api/characters/route.ts` | ⏳ |
| `tags.py` | `api/tags/route.ts` | ⏳ |
| `me.py` | `api/me/route.ts` | ⏳ |
| `upload.py` | `api/upload/route.ts` (Cloudinary) | ⏳ |
| `checkout.py` | `api/checkout/route.ts` | ⏳ |
| `coupons.py` | `api/coupons/route.ts` | ⏳ |
| `webhook.py` | `api/webhook/route.ts` | ⏳ |
| `admin_reviews.py` | `api/admin/reviews/route.ts` | ⏳ |

### Phase 3：前端迁移 (Claude 待派发)

| 原页面 | 新位置 | 状态 |
|-------|-------|------|
| `Home.tsx` | `app/page.tsx` | ⏳ |
| `Login.tsx` | `app/login/page.tsx` | ⏳ |
| `Dashboard.tsx` | `app/dashboard/page.tsx` | ⏳ |
| `Characters.tsx` | `app/characters/page.tsx` | ⏳ |
| `CharacterDetail.tsx` | `app/characters/[id]/page.tsx` | ⏳ |
| `NewCharacter.tsx` | `app/characters/new/page.tsx` | ⏳ |
| `AdminReview.tsx` | `app/admin/review/page.tsx` | ⏳ |
| `PromoReview.tsx` | `app/admin/promo/page.tsx` | ⏳ |
| `CheckoutSuccess.tsx` | `app/checkout/success/page.tsx` | ⏳ |
| `GoogleAuthCallback.tsx` | Supabase Auth 处理 | ⏳ |

### Phase 4：部署 + 测试

- [ ] Vercel 项目配置
- [ ] 环境变量设置
- [ ] Supabase 项目创建
- [ ] 数据迁移
- [ ] 域名配置
- [ ] e2e 测试

## 数据模型 (Prisma Schema)

```prisma
// 参考原项目 backend/app/models/

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  avatar        String?
  role          Role        @default(USER)
  characters    Character[]
  transactions  Transaction[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Character {
  id          String   @id @default(cuid())
  name        String
  description String?
  imageUrl    String?
  price       Float    @default(0)
  status      Status   @default(PENDING)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  tags        Tag[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tag {
  id         String      @id @default(cuid())
  name       String      @unique
  characters Character[]
}

model Coupon {
  id          String   @id @default(cuid())
  code        String   @unique
  discount    Float
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
}

model Transaction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Float
  status    String
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}

enum Status {
  PENDING
  APPROVED
  REJECTED
}
```

## 环境变量

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase PostgreSQL)
DATABASE_URL=

# Cloudinary (保持)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth (通过 Supabase)
# 在 Supabase Dashboard 配置

# Stripe (如果有支付)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## 验收标准

- [ ] 所有页面功能与原版一致
- [ ] 所有 API 接口兼容
- [ ] Google 登录正常
- [ ] 图片上传正常
- [ ] 支付流程正常（如有）
- [ ] 管理员功能正常
- [ ] Vercel 部署成功
- [ ] PR Preview 可用
- [ ] e2e 测试通过

## 参考资料

- 原项目：`~/projects/manga-character-platform/`
- Elvis 技术栈：`skills/agent-swarm/references/elvis/TECH_STACK.md`
- 模型分工：`skills/agent-swarm/rules/MODEL_ROLES.md`

---

*Last updated: 2026-03-06*
