import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface OperatorContext {
  id: string;
  displayName: string;
  role: string;
  operatorToken: string;
}

export interface OperatorHeaders {
  'x-operator-token'?: string;
  'x-project-code'?: string;
}

const DEFAULT_PROJECT_ID = 'village-memory';

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  editor: '协作者',
  viewer: '记录者',
};

const VALID_ROLES = new Set(['admin', 'editor', 'viewer']);

@Injectable()
export class OperatorsService {
  private generateToken(): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 14);
    return `op-${ts}-${rand}`;
  }

  async identify(
    displayName: string,
    role: string,
    projectId: string,
    note?: string,
  ): Promise<OperatorContext> {
    const trimmedName = displayName?.trim();
    if (!trimmedName) {
      throw new Error('display_name is required');
    }
    const normalizedRole = role?.trim() || 'viewer';
    if (!VALID_ROLES.has(normalizedRole)) {
      throw new Error(`Invalid role: ${normalizedRole}`);
    }
    const normalizedProject = projectId?.trim() || DEFAULT_PROJECT_ID;
    const operatorToken = this.generateToken();

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('operators')
      .insert({
        project_id: normalizedProject,
        display_name: trimmedName,
        role: normalizedRole,
        operator_token: operatorToken,
        note: note || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      displayName: data.display_name,
      role: data.role,
      operatorToken: data.operator_token,
    };
  }

  async resolve(token: string | undefined): Promise<OperatorContext | null> {
    if (!token?.trim()) return null;
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('operators')
      .select()
      .eq('operator_token', token.trim())
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    await supabase
      .from('operators')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', data.id);

    return {
      id: data.id,
      displayName: data.display_name,
      role: data.role,
      operatorToken: data.operator_token,
    };
  }

  async require(headers: OperatorHeaders | null): Promise<OperatorContext> {
    const token = headers?.['x-operator-token'];
    const operator = await this.resolve(token);
    if (!operator) {
      throw new Error('Missing or invalid operator token');
    }
    return operator;
  }

  roleCan(operator: OperatorContext, action: 'write' | 'admin') {
    if (action === 'admin') return operator.role === 'admin';
    if (action === 'write') return operator.role === 'admin' || operator.role === 'editor';
    return false;
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] || role;
  }

  async logActivity(params: {
    operator: OperatorContext | null;
    projectId?: string;
    actionType: string;
    targetType: string;
    targetId?: string;
    targetName?: string;
    summary: string;
  }) {
    const { operator, projectId, actionType, targetType, targetId, targetName, summary } = params;
    const supabase = getSupabaseClient();
    await supabase.from('activity_logs').insert({
      project_id: projectId || DEFAULT_PROJECT_ID,
      operator_id: operator?.id || null,
      operator_name: operator?.displayName || null,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId || null,
      target_name: targetName || null,
      summary,
    });
  }

  async getActivityLogs(projectId: string, limit = 50) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('activity_logs')
      .select()
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  async getOperatorById(id: string): Promise<OperatorContext | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('operators')
      .select()
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      displayName: data.display_name,
      role: data.role,
      operatorToken: data.operator_token,
    };
  }
}
