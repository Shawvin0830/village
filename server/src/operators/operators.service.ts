import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export type OperatorRole = 'admin' | 'editor' | 'viewer';

export type OperatorHeaders = Record<string, string | string[] | undefined>;

export type OperatorContext = {
  id: string;
  project_id: string;
  display_name: string;
  role: OperatorRole;
  operator_token: string;
  note: string | null;
};

type IdentifyPayload = {
  display_name: string;
  project_code?: string;
  role_code?: string;
  operator_token?: string;
  note?: string;
};

type LogPayload = {
  operator: OperatorContext;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  summary: string;
};

const ROLE_LABELS: Record<OperatorRole, string> = {
  admin: '管理员',
  editor: '协作者',
  viewer: '只读',
};

const DEFAULT_PROJECT_ID = 'village-memory';

const normalizeText = (value?: string | null) => (value || '').trim();

const headerValue = (headers: OperatorHeaders, key: string) => {
  const value = headers[key] || headers[key.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const makeToken = () => `op-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

@Injectable()
export class OperatorsService {
  private get client() {
    return getSupabaseClient();
  }

  getRoleLabel(role: OperatorRole) {
    return ROLE_LABELS[role] || ROLE_LABELS.viewer;
  }

  async identify(payload: IdentifyPayload) {
    const displayName = normalizeText(payload.display_name);
    if (!displayName) throw new Error('请填写姓名或昵称');

    const projectId = normalizeText(payload.project_code) || DEFAULT_PROJECT_ID;
    const operatorToken = normalizeText(payload.operator_token) || makeToken();
    const role = this.roleFromCode(payload.role_code);
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await this.client
      .from('operators')
      .select('id')
      .eq('project_id', projectId)
      .eq('operator_token', operatorToken)
      .maybeSingle();
    if (existingError) throw new Error(`读取操作者失败: ${existingError.message}`);

    if (existing) {
      const { data, error } = await this.client
        .from('operators')
        .update({
          display_name: displayName,
          role,
          note: normalizeText(payload.note) || null,
          last_seen_at: now,
        })
        .eq('id', existing.id)
        .select('id, project_id, display_name, role, operator_token, note, last_seen_at')
        .single();
      if (error) throw new Error(`更新操作者失败: ${error.message}`);
      return this.withMeta(data);
    }

    const { data, error } = await this.client
      .from('operators')
      .insert({
        project_id: projectId,
        display_name: displayName,
        role,
        operator_token: operatorToken,
        note: normalizeText(payload.note) || null,
        created_at: now,
        last_seen_at: now,
      })
      .select('id, project_id, display_name, role, operator_token, note, last_seen_at')
      .single();
    if (error) throw new Error(`创建操作者失败: ${error.message}`);

    return this.withMeta(data);
  }

  async me(headers: OperatorHeaders) {
    const operator = await this.resolve(headers);
    return operator ? this.withMeta(operator) : null;
  }

  async resolve(headers: OperatorHeaders): Promise<OperatorContext | null> {
    const token = normalizeText(headerValue(headers, 'x-operator-token'));
    if (!token) return null;

    const projectId = normalizeText(headerValue(headers, 'x-project-code')) || DEFAULT_PROJECT_ID;
    const { data, error } = await this.client
      .from('operators')
      .select('id, project_id, display_name, role, operator_token, note')
      .eq('project_id', projectId)
      .eq('operator_token', token)
      .maybeSingle();

    if (error) throw new Error(`读取操作者失败: ${error.message}`);
    if (!data) return null;

    await this.client
      .from('operators')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', data.id);

    return {
      id: data.id,
      project_id: data.project_id,
      display_name: data.display_name,
      role: this.normalizeRole(data.role),
      operator_token: data.operator_token,
      note: data.note || null,
    };
  }

  async require(headers: OperatorHeaders): Promise<OperatorContext> {
    const operator = await this.resolve(headers);
    if (!operator) throw new Error('请先在“我的”页面设置我的名字');
    return operator;
  }

  assertCan(operator: OperatorContext, capability: string) {
    if (operator.role === 'admin') return;

    const editorCapabilities = new Set([
      'create_topic',
      'create_subtopic',
      'create_material',
      'update_material',
      'generate_plan',
      'create_interview_record',
      'update_interviewee',
      'update_authorization',
    ]);

    if (operator.role === 'editor' && editorCapabilities.has(capability)) return;
    throw new Error('当前身份没有权限执行这个操作');
  }

  async writeLog(payload: LogPayload) {
    const { operator } = payload;
    const { error } = await this.client.from('activity_logs').insert({
      project_id: operator.project_id,
      operator_id: operator.id,
      operator_name: operator.display_name,
      action_type: payload.actionType,
      target_type: payload.targetType,
      target_id: payload.targetId || null,
      target_name: payload.targetName || null,
      summary: payload.summary,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn(`写入操作记录失败: ${error.message}`);
  }

  async getLogs(headers: OperatorHeaders, filters: { targetType?: string; targetId?: string }) {
    const operator = await this.require(headers);
    const limit = operator.role === 'admin' ? 50 : 20;
    let query = this.client
      .from('activity_logs')
      .select('id, operator_id, operator_name, action_type, target_type, target_id, target_name, summary, created_at')
      .eq('project_id', operator.project_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters.targetType) query = query.eq('target_type', filters.targetType);
    if (filters.targetId) query = query.eq('target_id', filters.targetId);
    if (operator.role !== 'admin') query = query.eq('operator_id', operator.id);

    const { data, error } = await query;
    if (error) throw new Error(`查询操作记录失败: ${error.message}`);
    return data || [];
  }

  private roleFromCode(roleCode?: string): OperatorRole {
    const code = normalizeText(roleCode);
    const adminCode = process.env.ADMIN_CODE || 'mulan-admin';
    const editorCode = process.env.EDITOR_CODE || 'village-editor';
    const viewerCode = process.env.VIEWER_CODE || 'village-viewer';

    if (code === adminCode) return 'admin';
    if (code === editorCode) return 'editor';
    if (code === viewerCode) return 'viewer';
    throw new Error('角色码不正确');
  }

  private normalizeRole(role?: string | null): OperatorRole {
    if (role === 'admin' || role === 'editor' || role === 'viewer') return role;
    return 'viewer';
  }

  private withMeta(data: Record<string, unknown>) {
    const role = this.normalizeRole(String(data.role || 'viewer'));
    return {
      ...data,
      role,
      role_label: this.getRoleLabel(role),
      permissions: {
        can_create: role === 'admin' || role === 'editor',
        can_edit: role === 'admin' || role === 'editor',
        can_delete: role === 'admin',
        can_view_logs: role === 'admin',
      },
    };
  }
}
