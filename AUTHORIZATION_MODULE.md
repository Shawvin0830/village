# 授权管理模块说明

## 本次范围

本补丁只处理授权管理模块，不开发 ASR，也不删除现有录音/转写相关代码。后续如果采访内容来自讯飞听见或其他整理工具，只要最终写入采访整理文本、子话题摘要和待核实标记，授权页就可以继续使用。

## 用户流程

1. 木兰进入某个话题的授权管理页。
2. 页面按子话题展示整理后的采访内容摘要。
3. 木兰查看每段内容来自谁、有哪些待核实点、是否可能涉及隐私或敏感风险。
4. 木兰逐个子话题选择授权级别：仅存档、村内可见、可对外分享。
5. 木兰记录授权方式、授权人和特殊要求。
6. 保存时只更新当前子话题，同时写入一条授权历史。

## 前端展示颗粒度

授权不是按整场采访确认，而是按子话题确认。第一版做到子话题级，不做到逐 claim 授权。

每个子话题卡片展示：

- 子话题名和图标
- 内容摘要
- 信息来源：受访人 / 采访整理文档
- 原文摘录
- 待核实项
- 授权前风险提醒
- 当前授权状态
- 授权级别、授权方式、授权人、特殊要求

受访人概览展示：

- 姓名
- 年龄、职业或身份，没有则显示待补充
- 标签，例如宗祠、木雕、历史、地理
- 贡献信息点数量

## 后端接口

继续使用现有接口，降低对扣子页面和已有流程的破坏：

```text
GET /api/topics/:id/auth-list
POST /api/topics/:id/subtopics/:subId/auth
GET /api/topics/:id/auth-overview
```

`POST /api/topics/:id/subtopics/:subId/auth` 请求体：

```json
{
  "auth_level": "public",
  "auth_method": "verbal",
  "auth_person": "陈爷爷",
  "restriction": "可以公开，但不要写家人的真实姓名。"
}
```

保存规则：

- 只更新当前 `subtopics` 记录。
- 更新 `auth_level / auth_method / auth_person / auth_time / auth_restriction`。
- 不修改 `verify_status`。
- 不修改其他子话题。
- 新增一条 `authorization_records` 历史记录。
- 返回 `previous_level`、`reversible` 和 `next_subtopic_id`。

## 数据结构

`subtopics` 新增字段：

```text
auth_restriction
```

新增授权历史表 `authorization_records`：

```text
id
topic_id
subtopic_id
auth_level
auth_method
auth_person
restriction
authorized_at
reversible
previous_level
created_at
```

看板和授权页仍然优先读取 `subtopics.auth_level` 作为当前状态。`authorization_records` 用于追溯每次授权变更。

## 来源与风险规则

授权页不额外调用 AI，因此不会产生新的模型 API 成本。

数据来源优先级：

1. `interview_records.ai_analysis.segments`
2. `subtopics.summary`
3. `interview_records.mandarin_text / dialect_original / transcript_text`

风险提醒规则：

- 有待核实 flag：提示公开时不能写成已核实事实。
- 出现姓名、家庭、纠纷、隐私等关键词：提示公开前确认是否隐去真实姓名。
- 出现据说、听说、可能、不确定等表达：提示保留口述来源并标注待核实。
- `auth_level = public` 且 `verify_status = pending`：提示已获公开授权，但事实核实仍未完成。

## 扣子里怎么调

推荐把这个模块拆成三个能力：

- 授权列表读取：读取话题、子话题、采访整理结果，生成授权工作台数据。
- 单子话题授权保存：接收授权级别、方式、授权人、特殊要求，只保存当前子话题。
- 授权总览：统计 `已确认/总数`、各授权级别数量、可公开但未核实的项目。

如果在扣子 workflow 中配置，字段颗粒度建议保持到子话题级：

- `topic_id`
- `subtopic_id`
- `auth_level`
- `auth_method`
- `auth_person`
- `restriction`
- `previous_level`
- `authorized_at`
- `reversible`
- `verify_status`

不要把授权状态只写进知识库。知识库适合放村志、论文、图片说明、采访原文等长资料；项目进度、核实状态、授权状态应该放结构化表或变量。

## 验收场景

- 给“木雕”设置为可对外分享，“宗祠整体”和“屋脊装饰”不变化。
- 填写特殊要求后，刷新授权页仍可看到。
- 可对外分享和待核实能同时出现，不误导成已核实。
- 未整理内容的子话题显示“采访内容整理完成后可设置授权”。
- 修改授权时返回 `previous_level`，并新增授权历史。
- 授权总览能展示 `已确认 1/3、2/3、3/3`。
