"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewScriptsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../storage/database/supabase-client");
let InterviewScriptsService = class InterviewScriptsService {
    get client() {
        return (0, supabase_client_1.getSupabaseClient)();
    }
    async create(body) {
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
        if (error)
            throw new Error(`创建采访稿失败: ${error.message}`);
        return data;
    }
    async getLatest(topicId) {
        const { data, error } = await this.client
            .from('interview_scripts')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error)
            throw new Error(`获取最新采访稿失败: ${error.message}`);
        return data;
    }
    async getByTopic(topicId) {
        const { data, error } = await this.client
            .from('interview_scripts')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`获取采访稿列表失败: ${error.message}`);
        return data || [];
    }
    async getById(id) {
        const { data, error } = await this.client
            .from('interview_scripts')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(`获取采访稿失败: ${error.message}`);
        return data;
    }
    async update(id, body) {
        const updateData = { updated_at: new Date().toISOString() };
        if (body.title !== undefined)
            updateData.title = body.title;
        if (body.selected_questions !== undefined)
            updateData.selected_questions = body.selected_questions;
        if (body.warmup_questions !== undefined)
            updateData.warmup_questions = body.warmup_questions;
        if (body.closing_questions !== undefined)
            updateData.closing_questions = body.closing_questions;
        if (body.status !== undefined)
            updateData.status = body.status;
        const { data, error } = await this.client
            .from('interview_scripts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(`更新采访稿失败: ${error.message}`);
        return data;
    }
    async delete(id) {
        const { error } = await this.client
            .from('interview_scripts')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(`删除采访稿失败: ${error.message}`);
        return true;
    }
};
exports.InterviewScriptsService = InterviewScriptsService;
exports.InterviewScriptsService = InterviewScriptsService = __decorate([
    (0, common_1.Injectable)()
], InterviewScriptsService);
//# sourceMappingURL=interview-scripts.service.js.map