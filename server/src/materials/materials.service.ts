import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { OperatorsService, type OperatorContext, type OperatorHeaders } from '@/operators/operators.service'

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name)

  constructor(private readonly operatorsService: OperatorsService) {}

  private get client() {
    return getSupabaseClient()
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
  }, headers?: OperatorHeaders) {
    const operator = await this.requireOperator(headers, 'create_material')
    const now = new Date().toISOString()
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
        created_by: operator.id,
        created_by_name: operator.display_name,
        updated_by: operator.id,
        updated_by_name: operator.display_name,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`Failed to create material: ${error.message}`)
      throw new Error(`创建资料失败: ${error.message}`)
    }

    this.logger.log(`Created material: ${material.id} for topic: ${data.topicId}`)
    await this.writeLog(operator, 'create_material', material.id, material.title, `添加了外部资料「${material.title}」`)
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
  }, headers?: OperatorHeaders) {
    const operator = await this.requireOperator(headers, 'update_material')
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: operator.id,
      updated_by_name: operator.display_name,
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
    if (material) await this.writeLog(operator, 'update_material', material.id, material.title, `更新了外部资料「${material.title}」`)
    return material
  }

  /**
   * 删除资料
   */
  async delete(id: string, headers?: OperatorHeaders) {
    const operator = await this.requireOperator(headers, 'delete_material')
    const { data: existing } = await this.client
      .from('reference_materials')
      .select('id, title')
      .eq('id', id)
      .maybeSingle()

    const { error } = await this.client
      .from('reference_materials')
      .delete()
      .eq('id', id)

    if (error) {
      this.logger.error(`Failed to delete material: ${error.message}`)
      throw new Error(`删除资料失败: ${error.message}`)
    }

    this.logger.log(`Deleted material: ${id}`)
    await this.writeLog(operator, 'delete_material', id, existing?.title || id, `删除了外部资料「${existing?.title || id}」`)
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

  private async requireOperator(headers: OperatorHeaders | undefined, capability: string): Promise<OperatorContext> {
    const operator = await this.operatorsService.require(headers || {})
    this.operatorsService.assertCan(operator, capability)
    return operator
  }

  private async writeLog(
    operator: OperatorContext,
    actionType: string,
    targetId: string,
    targetName: string,
    summary: string,
  ) {
    await this.operatorsService.writeLog({
      operator,
      actionType,
      targetType: 'material',
      targetId,
      targetName,
      summary: `${operator.display_name} ${summary}`,
    })
  }
}
