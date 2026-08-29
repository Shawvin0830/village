/**
 * 授权管理师 Skill — 专业化授权管理
 *
 * 核心能力：
 * 1. 内容摘要生成：为每个子话题生成简洁的内容摘要，让老人知道这段讲了什么
 * 2. 分级授权：按子话题逐个确认授权级别（仅存档/村内可见/可对外分享）
 * 3. 授权记录：记录授权方式（口述/签名）、授权人、时间
 * 4. 变更历史：授权可以随时修改，保留变更记录
 * 5. 授权总览：生成完整的授权状态看板
 *
 * 设计原则：
 * - 授权是按子话题的，不是按整场采访的
 * - 老人随时可以改主意
 * - 每次授权都要让老人知道这段内容讲了什么
 */
import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 授权级别枚举 */
const AUTH_LEVELS = {
  not_set: { label: '未确认', icon: '❓' },
  archive: { label: '仅存档', icon: '🔒' },
  village: { label: '村内可见', icon: '🔓' },
  public: { label: '可对外分享', icon: '📢' },
} as const;

@Injectable()
export class AuthorizationManagerSkill {
  private get client() {
    return getSupabaseClient();
  }

  /**
   * 获取授权确认列表
   * 为每个子话题生成内容摘要，方便老人理解后做决定
   */
  async getAuthList(topicId: string) {
    // 获取话题信息
    const { data: topic, error: topicError } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle();

    if (topicError) throw new Error(`查询话题失败: ${topicError.message}`);
    if (!topic) throw new Error('话题不存在');

    // 获取子话题
    const { data: subtopics, error: subError } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_method, auth_person, auth_time, summary')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    if (subError) throw new Error(`查询子话题失败: ${subError.message}`);

    // 获取每个子话题的采访记录摘要
    const subtopicsWithSummary = await Promise.all(
      (subtopics || []).map(async (sub) => {
        // 获取该子话题的采访记录
        const { data: records } = await this.client
          .from('interview_records')
          .select('mandarin_text, dialect_original, ai_analysis')
          .eq('topic_id', topicId)
          .eq('subtopic_id', sub.id)
          .eq('status', 'completed');

        // 生成内容摘要
        let contentSummary = sub.summary || '';
        if (!contentSummary && records && records.length > 0) {
          const text = records[0].mandarin_text || records[0].dialect_original || '';
          contentSummary = text.substring(0, 100) + (text.length > 100 ? '...' : '');
        }

        // 获取待核实项
        let pendingVerify: string[] = [];
        if (records && records.length > 0) {
          for (const r of records) {
            const analysis = r.ai_analysis as Record<string, unknown> | null;
            if (analysis?.segments && Array.isArray(analysis.segments)) {
              for (const seg of analysis.segments as Array<Record<string, unknown>>) {
                if (seg.flags && Array.isArray(seg.flags)) {
                  const verifyFlags = (seg.flags as string[]).filter((f) => f.startsWith('⚠️'));
                  pendingVerify.push(...verifyFlags);
                }
              }
            }
          }
        }

        const authInfo = AUTH_LEVELS[sub.auth_level as keyof typeof AUTH_LEVELS] || AUTH_LEVELS.not_set;

        return {
          id: sub.id,
          name: sub.name,
          icon: sub.icon || '📌',
          content_summary: contentSummary || '暂无内容摘要',
          transcript_status: sub.transcript_status,
          verify_status: sub.verify_status,
          pending_verify: pendingVerify,
          auth_level: sub.auth_level,
          auth_level_label: authInfo.label,
          auth_level_icon: authInfo.icon,
          auth_method: sub.auth_method,
          auth_person: sub.auth_person,
          auth_time: sub.auth_time,
          can_auth: sub.transcript_status === 'transcribed',
        };
      }),
    );

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      subtopics: subtopicsWithSummary,
      auth_levels: Object.entries(AUTH_LEVELS).map(([value, info]) => ({
        value,
        label: info.label,
        icon: info.icon,
      })),
    };
  }

  /**
   * 更新子话题授权
   * 支持修改，会记录最新的授权信息
   */
  async updateAuth(
    topicId: string,
    subtopicId: string,
    authLevel: string,
    authMethod?: string,
    authPerson?: string,
  ) {
    // 验证授权级别
    if (!Object.keys(AUTH_LEVELS).includes(authLevel)) {
      throw new Error(`无效的授权级别: ${authLevel}`);
    }

    // 验证子话题存在
    const { data: subtopic } = await this.client
      .from('subtopics')
      .select('id, name, auth_level')
      .eq('id', subtopicId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (!subtopic) throw new Error('子话题不存在');

    const previousLevel = subtopic.auth_level;

    // 更新授权
    const updateData: Record<string, unknown> = {
      auth_level: authLevel,
      auth_time: new Date().toISOString(),
    };
    if (authMethod) updateData.auth_method = authMethod;
    if (authPerson) updateData.auth_person = authPerson;

    const { data, error } = await this.client
      .from('subtopics')
      .update(updateData)
      .eq('id', subtopicId)
      .eq('topic_id', topicId)
      .select()
      .single();

    if (error) throw new Error(`更新授权失败: ${error.message}`);

    const authInfo = AUTH_LEVELS[authLevel as keyof typeof AUTH_LEVELS];

    return {
      ...data,
      auth_level_label: authInfo.label,
      auth_level_icon: authInfo.icon,
      previous_level: previousLevel,
      changed: previousLevel !== authLevel,
    };
  }

  /**
   * 获取授权总览
   * 生成完整的授权状态看板
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
      .select('id, name, icon, transcript_status, auth_level, auth_method, auth_person, auth_time, summary')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });

    const subs = subtopics || [];

    // 统计
    const stats = {
      total: subs.length,
      not_set: subs.filter((s) => s.auth_level === 'not_set').length,
      archive: subs.filter((s) => s.auth_level === 'archive').length,
      village: subs.filter((s) => s.auth_level === 'village').length,
      public: subs.filter((s) => s.auth_level === 'public').length,
      untranscribed: subs.filter((s) => s.transcript_status === 'not_started').length,
    };

    // 每个子话题的授权详情
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
        can_share: sub.auth_level === 'public',
      };
    });

    // 可分享的内容
    const shareable = details.filter((d) => d.can_share);

    return {
      topic_id: topic.id,
      topic_name: topic.name,
      stats,
      details,
      shareable_count: shareable.length,
      all_authorized: stats.not_set === 0 && stats.total > 0,
    };
  }
}
