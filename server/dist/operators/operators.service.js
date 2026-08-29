"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../storage/database/supabase-client");
const DEFAULT_PROJECT_ID = 'village-memory';
const ROLE_LABELS = {
    admin: '管理员',
    editor: '协作者',
    viewer: '记录者',
};
const VALID_ROLES = new Set(['admin', 'editor', 'viewer']);
let OperatorsService = class OperatorsService {
    generateToken() {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 14);
        return `op-${ts}-${rand}`;
    }
    async identify(displayName, role, projectId, note) {
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
        const supabase = (0, supabase_client_1.getSupabaseClient)();
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
        if (error)
            throw new Error(error.message);
        return {
            id: data.id,
            displayName: data.display_name,
            role: data.role,
            operatorToken: data.operator_token,
        };
    }
    async resolve(token) {
        if (!token?.trim())
            return null;
        const supabase = (0, supabase_client_1.getSupabaseClient)();
        const { data, error } = await supabase
            .from('operators')
            .select()
            .eq('operator_token', token.trim())
            .limit(1)
            .maybeSingle();
        if (error || !data)
            return null;
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
    async require(headers) {
        const token = headers?.['x-operator-token'];
        const operator = await this.resolve(token);
        if (!operator) {
            throw new Error('Missing or invalid operator token');
        }
        return operator;
    }
    roleCan(operator, action) {
        if (action === 'admin')
            return operator.role === 'admin';
        if (action === 'write')
            return operator.role === 'admin' || operator.role === 'editor';
        return false;
    }
    roleLabel(role) {
        return ROLE_LABELS[role] || role;
    }
    async logActivity(params) {
        const { operator, projectId, actionType, targetType, targetId, targetName, summary } = params;
        const supabase = (0, supabase_client_1.getSupabaseClient)();
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
    async getActivityLogs(projectId, limit = 50) {
        const supabase = (0, supabase_client_1.getSupabaseClient)();
        const { data } = await supabase
            .from('activity_logs')
            .select()
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return data || [];
    }
    async getOperatorById(id) {
        const supabase = (0, supabase_client_1.getSupabaseClient)();
        const { data, error } = await supabase
            .from('operators')
            .select()
            .eq('id', id)
            .limit(1)
            .maybeSingle();
        if (error || !data)
            return null;
        return {
            id: data.id,
            displayName: data.display_name,
            role: data.role,
            operatorToken: data.operator_token,
        };
    }
};
exports.OperatorsService = OperatorsService;
exports.OperatorsService = OperatorsService = __decorate([
    (0, common_1.Injectable)()
], OperatorsService);
//# sourceMappingURL=operators.service.js.map