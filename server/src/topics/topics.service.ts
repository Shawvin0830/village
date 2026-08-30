import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { AuthorizationManagerSkill } from '@/skills/authorization-manager.skill';

type TopicAffiliation = {
  primary: string;
  secondary: string;
};

type AnalysisSegment = {
  summary?: string;
  source_text?: string;
  quote?: string;
  mandarin_text?: string;
  dialect_original?: string;
  speaker?: string;
  interviewee?: string;
};

type InterviewRecord = {
  id: string;
  created_at?: string | null;
  mandarin_text?: string | null;
  dialect_original?: string | null;
  transcript_text?: string | null;
  ai_analysis?: Record<string, unknown> | null;
};

const trimText = (value?: string | null) => (value || '').trim();

const shortText = (value?: string | null, limit = 120) => {
  const text = trimText(value).replace(/\s+/g, ' ');
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const getRecordText = (record: InterviewRecord) =>
  trimText(record.mandarin_text) || trimText(record.dialect_original) || trimText(record.transcript_text);

const extractSegments = (record: InterviewRecord): AnalysisSegment[] => {
  const analysis = record.ai_analysis;
  if (!analysis || !Array.isArray(analysis.segments)) return [];
  return analysis.segments as AnalysisSegment[];
};

const extractPersonBase = (record: InterviewRecord) => {
  const analysis = record.ai_analysis || {};
  const interviewee = analysis.interviewee as Record<string, unknown> | undefined;
  if (interviewee && typeof interviewee === 'object') {
    return {
      name: String(interviewee.name || '受访人待补充'),
      age: interviewee.age ? String(interviewee.age) : null,
      occupation: interviewee.occupation ? String(interviewee.occupation) : null,
      role: interviewee.role || interviewee.identity ? String(interviewee.role || interviewee.identity) : null,
    };
  }

  const segment = extractSegments(record).find((item) => item.interviewee || item.speaker);
  return {
    name: String(analysis.interviewee_name || analysis.speaker || analysis.person || segment?.interviewee || segment?.speaker || '受访人待补充'),
    age: analysis.age ? String(analysis.age) : null,
    occupation: analysis.occupation ? String(analysis.occupation) : null,
    role: analysis.role || analysis.identity ? String(analysis.role || analysis.identity) : null,
  };
};

const safeAffiliations = (value: unknown): TopicAffiliation[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item as Record<string, unknown>;
      return {
        primary: String(record.primary || ''),
        secondary: String(record.secondary || ''),
      };
    })
    .filter((item) => item.primary && item.secondary);
};

@Injectable()
export class TopicsService {
  private get client() {
    return getSupabaseClient();
  }

  constructor(private readonly authSkill: AuthorizationManagerSkill) {}

  async findAll() {
    const { data, error } = await this.client
      .from('topics')
      .select('id, name, description, status, is_completed, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询话题列表失败: ${error.message}`);

    const topicsWithDetails = await Promise.all(
      (data || []).map(async (topic) => {
        // 子话题数量
        const { count: subtopicCount } = await this.client
          .from('subtopics')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        // 是否有采访策划
        const { data: plans } = await this.client
          .from('interview_plans')
          .select('id')
          .eq('topic_id', topic.id)
          .limit(1);

        // 已授权的受访人数
        const { count: authorizedCount } = await this.client
          .from('interviewees')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
          .eq('auth_status', 'agreed');

        // 采访记录总数（原始文件）
        const { count: interviewCount } = await this.client
          .from('interview_records')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        // 已整理的记录数量
        const { count: organizedCount } = await this.client
          .from('interview_records')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
          .eq('status', 'completed');

        // 是否有村庄故事
        const { data: stories } = await this.client
          .from('village_stories')
          .select('id')
          .eq('topic_id', topic.id)
          .limit(1);

        return {
          ...topic,
          is_completed: (topic as Record<string, unknown>).is_completed || false,
          subtopic_count: subtopicCount || 0,
          has_interview_plan: plans && plans.length > 0,
          authorized_count: authorizedCount || 0,
          interview_count: interviewCount || 0,
          organized_count: organizedCount || 0,
          has_story: stories && stories.length > 0,
        };
      }),
    );

    return topicsWithDetails;
  }

  async findOne(id: string) {
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name, description, status, created_at')
      .eq('id', id)
      .maybeSingle();
    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    const { data: subtopics, error: subError } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
      .eq('topic_id', id)
      .order('created_at', { ascending: true });
    if (subError) throw new Error(`查询子话题失败: ${subError.message}`);

    return { ...topic, subtopics: subtopics || [] };
  }

  async create(name: string, description?: string) {
    const { data, error } = await this.client
      .from('topics')
      .insert({ name, description: description || null })
      .select()
      .single();
    if (error) throw new Error(`创建话题失败: ${error.message}`);
    return data;
  }

  async deleteTopic(id: string) {
    const { error } = await this.client
      .from('topics')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`删除话题失败: ${error.message}`);
    return { success: true };
  }

  async updateCompletion(id: string, isCompleted: boolean) {
    const { data, error } = await this.client
      .from('topics')
      .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`更新完成状态失败: ${error.message}`);
    return data;
  }

  async getSubtopics(topicId: string) {
    const { data, error } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`查询子话题失败: ${error.message}`);
    return data || [];
  }

  async createSubtopic(topicId: string, name: string, icon?: string) {
    const { data, error } = await this.client
      .from('subtopics')
      .insert({ topic_id: topicId, name, icon: icon || '📌' })
      .select()
      .single();
    if (error) throw new Error(`创建子话题失败: ${error.message}`);
    return data;
  }

  async getSubtopicMaterials(topicId: string, subtopicId: string) {
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name')
      .eq('id', topicId)
      .maybeSingle();
    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    const { data: subtopic, error: subtopicError } = await this.client
      .from('subtopics')
      .select('id, name, icon, summary, transcript_status, verify_status')
      .eq('id', subtopicId)
      .eq('topic_id', topicId)
      .maybeSingle();
    if (subtopicError) throw new Error(`查询子话题失败: ${subtopicError.message}`);
    if (!subtopic) throw new Error('子话题不存在');

    const { data: records, error: recordsError } = await this.client
      .from('interview_records')
      .select('id, created_at, mandarin_text, dialect_original, transcript_text, ai_analysis')
      .eq('topic_id', topicId)
      .eq('subtopic_id', subtopicId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (recordsError) throw new Error(`查询历史采访失败: ${recordsError.message}`);

    const { data: people } = await this.client
      .from('interviewees')
      .select('id, name, age, occupation, role, auth_status, auth_note, topic_affiliations, confirmed_at')
      .eq('topic_id', topicId);

    const peopleByName = new Map<string, Record<string, unknown>>();
    for (const person of people || []) {
      peopleByName.set(String(person.name), person);
    }

    const quotes = ((records || []) as InterviewRecord[]).map((record, index) => {
      const segments = extractSegments(record);
      const text = getRecordText(record);
      const firstSegment = segments[0];
      const base = extractPersonBase(record);
      const savedPerson = peopleByName.get(base.name);
      const quoteText =
        shortText(firstSegment?.quote || firstSegment?.source_text || firstSegment?.mandarin_text || firstSegment?.summary || text, 160) ||
        '暂无摘录';

      return {
        id: record.id,
        quote: quoteText,
        summary: shortText(firstSegment?.summary || text, 120),
        full_interview: text || '暂无完整采访整理文本',
        created_at: record.created_at || null,
        interviewee: {
          id: savedPerson?.id || `temp-${index}-${record.id}`,
          name: String(savedPerson?.name || base.name),
          age: savedPerson?.age || base.age,
          occupation: savedPerson?.occupation || base.occupation,
          role: savedPerson?.role || base.role,
          auth_status: savedPerson?.auth_status || 'unset',
          auth_note: savedPerson?.auth_note || null,
          topic_affiliations: safeAffiliations(savedPerson?.topic_affiliations),
          confirmed_at: savedPerson?.confirmed_at || null,
        },
      };
    });

    const { data: references, error: referencesError } = await this.client
      .from('reference_materials')
      .select('id, title, content, source, url, tags, created_at')
      .eq('topic_id', topicId)
      .or(`subtopic_id.eq.${subtopicId},subtopic_id.is.null`)
      .order('created_at', { ascending: false });
    if (referencesError) throw new Error(`查询外部文献失败: ${referencesError.message}`);

    const essenceSummary = this.buildEssenceSummary(
      subtopic.name,
      quotes.map((q) => ({
        quote: q.quote,
        interviewee: {
          name: String(q.interviewee.name),
          occupation: q.interviewee.occupation ? String(q.interviewee.occupation) : null,
          role: q.interviewee.role ? String(q.interviewee.role) : null,
        },
      })),
      (references || []).map((item) => ({
        title: item.title,
        content: item.content,
        source: item.source,
      })),
    );

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      subtopic,
      essence_summary: essenceSummary,
      quotes,
      references: (references || []).map((item) => ({
        id: item.id,
        title: item.title,
        source: item.source,
        url: item.url,
        tags: item.tags || [],
        summary: shortText(item.content, 160),
        content: item.content,
        created_at: item.created_at,
      })),
    };
  }

  /**
   * 根据子话题名称、采访摘录、外部文献，动态生成 200-300 字的精华摘要。
   * 格式：为什么研究 → 查了哪些资料/采访了谁 → 获得了什么
   */
  private buildEssenceSummary(
    subtopicName: string,
    quotes: Array<{
      quote: string;
      interviewee: { name: string; occupation?: string | null; role?: string | null };
    }>,
    references: Array<{ title: string; content: string; source?: string | null }>,
  ): string {
    const parts: string[] = [];

    // 1. 为什么研究
    parts.push(`「${subtopicName}」是村落文化记忆的重要组成部分，对其进行系统梳理有助于还原历史面貌、传承地方文脉。`);

    // 2. 查了哪些资料、采访了谁
    const peopleList = [...new Set(quotes.map((q) => q.interviewee.name))].filter(Boolean);
    const refTitles = references.map((r) => r.title).filter(Boolean);

    const researchBits: string[] = [];
    if (quotes.length > 0) {
      const exampleNames = peopleList.slice(0, 3).join('、');
      const more = peopleList.length > 3 ? `等 ${peopleList.length} 位` : '';
      researchBits.push(`已采集 ${exampleNames}${more} 的口述记忆`);
    }
    if (references.length > 0) {
      const uniqueTitles = [...new Set(refTitles)];
      const exampleTitles = uniqueTitles.slice(0, 2).map((t) => `《${t}》`).join('、');
      const more = uniqueTitles.length > 2 ? `等 ${uniqueTitles.length} 篇` : '';
      researchBits.push(`查阅了 ${exampleTitles || '相关文献'}${more} 外部资料`);
    }

    if (researchBits.length > 0) {
      parts.push(`目前，${researchBits.join('，')}。`);
    } else {
      parts.push('目前该子话题的资料采集尚处于初期阶段，尚未录入采访记录或外部文献。');
    }

    // 3. 获得了什么
    if (quotes.length > 0) {
      const topQuote = quotes[0]?.quote || '';
      const snippet = topQuote.length > 60 ? `${topQuote.slice(0, 60)}…` : topQuote;
      parts.push(`通过整理，已初步提炼出关键口述片段，如"${snippet}"等，为后续深入研究提供了扎实的一手素材。`);
    } else if (references.length > 0) {
      parts.push('通过文献梳理，已初步掌握该子话题的基本脉络与核心信息，为后续深入研究奠定了基础。');
    }

    return parts.join('');
  }

  async deleteSubtopic(topicId: string, subtopicId: string) {
    const { error } = await this.client
      .from('subtopics')
      .delete()
      .eq('id', subtopicId)
      .eq('topic_id', topicId);
    if (error) throw new Error(`删除子话题失败: ${error.message}`);
    return { success: true };
  }

  async updateSubtopicAuth(
    topicId: string,
    subtopicId: string,
    authLevel: string,
    authPerson?: string,
    restriction?: string,
  ) {
    return this.authSkill.updateAuth(
      topicId,
      subtopicId,
      authLevel,
      authPerson,
      restriction,
    );
  }

  async updateIntervieweeAuthorization(
    topicId: string,
    intervieweeId: string,
    payload: {
      name?: string;
      age?: string;
      occupation?: string;
      role?: string;
      authStatus: string;
      authNote?: string;
      topicAffiliations?: Array<{ primary: string; secondary: string }>;
    },
  ) {
    return this.authSkill.updateIntervieweeAuthorization(topicId, intervieweeId, payload);
  }

  async getAuthList(topicId: string) {
    return this.authSkill.getAuthList(topicId);
  }

  async getAuthOverview(topicId: string) {
    return this.authSkill.getAuthOverview(topicId);
  }

  async getDashboard() {
    const { data: topics, error } = await this.client
      .from('topics')
      .select('id, name, description, status, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw new Error(`查询话题失败: ${error.message}`);

    if (!topics || topics.length === 0) {
      return { topic: null, nextSteps: [] };
    }

    const topic = topics[0];

    const { data: subtopics, error: subError } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, summary')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: true });
    if (subError) throw new Error(`查询子话题失败: ${subError.message}`);

    const subs = subtopics || [];

    const nextSteps: string[] = [];
    const hasNoSubtopics = subs.length === 0;
    const hasUntranscribed = subs.some((s) => s.transcript_status === 'not_started');
    const hasPendingVerify = subs.some((s) => s.verify_status === 'pending');
    const hasUnauthorized = subs.some((s) => s.auth_level === 'not_set' && s.transcript_status === 'transcribed');
    const allDone = subs.length > 0 && subs.every(
      (s) => s.transcript_status === 'transcribed' && s.auth_level !== 'not_set',
    );

    if (hasNoSubtopics) {
      nextSteps.push('先为话题添加几个子话题，比如"木雕""屋脊装饰"等');
      nextSteps.push('然后去"采访策划"生成采访问题清单');
    } else if (hasUntranscribed) {
      nextSteps.push('有子话题还没有整理好的采访内容，可以先用外部工具整理后再上传或录入');
    }
    if (hasPendingVerify) {
      nextSteps.push('有内容待核实，需要查证相关信息');
    }
    if (hasUnauthorized) {
      nextSteps.push('采访内容整理完成后，需要确认受访人授权状态和话题归属');
    }
    if (allDone) {
      nextSteps.push('🎉 阶段性完成！可以继续深挖某个子话题，或开始新话题');
    }

    return {
      topic: { ...topic, subtopics: subs },
      nextSteps,
    };
  }

  /** 获取子话题下的采访记录列表（quotes 格式） */
  async getQuotes(topicId: string, subtopicId: string) {
    const { data: records, error } = await this.client
      .from('interview_records')
      .select('id, created_at, mandarin_text, dialect_original, transcript_text, ai_analysis')
      .eq('topic_id', topicId)
      .eq('subtopic_id', subtopicId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询采访记录失败: ${error.message}`);

    const { data: people } = await this.client
      .from('interviewees')
      .select('id, name, age, occupation, role')
      .eq('topic_id', topicId);

    const peopleByName = new Map<string, Record<string, unknown>>();
    for (const person of people || []) {
      peopleByName.set(String(person.name), person);
    }

    const quotes = ((records || []) as InterviewRecord[]).map((record, index) => {
      const segments = extractSegments(record);
      const text = getRecordText(record);
      const firstSegment = segments[0];
      const base = extractPersonBase(record);
      const savedPerson = peopleByName.get(base.name);
      const quoteText =
        shortText(firstSegment?.quote || firstSegment?.source_text || firstSegment?.mandarin_text || firstSegment?.summary || text, 160) ||
        '暂无摘录';

      return {
        id: record.id,
        quote: quoteText,
        summary: shortText(firstSegment?.summary || text, 120),
        full_interview: text || '',
        created_at: record.created_at || null,
        interviewee: {
          id: savedPerson?.id || `temp-${index}-${record.id}`,
          name: String(savedPerson?.name || base.name),
          age: savedPerson?.age || base.age || null,
          occupation: savedPerson?.occupation || base.occupation || null,
          role: savedPerson?.role || base.role || null,
        },
      };
    });

    return quotes;
  }

  /** 创建采访记录 */
  async createQuote(
    topicId: string,
    subtopicId: string,
    body: {
      interviewee_name: string;
      age?: string | null;
      occupation?: string | null;
      role?: string | null;
      quote?: string | null;
      full_interview: string;
    },
  ) {
    // 1. 查找或创建受访人
    let intervieweeId: string | null = null;
    const { data: existing } = await this.client
      .from('interviewees')
      .select('id')
      .eq('topic_id', topicId)
      .eq('name', body.interviewee_name)
      .maybeSingle();

    if (existing) {
      intervieweeId = existing.id;
      // 更新受访人信息
      const updateData: Record<string, unknown> = {};
      if (body.age) updateData.age = body.age;
      if (body.occupation) updateData.occupation = body.occupation;
      if (body.role) updateData.role = body.role;
      if (Object.keys(updateData).length > 0) {
        await this.client.from('interviewees').update(updateData).eq('id', intervieweeId);
      }
    } else {
      const { data: newPerson, error: personError } = await this.client
        .from('interviewees')
        .insert({
          topic_id: topicId,
          name: body.interviewee_name,
          age: body.age || null,
          occupation: body.occupation || null,
          role: body.role || null,
        })
        .select('id')
        .single();
      if (personError) throw new Error(`创建受访人失败: ${personError.message}`);
      intervieweeId = newPerson.id;
    }

    // 2. 创建采访记录
    const aiAnalysis = {
      interviewee: {
        name: body.interviewee_name,
        age: body.age || null,
        occupation: body.occupation || null,
        role: body.role || null,
      },
      segments: [
        {
          quote: body.quote || shortText(body.full_interview, 160),
          summary: shortText(body.full_interview, 120),
        },
      ],
    };

    const { data: record, error: recordError } = await this.client
      .from('interview_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId,
        mandarin_text: body.full_interview,
        status: 'completed',
        ai_analysis: aiAnalysis,
      })
      .select()
      .single();
    if (recordError) throw new Error(`创建采访记录失败: ${recordError.message}`);

    return {
      id: record.id,
      quote: body.quote || shortText(body.full_interview, 160),
      full_interview: body.full_interview,
      created_at: record.created_at,
      interviewee: {
        id: intervieweeId,
        name: body.interviewee_name,
        age: body.age || null,
        occupation: body.occupation || null,
        role: body.role || null,
      },
    };
  }

  /** 更新采访记录 */
  async updateQuote(
    topicId: string,
    subtopicId: string,
    quoteId: string,
    body: {
      interviewee_name?: string;
      age?: string | null;
      occupation?: string | null;
      role?: string | null;
      quote?: string | null;
      full_interview?: string;
    },
  ) {
    // 1. 获取现有记录
    const { data: existing, error: fetchError } = await this.client
      .from('interview_records')
      .select('id, ai_analysis, mandarin_text')
      .eq('id', quoteId)
      .eq('topic_id', topicId)
      .maybeSingle();
    if (fetchError) throw new Error(`查询记录失败: ${fetchError.message}`);
    if (!existing) throw new Error('记录不存在');

    // 2. 更新受访人信息
    if (body.interviewee_name) {
      const oldAnalysis = (existing.ai_analysis || {}) as Record<string, unknown>;
      const oldInterviewee = (oldAnalysis.interviewee || {}) as Record<string, unknown>;
      const oldName = String(oldInterviewee.name || '');

      const { data: person } = await this.client
        .from('interviewees')
        .select('id')
        .eq('topic_id', topicId)
        .eq('name', oldName)
        .maybeSingle();

      if (person) {
        const updateData: Record<string, unknown> = { name: body.interviewee_name };
        if (body.age !== undefined) updateData.age = body.age;
        if (body.occupation !== undefined) updateData.occupation = body.occupation;
        if (body.role !== undefined) updateData.role = body.role;
        await this.client.from('interviewees').update(updateData).eq('id', person.id);
      }
    }

    // 3. 更新采访记录
    const fullText = body.full_interview || existing.mandarin_text || '';
    const quoteText = body.quote || shortText(fullText, 160);

    const newAnalysis = {
      interviewee: {
        name: body.interviewee_name || '',
        age: body.age || null,
        occupation: body.occupation || null,
        role: body.role || null,
      },
      segments: [
        {
          quote: quoteText,
          summary: shortText(fullText, 120),
        },
      ],
    };

    const updateData: Record<string, unknown> = {
      ai_analysis: newAnalysis,
      updated_at: new Date().toISOString(),
    };
    if (body.full_interview !== undefined) {
      updateData.mandarin_text = body.full_interview;
    }

    const { data: record, error: updateError } = await this.client
      .from('interview_records')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();
    if (updateError) throw new Error(`更新采访记录失败: ${updateError.message}`);

    return {
      id: record.id,
      quote: quoteText,
      full_interview: fullText,
      created_at: record.created_at,
      interviewee: {
        name: body.interviewee_name || '',
        age: body.age || null,
        occupation: body.occupation || null,
        role: body.role || null,
      },
    };
  }

  /** 删除采访记录 */
  async deleteQuote(topicId: string, subtopicId: string, quoteId: string) {
    const { error } = await this.client
      .from('interview_records')
      .delete()
      .eq('id', quoteId)
      .eq('topic_id', topicId)
      .eq('subtopic_id', subtopicId);
    if (error) throw new Error(`删除采访记录失败: ${error.message}`);
    return { success: true };
  }

  /** 归档话题 */
  async archiveTopic(topicId: string) {
    const { data, error } = await this.client
      .from('topics')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId)
      .select()
      .single();
    if (error) throw new Error(`归档话题失败: ${error.message}`);
    return data;
  }
}
