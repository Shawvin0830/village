import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

@Injectable()
export class InterviewScriptsService {
  private get client() {
    return getSupabaseClient();
  }

  async create(body: {
    topic_id: string;
    plan_id?: string;
    title?: string;
    selected_questions: unknown[];
    warmup_questions?: string[];
    closing_questions?: string[];
  }) {
    const { data, error } = await this.client
      .from('interview_scripts')
      .insert({
        topic_id: body.topic_id,
        plan_id: body.plan_id || null,
        title: body.title || null,
        selected_questions: body.selected_questions,
        warmup_questions: body.warmup_questions || [],
        closing_questions: body.closing_questions || [],
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw new Error(`创建采访稿失败: ${error.message}`);
    return data;
  }

  async getLatest(topicId: string) {
    const { data, error } = await this.client
      .from('interview_scripts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`获取最新采访稿失败: ${error.message}`);
    return data;
  }

  async getByTopic(topicId: string) {
    const { data, error } = await this.client
      .from('interview_scripts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`获取采访稿列表失败: ${error.message}`);
    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await this.client
      .from('interview_scripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`获取采访稿失败: ${error.message}`);
    return data;
  }
}
