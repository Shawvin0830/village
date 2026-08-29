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

## 使用说明

### 场景一：进度看板（首页）

进度看板是整个项目的"指挥中心"。进入首页后，顶部可以切换不同的话题，下方以四步流程（采访策划 → 授权 → 采访 → 整理）展示当前话题的推进状态。每一步都会显示完成情况和统计数字，例如"3 人已授权""2 个采访"。页面底部会根据当前进度给出"下一步建议"，引导用户继续推进。适合负责人快速了解全局进展，决定接下来该做什么。

### 场景二：话题管理

话题页是内容组织的核心入口。用户可以在这里创建一级话题（如"潮汕宗祠建筑设计"），每个话题下可以拆分子话题（如"木雕""石雕""整体布局"）。话题卡片展示子话题数量、采访数和文献数，支持搜索和按"历史采访 / 外部文献"筛选。点击话题进入详情页，可以看到所有子话题的状态（转录状态、核实状态、授权级别），也可以管理子话题的增删。点击子话题进入"子话题材料"页，查看谁讲过这段内容、对应的采访摘录、受访人档案和关联的外部文献。

### 场景三：采访策划

采访策划页由 AI 驱动。选择话题后，系统会读取该话题下的已有资料和采访记录，自动生成结构化的采访方案，包括：语境摘要（已知信息、已有资料、空白点）、大人备用版问题（5-8 个深度问题）、孩子执行版问题（3-5 个简单口语化问题）、追问锦囊（应对老人提到陌生概念时的追问技巧）。用户可以从策划方案中挑选问题，组合成一份"采访手卡"，方便实际采访时使用。每次生成会保存一条新记录，不会覆盖旧方案。

### 场景四：采访录制与转写

采访记录页支持三种输入模式：录音（小程序端调用 RecorderManager 录音后上传）、文本直接输入（手动粘贴或输入采访内容）、文档上传。提交后，AI 转录整理师会自动将内容按子话题分段，保留方言原文，翻译为普通话，标记待核实内容和新发现。整理结果以"故事片段"的形式展示，每个片段归属一个分类（建筑史、工艺文化、人物传记等），并标注来源和完整性。用户可以对片段进行编辑、核实和补充。

### 场景五：授权管理

授权管理页以"受访人"为中心。用户可以添加受访人档案（姓名、年龄、职业、身份），记录每位受访人的授权状态（未设置 / 同意 / 不同意），并通过"一级主题 + 二级话题"的多选结构标注话题归属。页面顶部有搜索框（支持按人名或话题关键词搜索）和统计卡片（未设置、同意、不同意的人数）。点击受访人进入 Profile 页，可查看和编辑完整信息、关联的采访资料包、特殊要求等。授权记录支持变更历史追溯。

### 场景六：资料库

资料库是全局资料汇总中心。按 Tabs 分为"历史采访"和"外部文献"两个来源，每个 Tab 下先展示话题列表（含资料数量），点击话题进入该话题下的资料详情。支持全局搜索和话题内搜索。外部文献支持手动录入、AI 搜索、网络采集三种来源，每条资料包含标题、内容、标签、来源 URL 等字段。资料库的价值在于：在采访前了解已有信息，避免重复提问；在采访后交叉验证，补充遗漏。

### 场景七：采访手卡

采访手卡页（interview-script）将 AI 策划的问题整理成可执行的采访清单。用户可以从多份策划方案中挑选问题，组合成一份手卡。每个问题包含：问题原文、孩子版简化表述、提问意图、追问方向。手卡支持编辑标题和自定义修改问题内容，方便在实际采访中直接使用。

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
