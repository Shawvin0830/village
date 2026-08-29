/**
 * 授权管理师 Skill V4 — 受访人档案、授权状态与话题归属
 *
 * 核心能力：
 * 1. 授权管理入口不直接铺开人名单，通过名单、搜索和统计进入受访人 profile
 * 2. 授权状态只保留未设置/同意/不同意
 * 3. 受访人 profile 可编辑姓名、年龄、职业/身份、特殊要求
 * 4. 话题归属支持“一级主题 + 二级话题”多选，并允许自定义二级话题
 * 5. profile 中展示关联采访资料包，列表页不展开
 */
import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

type TopicAffiliation = {
  primary: string;
  secondary: string;
};

type AnalysisSegment = {
  summary?: string;
  source_text?: string;
  quote?: string;
  speaker?: string;
  interviewee?: string;
  tags?: unknown;
};

type InterviewPackage = {
  id: string;
  title: string;
  summary: string;
  created_at: string | null;
};

type InterviewRecord = {
  id?: string;
  subtopic_id?: string | null;
  created_at?: string | null;
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
  auth_note: string | null;
  topic_affiliations: TopicAffiliation[];
  suggested_affiliations: TopicAffiliation[];
  interview_packages: InterviewPackage[];
  source_count: number;
  source_summary: string;
  confirmed_at: string | null;
  is_temporary: boolean;
};

const AUTH_STATUSES = {
  unset: '未设置',
  agreed: '同意',
  declined: '不同意',
} as const;

const normalizeAuthStatus = (status?: string | null) => {
  if (status === 'agreed' || status === 'declined') return status;
  return 'unset';
};

const TOPIC_TAXONOMY = [
  { code: '01', primary: '建筑与空间', secondary: ['宗祠', '庙宇', '老宅', '桥梁', '水井', '古道', '学校', '集市', '公共空间'] },
  { code: '02', primary: '地理与地标', secondary: ['山川', '水系', '田地', '道路', '村落边界', '老地名', '自然地标'] },
  { code: '03', primary: '宗族与家族', secondary: ['姓氏来源', '宗祠文化', '族谱', '迁徙', '家族关系', '祖先故事'] },
  { code: '04', primary: '民俗与节庆', secondary: ['春节', '清明', '端午', '中秋', '婚俗', '丧葬', '祭祀', '成年礼', '地方节庆'] },
  { code: '05', primary: '信仰与仪式', secondary: ['神祇', '祭祖', '庙会', '禁忌', '祈福', '仪式空间', '民间信仰'] },
  { code: '06', primary: '生产与生计', secondary: ['农耕', '渔业', '手工业', '商贸', '传统职业', '工具', '集市'] },
  { code: '07', primary: '饮食与物产', secondary: ['家常菜', '节庆食品', '地方特产', '制作技艺', '食材', '宴席'] },
  { code: '08', primary: '日常生活', secondary: ['衣着', '住房', '出行', '用水', '照明', '购物', '娱乐', '家庭生活'] },
  { code: '09', primary: '儿童与教育', secondary: ['学校', '读书', '游戏', '童谣', '劳动', '成长', '家庭教育'] },
  { code: '10', primary: '人物与人生', secondary: ['村中老人', '手艺人', '教师', '干部', '商人', '普通家庭', '特殊人物'] },
  { code: '11', primary: '村庄事件', secondary: ['建村', '灾害', '修路', '建桥', '建校', '集体活动', '社会变迁'] },
  { code: '12', primary: '语言与口述文化', secondary: ['方言词', '俗语', '谚语', '童谣', '歌谣', '称谓', '地名读音'] },
  { code: '13', primary: '手艺与物质文化', secondary: ['木工', '石雕', '编织', '农具', '服饰', '器物', '建筑技艺'] },
  { code: '14', primary: '故事与传说', secondary: ['地方传说', '人物轶事', '地名故事', '神话', '怪谈', '家族故事'] },
  { code: '15', primary: '村庄变迁', secondary: ['人口', '迁徙', '产业', '建筑', '交通', '环境', '生活方式'] },
  { code: '16', primary: '社区关系', secondary: ['邻里互助', '宗族关系', '公共事务', '集体劳动', '女性角色'] },
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

const uniqPackages = (items: InterviewPackage[]) => {
  const map = new Map<string, InterviewPackage>();
  for (const item of items) map.set(item.id, item);
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
      if (text.includes(secondary)) matched.push({ primary: topic.primary, secondary });
    }
    if (text.includes(topic.primary)) {
      matched.push({ primary: topic.primary, secondary: topic.secondary[0] });
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

const makeInterviewPackage = (record: InterviewRecord, index: number): InterviewPackage => {
  const segments = extractSegments(record);
  const segmentSummary = segments
    .map((segment) => segment.summary || segment.source_text || segment.quote || '')
    .filter(Boolean)
    .join(' ');
  return {
    id: record.id || `record-${index}`,
    title: `采访资料包 ${index + 1}`,
    summary: shortText(getRecordText(record) || segmentSummary || '暂无整理摘要', 120),
    created_at: record.created_at || null,
  };
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
    existing.interview_packages = uniqPackages([...existing.interview_packages, ...card.interview_packages]);
    existing.source_count += card.source_count;
    existing.source_summary = existing.source_summary || card.source_summary;
    existing.is_temporary = existing.is_temporary && card.is_temporary;
  }

  return Array.from(map.values());
};

const authLevelForLegacy = (status: string) => {
  if (status === 'agreed') return 'village';
  if (status === 'declined') return 'archive';
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
      unset: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'unset').length,
      agreed: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'agreed').length,
      declined: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'declined').length,
      tagged: interviewees.filter((item) => item.topic_affiliations.length > 0).length,
    };

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      stats,
      interviewees,
      taxonomy: TOPIC_TAXONOMY,
      auth_statuses: AUTH_STATUSES,
      reminder: '授权管理以受访人为主，搜索人名或话题后进入受访人档案。',
    };
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
    let previousStatus = 'unset';

    if (isTemporary) {
      const { data, error } = await this.client
        .from('interviewees')
        .insert({
          topic_id: topicId,
          name: trimText(payload.name) || '受访人待补充',
          age: trimText(payload.age) || null,
          occupation: trimText(payload.occupation) || null,
          role: trimText(payload.role) || null,
          auth_status: payload.authStatus,
          auth_note: trimText(payload.authNote) || null,
          topic_affiliations: affiliations,
          confirmed_at: now,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (error) throw new Error(`创建受访人档案失败: ${error.message}`);
      savedIntervieweeId = data.id;
    } else {
      const { data: existing } = await this.client
        .from('interviewees')
        .select('id, auth_status')
        .eq('id', intervieweeId)
        .eq('topic_id', topicId)
        .maybeSingle();

      if (!existing) throw new Error('受访人不存在');
      previousStatus = normalizeAuthStatus(existing.auth_status);

      const updateData: Record<string, unknown> = {
        auth_status: payload.authStatus,
        auth_note: trimText(payload.authNote) || null,
        topic_affiliations: affiliations,
        confirmed_at: now,
        updated_at: now,
      };
      if (payload.name !== undefined) updateData.name = trimText(payload.name) || '受访人待补充';
      if (payload.age !== undefined) updateData.age = trimText(payload.age) || null;
      if (payload.occupation !== undefined) updateData.occupation = trimText(payload.occupation) || null;
      if (payload.role !== undefined) updateData.role = trimText(payload.role) || null;

      const { error } = await this.client
        .from('interviewees')
        .update(updateData)
        .eq('id', intervieweeId)
        .eq('topic_id', topicId);

      if (error) throw new Error(`更新受访人档案失败: ${error.message}`);
    }

    await this.replaceTopicLinks(topicId, savedIntervieweeId, affiliations);
    await this.writeAuthorizationHistory(topicId, savedIntervieweeId, {
      authStatus: payload.authStatus,
      authPerson: trimText(payload.name) || null,
      authNote: trimText(payload.authNote) || null,
      topicAffiliations: affiliations,
      previousStatus,
      now,
    });

    const nextInterviewee = await this.getNextUnsetInterviewee(topicId, savedIntervieweeId);

    return {
      id: savedIntervieweeId,
      name: trimText(payload.name) || '受访人待补充',
      age: trimText(payload.age) || null,
      occupation: trimText(payload.occupation) || null,
      role: trimText(payload.role) || null,
      auth_status: payload.authStatus,
      auth_status_label: AUTH_STATUSES[payload.authStatus as keyof typeof AUTH_STATUSES],
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
    authPerson?: string,
    restriction?: string,
  ) {
    const name = trimText(authPerson) || '受访人待补充';
    return this.updateIntervieweeAuthorization(topicId, `temp-${subtopicId}-${Date.now()}`, {
      name,
      authStatus: 'agreed',
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
        age: item.age,
        occupation: item.occupation,
        role: item.role,
        auth_status: item.auth_status,
        auth_status_label: item.auth_status_label,
        auth_note: item.auth_note,
        topic_affiliations: item.topic_affiliations,
        confirmed_at: item.confirmed_at,
      })),
      agreed_count: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'agreed').length,
      declined_count: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'declined').length,
      unset_count: interviewees.filter((item) => normalizeAuthStatus(item.auth_status) === 'unset').length,
      tagged_count: interviewees.filter((item) => item.topic_affiliations.length > 0).length,
    };
  }

  private async getSavedInterviewees(topicId: string): Promise<IntervieweeCard[]> {
    const { data, error } = await this.client
      .from('interviewees')
      .select('id, name, age, occupation, role, auth_status, auth_note, topic_affiliations, confirmed_at')
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
      auth_status: normalizeAuthStatus(person.auth_status),
      auth_status_label: AUTH_STATUSES[normalizeAuthStatus(person.auth_status) as keyof typeof AUTH_STATUSES],
      auth_note: person.auth_note || null,
      topic_affiliations: safeAffiliations(person.topic_affiliations),
      suggested_affiliations: [],
      interview_packages: [],
      source_count: 0,
      source_summary: '',
      confirmed_at: person.confirmed_at || null,
      is_temporary: false,
    }));
  }

  private async getInferredInterviewees(topicId: string): Promise<IntervieweeCard[]> {
    const { data: records, error } = await this.client
      .from('interview_records')
      .select('id, subtopic_id, created_at, mandarin_text, dialect_original, transcript_text, ai_analysis')
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
        auth_status: 'unset',
        auth_status_label: AUTH_STATUSES.unset,
        auth_note: null,
        topic_affiliations: [],
        suggested_affiliations: suggestions,
        interview_packages: [makeInterviewPackage(record, index)],
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

    if (insertError) console.warn(`保存话题归属失败: ${insertError.message}`);
  }

  private async writeAuthorizationHistory(
    topicId: string,
    intervieweeId: string,
    payload: {
      authStatus: string;
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
      auth_person: payload.authPerson,
      restriction: payload.authNote,
      topic_affiliations: payload.topicAffiliations,
      authorized_at: payload.now,
      reversible: true,
      previous_status: payload.previousStatus,
      created_at: payload.now,
    });

    if (error) console.warn(`授权历史记录保存失败: ${error.message}`);
  }

  private async getNextUnsetInterviewee(topicId: string, currentIntervieweeId: string) {
    const { data } = await this.client
      .from('interviewees')
      .select('id')
      .eq('topic_id', topicId)
      .eq('auth_status', 'unset')
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
