"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MaterialsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_client_1 = require("../storage/database/supabase-client");
const material_embedding_skill_1 = require("../skills/material-embedding.skill");
let MaterialsService = MaterialsService_1 = class MaterialsService {
    constructor(embeddingSkill) {
        this.embeddingSkill = embeddingSkill;
        this.logger = new common_1.Logger(MaterialsService_1.name);
    }
    get client() {
        return (0, supabase_client_1.getSupabaseClient)();
    }
    async librarySearch(query, source) {
        const q = query.trim();
        if (!q)
            return [];
        const { data: matchedTopics } = await this.client
            .from('topics')
            .select('id, name, description')
            .ilike('name', `%${q}%`);
        const { data: matchedInterviewees } = await this.client
            .from('interviewees')
            .select('topic_id, name, topic:topics(id, name, description)')
            .ilike('name', `%${q}%`);
        let materialsQuery = this.client
            .from('reference_materials')
            .select('topic_id, topic:topics(id, name, description)')
            .or(`title.ilike.%${q}%,content.ilike.%${q}%`);
        if (source) {
            if (source === 'external') {
                materialsQuery = materialsQuery.neq('source', 'interview');
            }
            else {
                materialsQuery = materialsQuery.eq('source', source);
            }
        }
        const { data: matchedMaterials } = await materialsQuery;
        const topicIdSet = new Set();
        const topicInfoMap = new Map();
        for (const t of matchedTopics || []) {
            topicIdSet.add(t.id);
            topicInfoMap.set(t.id, t);
        }
        for (const item of matchedInterviewees || []) {
            const topic = (Array.isArray(item.topic) ? item.topic[0] : item.topic);
            if (topic) {
                topicIdSet.add(topic.id);
                topicInfoMap.set(topic.id, topic);
            }
        }
        for (const item of matchedMaterials || []) {
            const topic = (Array.isArray(item.topic) ? item.topic[0] : item.topic);
            if (topic) {
                topicIdSet.add(topic.id);
                topicInfoMap.set(topic.id, topic);
            }
        }
        const results = [];
        for (const topicId of topicIdSet) {
            const topicInfo = topicInfoMap.get(topicId);
            if (!topicInfo)
                continue;
            let countQuery = this.client
                .from('reference_materials')
                .select('id', { count: 'exact', head: true })
                .eq('topic_id', topicId);
            if (source) {
                if (source === 'external') {
                    countQuery = countQuery.neq('source', 'interview');
                }
                else {
                    countQuery = countQuery.eq('source', source);
                }
            }
            const { count } = await countQuery;
            results.push({
                topicId: topicInfo.id,
                topicName: topicInfo.name,
                topicDescription: topicInfo.description,
                materialCount: count || 0,
            });
        }
        return results.sort((a, b) => b.materialCount - a.materialCount);
    }
    async findTopicsWithMaterials(source) {
        let query = this.client
            .from('reference_materials')
            .select('topic_id, topic:topics(id, name, description)');
        if (source) {
            if (source === 'external') {
                query = query.neq('source', 'interview');
            }
            else {
                query = query.eq('source', source);
            }
        }
        const { data, error } = await query;
        if (error) {
            this.logger.error(`Failed to fetch topics with materials: ${error.message}`);
            return [];
        }
        const topicMap = new Map();
        for (const item of data || []) {
            const topicId = item.topic_id;
            const topicInfo = (Array.isArray(item.topic) ? item.topic[0] : item.topic);
            if (!topicInfo)
                continue;
            if (!topicMap.has(topicId)) {
                topicMap.set(topicId, { topic: topicInfo, count: 0 });
            }
            topicMap.get(topicId).count++;
        }
        return Array.from(topicMap.values()).map((v) => ({
            topicId: v.topic.id,
            topicName: v.topic.name,
            topicDescription: v.topic.description,
            materialCount: v.count,
        }));
    }
    async findAll(source) {
        let query = this.client
            .from('reference_materials')
            .select('*, topic:topics(id, name)')
            .order('created_at', { ascending: false });
        if (source) {
            if (source === 'external') {
                query = query.neq('source', 'interview');
            }
            else {
                query = query.eq('source', source);
            }
        }
        const { data, error } = await query;
        if (error) {
            this.logger.error(`Failed to fetch all materials: ${error.message}`);
            return [];
        }
        return data || [];
    }
    async globalSearch(query, source) {
        let q = this.client
            .from('reference_materials')
            .select('*, topic:topics(id, name)')
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(50);
        if (source) {
            if (source === 'external') {
                q = q.neq('source', 'interview');
            }
            else {
                q = q.eq('source', source);
            }
        }
        const { data, error } = await q;
        if (error) {
            this.logger.error(`Failed to global search materials: ${error.message}`);
            return [];
        }
        return data || [];
    }
    async findByTopic(topicId) {
        const { data, error } = await this.client
            .from('reference_materials')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false });
        if (error) {
            this.logger.error(`Failed to fetch materials: ${error.message}`);
            return [];
        }
        return data || [];
    }
    async findById(id) {
        const { data, error } = await this.client
            .from('reference_materials')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) {
            this.logger.error(`Failed to fetch material: ${error.message}`);
            return null;
        }
        return data;
    }
    async create(data) {
        const { data: material, error } = await this.client
            .from('reference_materials')
            .insert({
            topic_id: data.topicId,
            subtopic_id: data.subtopicId || null,
            source: data.source || 'manual',
            title: data.title,
            content: data.content,
            url: data.url || null,
            structured_data: data.structuredData || null,
            tags: data.tags || null,
        })
            .select()
            .single();
        if (error) {
            this.logger.error(`Failed to create material: ${error.message}`);
            throw new Error(`创建资料失败: ${error.message}`);
        }
        this.logger.log(`Created material: ${material.id} for topic: ${data.topicId}`);
        this.embeddingSkill.embedMaterial(material.id).catch((err) => {
            this.logger.warn(`Failed to embed new material: ${err}`);
        });
        return material;
    }
    async update(id, data) {
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (data.title !== undefined)
            updateData.title = data.title;
        if (data.content !== undefined)
            updateData.content = data.content;
        if (data.url !== undefined)
            updateData.url = data.url;
        if (data.structuredData !== undefined)
            updateData.structured_data = data.structuredData;
        if (data.tags !== undefined)
            updateData.tags = data.tags;
        const { data: material, error } = await this.client
            .from('reference_materials')
            .update(updateData)
            .eq('id', id)
            .select()
            .maybeSingle();
        if (error) {
            this.logger.error(`Failed to update material: ${error.message}`);
            return null;
        }
        if (material && (data.title !== undefined || data.content !== undefined)) {
            this.embeddingSkill.embedMaterial(material.id).catch((err) => {
                this.logger.warn(`Failed to re-embed material: ${err}`);
            });
        }
        return material;
    }
    async delete(id) {
        const { error } = await this.client
            .from('reference_materials')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Failed to delete material: ${error.message}`);
            throw new Error(`删除资料失败: ${error.message}`);
        }
        this.logger.log(`Deleted material: ${id}`);
        return { success: true };
    }
    async getMaterialsSummary(topicId) {
        const materials = await this.findByTopic(topicId);
        if (materials.length === 0) {
            return '暂无资料';
        }
        const summary = materials.map((m, i) => {
            const sourceLabel = m.source === 'manual' ? '用户录入' : m.source === 'ai_search' ? 'AI搜索' : '互联网';
            const tags = m.tags ? (Array.isArray(m.tags) ? m.tags.join('、') : '') : '';
            return `${i + 1}. [${sourceLabel}] ${m.title}${tags ? ` (标签: ${tags})` : ''}\n   ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`;
        }).join('\n\n');
        return `### 已有资料（${materials.length}条）\n\n${summary}`;
    }
};
exports.MaterialsService = MaterialsService;
exports.MaterialsService = MaterialsService = MaterialsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [material_embedding_skill_1.MaterialEmbeddingSkill])
], MaterialsService);
//# sourceMappingURL=materials.service.js.map