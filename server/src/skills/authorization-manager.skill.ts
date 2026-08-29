/**
 * 授权管理师 Skill V3 — 按受访人管理授权状态与话题归属
 *
 * 核心能力：
 * 1. 受访人视角：授权管理页以“人”为主对象，而不是以子话题为主对象
 * 2. 授权状态：记录待确认/已同意/不同意/需回访确认/已撤回
 * 3. 话题归属：按“一级主题 + 二级话题”多选标注受访人贡献方向
 * 4. 低成本推导：从已有采访整理文本里推导候选人名和候选话题，不额外调用 AI
 * 5. 兼容旧接口：保留旧 subtopic auth 入口，但主流程使用 interviewee authorization
 */
import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

type TopicAffiliation = {
  primary: string;
  secondary: string;
};

type AnalysisSegment = {
  summary?: string;
  flags?: unknown;
  claims?: unknown;
  source_text?: string;
  dialect_original?: string;
  mandarin_text?: string;
  quote?: string;
  subtopic_id?: string;
  matched_subtopic_id?: string;
  subtopic_name?: string;
  speaker?: string;
  interviewee?: string;
  tags?: unknown;
};

type InterviewRecord = {
  subtopic_id?: string | null;
  mandarin_text?: string | null;
  dialect_original?: string | null;
  transcript_text?: string | null;
  ai_analysis?: Record<string, unknown> | null;
};

type IntervieweeCard = {
  id: string;
  name: string;
  age: string | null;
  occupation: string | null;
  role: string | null;
  auth_status: string;
  auth_status_label: string;
  auth_method: string | null;
  auth_method_label: string;
  auth_note: string | null;
  topic_affiliations: TopicAffiliation[];
  suggested_affiliations: TopicAffiliation[];
  source_count: number;
  source_summary: string;
  confirmed_at: string | null;
  is_temporary: boolean;
};

const AUTH_STATUSES = {
  pending: '待确认',
  agreed: '已同意',
  declined: '不同意',
  revisit: '需回访确认',
  withdrawn: '已撤回',
} as const;

const AUTH_METHODS = {
  verbal: '口述确认',
  written: '书面确认',
  family_proxy: '家属代确认',
  other: '其他方式',
} as const;

const TOPIC_TAXONOMY = [
  {
    code: '01',
    primary: '建筑与空间',
    secondary: ['宗祠', '庙宇', '老宅', '桥梁', '水井', '古道', '学校', '集市', '公共空间'],
  },
  {
    code: '02',
    primary: '地理与地标',
    secondary: ['山川', '水系', '田地', '道路', '村落边界', '老地名', '自然地标'],
  },
  {
    code: '03',
    primary: '宗族与家族',
    secondary: ['姓氏来源', '宗祠文化', '族谱', '迁徙', '家族关系', '祖先故事'],
  },
  {
    code: '04',
    primary: '民俗与节庆',
    secondary: ['春节', '清明', '端午', '中秋', '婚俗', '丧葬', '祭祀', '成年礼', '地方节庆'],
  },
  {
    code: '05',
    primary: '信仰与仪式',
    secondary: ['神祇', '祭祖', '庙会', '禁忌', '祈福', '仪式空间', '民间信仰'],
  },
  {
    code: '06',
    primary: '生产与生计',
    secondary: ['农耕', '渔业', '手工业', '商贸', '传统职业', '工具', '集市'],
  },
  {
    code: '07',
    primary: '饮食与物产',
    secondary: ['家常菜', '节庆食品', '地方特产', '制作技艺', '食材', '宴席'],
  },
  {
    code: '08',
    primary: '日常生活',
    secondary: ['衣着', '住房', '出行', '用水', '照明', '购物', '娱乐', '家庭生活'],
  },
  {
    code: '09',
    primary: '儿童与教育',
    secondary: ['学校', '读书', '游戏', '童谣', '劳动', '成长', '家庭教育'],
  },
  {
    code: '10',
    primary: '人物与人生',
    secondary: ['村中老人', '手艺人', '教师', '干部', '商人', '普通家庭', '特殊人物'],
  },
  {
    code: '11',
    primary: '村庄事件',
    secondary: ['建村', '灾害', '修路', '建桥', '建校', '集体活动', '社会变迁'],
  },
  {
    code: '12',
    primary: '语言与口述文化',
    secondary: ['方言词', '俗语', '谚语', '童谣', '歌谣', '称谓', '地名读音'],
  },
  {
    code: '13',
    primary: '手艺与物质文化',
    secondary: ['木工', '石雕', '编织', '农具', '服饰', '器物', '建筑技艺'],
  },
  {
    code: '14',
    primary: '故事与传说',
    secondary: ['地方传说', '人物轶事', '地名故事', '神话', '怪谈', '家族故事'],
  },
  {
    code: '15',
    primary: '村庄变迁',
    secondary: ['人口', '迁徙', '产业', '建筑', '交通', '环境', '生活方式'],
  },
  {
    code: '16',
    primary: '社区关系',
    secondary: ['邻里互助', '宗族关系', '公共事务', '集体劳动', '女性角色'],
  },
];

const trimText = (value?: string | null) => (value || '').trim();

const shortText = (value?: string | null, limit = 120) => {
  const text = trimText(value).replace(/\s+/g, ' ');
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const stableIdPart = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1000000007;
  }
  return String(hash);
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

const affiliationKey = (item: TopicAffiliation) => `${item.primary}::${item.secondary}`;

const uniqAffiliations = (items: TopicAffiliation[]) => {
  const map = new Map<string, TopicAffiliation>();
  for (const item of items) {
    if (item.primary && item.secondary) map.set(affiliationKey(item), item);
  }
  return Array.from(map.values());
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

const suggestAffiliations = (text: string) => {
  const matched: TopicAffiliation[] = [];

  for (const topic of TOPIC_TAXONOMY) {
    for (const secondary of topic.secondary) {
      if (text.includes(secondary)) {
        matched.push({ primary: topic.primary, secondary });
      }
    }
  }

  if (/祠堂|祖祠|宗祠/.test(text)) {
    matched.push({ primary: '建筑与空间', secondary: '宗祠' });
    matched.push({ primary: '宗族与家族', secondary: '宗祠文化' });
  }
  if (/木雕|雕花|梁架|斗拱/.test(text)) {
    matched.push({ primary: '手艺与物质文化', secondary: '木工' });
    matched.push({ primary: '建筑与空间', secondary: '老宅' });
  }
  if (/屋脊|嵌瓷|脊饰|剪瓷雕/.test(text)) {
    matched.push({ primary: '建筑与空间', secondary: '庙宇' });
    matched.push({ primary: '手艺与物质文化', secondary: '建筑技艺' });
  }
  if (/风水|水口|朝向|山|河|地名/.test(text)) {
    matched.push({ primary: '地理与地标', secondary: '老地名' });
    matched.push({ primary: '地理与地标', secondary: '自然地标' });
  }
  if (/童谣|读书|学校|游戏/.test(text)) {
    matched.push({ primary: '儿童与教育', secondary: '学校' });
  }

  return uniqAffiliations(matched).slice(0, 8);
};

const mergeIntervieweeCards = (cards: IntervieweeCard[]) => {
  const map = new Map<string, IntervieweeCard>();

  for (const card of cards) {
    const existing = map.get(card.name);
    if (!existing) {
      map.set(card.name, card);
      continue;
    }

    existing.age = existing.age || card.age;
    existing.occupation = existing.occupation || card.occupation;
    existing.role = existing.role || card.role;
    existing.topic_affiliations = uniqAffiliations([...existing.topic_affiliations, ...card.topic_affiliations]);
    existing.suggested_affiliations = uniqAffiliations([...existing.suggested_affiliations, ...card.suggested_affiliations]);
    existing.source_count += card.source_count;
    existing.source_summary = existing.source_summary || card.source_summary;
    existing.is_temporary = existing.is_temporary && card.is_temporary;
  }

  return Array.from(map.values());
};

const authLevelForLegacy = (status: string) => {
  if (status === 'agreed') return 'village';
  if (status === 'declined' || status === 'withdrawn') return 'archive';
  return 'not_set';
};

@Injectable()
export class AuthorizationManagerSkill {
  private get client() {
    return getSupabaseClient();
  }

  async getAuthList(topicId: string) {
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();

    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    const dbCards = await this.getSavedInterviewees(topicId);
    const inferredCards = await this.getInferredInterviewees(topicId);
    const interviewees = mergeIntervieweeCards([...dbCards, ...inferredCards]);

    const stats = {
      total: interviewees.length,
      pending: interviewees.filter((item) => item.auth_status === 'pending').length,
      agreed: interviewees.filter((item) => item.auth_status === 'agreed').length,
      declined: interviewees.filter((item) => item.auth_status === 'declined').length,
      revisit: interviewees.filter((item) => item.auth_status === 'revisit').length,
      withdrawn: interviewees.filter((item) => item.auth_status === 'withdrawn').length,
      tagged: interviewees.filter((item) => item.topic_affiliations.length > 0).length,
    };

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      stats,
      interviewees,
      taxonomy: TOPIC_TAXONOMY,
      auth_statuses: AUTH_STATUSES,
      auth_methods: AUTH_METHODS,
      reminder: '授权管理以受访人为主：先确认人的授权状态，再标注这个人关联的一、二级话题。',
    };
  }

  async updateIntervieweeAuthorization(
    topicId: string,
    intervieweeId: string,
    payload: {
      name?: string;
      authStatus: string;
      authMethod?: string;
      authNote?: string;
      topicAffiliations?: TopicAffiliation[];
    },
  ) {
    if (!Object.keys(AUTH_STATUSES).includes(payload.authStatus)) {
      throw new Error(`无效的授权状态: ${payload.authStatus}`);
    }

    const now = new Date().toISOString();
    const affiliations = uniqAffiliations(payload.topicAffiliations || []);
    const isTemporary = intervieweeId.startsWith('temp-');
    let savedIntervieweeId = intervieweeId;
    let previousStatus = 'pending';

    if (isTemporary) {
      const { data, error } = await this.client
        .from('interviewees')
        .insert({
          topic_id: topicId,
          name: trimText(payload.name) || '受访人待补充',
          auth_status: payload.authStatus,
          auth_method: payload.authMethod || null,
          auth_note: trimText(payload.authNote) || null,
          topic_affiliations: affiliations,
          confirmed_at: now,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (error) throw new Error(`创建受访人授权记录失败: ${error.message}`);
      savedIntervieweeId = data.id;
    } else {
      const { data: existing } = await this.client
        .from('interviewees')
        .select('id, auth_status')
        .eq('id', intervieweeId)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (!existing) throw new Error('受访人不存在');
      previousStatus = existing.auth_status || 'pending';

      const { error } = await this.client
        .from('interviewees')
        .update({
          name: trimText(payload.name) || undefined,
          auth_status: payload.authStatus,
          auth_method: payload.authMethod || null,
          auth_note: trimText(payload.authNote) || null,
          topic_affiliations: affiliations,
          confirmed_at: now,
          updated_at: now,
        })
        .eq('id', intervieweeId)
        .eq('topic_id', topicId);

      if (error) throw new Error(`更新受访人授权失败: ${error.message}`);
    }

    await this.replaceTopicLinks(topicId, savedIntervieweeId, affiliations);
    await this.writeAuthorizationHistory(topicId, savedIntervieweeId, {
      authStatus: payload.authStatus,
      authMethod: payload.authMethod || null,
      authPerson: trimText(payload.name) || null,
      authNote: trimText(payload.authNote) || null,
      topicAffiliations: affiliations,
      previousStatus,
      now,
    });

    const nextInterviewee = await this.getNextPendingInterviewee(topicId, savedIntervieweeId);

    return {
      id: savedIntervieweeId,
      auth_status: payload.authStatus,
      auth_status_label: AUTH_STATUSES[payload.authStatus as keyof typeof AUTH_STATUSES],
      auth_method: payload.authMethod || null,
      auth_method_label: payload.authMethod ? AUTH_METHODS[payload.authMethod as keyof typeof AUTH_METHODS] || '其他方式' : '待补充',
      auth_note: trimText(payload.authNote) || null,
      topic_affiliations: affiliations,
      previous_status: previousStatus,
      changed: previousStatus !== payload.authStatus,
      confirmed_at: now,
      next_interviewee_id: nextInterviewee?.id || null,
    };
  }

  async updateAuth(
    topicId: string,
    subtopicId: string,
    _authLevel: string,
    authMethod?: string,
    authPerson?: string,
    restriction?: string,
  ) {
    const name = trimText(authPerson) || '受访人待补充';
    return this.updateIntervieweeAuthorization(topicId, `temp-${subtopicId}-${Date.now()}`, {
      name,
      authStatus: 'agreed',
      authMethod: authMethod || 'verbal',
      authNote: restriction,
      topicAffiliations: [],
    });
  }

  async getAuthOverview(topicId: string) {
    const list = await this.getAuthList(topicId);
    const interviewees = list.interviewees as IntervieweeCard[];
    return {
      topic_id: list.topic_id,
      topic_name: list.topic_name,
      stats: list.stats,
      people: interviewees.map((item) => ({
        id: item.id,
        name: item.name,
        auth_status: item.auth_status,
        auth_status_label: item.auth_status_label,
        topic_affiliations: item.topic_affiliations,
        auth_method: item.auth_method,
        confirmed_at: item.confirmed_at,
      })),
      ready_people_count: interviewees.filter((item) => item.auth_status === 'agreed' && item.topic_affiliations.length > 0).length,
      needs_followup_count: interviewees.filter((item) => ['pending', 'revisit'].includes(item.auth_status)).length,
    };
  }

  private async getSavedInterviewees(topicId: string): Promise<IntervieweeCard[]> {
    const { data, error } = await this.client
      .from('interviewees')
      .select('id, name, age, occupation, role, auth_status, auth_method, auth_note, topic_affiliations, confirmed_at')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn(`读取受访人表失败: ${error.message}`);
      return [];
    }

    return (data || []).map((person) => ({
      id: person.id,
      name: person.name,
      age: person.age || null,
      occupation: person.occupation || null,
      role: person.role || null,
      auth_status: person.auth_status || 'pending',
      auth_status_label: AUTH_STATUSES[(person.auth_status || 'pending') as keyof typeof AUTH_STATUSES],
      auth_method: person.auth_method || null,
      auth_method_label: person.auth_method ? AUTH_METHODS[person.auth_method as keyof typeof AUTH_METHODS] || '其他方式' : '待补充',
      auth_note: person.auth_note || null,
      topic_affiliations: safeAffiliations(person.topic_affiliations),
      suggested_affiliations: [],
      source_count: 0,
      source_summary: '',
      confirmed_at: person.confirmed_at || null,
      is_temporary: false,
    }));
  }

  private async getInferredInterviewees(topicId: string): Promise<IntervieweeCard[]> {
    const { data: records, error } = await this.client
      .from('interview_records')
      .select('subtopic_id, mandarin_text, dialect_original, transcript_text, ai_analysis')
      .eq('topic_id', topicId)
      .eq('status', 'completed');

    if (error) {
      console.warn(`读取采访整理记录失败: ${error.message}`);
      return [];
    }

    return ((records || []) as InterviewRecord[]).map((record, index) => {
      const base = extractPersonBase(record);
      const recordText = getRecordText(record);
      const segments = extractSegments(record);
      const segmentText = segments
        .map((segment) => `${segment.summary || ''} ${segment.source_text || ''} ${segment.quote || ''}`)
        .join(' ');
      const joinedText = `${recordText} ${segmentText}`;
      const suggestions = suggestAffiliations(joinedText);

      return {
        id: `temp-${index}-${stableIdPart(base.name)}`,
        name: base.name,
        age: base.age,
        occupation: base.occupation,
        role: base.role,
        auth_status: 'pending',
        auth_status_label: AUTH_STATUSES.pending,
        auth_method: null,
        auth_method_label: '待补充',
        auth_note: null,
        topic_affiliations: [],
        suggested_affiliations: suggestions,
        source_count: Math.max(segments.length, 1),
        source_summary: shortText(recordText || segmentText, 120),
        confirmed_at: null,
        is_temporary: true,
      };
    });
  }

  private async replaceTopicLinks(topicId: string, intervieweeId: string, affiliations: TopicAffiliation[]) {
    const { error: deleteError } = await this.client
      .from('interviewee_topic_links')
      .delete()
      .eq('topic_id', topicId)
      .eq('interviewee_id', intervieweeId);

    if (deleteError) {
      console.warn(`清理旧话题归属失败: ${deleteError.message}`);
      return;
    }

    if (affiliations.length === 0) return;

    const { error: insertError } = await this.client.from('interviewee_topic_links').insert(
      affiliations.map((item) => ({
        topic_id: topicId,
        interviewee_id: intervieweeId,
        primary_topic: item.primary,
        secondary_topic: item.secondary,
        source: 'manual',
        confidence: 100,
      })),
    );

    if (insertError) {
      console.warn(`保存话题归属失败: ${insertError.message}`);
    }
  }

  private async writeAuthorizationHistory(
    topicId: string,
    intervieweeId: string,
    payload: {
      authStatus: string;
      authMethod: string | null;
      authPerson: string | null;
      authNote: string | null;
      topicAffiliations: TopicAffiliation[];
      previousStatus: string;
      now: string;
    },
  ) {
    const { error } = await this.client.from('authorization_records').insert({
      topic_id: topicId,
      interviewee_id: intervieweeId,
      auth_status: payload.authStatus,
      auth_method: payload.authMethod,
      auth_person: payload.authPerson,
      restriction: payload.authNote,
      topic_affiliations: payload.topicAffiliations,
      authorized_at: payload.now,
      reversible: true,
      previous_status: payload.previousStatus,
      created_at: payload.now,
    });

    if (error) {
      console.warn(`授权历史记录保存失败: ${error.message}`);
    }
  }

  private async getNextPendingInterviewee(topicId: string, currentIntervieweeId: string) {
    const { data } = await this.client
      .from('interviewees')
      .select('id')
      .eq('topic_id', topicId)
      .in('auth_status', ['pending', 'revisit'])
      .neq('id', currentIntervieweeId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return data;
  }

  getLegacyAuthLevel(status: string) {
    return authLevelForLegacy(status);
  }
}
