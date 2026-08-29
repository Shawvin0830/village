# 村庄记忆 — 产品整合文档

---

## 产品名称

**村庄记忆**

## 一句话产品介绍

帮助乡村图书馆记录村庄文化和老人记忆的 AI 助手——通过采访策划、录音转写、授权管理等工具，帮助孩子和大人们一起记录珍贵的村庄记忆。

## 产品入口

**H5 地址**：https://8aaddd1a-75d7-4134-ae7f-d060eb488b19.dev.coze.site

| 页面 | 链接 |
|------|------|
| 进度看板（首页） | https://8aaddd1a-75d7-4134-ae7f-d060eb488b19.dev.coze.site/#/pages/index/index |
| 话题管理 | https://8aaddd1a-75d7-4134-ae7f-d060eb488b19.dev.coze.site/#/pages/topics/index |
| 资料库 | https://8aaddd1a-75d7-4134-ae7f-d060eb488b19.dev.coze.site/#/pages/material-library/index |
| 我的 | https://8aaddd1a-75d7-4134-ae7f-d060eb488b19.dev.coze.site/#/pages/profile/index |

---

## 产品背景

潮汕溪南古村，一个 3 到 4 万人的大村，30 个自然村落全姓周，宗族文化深厚。村民日常聊天最常问的两个问题是："你是哪家的孩子？""你是哪个祠堂的？"——答不上来，别人就没法认识你。在这里，知道自己从哪来，是每个人的社交名片，也是归属感的根基。

图书馆负责人卢石英希望带孩子去采访村里的老人，记录风俗和生活记忆。但在没有 AI 工具之前，这些工作做了就等于散了——"说了就说了，查了就查了，很碎片化，讨论一个问题的切入点都要花很长时间。"

**村庄记忆**就是为了解决这个问题：把碎片化的村庄文化信息，通过"搜集资料 → AI 策划 → 儿童采访 → 录音转写 → 整理成文"的完整流程，变成可回顾、可深挖、可传承的结构化文档。

---

## 使用说明

### 场景一：资料库 —— 解决"网上能查到的东西先收集起来"

> **解决的问题**：动手采访之前，先搞清楚 already 知道什么。避免重复查、重复问，也让孩子在采访前对话题有基本认知。

按"历史采访"和"外部文献"两个来源汇总所有资料，支持按话题浏览和关键词搜索。外部文献支持手动录入、AI 搜索、网络采集三种方式。每条资料关联到具体话题和子话题，方便后续交叉引用。

### 场景二：话题管理 —— 解决"要记录的东西很散，需要一个结构"

> **解决的问题**：村庄文化涉及建筑、工艺、民俗、人物等多方面，不按结构梳理就会越记越乱。

创建一级话题（如"潮汕宗祠建筑设计"），拆分子话题（如"木雕""石雕""整体布局"）。每个子话题可以独立追踪转录状态、核实状态和授权级别。点击子话题可以查看：谁讲过这段、对应的采访摘录、受访人档案、关联的外部文献——所有材料按子话题聚合，不再散落。

### 场景三：采访策划 —— 解决"不知道该问什么"

> **解决的问题**：大人和孩子都不知道该问老人什么问题，讨论切入点要花很长时间。AI 根据已有资料找出"空白点"，生成有针对性的问题。

选择话题后，AI 读取已有资料和采访记录，自动生成：语境摘要（已知什么、还缺什么）、大人备用版问题（5-8 个深度问题）、孩子执行版问题（3-5 个简单口语化问题）、追问锦囊（老人说到陌生概念时怎么追问）。同时生成大人版和孩子版两套话术，大人把握方向，孩子执行提问。

### 场景四：采访手卡 —— 解决"带着什么问题去现场"

> **解决的问题**：策划方案里问题很多，实际采访需要精简成一份可执行的清单。

从 AI 策划方案中挑选问题，组合成一份手卡。每个问题保留：问题原文、孩子版简化表述、提问意图、追问方向。支持编辑和自定义修改，打印或手机上直接看。

### 场景五：采访录制与转写 —— 解决"谁在什么时候讲了什么，记不清楚"

> **解决的问题**：采访完只有一堆录音，回听费时，方言听不懂，关键信息容易遗漏。

支持三种输入：录音（小程序端录制）、文本直接输入、文档上传。提交后 AI 自动将内容按子话题分段，保留方言原文，翻译为普通话，标记待核实内容和新发现。结果以"故事片段"展示，每个片段归属一个分类（建筑史、工艺文化、人物传记等），标注来源和完整性。

### 场景六：授权管理 —— 解决"这段内容能不能用、谁同意的"

> **解决的问题**：老人的口述涉及隐私和意愿，必须记清楚谁同意了、同意到什么范围，避免后续纠纷。

以受访人为中心建立档案（姓名、年龄、职业、身份），记录授权状态（未设置 / 同意 / 不同意），通过"一级主题 + 二级话题"标注每段内容的归属范围。支持搜索、统计、变更历史追溯。

### 场景七：进度看板 —— 解决"现在做到哪了、下一步干什么"

> **解决的问题**：话题多、步骤多，负责人需要一个全局视图，快速判断进度和瓶颈。

首页以四步流程（策划 → 授权 → 采访 → 整理）展示每个话题的推进状态和统计数字，底部给出"下一步建议"。打开就知道该干什么。

---

## 技术实现说明

### 整体架构

```
┌─────────────────────────────────────────────────┐
│                   前端（Taro 4）                  │
│  React 18 + TypeScript + Tailwind CSS 4          │
│  状态管理: Zustand  |  图标: lucide-react-taro    │
│  UI 组件: @/components/ui (shadcn/ui Taro 版)     │
│  网络请求: Network 封装 (自动域名拼接 + 代理)      │
├─────────────────────────────────────────────────┤
│                  后端（NestJS 10）                 │
│  ORM: Drizzle ORM  |  校验: Zod                   │
│  全局前缀: /api  |  状态码拦截器: 201→200          │
├─────────────────────────────────────────────────┤
│                  数据层（Supabase）                │
│  PostgreSQL  |  Row Level Security                │
│  表: topics, subtopics, interview_plans,          │
│      interview_records, interviewees,             │
│      authorization_records, reference_materials,  │
│      interviewee_topic_links                      │
└─────────────────────────────────────────────────┘
```

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Taro | 4.1.9 | 跨端框架（H5 / 微信小程序 / 抖音小程序） |
| React | 18.0.0 | UI 渲染 |
| TypeScript | 5.4.5 | 类型安全 |
| Tailwind CSS | 4.1.18 | 原子化样式 |
| weapp-tailwindcss | 4.9.2 | 小程序端 Tailwind 适配 |
| Zustand | 5.0.9 | 轻量状态管理 |
| lucide-react-taro | latest | 图标库（SVG → Image 渲染） |
| Vite | 4.2.0 | 构建工具 + 开发代理 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 10.4.15 | 服务端框架 |
| Drizzle ORM | 0.45.1 | 数据库 ORM（类型安全） |
| Zod | 4.3.5 | 请求参数校验 |
| Supabase | - | PostgreSQL 托管 + 认证 |

### 后端模块结构

| 模块 | 路径 | 职责 |
|------|------|------|
| TopicsModule | `server/src/topics/` | 话题与子话题的 CRUD |
| InterviewPlansModule | `server/src/interview-plans/` | 采访策划的生成与查询 |
| InterviewRecordsModule | `server/src/interview-records/` | 采访记录的存储与处理 |
| MaterialsModule | `server/src/materials/` | 资料库（外部文献）管理 |
| InterviewScriptsModule | `server/src/interview-scripts/` | 采访手卡的组合与编辑 |
| SkillsModule | `server/src/skills/` | AI 技能集成（LLM 调用） |

### AI 技能（Skills）

| 技能 | 文件 | 功能 |
|------|------|------|
| 采访策划师 | `interview-planner.skill.ts` | 根据话题和已有资料，生成结构化采访方案（大人版 + 孩子版问题 + 追问锦囊） |
| 转录整理师 | `transcript-organizer.skill.ts` | 将采访录音/文本按子话题分段，保留方言原文，标记待核实和新发现 |
| 授权管理师 | `authorization-manager.skill.ts` | 按子话题管理授权级别，支持变更历史追溯 |
| 资料向量化 | `material-embedding.skill.ts` | 将资料文本向量化存储，支持语义搜索 |
| 资料搜索 | `material-search.skill.ts` | 基于向量相似度的资料语义检索 |
| 村庄研究员 | `village-research.skill.ts` | AI 驱动的外部资料搜索与采集 |

### 数据库表结构

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `topics` | id, name, description, status | 一级话题 |
| `subtopics` | id, topic_id, name, icon, transcript_status, verify_status, auth_level | 子话题，含转录/核实/授权状态 |
| `interview_plans` | id, topic_id, context_summary, adult_questions, child_questions, tips | AI 生成的采访策划 |
| `interview_records` | id, topic_id, subtopic_id, audio_key, transcript_text, dialect_original, mandarin_text, ai_analysis | 采访记录（含音频、转写、AI 分析） |
| `interviewees` | id, topic_id, name, age, occupation, role, auth_status, topic_affiliations | 受访人档案 |
| `authorization_records` | id, topic_id, interviewee_id, subtopic_id, auth_status, auth_person, reversible | 授权记录（支持变更追溯） |
| `reference_materials` | id, topic_id, subtopic_id, source, title, content, tags, url | 外部文献资料 |
| `interviewee_topic_links` | id, topic_id, interviewee_id, primary_topic, secondary_topic | 受访人-话题归属关联 |

### 前端页面路由

| 页面 | 路径 | 类型 | 功能 |
|------|------|------|------|
| 进度看板 | `pages/index/index` | TabBar | 全局进度概览 + 下一步建议 |
| 话题管理 | `pages/topics/index` | TabBar | 话题 CRUD + 搜索筛选 |
| 资料库 | `pages/material-library/index` | TabBar | 全局资料汇总 + 搜索 |
| 我的 | `pages/profile/index` | TabBar | 个人中心 + 关于 |
| 话题详情 | `pages/topic-detail/index` | 子页面 | 子话题管理 + 状态查看 |
| 子话题材料 | `pages/subtopic-materials/index` | 子页面 | 采访摘录 + 受访人 + 文献 |
| 采访策划 | `pages/interview-plan/index` | 子页面 | AI 生成策划方案 |
| 采访手卡 | `pages/interview-script/index` | 子页面 | 问题组合与编辑 |
| 采访录制 | `pages/interview-record/index` | 子页面 | 录音/文本/文档输入 + AI 转写 |
| 采访管理 | `pages/interview-manage/index` | 子页面 | 受访人采访记录管理 |
| 授权管理 | `pages/authorization/index` | 子页面 | 受访人档案 + 授权状态 |

### 跨端适配要点

- **H5 开发**：Vite proxy 将 `/api` 代理到 `http://localhost:3000`
- **小程序端**：Network 自动拼接 `PROJECT_DOMAIN` 环境变量
- **录音功能**：需平台检测（`Taro.getEnv()`），H5 端提供降级提示
- **文件上传**：小程序端使用 `file.path`，H5 端使用 `file.buffer`，后端同时支持两种模式
- **Tailwind 跨端**：通过 `weapp-tailwindcss` 实现小程序端原子化样式支持

### 设计风格

- **主色**：琥珀棕 `#B45309`（amber-700）——记忆的温度
- **辅色**：青苔绿 `#4D7C0F`（lime-800）——传承与新生
- **背景**：米白 `#FAFAF5`（stone-50）——宣纸底色
- **设计语言**：温暖质朴、有文化感、现代但不冰冷，让"内容"成为主角
