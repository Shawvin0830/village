/**
 * 资料语义搜索 Skill
 *
 * 核心能力：
 * 1. 文本向量化：使用 EmbeddingClient 将资料内容转为向量
 * 2. 语义检索：通过余弦相似度匹配最相关的资料
 * 3. 自动嵌入：新增/更新资料时自动生成 embedding
 */
import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingClient } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 搜索结果 */
export interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  tags: string[] | null;
  score: number;
  created_at: string;
}

@Injectable()
export class MaterialEmbeddingSkill {
  private readonly logger = new Logger(MaterialEmbeddingSkill.name);

  private get client() {
    return getSupabaseClient();
  }

  private getEmbeddingClient() {
    return new EmbeddingClient();
  }

  /**
   * 为文本生成 embedding 向量
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const embeddingClient = this.getEmbeddingClient();
      const embedding = await embeddingClient.embedText(text);
      return embedding;
    } catch (err) {
      this.logger.error(`Failed to generate embedding: ${err}`);
      return null;
    }
  }

  /**
   * 为资料生成 embedding 并保存到数据库
   * 嵌入文本 = 标题 + 内容前500字 + 标签
   */
  async embedMaterial(materialId: string): Promise<void> {
    const { data: material, error } = await this.client
      .from('reference_materials')
      .select('id, title, content, tags')
      .eq('id', materialId)
      .maybeSingle();

    if (error || !material) {
      this.logger.warn(`Material not found for embedding: ${materialId}`);
      return;
    }

    // 构建嵌入文本
    const tagsText = Array.isArray(material.tags) ? material.tags.join(' ') : '';
    const contentPreview = (material.content || '').substring(0, 500);
    const embedText = `${material.title} ${contentPreview} ${tagsText}`.trim();

    if (!embedText) return;

    const embedding = await this.generateEmbedding(embedText);
    if (!embedding) return;

    await this.client
      .from('reference_materials')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', materialId);

    this.logger.log(`Embedded material: ${materialId}`);
  }

  /**
   * 语义搜索：在指定话题下检索最相关的资料
   */
  async semanticSearch(
    topicId: string,
    query: string,
    topK: number = 10,
  ): Promise<SemanticSearchResult[]> {
    // 1. 获取话题下所有有 embedding 的资料
    const { data: materials, error } = await this.client
      .from('reference_materials')
      .select('id, title, content, source, tags, embedding, created_at')
      .eq('topic_id', topicId)
      .not('embedding', 'is', null);

    if (error || !materials || materials.length === 0) {
      this.logger.log(`No embedded materials found for topic: ${topicId}`);
      return [];
    }

    // 2. 将查询文本向量化
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding) return [];

    // 3. 计算余弦相似度并排序
    const results = materials
      .map((m) => {
        let docEmbedding: number[];
        try {
          docEmbedding = typeof m.embedding === 'string' ? JSON.parse(m.embedding) : m.embedding;
        } catch {
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
      .filter((r): r is SemanticSearchResult => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
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
}
