/**
 * 授权管理师 Skill — 专业化授权管理
 *
 * 核心能力：
 * 1. 内容摘要：按子话题展示这段采访整理内容讲了什么
 * 2. 来源关联：让木兰看到内容来自哪位受访人和哪份采访整理记录
 * 3. 风险提醒：用规则提示待核实、隐私、口述记忆等授权风险
 * 4. 分级授权：按子话题确认仅存档/村内可见/可对外分享
 * 5. 授权追溯：保存当前状态，同时写入授权历史记录
 *
 * 设计原则：
 * - 授权按子话题确认，不按整场采访一刀切
 * - 授权状态和事实核实状态分开，public 不代表 verified
 * - 本模块不额外调用 AI，全部基于已有采访整理结果和规则聚合
 */
import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
  mandarin_text?: string | null;
  dialect_original?: string | null;
  transcript_text?: string | null;
  ai_analysis?: Record<string, unknown> | null;
};

type IntervieweeOverview = {
  name: string;
  age: string | null;
  occupation: string | null;
  role: string | null;
  tags: string[];
  claim_count: number;
};

/** 授权级别枚举 */
const AUTH_LEVELS = {
  not_set: { label: '未确认', icon: '❓' },
  archive: { label: '仅存档', icon: '🔒' },
  village: { label: '村内可见', icon: '🔓' },
  public: { label: '可对外分享', icon: '📢' },
} as const;

const AUTH_METHOD_LABELS: Record<string, string> = {
  verbal: '口述',
  written: '书面',
  other: '其他',
};

const PRIVACY_KEYWORDS = /真实姓名|姓名|家人|家庭|儿子|女儿|孩子|纠纷|矛盾|隐私|地址|电话|收入|生病|借钱|债/;
const UNCERTAIN_KEYWORDS = /据说|听说|可能|大概|不确定|好像|老人说|传说/;
const READY_TRANSCRIPT_STATUSES = new Set(['transcribed', 'completed', 'organized']);

const uniq = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

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

const segmentBelongsToSubtopic = (segment: AnalysisSegment, subtopic: { id: string; name: string }) => {
  const segmentSubId = segment.subtopic_id || segment.matched_subtopic_id;
  if (segmentSubId && segmentSubId !== subtopic.id) return false;
  if (segment.subtopic_name && segment.subtopic_name !== subtopic.name) return false;
  return true;
};

const extractPendingFlags = (segments: AnalysisSegment[]) => {
  const flags: string[] = [];

  for (const segment of segments) {
    if (Array.isArray(segment.flags)) {
      flags.push(
        ...(segment.flags as unknown[])
          .map((flag) => String(flag))
          .filter((flag) => flag.startsWith('⚠️') || flag.includes('待核实')),
      );
    }

    if (Array.isArray(segment.claims)) {
      for (const claim of segment.claims as Array<Record<string, unknown>>) {
        const status = String(claim.status || claim.verify_status || '');
        const text = String(claim.text || claim.claim || '');
        if (text && (status.includes('pending') || status.includes('待核实') || status.includes('unknown'))) {
          flags.push(`⚠️ 待核实：${text}`);
        }
      }
    }
  }

  return uniq(flags);
};

const inferTags = (subtopicName: string, text: string, segments: AnalysisSegment[]) => {
  const joined = `${subtopicName} ${text} ${segments.map((segment) => {
    if (Array.isArray(segment.tags)) return (segment.tags as unknown[]).join(' ');
    return '';
  }).join(' ')}`;
  const tags: string[] = [];

  if (/宗祠|祠堂|祖祠/.test(joined)) tags.push('宗祠');
  if (/木雕|雕花|梁架|斗拱/.test(joined)) tags.push('木雕');
  if (/屋脊|嵌瓷|脊饰|剪瓷雕/.test(joined)) tags.push('屋脊装饰');
  if (/历史|年代|以前|祖先|迁徙/.test(joined)) tags.push('历史');
  if (/地理|位置|朝向|风水|水口|山|河/.test(joined)) tags.push('地理');
  if (/建筑|布局|门楼|厅堂|柱|梁/.test(joined)) tags.push('建筑');

  return uniq(tags);
};

const extractInterviewee = (
  records: InterviewRecord[],
  subtopic: { auth_person?: string | null },
): Omit<IntervieweeOverview, 'tags' | 'claim_count'> => {
  const fallbackName = trimText(subtopic.auth_person) || '受访人待补充';

  for (const record of records) {
    const analysis = record.ai_analysis || {};
    const interviewee = analysis.interviewee as Record<string, unknown> | undefined;
    if (interviewee && typeof interviewee === 'object') {
      return {
        name: String(interviewee.name || fallbackName),
        age: interviewee.age ? String(interviewee.age) : null,
        occupation: interviewee.occupation ? String(interviewee.occupation) : null,
        role: interviewee.role || interviewee.identity ? String(interviewee.role || interviewee.identity) : null,
      };
    }

    const name = analysis.interviewee_name || analysis.speaker || analysis.person;
    if (name) {
      return {
        name: String(name),
        age: analysis.age ? String(analysis.age) : null,
        occupation: analysis.occupation ? String(analysis.occupation) : null,
        role: analysis.role || analysis.identity ? String(analysis.role || analysis.identity) : null,
      };
    }

    const segment = extractSegments(record).find((item) => item.interviewee || item.speaker);
    if (segment) {
      return {
        name: String(segment.interviewee || segment.speaker),
        age: null,
        occupation: null,
        role: null,
      };
    }
  }

  return {
    name: fallbackName,
    age: null,
    occupation: null,
    role: null,
  };
};

const buildRiskWarnings = (params: {
  text: string;
  pendingVerify: string[];
  verifyStatus: string;
  authLevel: string;
}) => {
  const warnings: string[] = [];

  if (params.pendingVerify.length > 0 || params.verifyStatus === 'pending') {
    warnings.push('这段含待核实说法，公开时不能写成已核实事实。');
  }

  if (PRIVACY_KEYWORDS.test(params.text)) {
    warnings.push('内容可能涉及个人或家庭信息，公开前确认是否隐去真实姓名。');
  }

  if (UNCERTAIN_KEYWORDS.test(params.text)) {
    warnings.push('内容带有口述记忆特征，建议保留受访来源并标注待核实。');
  }

  if (params.authLevel === 'public' && params.verifyStatus === 'pending') {
    warnings.push('已获得公开授权，但事实核实仍未完成。');
  }

  return uniq(warnings);
};

const mergeInterviewees = (items: IntervieweeOverview[]) => {
  const map = new Map<string, IntervieweeOverview>();

  for (const item of items) {
    const existing = map.get(item.name);
    if (!existing) {
      map.set(item.name, { ...item, tags: uniq(item.tags) });
      continue;
    }
    existing.age = existing.age || item.age;
    existing.occupation = existing.occupation || item.occupation;
    existing.role = existing.role || item.role;
    existing.tags = uniq([...existing.tags, ...item.tags]);
    existing.claim_count += item.claim_count;
  }

  return Array.from(map.values());
};

@Injectable()
export class AuthorizationManagerSkill {
  private get client() {
    return getSupabaseClient();
  }

  /**
   * 获取授权确认列表
   * 为每个子话题聚合摘要、来源、受访人概览和授权风险。
   */
  async getAuthList(topicId: string) {
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();

    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    const { data: subtopics, error: subError } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_method, auth_person, auth_time, auth_restriction, summary')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (subError) throw new Error(`查询子话题失败: ${subError.message}`);

    const collectedInterviewees: IntervieweeOverview[] = [];

    const subtopicsWithSummary = await Promise.all(
      (subtopics || []).map(async (sub) => {
        const { data: records } = await this.client
          .from('interview_records')
          .select('mandarin_text, dialect_original, transcript_text, ai_analysis')
          .eq('topic_id', topicId)
          .eq('subtopic_id', sub.id)
          .eq('status', 'completed');

        const completedRecords = (records || []) as InterviewRecord[];
        const segments = completedRecords
          .flatMap((record) => extractSegments(record))
          .filter((segment) => segmentBelongsToSubtopic(segment, sub));

        const recordText = completedRecords.map(getRecordText).filter(Boolean).join('\n');
        const firstSegmentSummary = shortText(segments.find((segment) => segment.summary)?.summary, 120);
        const contentSummary =
          trimText(sub.summary) ||
          firstSegmentSummary ||
          shortText(recordText, 120) ||
          '暂无内容摘要';

        const sourceExcerpt =
          shortText(
            segments.find((segment) => segment.source_text)?.source_text ||
              segments.find((segment) => segment.mandarin_text)?.mandarin_text ||
              segments.find((segment) => segment.dialect_original)?.dialect_original ||
              segments.find((segment) => segment.quote)?.quote ||
              recordText,
            140,
          ) || '';

        const pendingVerify = extractPendingFlags(segments);
        const intervieweeBase = extractInterviewee(completedRecords, sub);
        const tags = inferTags(sub.name, `${contentSummary} ${sourceExcerpt} ${recordText}`, segments);
        const claimCount =
          segments.reduce((count, segment) => {
            if (Array.isArray(segment.claims)) return count + segment.claims.length;
            return count + 1;
          }, 0) || (completedRecords.length > 0 ? completedRecords.length : 0);

        const interviewee: IntervieweeOverview = {
          ...intervieweeBase,
          tags,
          claim_count: claimCount,
        };
        collectedInterviewees.push(interviewee);

        const authInfo = AUTH_LEVELS[sub.auth_level as keyof typeof AUTH_LEVELS] || AUTH_LEVELS.not_set;
        const hasOrganizedContent =
          READY_TRANSCRIPT_STATUSES.has(sub.transcript_status) ||
          completedRecords.length > 0 ||
          Boolean(trimText(sub.summary));

        return {
          id: sub.id,
          name: sub.name,
          icon: sub.icon || '📌',
          content_summary: contentSummary,
          source_label: `${interviewee.name} / 采访整理文档`,
          source_excerpt: sourceExcerpt,
          interviewees: [interviewee],
          transcript_status: sub.transcript_status,
          verify_status: sub.verify_status,
          pending_verify: pendingVerify,
          risk_warnings: buildRiskWarnings({
            text: `${contentSummary} ${sourceExcerpt} ${recordText}`,
            pendingVerify,
            verifyStatus: sub.verify_status,
            authLevel: sub.auth_level,
          }),
          auth_level: sub.auth_level,
          auth_level_label: authInfo.label,
          auth_level_icon: authInfo.icon,
          auth_method: sub.auth_method,
          auth_person: sub.auth_person,
          auth_time: sub.auth_time,
          auth_restriction: sub.auth_restriction,
          can_auth: hasOrganizedContent,
        };
      }),
    );

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      interviewees: mergeInterviewees(collectedInterviewees),
      subtopics: subtopicsWithSummary,
      auth_levels: Object.entries(AUTH_LEVELS)
        .filter(([value]) => value !== 'not_set')
        .map(([value, info]) => ({
          value,
          label: info.label,
          icon: info.icon,
        })),
    };
  }

  /**
   * 更新子话题授权
   * 只更新当前子话题，不修改 verify_status，也不影响其他子话题。
   */
  async updateAuth(
    topicId: string,
    subtopicId: string,
    authLevel: string,
    authMethod?: string,
    authPerson?: string,
    restriction?: string,
  ) {
    if (!Object.keys(AUTH_LEVELS).includes(authLevel)) {
      throw new Error(`无效的授权级别: ${authLevel}`);
    }

    const { data: subtopic } = await this.client
      .from('subtopics')
      .select('id, name, auth_level')
      .eq('id', subtopicId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (!subtopic) throw new Error('子话题不存在');

    const previousLevel = subtopic.auth_level;
    const now = new Date().toISOString();
    const normalizedMethod = authMethod || 'verbal';
    const normalizedPerson = trimText(authPerson) || null;
    const normalizedRestriction = trimText(restriction) || null;

    const updateData: Record<string, unknown> = {
      auth_level: authLevel,
      auth_method: normalizedMethod,
      auth_person: normalizedPerson,
      auth_restriction: normalizedRestriction,
      auth_time: now,
    };

    const { data, error } = await this.client
      .from('subtopics')
      .update(updateData)
      .eq('id', subtopicId)
      .eq('topic_id', topicId)
      .select()
      .single();

    if (error) throw new Error(`更新授权失败: ${error.message}`);

    const { error: recordError } = await this.client
      .from('authorization_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId,
        auth_level: authLevel,
        auth_method: normalizedMethod,
        auth_person: normalizedPerson,
        restriction: normalizedRestriction,
        authorized_at: now,
        reversible: true,
        previous_level: previousLevel,
        created_at: now,
      });

    if (recordError) {
      console.warn(`授权历史记录保存失败: ${recordError.message}`);
    }

    const { data: nextSubtopic } = await this.client
      .from('subtopics')
      .select('id')
      .eq('topic_id', topicId)
      .eq('auth_level', 'not_set')
      .neq('id', subtopicId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const authInfo = AUTH_LEVELS[authLevel as keyof typeof AUTH_LEVELS];

    return {
      ...data,
      auth_level_label: authInfo.label,
      auth_level_icon: authInfo.icon,
      auth_method_label: AUTH_METHOD_LABELS[normalizedMethod] || AUTH_METHOD_LABELS.other,
      auth_restriction: normalizedRestriction,
      previous_level: previousLevel,
      changed: previousLevel !== authLevel,
      reversible: true,
      next_subtopic_id: nextSubtopic?.id || null,
    };
  }

  /**
   * 获取授权总览
   * 首页/授权页可用它显示 1/3、2/3、3/3 进度。
   */
  async getAuthOverview(topicId: string) {
    const { data: topic } = await this.client
      .from('topics')
      .select('id, name')
      .eq('id', topicId)
      .maybeSingle();

    if (!topic) throw new Error('话题不存在');

    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_method, auth_person, auth_time, auth_restriction, summary')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    const subs = subtopics || [];

    const stats = {
      total: subs.length,
      confirmed: subs.filter((s) => s.auth_level !== 'not_set').length,
      not_set: subs.filter((s) => s.auth_level === 'not_set').length,
      archive: subs.filter((s) => s.auth_level === 'archive').length,
      village: subs.filter((s) => s.auth_level === 'village').length,
      public: subs.filter((s) => s.auth_level === 'public').length,
      unorganized: subs.filter((s) => !READY_TRANSCRIPT_STATUSES.has(s.transcript_status) && !s.summary).length,
    };

    const details = subs.map((sub) => {
      const authInfo = AUTH_LEVELS[sub.auth_level as keyof typeof AUTH_LEVELS] || AUTH_LEVELS.not_set;
      return {
        id: sub.id,
        name: sub.name,
        icon: sub.icon || '📌',
        auth_level: sub.auth_level,
        auth_label: authInfo.label,
        auth_icon: authInfo.icon,
        auth_method: sub.auth_method || '-',
        auth_person: sub.auth_person || '-',
        auth_time: sub.auth_time || '-',
        auth_restriction: sub.auth_restriction || '',
        verify_status: sub.verify_status,
        authorized_for_public: sub.auth_level === 'public',
        ready_for_public: sub.auth_level === 'public' && sub.verify_status === 'verified',
      };
    });

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      stats,
      details,
      shareable_count: details.filter((detail) => detail.authorized_for_public).length,
      ready_public_count: details.filter((detail) => detail.ready_for_public).length,
      all_authorized: stats.not_set === 0 && stats.total > 0,
    };
  }
}
