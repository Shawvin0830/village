# 村庄记忆 - 设计指南

## 品牌定位

- 应用定位：帮助乡村图书馆记录村庄文化和老人记忆的AI助手
- 设计风格：温暖质朴、有文化感、现代但不冰冷
- 目标用户：乡村图书馆负责人（大人）和 8-12 岁的孩子

## 配色方案

| 用途 | Tailwind 类名 | 色值 | 意象 |
|------|--------------|------|------|
| 主色 | `bg-amber-700` `text-amber-700` | #B45309 | 琥珀棕，记忆的温度 |
| 辅色 | `bg-lime-800` `text-lime-800` | #4D7C0F | 青苔绿，传承与新生 |
| 页面背景 | `bg-stone-50` | #FAFAF5 | 米白，宣纸底色 |
| 卡片背景 | `bg-white` | #FFFFFF | 纯白卡片 |
| 主文字 | `text-stone-800` | #292524 | 暖黑 |
| 副文字 | `text-stone-500` | #78716C | 暖灰 |
| 分割线 | `border-stone-200` | #E7E5E4 | 淡灰 |
| 待核实 | `text-red-600` `bg-red-50` | #DC2626 | 赭红批注 |
| 已完成 | `text-green-800` `bg-green-50` | #166534 | 深绿印章 |
| 新发现 | `text-amber-600` `bg-amber-50` | #D97706 | 金色标注 |

## 字体规范

- 标题 H1：`text-xl font-bold text-stone-800`
- 标题 H2：`text-lg font-semibold text-stone-800`
- 正文：`text-sm text-stone-600`
- 辅助文字：`text-xs text-stone-400`
- 方言引用：`text-sm text-stone-700 bg-amber-50 p-3 rounded-lg italic`

## 间距系统

- 页面边距：`px-4`（16px）
- 卡片内边距：`p-4`
- 卡片间距：`gap-3` 或 `space-y-3`
- 列表项间距：`gap-2`
- 区块间距：`space-y-6`

## 组件使用原则

- 通用 UI 组件优先使用 `@/components/ui/*`
- 按钮：`Button`（主色用 amber-700 风格）
- 卡片：`Card` + `CardContent`（话题卡片、记录卡片）
- 标签：`Badge`（状态标签：转录/核实/授权）
- 弹窗：`Dialog`（授权确认、采访问题展示）
- 输入框：`Input`（话题名称、文本输入）
- 进度：`Progress`（话题完成进度）
- 空状态：居中图标+文字说明

## 导航结构

TabBar 四个页面：
1. **进度看板**（首页）- 进度看板 + 下一步建议
2. **话题**（话题管理）- 话题列表 + 话题树
3. **资料库**（全局资料）- 所有话题资料汇总 + 搜索
4. **我的**（个人中心）- 设置

子页面（通过 navigateTo 跳转）：
- 话题详情：子话题状态 + 采访记录 + 授权管理
- 采访策划：AI 生成的问题清单
- 录音转写：录音 + ASR 转写结果

## 容器样式

- 卡片：`bg-white rounded-xl shadow-sm border border-stone-100`
- 页面容器：`bg-stone-50 min-h-screen`
- 分组标题：`text-lg font-semibold text-stone-800 mb-3`

## 状态展示原则

- 空状态：图标 + "还没有话题，点击下方开始记录"
- 加载态：Skeleton 骨架屏
- 错误态：温和提示 + 重试按钮

## 小程序约束

- 图片全部使用 TOS 对象存储 URL
- TabBar 图标使用本地 PNG（81x81）
- 录音功能需要平台检测（H5 降级）
- 包体积控制在 2MB 以内
