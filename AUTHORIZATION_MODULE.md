# 授权管理模块说明 V4

## 本次范围

V4 把授权管理收敛成“受访人档案 + 授权状态 + 话题归属”。页面不再直接铺开所有受访人，也不再使用“授权级别”和“授权方式”。

本补丁只升级授权相关模块，不开发 ASR，也不删除现有录音/转写相关代码。`subtopics.auth_level` 仍保留给旧看板兼容，不作为新授权页主字段。

## 页面结构

授权管理首页显示：

- 搜索框
- 统计卡片：未设置、同意、不同意
- 受访人名单按钮
- 增加受访人按钮
- 话题归属标注进度

点击“受访人名单”后显示姓名列表。点击统计卡片后显示对应状态的人名列表。点击搜索结果或名单里的姓名后进入该受访人的 profile。

## 搜索

搜索支持两类输入：

- 人名，例如“陈爷爷”
- 话题，例如“建筑与空间”“宗祠”“木工”“族谱”

搜索结果显示受访人姓名，点击姓名进入 profile。

## 受访人 Profile

profile 可查看和编辑：

- 姓名
- 年龄
- 职业
- 身份
- 授权状态
- 话题归属
- 特殊要求
- 关联采访资料包

关联采访资料包只在 profile 里展示，不在首页和名单页展开。

## 授权状态

```text
unset     未设置
agreed    同意
declined  不同意
```

新增受访人的默认状态是 `unset`。

## 话题归属

话题归属采用“一级主题 + 二级话题”的多选结构。每个一级主题下都有一个添加入口，可以新增自定义二级话题。

### 01 建筑与空间

宗祠、庙宇、老宅、桥梁、水井、古道、学校、集市、公共空间

### 02 地理与地标

山川、水系、田地、道路、村落边界、老地名、自然地标

### 03 宗族与家族

姓氏来源、宗祠文化、族谱、迁徙、家族关系、祖先故事

### 04 民俗与节庆

春节、清明、端午、中秋、婚俗、丧葬、祭祀、成年礼、地方节庆

### 05 信仰与仪式

神祇、祭祖、庙会、禁忌、祈福、仪式空间、民间信仰

### 06 生产与生计

农耕、渔业、手工业、商贸、传统职业、工具、集市

### 07 饮食与物产

家常菜、节庆食品、地方特产、制作技艺、食材、宴席

### 08 日常生活

衣着、住房、出行、用水、照明、购物、娱乐、家庭生活

### 09 儿童与教育

学校、读书、游戏、童谣、劳动、成长、家庭教育

### 10 人物与人生

村中老人、手艺人、教师、干部、商人、普通家庭、特殊人物

### 11 村庄事件

建村、灾害、修路、建桥、建校、集体活动、社会变迁

### 12 语言与口述文化

方言词、俗语、谚语、童谣、歌谣、称谓、地名读音

### 13 手艺与物质文化

木工、石雕、编织、农具、服饰、器物、建筑技艺

### 14 故事与传说

地方传说、人物轶事、地名故事、神话、怪谈、家族故事

### 15 村庄变迁

人口、迁徙、产业、建筑、交通、环境、生活方式

### 16 社区关系

邻里互助、宗族关系、公共事务、集体劳动、女性角色

## 数据结构

新增 `interviewees` 表：

```text
id
topic_id
name
age
occupation
role
auth_status
auth_note
topic_affiliations
confirmed_at
created_at
updated_at
```

新增 `interviewee_topic_links` 表：

```text
id
topic_id
interviewee_id
primary_topic
secondary_topic
source
confidence
created_at
```

调整 `authorization_records` 表为受访人授权历史：

```text
id
topic_id
interviewee_id
subtopic_id
auth_status
auth_person
restriction
topic_affiliations
authorized_at
reversible
previous_status
created_at
```

## 接口

继续保留列表与总览：

```text
GET /api/topics/:id/auth-list
GET /api/topics/:id/auth-overview
```

主保存接口：

```text
POST /api/topics/:id/interviewees/:intervieweeId/authorization
```

请求体：

```json
{
  "name": "陈爷爷",
  "age": "72",
  "occupation": "木匠",
  "role": "村中老人",
  "auth_status": "agreed",
  "auth_note": "公开时不要写家人的真实姓名。",
  "topic_affiliations": [
    { "primary": "建筑与空间", "secondary": "宗祠" },
    { "primary": "手艺与物质文化", "secondary": "木工" }
  ]
}
```

旧接口仍保留为兼容入口：

```text
POST /api/topics/:id/subtopics/:subId/auth
```

## AI 与人工关系

V4 不额外调用模型 API。它会从已有采访整理结果里用规则推导：

- 候选受访人
- 候选话题归属
- 关联采访资料包
- 整理文档摘要

木兰可以在 profile 里直接确认、删改、补充。

## 扣子里怎么调

推荐拆成四个能力块：

1. 受访人授权入口
   - 输出统计：未设置、同意、不同意、已标注

2. 受访人搜索
   - 输入：人名或一级/二级话题
   - 输出：匹配受访人列表

3. 受访人 Profile
   - 输入：`interviewee_id`
   - 输出：姓名、年龄、职业、身份、授权状态、话题归属、特殊要求、关联采访

4. 保存受访人 Profile
   - 输入：profile 字段
   - 输出：更新后的受访人、历史记录

## 验收场景

- 首页不直接铺开所有人。
- 点击“受访人名单”能看到姓名列表，点姓名进入 profile。
- 搜人名能进入对应 profile。
- 搜一级主题或二级话题能看到关联受访人，点姓名进入 profile。
- 点击“未设置/同意/不同意”统计卡片能看到对应名单。
- 新增受访人默认状态是未设置。
- profile 能编辑姓名、年龄、职业、身份、授权状态、话题归属、特殊要求。
- 每个一级主题下面能添加自定义二级话题。
- 保存某个受访人不影响其他受访人。
