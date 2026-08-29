import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { AuthorizationManagerSkill } from '@/skills/authorization-manager.skill';

@Injectable()
export class TopicsService {
  private get client() {
    return getSupabaseClient();
  }

  constructor(private readonly authSkill: AuthorizationManagerSkill) {}

  async findAll() {
    const { data, error } = await this.client
      .from('topics')
      .select('id, name, description, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询话题列表失败: ${error.message}`);

    const topicsWithCount = await Promise.all(
      (data || []).map(async (topic) => {
        const { count } = await this.client
          .from('subtopics')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);
        return { ...topic, subtopic_count: count || 0 };
      }),
    );

    return topicsWithCount;
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
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_method, auth_person, auth_time, auth_restriction, summary')
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

  async getSubtopics(topicId: string) {
    const { data, error } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_method, auth_person, auth_time, auth_restriction, summary')
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
    authMethod?: string,
    authPerson?: string,
    restriction?: string,
  ) {
    return this.authSkill.updateAuth(topicId, subtopicId, authLevel, authMethod, authPerson, restriction);
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
      .select('id, name, icon, transcript_status, verify_status, auth_level, auth_restriction, summary')
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
      nextSteps.push('采访内容整理完成的子话题需要确认授权级别');
    }
    if (allDone) {
      nextSteps.push('🎉 阶段性完成！可以继续深挖某个子话题，或开始新话题');
    }

    return {
      topic: { ...topic, subtopics: subs },
      nextSteps,
    };
  }
}
