/**
 * 采访策划师 Skill — 专业化采访策划
 *
 * 核心能力：
 * 1. 语境分析：综合已有资料，识别知识空白点
 * 2. 双版本问题生成：大人备用版（深度追问）+ 孩子执行版（简单口语）
 * 3. 追问锦囊：应对偏题、专有名词、新发现等场景
 * 4. 避免重复：基于已有采访记录，不重复已覆盖的内容
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
   * 包含：语境摘要、大人版问题、孩子版问题、追问锦囊
   */
  async generate(topicId: string) {
    // 1. 收集上下文
    const context = await this.collectContext(topicId);

    // 2. 调用 LLM 生成策划
    const plan = await this.generatePlan(context);

    // 3. 保存到数据库
    const { data: savedPlan, error } = await this.client
      .from('interview_plans')
      .insert({
        topic_id: topicId,
        context_summary: plan.context_summary,
        adult_questions: plan.adult_questions,
        child_questions: plan.child_questions,
        tips: plan.tips,
      })
      .select()
      .single();

    if (error) throw new Error(`保存采访策划失败: ${error.message}`);
    return savedPlan;
  }

  /**
   * 收集话题的完整上下文
   */
  private async collectContext(topicId: string) {
    // 话题基本信息
    const { data: topic } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();

    if (!topic) throw new Error('话题不存在');

    // 已有子话题
    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, summary')
      .eq('topic_id', topicId);

    // 已有采访记录
    const { data: records } = await this.client
      .from('interview_records')
      .select('transcript_text, dialect_original, mandarin_text, ai_analysis')
      .eq('topic_id', topicId)
      .eq('status', 'completed');

    // 已有策划
    const { data: existingPlans } = await this.client
      .from('interview_plans')
      .select('context_summary, adult_questions, child_questions')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 已有资料（用户录入 + AI搜索）
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
   * 调用 LLM 生成采访策划
   */
  private async generatePlan(context: Awaited<ReturnType<InterviewPlannerSkill['collectContext']>>) {
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
        return `${i + 1}. [${sourceLabel}] ${m.title}${tags ? ` (标签: ${tags})` : ''}\n   ${m.content?.substring(0, 200) || ''}${m.content && m.content.length > 200 ? '...' : ''}`;
      })
      .join('\n\n');

    const systemPrompt = `你叫"村庄记忆"的采访策划师，是一个专业的文化记录顾问。

你的任务是帮用户准备一次高质量的采访。你要像一个经验丰富的田野调查专家一样思考。

## 核心原则

1. **贴近生活**：问题要贴近老人的日常生活经验，不要太学术化
2. **双版本设计**：
   - 大人版（5-8个）：深度追问，包含事实核查角度，帮木兰（项目负责人）把握方向
   - 孩子版（3-5个）：简单口语化，8-12岁能理解和执行
3. **避免重复**：如果已有采访记录，不要重复已覆盖的内容，要找到空白点
4. **方言友好**：问题设计要考虑方言表达，避免需要精确术语才能回答的问题
5. **追问锦囊要实用**：帮孩子应对采访中的真实场景

## 语境摘要要求

语境摘要要包含三部分：
- **已知信息**：这个话题我们已经知道什么（来自互联网常识和已有采访）
- **已有资料**：图书馆/项目组已有的相关材料
- **空白点**：还没人讲过的、还不清楚的、值得深挖的方向

## 追问锦囊设计

要覆盖以下场景：
- 老人说了一个孩子没听过的东西 → 如何追问
- 老人讲得很有意思但偏题了 → 如何拉回来
- 老人说了一个专有名词/方言词 → 如何记录
- 老人记忆模糊/不确定 → 如何处理
- 老人情绪激动/感慨 → 如何回应

请严格按以下JSON格式返回，不要有任何其他内容：
{
  "context_summary": "语境摘要（包含已知信息、已有资料、空白点三部分）",
  "adult_questions": ["大人备用版问题1", "问题2", ...],
  "child_questions": ["小孩执行版问题1", "问题2", ...],
  "tips": ["追问锦囊1（场景→应对方式）", "锦囊2", ...]
}`;

    const userPrompt = `## 话题信息
话题名称：${topic.name}
${topic.description ? `话题描述：${topic.description}` : ''}

## 子话题列表
${subtopicInfo || '暂无子话题'}

## 已有资料（用户录入/AI搜索）
${materialsInfo || '暂无资料'}

## 已有采访内容
${recordInfo ? recordInfo.substring(0, 1500) : '暂无已有采访记录'}

## 已有策划
${existingPlanInfo}

请为这个话题生成一份专业的采访策划。注意：
1. 如果已有资料，请充分利用这些资料，找到还没覆盖的空白点
2. 孩子版问题要足够简单，让8-12岁的孩子能直接问出口
3. 追问锦囊要具体实用，给出场景和对应的应对话术`;

    const llmClient = this.getLLMClient();
    const response = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7 },
    );

    // 解析 JSON
    try {
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('无法提取 JSON');
    } catch {
      return {
        context_summary: response.content,
        adult_questions: [
          `请详细介绍${topic.name}的历史和现状`,
          `${topic.name}最让您印象深刻的记忆是什么？`,
          '这些年${topic.name}发生了什么变化？',
          '有什么是年轻人可能不知道的？',
        ],
        child_questions: [
          `爷爷/奶奶，您能给我讲讲${topic.name}吗？`,
          '您小时候这个是什么样的？',
          '有什么有趣的故事可以告诉我吗？',
        ],
        tips: [
          '如果老人说了一个你没听过的东西 → "这个是什么？能再给我讲讲吗？"',
          '如果老人讲偏题了 → "这个太有趣了！那我们刚才说的那个呢？"',
          '如果老人说了方言词 → "这个词是什么意思？我记下来"',
          '如果老人不确定 → "没关系，您记得多少说多少，我们慢慢聊"',
        ],
      };
    }
  }

  /**
   * 获取话题的最新策划
   */
  async getByTopic(topicId: string) {
    const { data, error } = await this.client
      .from('interview_plans')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw new Error(`查询采访策划失败: ${error.message}`);
    return data?.[0] || null;
  }
}
