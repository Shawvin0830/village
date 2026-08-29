# 轻量身份与署名模块（简化版）

## 概述

在现有村志小程序上增量接入用户身份管理和操作署名功能。用户只需填写**昵称 + 选择角色**即可进入，页面右上角显示身份小标签（如「木兰·管理员」），后端自动记录每条数据的创建者/编辑者。不改动任何已有功能逻辑。

## 技术方案

| 维度 | 选择 | 理由 |
|------|------|------|
| 身份存储 | 本地 token + 数据库 operators 表 | 无需登录，轻量持久化 |
| 身份传递 | Network 自动附带 header | 业务代码零侵入 |
| 署名写入 | Service 层 create/update 时自动填充 | 不改变现有接口签名 |
| 角色模型 | 3 种中文角色（管理员/协作者/记录者） | 去掉项目码和角色码，降低认知成本 |
| 身份展示 | 右上角小标签，点击进入「我的」修改 | 简洁不打扰 |

## 功能模块

### 1. 数据库（已就绪，无需操作）

`operators` 表、`activity_logs` 表、各表署名字段（`created_by` 等）已在上轮创建，直接复用。

### 2. 后端 operators 模块

```
server/src/operators/
├── operators.service.ts    # 身份注册/查询/切换
├── operators.controller.ts # POST /identify, GET /me, POST /switch-project
└── operators.module.ts
```

**接口**：
- `POST /api/operators/identify` — body: `{ display_name, role }` → 返回 `{ operator_token, display_name, role }`
- `GET /api/operators/me` — header: `x-operator-token` → 返回当前操作者信息
- `GET /api/activity-logs` — 返回操作记录列表

**角色映射**（去掉角色码，直接用中文）：

| 前端显示 | 存储值 | 权限 |
|---------|--------|------|
| 管理员 | `admin` | 全部读写 + 授权管理 |
| 协作者 | `editor` | 读写，不可授权 |
| 记录者 | `viewer` | 只读 |

### 3. 后端署名注入

在以下 service 的 create/update 方法中，从 `OperatorContext` 自动填充署名字段：

| 文件 | 改动点 |
|------|--------|
| `topics.service.ts` | create → 写 `created_by/name`；update → 写 `updated_by/name` |
| `materials.service.ts` | 同上 |
| `interview-records.service.ts` | 同上 |
| `transcript-organizer.skill.ts` | 接受 operator 参数，写入署名 |

改动方式：每个 service 注入 `OperatorsService`，在写操作前调用 `resolve(token)` 获取操作者，填充字段。**不改变现有接口的请求/响应格式**。

### 4. 前端 identity.ts

```typescript
// 核心 API
getCurrentOperator()     // 获取本地缓存的操作者
setOperator(op)          // 缓存操作者
clearOperator()          // 清除
isReady()                // 是否已设置身份
roleCan(action)          // 权限判断

// 角色常量
const ROLES = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '协作者' },
  { value: 'viewer', label: '记录者' },
]
```

### 5. 前端 network.ts 改造

在现有 Network 请求拦截器中追加：如果本地有 operator token，自动添加 `x-operator-token` header。业务代码无需改动。

### 6. 前端身份展示

**入口**：`app.tsx` 启动时检查 `isReady()`，未设置则跳转「我的」页面引导设置。

**角落标签**：在 `topics`、`topic-detail`、`subtopic-materials` 等核心页面的导航栏区域显示身份小标签（如「木兰·管理员」），点击跳转「我的」页面。

**「我的」页面**：
- 已设置：显示昵称、角色标签，提供「切换身份」按钮
- 未设置：显示设置表单（昵称输入 + 角色选择器）

**署名展示规则**：
- 每条数据 UI 上只显示 2 个名字：`创建者` + `最后编辑者`
- `activity_logs` 操作流水在后台存储，不主动展示到 UI（可按需查询）
- 100 人编辑过同一话题 → 话题卡片上仍只显示创建者和最后编辑者，不会堆满名字

## 是否有原型设计

否

## 实施步骤

1. **后端 operators 模块** — 创建 `server/src/operators/` 三件套，注册到 `app.module.ts`，curl 验证接口
2. **后端署名注入** — 在 `topics.service.ts`、`materials.service.ts`、`interview-records.service.ts`、`transcript-organizer.skill.ts` 中注入署名逻辑
3. **前端 identity + network** — 创建 `src/identity.ts`，改造 `src/network.ts` 自动附带 header
4. **前端 app.tsx + 角落标签** — 启动检查 + 核心页面添加身份小标签组件
5. **前端「我的」页面** — 简化为昵称 + 角色选择的身份设置页
6. **pnpm validate + 构建验证**

## 页面规格

##### @page(/pages/profile/index) 我的

**核心职责**：身份设置与展示
**访问路径**：TabBar 直达；未设置身份时从 app.tsx 自动跳转
**布局**：
- 未设置状态：居中卡片，昵称输入框 + 角色选择器（3 选 1）+ 确认按钮
- 已设置状态：头像区（昵称首字）+ 昵称 + 角色标签 + 「切换身份」按钮

**交互说明**

| 元素 | 动作 | 响应 | 备注 |
|------|------|------|------|
| 确认按钮 | 点击 | 调用 POST /api/operators/identify，成功后刷新页面 | 未设置状态 |
| 切换身份按钮 | 点击 | 弹出 Dialog 重新填写昵称和角色 | 已设置状态 |
| 角色选择器 | 点击 | 展开 3 个选项：管理员/协作者/记录者 | — |
