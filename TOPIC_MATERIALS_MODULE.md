# 话题材料模块补丁说明

## 这次解决什么

这版把「话题管理」补成一个可以向下追溯材料来源的入口：

1. 话题管理页顶部新增搜索框。
2. 搜索框下方新增「历史采访」「外部文献」两个筛选按钮。
3. 话题卡片显示该话题下的子话题数、历史采访数、外部文献数。
4. 话题卡片右侧新增删除按钮，删除前会二次确认。
5. 在话题详情页，子话题卡片可以点击进入「子话题材料」。
6. 子话题材料页显示：
   - 谁讲过这个子话题
   - 每个人对应的一段采访摘录
   - 这个人的授权状态、年龄/职业/身份、话题归属
   - 点击摘录后查看受访人 profile 和完整采访内容
   - 该子话题关联的外部文献

## 使用路径

木兰在小程序里的路径是：

```text
话题管理
→ 搜索话题，或点「历史采访 / 外部文献」筛选
→ 点进一级话题，例如「潮汕宗祠建筑设计」
→ 点子话题，例如「宗祠整体布局」
→ 看「谁讲过这段」
→ 点某个受访人的摘录
→ 查看这个人的 profile 和完整采访内容
```

删除话题的路径是：

```text
话题管理
→ 找到要删除的话题
→ 点话题卡片右侧红色删除图标
→ 二次确认
```

注意：删除一级话题会连带删除这个话题下的子话题、采访记录、受访人、授权记录和外部文献关联，具体级联范围由数据库外键决定。

## 数据颗粒度

这版按「子话题」聚合材料，不做到逐 claim 管理。

后端接口会从现有表读取：

```text
topics
subtopics
interview_records
interviewees
reference_materials
```

采访内容优先读取 `interview_records.ai_analysis.segments`：

```json
{
  "segments": [
    {
      "summary": "这段摘要",
      "quote": "适合展示的一句摘录",
      "source_text": "原文片段",
      "speaker": "陈爷爷"
    }
  ],
  "interviewee": {
    "name": "陈爷爷",
    "age": "72",
    "occupation": "木匠",
    "role": "村中老人"
  }
}
```

如果没有结构化片段，就回退显示 `mandarin_text`、`dialect_original` 或 `transcript_text`。

## 新增接口

```text
GET /api/topics/:id/subtopics/:subId/materials
DELETE /api/topics/:id
```

返回结构：

```json
{
  "topic_id": "topic-id",
  "topic_name": "潮汕宗祠建筑设计",
  "subtopic": {
    "id": "subtopic-id",
    "name": "宗祠整体布局",
    "icon": "🏛️",
    "summary": "这个子话题的摘要"
  },
  "quotes": [
    {
      "id": "interview-record-id",
      "quote": "老人讲到的具体摘录",
      "summary": "摘录摘要",
      "full_interview": "完整采访整理文本",
      "interviewee": {
        "id": "interviewee-id",
        "name": "陈爷爷",
        "age": "72",
        "occupation": "木匠",
        "role": "村中老人",
        "auth_status": "agreed",
        "auth_note": "公开时不要写家人的真实姓名",
        "topic_affiliations": [
          { "primary": "建筑与空间", "secondary": "宗祠" }
        ]
      }
    }
  ],
  "references": [
    {
      "id": "reference-id",
      "title": "文献标题",
      "source": "外部文献",
      "summary": "文献摘要",
      "content": "文献正文"
    }
  ]
}
```

## 本版不做什么

- 不接新的 AI API。
- 不产生额外模型调用成本。
- 不开发 ASR。
- 不删除录音转写页，只保持原入口。
- 不改变授权状态，只读取受访人授权状态用于展示。

## 文件清单

```text
src/app.config.ts
src/pages/topics/index.tsx
src/pages/topic-detail/index.tsx
src/pages/subtopic-materials/index.tsx
src/pages/subtopic-materials/index.config.ts
server/src/topics/topics.controller.ts
server/src/topics/topics.service.ts
TOPIC_MATERIALS_MODULE.md
```

注意：`server/src/topics/topics.controller.ts` 和 `server/src/topics/topics.service.ts` 当前也包含上一版授权管理的接口改动。建议先应用授权模块，再应用本话题材料模块，或直接使用当前合并后的服务文件。
