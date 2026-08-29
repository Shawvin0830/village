import { Injectable } from '@nestjs/common';
import { db } from '@/storage/database/shared/db';
import { operators, activityLogs } from '@/storage/database/shared/schema';
import { eq, and, desc } from 'drizzle-orm';

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

    const [record] = await db
      .insert(operators)
      .values({
        projectId: normalizedProject,
        displayName: trimmedName,
        role: normalizedRole,
        operatorToken,
        note: note || null,
      })
      .returning();

    return {
      id: record.id,
      displayName: record.displayName,
      role: record.role,
      operatorToken: record.operatorToken,
    };
  }

  async resolve(token: string | undefined): Promise<OperatorContext | null> {
    if (!token?.trim()) return null;
    const [record] = await db
      .select()
      .from(operators)
      .where(eq(operators.operatorToken, token.trim()))
      .limit(1);
    if (!record) return null;

    await db
      .update(operators)
      .set({ lastSeenAt: new Date() })
      .where(eq(operators.id, record.id));

    return {
      id: record.id,
      displayName: record.displayName,
      role: record.role,
      operatorToken: record.operatorToken,
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
    await db.insert(activityLogs).values({
      projectId: projectId || DEFAULT_PROJECT_ID,
      operatorId: operator?.id || null,
      operatorName: operator?.displayName || null,
      actionType,
      targetType,
      targetId: targetId || null,
      targetName: targetName || null,
      summary,
    });
  }

  async getActivityLogs(projectId: string, limit = 50) {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.projectId, projectId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getOperatorById(id: string): Promise<OperatorContext | null> {
    const [record] = await db
      .select()
      .from(operators)
      .where(eq(operators.id, id))
      .limit(1);
    if (!record) return null;
    return {
      id: record.id,
      displayName: record.displayName,
      role: record.role,
      operatorToken: record.operatorToken,
    };
  }
}
