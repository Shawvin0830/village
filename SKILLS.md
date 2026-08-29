# 村庄记忆 — Skill 调试文档

> 版本：V1.1 | 三个核心 Skill 的接口说明与调试指南

---

## 概览

| Skill | 文件 | 职责 |
|-------|------|------|
| 采访策划师 | `server/src/skills/interview-planner.skill.ts` | 根据话题生成采访问题清单 |
| 转录整理师 | `server/src/skills/transcript-organizer.skill.ts` | 将录音/文本按子话题分段整理 |
| 授权管理师 | `server/src/skills/authorization-manager.skill.ts` | 按子话题管理授权级别 |

---

## Skill ①：采访策划师

### 功能

根据话题名称和已有资料，生成结构化的采访策划方案。

### API 端点

```
POST /api/interview-plans/generate
Content-Type: application/json

{
  "topic_id": "话题UUID"
}
```

### 返回格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "plan_id": "策划记录UUID",
    "topic_id": "话题UUID",
    "context_summary": "## 已知信息\n- ...\n\n## 已有资料\n- ...\n\n## 空白点\n- ...",
    "adult_questions": "1. ...\n2. ...",
    "child_questions": "1. ...\n2. ...",
    "tips": "- 老人说了一个你没听过的东西 → ...\n- ...",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `context_summary` | string | 语境摘要（Markdown格式），分三段：已知信息、已有资料、空白点 |
| `adult_questions` | string | 大人备用版问题（5-8个），换行分隔 |
| `child_questions` | string | 孩子执行版问题（3-5个），简单口语化，换行分隔 |
| `tips` | string | 追问锦囊（5种场景），换行分隔 |

### 调试要点

- 需要先创建话题（`POST /api/topics`）才能生成策划
- 每次生成会保存一条新记录，不会覆盖旧的
- AI 会读取已有采访记录和已有策划，避免重复提问
- 如果话题下还没有子话题，AI 会建议先拆分

### 调试步骤

```bash
# 1. 创建话题
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"潮汕宗祠建筑设计","description":"V1话题"}'

# 2. 添加子话题（可选但推荐）
TOPIC_ID="上一步返回的id"
curl -X POST "http://localhost:3000/api/topics/$TOPIC_ID/subtopics" \
  -H "Content-Type: application/json" \
  -d '{"name":"木雕","icon":"🪵"}'

# 3. 生成采访策划
curl -X POST http://localhost:3000/api/interview-plans/generate \
  -H "Content-Type: application/json" \
  -d "{\"topic_id\":\"$TOPIC_ID\"}"
```

---

## Skill ②：转录整理师

### 功能

将采访录音或文本按子话题智能分段，保留方言原文，标记待核实内容和新发现。

### 两种输入方式

#### 方式 A：文本直接输入（推荐调试用）

```
POST /api/interview-records/transcribe-text
Content-Type: application/json

{
  "topic_id": "话题UUID",
  "subtopic_id": "子话题UUID（可选）",
  "text": "采访内容文本..."
}
```

#### 方式 B：录音上传 + ASR 转写

```
# 步骤1：上传录音
POST /api/interview-records/upload-audio
Content-Type: multipart/form-data
audio: (WAV文件, 16kHz, 单声道)

# 返回 audio_key

# 步骤2：转写
POST /api/interview-records/transcribe
Content-Type: application/json

{
  "topic_id": "话题UUID",
  "subtopic_id": "子话题UUID（可选）",
  "audio_key": "上一步返回的audio_key"
}
```

### 返回格式

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "record_id": "记录UUID",
    "topic_id": "话题UUID",
    "subtopic_id": "子话题UUID或null",
    "raw_text": "原始输入文本",
    "structured_text": "## 🏛️ 宗祠整体 [段落1]\n\n**方言原话**：...\n**普通话转写**：...\n\n标记：\n- ⚠️ 待核实：...\n- 🆕 新发现：...",
    "subtopic_segments": [
      {
        "subtopic_name": "宗祠整体",
        "subtopic_id": "UUID或null",
        "text": "该段落的原始文本",
        "summary": "该段落的内容摘要"
      }
    ],
    "cross_references": [
      {
        "subtopic_name": "木雕",
        "current_range": "[段落2]",
        "previous_ranges": ["[段落5]"]
      }
    ],
    "deepening_suggestions": [
      {
        "subtopic_name": "木雕",
        "suggestion": "木雕部分讲得比较浅，建议下次深挖..."
      }
    ],
    "created_at": "2026-01-01T00:00:00.000Z"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `raw_text` | string | 用户输入的原始文本 |
| `structured_text` | string | 结构化整理结果（Markdown格式） |
| `subtopic_segments` | array | 按子话题分段的列表 |
| `cross_references` | array | 交叉引用（同一子话题在不同段落出现） |
| `deepening_suggestions` | array | 子话题深化建议 |

### 调试要点

- **推荐用文本方式调试**（方式A），避免录音格式问题
- 文本中应包含多个子话题的内容，AI 会自动分段
- 如果指定了 `subtopic_id`，整段内容会归到该子话题下
- 如果没有指定，AI 会根据内容自动匹配已有子话题
- 方言原文会被保留，同时生成普通话转写
- 待核实标记：日期、人名、事实性断言
- 新发现标记：与已有知识对比

### 调试步骤

```bash
TOPIC_ID="你的话题ID"
SUB_ID="你的子话题ID"

# 文本转写（推荐）
curl -X POST http://localhost:3000/api/interview-records/transcribe-text \
  -H "Content-Type: application/json" \
  -d "{
    \"topic_id\": \"$TOPIC_ID\",
    \"subtopic_id\": \"$SUB_ID\",
    \"text\": \"宗祠的木雕主要是在梁架上面，我们潮汕这边叫抬梁式。说到屋脊装饰，我们叫厝角头，有金木水火土五种样式。我记得正厅的梁上有两只狮子滚球，是清道光年间重修时请的潮州工匠做的。\"
  }"
```

---

## Skill ③：授权管理师

### 功能

按子话题逐个确认授权级别，生成内容摘要，记录授权历史。

### API 端点

#### 获取授权列表（带内容摘要）

```
GET /api/topics/:topicId/auth-list
```

返回：
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "子话题UUID",
      "name": "木雕",
      "icon": "🪵",
      "auth_level": "none",
      "auth_method": null,
      "auth_person": null,
      "auth_time": null,
      "transcription_status": "done",
      "verification_status": "pending",
      "content_summary": "这段讲了木雕的位置和工艺特点...",
      "pending_verify_items": ["清道光年间的具体年份", "工匠的姓名"],
      "last_auth_level": null,
      "auth_changed": false
    }
  ]
}
```

#### 设置授权级别

```
POST /api/topics/:topicId/subtopics/:subtopicId/auth
Content-Type: application/json

{
  "auth_level": "village",
  "auth_method": "口述同意",
  "auth_person": "陈爷爷"
}
```

`auth_level` 可选值：`archive`（仅存档）| `village`（村内可见）| `public`（可对外分享）

#### 获取授权总览

```
GET /api/topics/:topicId/auth-overview
```

返回：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "topic_name": "潮汕宗祠建筑设计",
    "stats": {
      "total": 3,
      "archive": 1,
      "village": 1,
      "public": 1,
      "pending": 0
    },
    "subtopics": [
      {
        "id": "UUID",
        "name": "宗祠整体",
        "icon": "🏛️",
        "auth_level": "village",
        "auth_method": "口述同意",
        "auth_person": "陈爷爷",
        "auth_time": "2026-01-01T00:00:00.000Z",
        "content_summary": "这段讲了宗祠的修建年代和重修历史...",
        "last_auth_level": null,
        "auth_changed": false
      }
    ],
    "shareable_info": "可对外分享的内容：木雕"
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `content_summary` | AI 根据采访记录生成的内容摘要，让老人知道这段讲了什么 |
| `pending_verify_items` | 该子话题下待核实的内容列表 |
| `last_auth_level` | 上次授权级别（用于追踪变更） |
| `auth_changed` | 本次是否变更了授权 |
| `shareable_info` | 汇总哪些内容可以对外分享 |

### 调试要点

- `content_summary` 需要该子话题有采访记录才会生成
- 如果没有采访记录，`content_summary` 为 null
- 授权级别可以随时修改，会记录变更历史
- `auth_method` 记录授权方式（口述同意/签名/其他）
- `auth_person` 记录授权人姓名

### 调试步骤

```bash
TOPIC_ID="你的话题ID"
SUB_ID="你的子话题ID"

# 1. 查看授权列表（含内容摘要）
curl "http://localhost:3000/api/topics/$TOPIC_ID/auth-list"

# 2. 设置授权
curl -X POST "http://localhost:3000/api/topics/$TOPIC_ID/subtopics/$SUB_ID/auth" \
  -H "Content-Type: application/json" \
  -d '{"auth_level":"village","auth_method":"口述同意","auth_person":"陈爷爷"}'

# 3. 查看授权总览
curl "http://localhost:3000/api/topics/$TOPIC_ID/auth-overview"
```

---

## 完整 Demo 流程

```bash
# 1. 创建话题
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name":"潮汕宗祠建筑设计","description":"V1话题"}'
# 记录 topic_id

# 2. 添加子话题
curl -X POST "http://localhost:3000/api/topics/{topic_id}/subtopics" \
  -H "Content-Type: application/json" \
  -d '{"name":"宗祠整体","icon":"🏛️"}'
curl -X POST "http://localhost:3000/api/topics/{topic_id}/subtopics" \
  -H "Content-Type: application/json" \
  -d '{"name":"木雕","icon":"🪵"}'
curl -X POST "http://localhost:3000/api/topics/{topic_id}/subtopics" \
  -H "Content-Type: application/json" \
  -d '{"name":"屋脊装饰","icon":"🐉"}'

# 3. 生成采访策划
curl -X POST http://localhost:3000/api/interview-plans/generate \
  -H "Content-Type: application/json" \
  -d '{"topic_id":"{topic_id}"}'

# 4. 文本转写（模拟采访）
curl -X POST http://localhost:3000/api/interview-records/transcribe-text \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id":"{topic_id}",
    "text":"宗祠是三进布局，前厅天井正厅。正厅供祖宗牌位。木雕主要是在梁架上面，我们叫抬梁式。屋脊装饰叫厝角头，有金木水火土五种。"
  }'

# 5. 查看授权列表
curl "http://localhost:3000/api/topics/{topic_id}/auth-list"

# 6. 逐个设置授权
curl -X POST "http://localhost:3000/api/topics/{topic_id}/subtopics/{sub_id_1}/auth" \
  -H "Content-Type: application/json" \
  -d '{"auth_level":"village","auth_method":"口述同意","auth_person":"陈爷爷"}'

# 7. 查看授权总览
curl "http://localhost:3000/api/topics/{topic_id}/auth-overview"

# 8. 查看进度看板
curl "http://localhost:3000/api/topics/dashboard"
```

---

## 常见问题

### Q: 采访策划生成的问题不够好？
A: 可以在 `interview-planner.skill.ts` 中调整 prompt 的 `ROLE` 和 `STYLE` 部分。

### Q: 转写整理没有按子话题分段？
A: 确保输入的文本包含多个子话题的内容，且话题下已添加子话题。如果文本太短，AI 可能不会分段。

### Q: 授权列表的 content_summary 是 null？
A: 需要先对该子话题进行转写（步骤4），有了采访记录后才会生成摘要。

### Q: 录音上传失败？
A: 确保录音格式为 WAV（16kHz，单声道）。调试时建议用文本方式（transcribe-text）代替录音。
