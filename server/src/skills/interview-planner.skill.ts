/**
 * 采访策划师 Skill — 专业化采访策划（V2 框架版）
 *
 * 基于 Village Memory Interview Skill V0.1
 *
 * 核心能力：
 * 1. 10维度镜头（Interview Lens）：根据话题选取最相关的5-8个维度
 * 2. 三层问题结构：热身（2-3个）→ 核心（6-10个，按维度组织）→ 收尾（2-3个）
 * 3. 双版本设计：每个核心问题含大人备用版 + 小孩执行版
 * 4. 追问锦囊：6类追问（人物/时间/地点/做法/变化/方言）+ 3种特殊场景
 * 5. 避免重复：基于已有采访记录，不重复已覆盖的内容
 */
import { Injectable } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class InterviewPlannerSkill {
  private get client() {
    return getSupabaseClient();
  }

  private getLLMClient() {
    return new LLMClient(new Config());
  }

  /**
   * 生成专业采访策划
   */
  async generate(topicId: string, subtopicId?: string, requirements?: string) {
    const context = await this.collectContext(topicId, subtopicId);
    const plan = await this.generatePlan(context, requirements);

    const { data: savedPlan, error } = await this.client
      .from('interview_plans')
      .insert({
        topic_id: topicId,
        context_summary: plan.context_summary,
        adult_questions: plan.selected_dimensions,
        child_questions: plan.warmup_questions,
        tips: {
          core_questions: plan.core_questions,
          closing_questions: plan.closing_questions,
          tips: plan.tips,
        },
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(`保存采访策划失败: ${error.message}`);

    // 返回完整结构
    return {
      ...savedPlan,
      selected_dimensions: plan.selected_dimensions,
      warmup_questions: plan.warmup_questions,
      core_questions: plan.core_questions,
      closing_questions: plan.closing_questions,
      tips: plan.tips,
    };
  }

  /**
   * 基于已有策划 + 用户反馈迭代优化
   * 创建新版本，保留原始草稿
   */
  async refine(planId: string, feedback: string) {
    const { data: existingPlan, error: planError } = await this.client
      .from('interview_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !existingPlan) throw new Error('策划不存在');

    const context = await this.collectContext(existingPlan.topic_id);
    const refined = await this.refinePlan(context, existingPlan, feedback);

    // 创建新版本，而不是更新原记录
    const { data: newPlan, error: insertError } = await this.client
      .from('interview_plans')
      .insert({
        topic_id: existingPlan.topic_id,
        context_summary: refined.context_summary,
        adult_questions: refined.selected_dimensions,
        child_questions: refined.warmup_questions,
        tips: {
          core_questions: refined.core_questions,
          closing_questions: refined.closing_questions,
          tips: refined.tips,
        },
        status: 'draft',
        parent_id: planId, // 关联到父版本
      })
      .select()
      .single();

    if (insertError) throw new Error(`创建新版本失败: ${insertError.message}`);

    return {
      ...newPlan,
      selected_dimensions: refined.selected_dimensions,
      warmup_questions: refined.warmup_questions,
      core_questions: refined.core_questions,
      closing_questions: refined.closing_questions,
      tips: refined.tips,
    };
  }

  /**
   * 确认定稿
   */
  async finalize(planId: string) {
    const { data, error } = await this.client
      .from('interview_plans')
      .update({ status: 'final', updated_at: new Date().toISOString() })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw new Error(`确认定稿失败: ${error.message}`);
    return data;
  }

  /**
   * 获取话题的所有策划（按时间倒序，最新版本在前）
   */
  async getByTopic(topicId: string) {
    const { data, error } = await this.client
      .from('interview_plans')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询采访策划失败: ${error.message}`);
    return data || [];
  }

  /**
   * 获取单个策划的完整版本链（从当前版本追溯到初始草稿）
   */
  async getVersionChain(planId: string) {
    const versions: Record<string, unknown>[] = [];
    let currentId: string | null = planId;

    while (currentId) {
      const { data, error } = await this.client
        .from('interview_plans')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error || !data) break;
      versions.push(data);
      currentId = (data as Record<string, unknown>).parent_id as string | null;
    }

    return versions;
  }

  /**
   * 收集话题的完整上下文
   */
  private async collectContext(topicId: string, subtopicId?: string) {
    const { data: topic } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();

    if (!topic) throw new Error('话题不存在');

    // 如果指定了子话题，只获取该子话题的信息
    let subtopicsQuery = this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, summary')
      .eq('topic_id', topicId);

    if (subtopicId) {
      subtopicsQuery = subtopicsQuery.eq('id', subtopicId);
    }
    const { data: subtopics } = await subtopicsQuery;

    // 如果指定了子话题，只获取该子话题的采访记录
    let recordsQuery = this.client
      .from('interview_records')
      .select('transcript_text, dialect_original, mandarin_text, ai_analysis')
      .eq('topic_id', topicId)
      .eq('status', 'completed');

    if (subtopicId) {
      recordsQuery = recordsQuery.eq('subtopic_id', subtopicId);
    }
    const { data: records } = await recordsQuery;

    const { data: existingPlans } = await this.client
      .from('interview_plans')
      .select('context_summary, adult_questions, child_questions, tips')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: materials } = await this.client
      .from('reference_materials')
      .select('id, source, title, content, tags, url')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    return {
      topic,
      subtopics: subtopics || [],
      records: records || [],
      existingPlan: existingPlans?.[0] || null,
      materials: materials || [],
    };
  }

  /**
   * 10维度框架定义（传给 LLM 的参考）
   */
  private get dimensionsReference() {
    return `
| 维度 | 英文 | 问什么 | 什么时候选 |
|------|------|--------|-----------|
| 🌱 起源 | Origin | 东西从哪来、怎么开始的 | 主题涉及建筑/宗族/习俗时必选 |
| 👤 人物 | People | 谁做的、谁管的、谁变了 | 几乎所有主题都涉及 |
| 📍 地点 | Place | 在哪、叫什么、还在吗 | 主题涉及建筑/地理/空间时必选 |
| 🔧 做法 | Practice | 具体怎么做、步骤是什么 | 主题涉及习俗/手艺/生计时必选 |
| 🏺 物件 | Object | 用什么、什么材料、现在还有吗 | 主题涉及建筑/手艺/饮食时选 |
| 📜 规则 | Rule | 有什么讲究、禁忌、不能做的 | 主题涉及习俗/信仰/宗族时选 |
| 🧠 个人记忆 | Memory | 您亲历的、您记得的 | **永远必选** |
| 🔄 变化 | Change | 以前和现在有什么不同 | **永远必选** |
| 💡 意义 | Meaning | 对您来说意味着什么 | 收尾时用 |
| 🔁 传承 | Transmission | 谁接着做、还会不会继续 | 主题涉及手艺/习俗/方言时选 |`;
  }

  /**
   * 调用 LLM 生成采访策划（V2 框架）
   */
  private async generatePlan(context: Awaited<ReturnType<InterviewPlannerSkill['collectContext']>>, requirements?: string) {
    const { topic, subtopics, records, existingPlan, materials } = context;

    const subtopicInfo = subtopics
      .map((s) => {
        const status = s.transcript_status === 'transcribed' ? '已转录' : '未转录';
        return `${s.icon || '📌'} ${s.name}（${status}${s.summary ? `，${s.summary}` : ''}）`;
      })
      .join('\n');

    const recordInfo = records
      .map((r) => {
        const text = r.mandarin_text || r.transcript_text || '';
        return text.substring(0, 300);
      })
      .filter(Boolean)
      .join('\n---\n');

    const existingPlanInfo = existingPlan
      ? `已有策划摘要：${existingPlan.context_summary?.substring(0, 200) || '无'}`
      : '暂无已有策划';

    const materialsInfo = materials
      .map((m, i) => {
        const sourceLabel = m.source === 'manual' ? '用户录入' : m.source === 'ai_search' ? 'AI搜索' : '互联网';
        const tags = m.tags ? (Array.isArray(m.tags) ? (m.tags as string[]).join('、') : '') : '';
        return `${i + 1}. [${sourceLabel}] ${m.title}${tags ? ` (标签: ${tags})` : ''}\n   ${m.content?.substring(0, 500) || ''}${m.content && m.content.length > 500 ? '...' : ''}`;
      })
      .join('\n\n');

    const systemPrompt = `你叫"村庄记忆"的采访策划师，是一个专业的文化记录顾问。

你的任务是帮用户准备一次高质量的村庄记忆采访。你要像一个经验丰富的田野调查专家一样思考。

## 10维度采访镜头（Interview Lens）

一次完整的采访，需要从以下10个视角中选取最相关的5-8个。不要全部覆盖——根据主题选最相关的，像调镜头一样，远近高低各不同。

${this.dimensionsReference}

## 问题分层结构

### 热身问题（2-3个）
让老人放松，知道"我随便聊聊就行"。不要一上来就问大问题。
要口语化、像聊天：
- "您在这住了多少年啦？"
- "您小时候这村子啥样？"
- "您跟这个[主题]是怎么认识的？"

### 核心问题（6-10个，按维度组织）
每个核心问题必须包含：
- **dimension**: 维度标签（如 "🌱 起源"）
- **dimension_key**: 维度英文key（如 "origin"）
- **adult_version**: 大人备用版——项目负责人心里有数就行，可以自然插话追问
- **child_version**: 小孩执行版——**像孩子指着现场的东西问老人**，必须口语化、具体、有画面感，不超过1句话。禁止"请介绍"、"请谈谈"等书面表达。
- **why_ask**: 为什么问这个——让采访者理解这个问题在找什么
- **follow_up**: 追问方向——老人说到哪，就往哪个方向跟

### 收尾问题（2-3个）
意义 + 传承 + 寄语，用于收尾，同样要口语化：
- "这个[主题]对您来说意味着啥？"
- "您觉得以后还会在吗？"
- "有什么话想跟我们这些小孩说的？"

## 追问锦囊

分为6类常规追问 + 3种特殊场景：

6类常规追问（根据本次采访涉及的维度选择相关的）：
- 👤 人物追问：老人提到具体的人时
- ⏰ 时间追问：老人提到时间时
- 📍 地点追问：老人提到地点时
- 🔧 做法追问：老人讲到某件事的过程时
- 🔄 变化追问：老人说"不一样了"时
- 🗣️ 方言追问：老人说了方言词时

3种特殊场景（必选）：
- 老人说了一个你没听过的东西 → "这个是什么？能再讲讲吗？"
- 老人讲得很有意思但偏题了 → "这个太有趣了！那我们刚才说的那个呢？"
- 老人说了一个专有名词 → "这个词是什么意思？" → 专有名词=文化密码，千万别跳过

## 核心原则

### 最重要的原则：问题要「指着东西问」

问题必须基于**具体的、可见的、可感知的**事物来提问。想象孩子站在现场，用手指着一个东西问老人。

**好问题的特征**：
- 指向一个具体的东西（建筑构件、物件、照片、地名、某个人）
- 口语化，像日常聊天，不像考试
- 有画面感，老人一听就知道你在问什么

**❌ 坏问题（抽象、书面、浮于表面）**：
- "请介绍一下宗祠的历史和建筑特色" → 太像考试
- "这个建筑有什么文化价值？" → 老人不是百科全书
- "宗祠的建筑风格属于哪个流派？" → 太学术
- "您能谈谈对传统文化传承的看法吗？" → 太宏大

**✅ 好问题（具体、口语、指着东西问）**：
- "屋顶上那几个金木水火土是什么意思呀？" → 指着屋顶问
- "墙上这些画是谁画的？画的是什么故事？" → 指着墙画问
- "这个水滴兽是干什么用的？下雨天真的会滴水吗？" → 指着具体构件问
- "这根柱子为什么是石头不是木头的？" → 观察到的细节
- "以前这里有个戏台，您还记得在哪吗？" → 基于已知信息问具体位置
- "您说以前祭祀要摆九道菜，第一道是什么？" → 追问具体细节

### 其他原则

1. **亲历 > 听说**：优先问"您自己经历过的"、"您还记得吗"
2. **避免重复**：如果已有采访记录，不要重复已覆盖的内容
3. **方言友好**：问题设计要考虑方言表达
4. **不给套路回答**：不问"有什么文化意义"，问"这个是什么意思"、"为什么是这样"
5. **禁忌用语**：绝对不用"请介绍一下"、"请谈谈"、"有什么文化价值"、"有什么历史意义"这类学术/考试/新闻采访用语
6. **利用资料库**：如果资料库中有具体的细节（如某个构件名称、某个人的名字、某个习俗的步骤），要直接把这些细节融入问题中

## 语境摘要要求

语境摘要要包含三部分：
- **已知信息**：这个话题我们已经知道什么
- **已有资料**：图书馆/项目组已有的相关材料
- **空白点**：还没人讲过的、还不清楚的、值得深挖的方向
- **推荐维度**：为什么选这些维度

请严格按以下JSON格式返回，不要有任何其他内容：
{
  "context_summary": "语境摘要",
  "selected_dimensions": ["🌱 起源", "👤 人物", ...],
  "warmup_questions": ["热身问题1", "热身问题2", ...],
  "core_questions": [
    {
      "dimension": "🌱 起源",
      "dimension_key": "origin",
      "adult_version": "大人版问题",
      "child_version": "小孩版问题",
      "why_ask": "为什么问这个",
      "follow_up": "→ 追问方向1、→ 追问方向2"
    }
  ],
  "closing_questions": ["收尾问题1", "收尾问题2", ...],
  "tips": {
    "people": ["人物追问1", ...],
    "time": ["时间追问1", ...],
    "place": ["地点追问1", ...],
    "practice": ["做法追问1", ...],
    "change": ["变化追问1", ...],
    "dialect": ["方言追问1", ...],
    "special": ["特殊场景追问1", ...]
  }
}`;

    const userPrompt = `## 话题信息
话题名称：${topic.name}
${topic.description ? `话题描述：${topic.description}` : ''}

## 子话题列表
${subtopicInfo || '暂无子话题'}

## 已有资料（用户录入/AI搜索）
**请从以下资料中提取具体的细节（构件名称、物件、地名、人名、习俗步骤等），用这些细节来设计具体的采访问题。**
${materialsInfo || '暂无资料'}

## 已有采访内容
${recordInfo ? recordInfo.substring(0, 1500) : '暂无已有采访记录'}

## 已有策划
${existingPlanInfo}
${requirements ? `\n## 用户的具体要求\n${requirements}\n` : ''}
请为这个话题生成一份专业的采访策划。注意：
1. 从10个维度中选取5-8个最相关的，不要全部覆盖
2. 🧠 个人记忆 和 🔄 变化 永远必选
3. 热身问题要针对这个话题定制，不要完全用通用模板
4. 核心问题每个维度1-2个，总共6-10个
5. 小孩版问题要足够简单，让8-12岁的孩子能直接问出口
6. 追问锦囊要根据本次选取的维度，选择相关的追问类型
7. **最重要**：问题要基于资料中的具体细节来设计，指向具体的东西（构件、物件、地名、人名、习俗步骤等），不要问抽象的泛泛问题
8. 所有问题必须口语化，像日常聊天，禁止"请介绍"、"请谈谈"、"有什么文化价值"等书面表达
${requirements ? '9. **必须优先满足用户的具体要求**' : ''}`;

    const llmClient = this.getLLMClient();
    const response = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7 },
    );

    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法提取 JSON');
    } catch {
      return this.getFallbackPlan(topic.name);
    }
  }

  /**
   * 调用 LLM 基于用户反馈迭代优化策划
   */
  private async refinePlan(
    context: Awaited<ReturnType<InterviewPlannerSkill['collectContext']>>,
    existingPlan: Record<string, unknown>,
    feedback: string,
  ) {
    const { topic } = context;

    const currentPlanInfo = `
【语境摘要】${existingPlan.context_summary || '无'}
【选用维度】${JSON.stringify(existingPlan.adult_questions || [])}
【热身问题】${JSON.stringify(existingPlan.child_questions || [])}
【核心问题】${JSON.stringify(existingPlan.tips || {})}
`;

    const systemPrompt = `你叫"村庄记忆"的采访策划师。用户已经有一版采访策划，现在要根据反馈进行修改优化。

## 最重要的原则：问题要「指着东西问」

问题必须基于**具体的、可见的、可感知的**事物来提问。像孩子站在现场，用手指着一个东西问老人。
- ✅ "屋顶那几个金木水火土是什么意思呀？"
- ✅ "墙上这些画是谁画的？画的是什么故事？"
- ✅ "这个水滴兽是干什么用的？"
- ❌ "请介绍一下宗祠的历史和建筑特色"
- ❌ "这个建筑有什么文化价值？"
- ❌ "您能谈谈对传统文化传承的看法吗？"

child_version 必须口语化、具体、有画面感。禁止"请介绍"、"请谈谈"等书面表达。

## 其他核心原则
1. 理解反馈意图：用户可能要求修改某个问题、调整维度、增删问题、改变语气等
2. 保持整体质量：修改时保持其他部分的质量
3. 遵循10维度框架：🌱起源 👤人物 📍地点 🔧做法 🏺物件 📜规则 🧠个人记忆 🔄变化 💡意义 🔁传承
4. 三层结构：热身（2-3个）→ 核心（6-10个，按维度）→ 收尾（2-3个）
5. 双版本设计：每个核心问题有大人版 + 小孩版
6. 追问锦囊分6类+3特殊场景

请严格按以下JSON格式返回：
{
  "context_summary": "更新后的语境摘要",
  "selected_dimensions": ["🌱 起源", ...],
  "warmup_questions": ["热身问题1", ...],
  "core_questions": [
    {
      "dimension": "🌱 起源",
      "dimension_key": "origin",
      "adult_version": "大人版",
      "child_version": "小孩版",
      "why_ask": "为什么问",
      "follow_up": "追问方向"
    }
  ],
  "closing_questions": ["收尾问题1", ...],
  "tips": {
    "people": [], "time": [], "place": [],
    "practice": [], "change": [], "dialect": [], "special": []
  }
}`;

    const userPrompt = `## 话题信息
话题名称：${topic.name}

## 当前策划
${currentPlanInfo}

## 用户的修改反馈
${feedback}

请根据用户反馈修改策划，返回完整的更新后策划（JSON格式）。`;

    const llmClient = this.getLLMClient();
    const response = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7 },
    );

    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法提取 JSON');
    } catch {
      return {
        context_summary: existingPlan.context_summary,
        selected_dimensions: existingPlan.adult_questions,
        warmup_questions: existingPlan.child_questions,
        core_questions: [],
        closing_questions: [],
        tips: existingPlan.tips,
      };
    }
  }

  /**
   * LLM 解析失败时的兜底方案
   */
  private getFallbackPlan(topicName: string) {
    return {
      context_summary: `已知信息：关于「${topicName}」的基础资料有限。\n空白点：需要深入了解老人的亲历记忆和具体细节。`,
      selected_dimensions: ['🌱 起源', '👤 人物', '🧠 个人记忆', '🔄 变化', '💡 意义'],
      warmup_questions: [
        `您在这村住了多少年了？`,
        `您小时候${topicName}是什么样子的？`,
      ],
      core_questions: [
        {
          dimension: '🌱 起源',
          dimension_key: 'origin',
          adult_version: `您知道${topicName}最初是怎么来的吗？是谁发起的？`,
          child_version: `这个是谁造的呀？`,
          why_ask: '起源故事往往是最有记忆价值的部分',
          follow_up: '→ 人物、→ 时间、→ 说法冲突',
        },
        {
          dimension: '👤 人物',
          dimension_key: 'people',
          adult_version: `以前${topicName}由谁负责？现在呢？`,
          child_version: `以前谁管这个？现在谁管？`,
          why_ask: '人物是线索——知道了人，就能追出更多故事',
          follow_up: '→ 还有没有其他关键人物、→ 人物关系',
        },
        {
          dimension: '🧠 个人记忆',
          dimension_key: 'memory',
          adult_version: `关于${topicName}，您印象最深的一件事是什么？`,
          child_version: `您记得最清楚的一件事是什么？讲给我听？`,
          why_ask: '让老人讲自己的故事——原话最珍贵',
          follow_up: '→ 当时多大、→ 什么感觉、→ 现在想起什么感觉',
        },
        {
          dimension: '🔄 变化',
          dimension_key: 'change',
          adult_version: `以前和现在最大的不一样是什么？大概什么时候开始变的？`,
          child_version: `以前和现在哪里不一样？`,
          why_ask: '变化线是老人最有话说的——每个变化背后都是一段历史',
          follow_up: '→ 什么时候开始变的、→ 为什么变、→ 还有什么没变',
        },
      ],
      closing_questions: [
        `这个对您来说意味着什么？`,
        `您觉得以后还会有人记得吗？`,
        `有什么话想跟我们这些后辈说的？`,
      ],
      tips: {
        people: ['"他/她是谁？" → 提到不认识的人时追问', '"您和他/她是什么关系？"'],
        time: ['"您当时多大？" → 用年龄锚定比年代更准', '"是您小时候？还是您爸爸那时候？"'],
        place: ['"这个地方现在还在吗？"', '"以前本地人叫这个什么？"'],
        practice: ['"能不能从头到尾讲一遍？"', '"第一步是什么？然后呢？"'],
        change: ['"以前和现在有什么不一样？"', '"大概从什么时候开始变的？"'],
        dialect: ['"这个词用本地方言怎么说？"', '"能不能再说一遍？我跟着念一下"'],
        special: [
          '老人说了你没听过的东西 → "这个是什么？能再讲讲吗？"',
          '老人偏题了 → "这个太有趣了！那我们刚才说的那个呢？"',
          '老人说了专有名词 → "这个词是什么意思？" → 千万别跳过',
        ],
      },
    };
  }
}
