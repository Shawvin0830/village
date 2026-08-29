# 授权管理模块说明 V3

## 本次范围

V3 把授权管理改成“按受访人管理”。页面主对象不再是子话题，也不再让木兰选择授权级别。

本补丁只升级授权相关模块，不开发 ASR，也不删除现有录音/转写相关代码。`subtopics.auth_level` 暂时保留为旧看板兼容字段，不作为新授权页的主字段。

## 核心功能

授权页展示：

- 受访人姓名
- 授权状态
- 话题归属
- 授权方式
- 特殊要求
- 整理文档线索数量

展开受访人卡片后可编辑：

- 受访人姓名
- 授权状态
- 授权方式
- 一级主题 + 二级话题归属
- 特殊要求

## 授权状态

```text
pending    待确认
agreed     已同意
declined   不同意
revisit    需回访确认
withdrawn  已撤回
```

这几个状态比“仅存档/村内可见/可公开”更贴近真实采访流程。它记录的是这个受访人对参与项目和材料使用的整体态度。

## 授权方式

```text
verbal        口述确认
written       书面确认
family_proxy  家属代确认
other         其他方式
```

## 话题归属

话题归属采用“一级主题 + 二级话题”的多选结构。

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
auth_method
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
auth_method
auth_person
restriction
topic_affiliations
authorized_at
reversible
previous_status
created_at
```

## 接口

继续保留：

```text
GET /api/topics/:id/auth-list
GET /api/topics/:id/auth-overview
```

新增主保存接口：

```text
POST /api/topics/:id/interviewees/:intervieweeId/authorization
```

请求体：

```json
{
  "name": "陈爷爷",
  "auth_status": "agreed",
  "auth_method": "verbal",
  "auth_note": "公开时不要写家人的真实姓名。",
  "topic_affiliations": [
    { "primary": "建筑与空间", "secondary": "宗祠" },
    { "primary": "手艺与物质文化", "secondary": "木工" }
  ]
}
```

旧接口仍保留：

```text
POST /api/topics/:id/subtopics/:subId/auth
```

它只作为兼容入口，不是 V3 授权页主路径。

## AI 与人工关系

V3 不额外调用模型 API。它会从已有采访整理结果里用规则推导：

- 候选受访人
- 候选话题归属
- 贡献信息点数量
- 整理文档摘要

木兰做的是确认、删改和补充，而不是从零手工结构化。

后续如果接低价模型，可以把“候选话题归属”这一步改成模型输出，但保存结构不需要变。

## 扣子里怎么调

推荐拆成三个 workflow：

1. 受访人授权列表
   - 输入：`topic_id`
   - 输出：受访人列表、授权状态、候选话题归属、整理文档线索

2. 保存受访人授权
   - 输入：姓名、授权状态、授权方式、特殊要求、话题归属
   - 输出：更新后的受访人、下一位待确认受访人

3. 授权总览
   - 输入：话题下的受访人
   - 输出：已同意人数、待确认人数、已标注人数、需回访人数

## 验收场景

- 页面不再出现“授权级别”选择。
- 能看到受访人姓名、授权状态、话题归属、授权方式、特殊要求。
- 话题归属支持一级主题 + 二级话题多选。
- 修改某个受访人的授权状态，不影响其他受访人。
- 保存特殊要求后刷新仍能看到。
- 候选受访人能从采访整理文档里推导出来。
- 新增或修改授权会写入 `authorization_records`。
