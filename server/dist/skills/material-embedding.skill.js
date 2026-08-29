"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MaterialEmbeddingSkill_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialEmbeddingSkill = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
const supabase_client_1 = require("../storage/database/supabase-client");
let MaterialEmbeddingSkill = MaterialEmbeddingSkill_1 = class MaterialEmbeddingSkill {
    constructor() {
        this.logger = new common_1.Logger(MaterialEmbeddingSkill_1.name);
    }
    get client() {
        return (0, supabase_client_1.getSupabaseClient)();
    }
    getEmbeddingClient() {
        return new coze_coding_dev_sdk_1.EmbeddingClient();
    }
    async generateEmbedding(text) {
        try {
            const embeddingClient = this.getEmbeddingClient();
            const embedding = await embeddingClient.embedText(text);
            return embedding;
        }
        catch (err) {
            this.logger.error(`Failed to generate embedding: ${err}`);
            return null;
        }
    }
    async embedMaterial(materialId) {
        const { data: material, error } = await this.client
            .from('reference_materials')
            .select('id, title, content, tags')
            .eq('id', materialId)
            .maybeSingle();
        if (error || !material) {
            this.logger.warn(`Material not found for embedding: ${materialId}`);
            return;
        }
        const tagsText = Array.isArray(material.tags) ? material.tags.join(' ') : '';
        const contentPreview = (material.content || '').substring(0, 500);
        const embedText = `${material.title} ${contentPreview} ${tagsText}`.trim();
        if (!embedText)
            return;
        const embedding = await this.generateEmbedding(embedText);
        if (!embedding)
            return;
        await this.client
            .from('reference_materials')
            .update({ embedding: JSON.stringify(embedding) })
            .eq('id', materialId);
        this.logger.log(`Embedded material: ${materialId}`);
    }
    async semanticSearch(topicId, query, topK = 10) {
        const { data: materials, error } = await this.client
            .from('reference_materials')
            .select('id, title, content, source, tags, embedding, created_at')
            .eq('topic_id', topicId)
            .not('embedding', 'is', null);
        if (error || !materials || materials.length === 0) {
            this.logger.log(`No embedded materials found for topic: ${topicId}`);
            return [];
        }
        const queryEmbedding = await this.generateEmbedding(query);
        if (!queryEmbedding)
            return [];
        const results = materials
            .map((m) => {
            let docEmbedding;
            try {
                docEmbedding = typeof m.embedding === 'string' ? JSON.parse(m.embedding) : m.embedding;
            }
            catch {
                return null;
            }
            const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
            return {
                id: m.id,
                title: m.title,
                content: m.content,
                source: m.source,
                tags: m.tags,
                score,
                created_at: m.created_at,
            };
        })
            .filter((r) => r !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
        return results;
    }
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dotProduct / denom;
    }
};
exports.MaterialEmbeddingSkill = MaterialEmbeddingSkill;
exports.MaterialEmbeddingSkill = MaterialEmbeddingSkill = MaterialEmbeddingSkill_1 = __decorate([
    (0, common_1.Injectable)()
], MaterialEmbeddingSkill);
//# sourceMappingURL=material-embedding.skill.js.map