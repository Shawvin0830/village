import { Injectable } from '@nestjs/common';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class InterviewPlansService {
  private get client() {
    return getSupabaseClient();
  }

  private getLLMClient() {
    const config = new Config();
    return new LLMClient(config);
  }

  async generate(topicId: string) {
    // 获取话题信息
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();
    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    // 获取子话题
    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, summary')
      .eq('topic_id', topicId);

    // 获取已有的采访记录
    const { data: records } = await this.client
      .from('interview_records')
      .select('transcript_text, dialect_original')
      .eq('topic_id', topicId)
      .eq('status', 'completed');

    const subtopicNames = (subtopics || []).map((s) => s.name).join('、');
    const existingInfo = (records || [])
      .map((r) => r.transcript_text || r.dialect_original || '')
      .filter(Boolean)
      .join('\n');

    // 调用 LLM 生成采访策划
    const llmClient = this.getLLMClient();
    const systemPrompt = `你叫"村庄记忆"，是一个帮助乡村图书馆记录村庄文化和老人记忆的AI助手。
你的任务是帮用户准备一次采访。

核心原则：
1. 问题要贴近老人的生活经验，不要太学术
2. 孩子版问题要简单口语化，8-12岁能理解
3. 追问锦囊要实用，帮孩子应对采访中的常见情况
4. 方言原话要保留，普通话转写是辅助

请严格按照以下JSON格式返回，不要有其他内容：
{
  "context_summary": "语境摘要（已知信息、已有资料、空白点）",
  "adult_questions": ["大人备用版问题1", "问题2", ...],
  "child_questions": ["小孩执行版问题1", "问题2", ...],
  "tips": ["追问锦囊1", "锦囊2", ...]
}`;

    const userPrompt = `话题：${topic.name}
${topic.description ? `描述：${topic.description}` : ''}
${subtopicNames ? `已有子话题：${subtopicNames}` : ''}
${existingInfo ? `已有采访内容：\n${existingInfo}` : ''}

请为这个话题生成采访策划。`;

    const response = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7 },
    );

    // 解析 LLM 返回的 JSON
    let parsed: {
      context_summary: string;
      adult_questions: string[];
      child_questions: string[];
      tips: string[];
    };

    try {
      const content = response.content.trim();
      // 尝试提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 JSON');
      }
    } catch {
      // 如果解析失败，使用默认结构
      parsed = {
        context_summary: response.content,
        adult_questions: ['请介绍这个话题的基本情况', '这个话题有什么特别之处？', '您对这个话题有什么个人记忆？'],
        child_questions: ['爷爷/奶奶，您能给我讲讲这个话题吗？', '您小时候这个话题是什么样的？', '有什么有趣的故事吗？'],
        tips: ['如果老人说了一个你没听过的东西，问"这个是什么？能再讲讲吗？"', '如果老人讲偏题了，说"这个太有趣了！那我们刚才说的那个呢？"', '如果老人说了专有名词，问"这个词是什么意思？"'],
      };
    }

    // 保存到数据库
    const { data: plan, error: planError } = await this.client
      .from('interview_plans')
      .insert({
        topic_id: topicId,
        context_summary: parsed.context_summary,
        adult_questions: parsed.adult_questions,
        child_questions: parsed.child_questions,
        tips: parsed.tips,
      })
      .select()
      .single();
    if (planError) throw new Error(`保存采访策划失败: ${planError.message}`);

    return plan;
  }

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
