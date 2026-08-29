import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { MaterialEmbeddingSkill } from '@/skills/material-embedding.skill'

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name)

  constructor(private readonly embeddingSkill: MaterialEmbeddingSkill) {}

  private get client() {
    return getSupabaseClient()
  }

  /**
   * 获取所有资料（资料库 TabBar 页面使用），支持来源筛选，关联话题名称
   */
  async findAll(source?: string) {
    let query = this.client
      .from('reference_materials')
      .select('*, topic:topics(id, name)')
      .order('created_at', { ascending: false })

    if (source) {
      if (source === 'external') {
        // 外部文献：排除 interview
        query = query.neq('source', 'interview')
      } else {
        query = query.eq('source', source)
      }
    }

    const { data, error } = await query

    if (error) {
      this.logger.error(`Failed to fetch all materials: ${error.message}`)
      return []
    }
    return data || []
  }

  /**
   * 全局关键词搜索资料（不限话题），支持来源筛选
   */
  async globalSearch(query: string, source?: string) {
    let q = this.client
      .from('reference_materials')
      .select('*, topic:topics(id, name)')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (source) {
      if (source === 'external') {
        q = q.neq('source', 'interview')
      } else {
        q = q.eq('source', source)
      }
    }

    const { data, error } = await q

    if (error) {
      this.logger.error(`Failed to global search materials: ${error.message}`)
      return []
    }
    return data || []
  }

  /**
   * 获取话题下的所有资料
   */
  async findByTopic(topicId: string) {
    const { data, error } = await this.client
      .from('reference_materials')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`Failed to fetch materials: ${error.message}`)
      return []
    }
    return data || []
  }

  /**
   * 获取单条资料
   */
  async findById(id: string) {
    const { data, error } = await this.client
      .from('reference_materials')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      this.logger.error(`Failed to fetch material: ${error.message}`)
      return null
    }
    return data
  }

  /**
   * 创建资料（手动录入）
   */
  async create(data: {
    topicId: string
    subtopicId?: string
    source?: string
    title: string
    content: string
    url?: string
    structuredData?: Record<string, unknown>
    tags?: string[]
  }) {
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
      .single()

    if (error) {
      this.logger.error(`Failed to create material: ${error.message}`)
      throw new Error(`创建资料失败: ${error.message}`)
    }

    this.logger.log(`Created material: ${material.id} for topic: ${data.topicId}`)

    // 异步生成 embedding（不阻塞返回）
    this.embeddingSkill.embedMaterial(material.id).catch((err) => {
      this.logger.warn(`Failed to embed new material: ${err}`)
    })

    return material
  }

  /**
   * 更新资料
   */
  async update(id: string, data: {
    title?: string
    content?: string
    url?: string
    structuredData?: Record<string, unknown>
    tags?: string[]
  }) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.url !== undefined) updateData.url = data.url
    if (data.structuredData !== undefined) updateData.structured_data = data.structuredData
    if (data.tags !== undefined) updateData.tags = data.tags

    const { data: material, error } = await this.client
      .from('reference_materials')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      this.logger.error(`Failed to update material: ${error.message}`)
      return null
    }

    // 内容变更时重新生成 embedding
    if (material && (data.title !== undefined || data.content !== undefined)) {
      this.embeddingSkill.embedMaterial(material.id).catch((err) => {
        this.logger.warn(`Failed to re-embed material: ${err}`)
      })
    }

    return material
  }

  /**
   * 删除资料
   */
  async delete(id: string) {
    const { error } = await this.client
      .from('reference_materials')
      .delete()
      .eq('id', id)

    if (error) {
      this.logger.error(`Failed to delete material: ${error.message}`)
      throw new Error(`删除资料失败: ${error.message}`)
    }

    this.logger.log(`Deleted material: ${id}`)
    return { success: true }
  }

  /**
   * 获取话题资料摘要（供采访策划使用）
   */
  async getMaterialsSummary(topicId: string): Promise<string> {
    const materials = await this.findByTopic(topicId)

    if (materials.length === 0) {
      return '暂无资料'
    }

    const summary = materials.map((m, i) => {
      const sourceLabel = m.source === 'manual' ? '用户录入' : m.source === 'ai_search' ? 'AI搜索' : '互联网'
      const tags = m.tags ? (Array.isArray(m.tags) ? m.tags.join('、') : '') : ''
      return `${i + 1}. [${sourceLabel}] ${m.title}${tags ? ` (标签: ${tags})` : ''}\n   ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`
    }).join('\n\n')

    return `### 已有资料（${materials.length}条）\n\n${summary}`
  }
}
