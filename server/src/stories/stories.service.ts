import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { StoryGenerationSkill } from '@/skills/story-generation.skill'

/** 故事列表项 */
export interface StoryListItem {
  id: string
  topic_id: string
  title: string
  summary: string | null
  source_material_count: number
  status: string
  topic_name: string
  created_at: string
}

/** 故事详情 */
export interface StoryDetail {
  id: string
  topic_id: string
  title: string
  content: string
  summary: string | null
  source_material_count: number
  status: string
  created_at: string
  updated_at: string | null
}

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name)

  constructor(private readonly storyGenerationSkill: StoryGenerationSkill) {}

  private get client() {
    return getSupabaseClient()
  }

  /**
   * 获取所有故事列表（关联话题名称）
   */
  async findAll(): Promise<StoryListItem[]> {
    const { data, error } = await this.client
      .from('village_stories')
      .select('*, topics(name)')
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`Failed to fetch stories: ${error.message}`)
      return []
    }

    return (data || []).map((item: Record<string, unknown>) => {
      const topic = item.topics as { name: string } | { name: string }[] | null
      const topicName = Array.isArray(topic) ? topic[0]?.name : topic?.name
      return {
        id: item.id as string,
        topic_id: item.topic_id as string,
        title: item.title as string,
        summary: item.summary as string | null,
        source_material_count: item.source_material_count as number,
        status: item.status as string,
        topic_name: topicName || '未知话题',
        created_at: item.created_at as string,
      }
    })
  }

  /**
   * 获取故事详情
   */
  async findById(id: string): Promise<StoryDetail | null> {
    const { data, error } = await this.client
      .from('village_stories')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      this.logger.error(`Failed to fetch story: ${error.message}`)
      return null
    }
    return data as StoryDetail | null
  }

  /**
   * 根据话题ID获取故事
   */
  async findByTopicId(topicId: string): Promise<StoryDetail | null> {
    const { data, error } = await this.client
      .from('village_stories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      this.logger.error(`Failed to fetch story by topic: ${error.message}`)
      return null
    }
    return data as StoryDetail | null
  }

  /**
   * 获取话题信息
   */
  private async getTopicInfo(topicId: string) {
    const { data, error } = await this.client
      .from('topics')
      .select('id, name, description')
      .eq('id', topicId)
      .maybeSingle()

    if (error || !data) {
      this.logger.error(`Topic not found: ${topicId}`)
      return null
    }
    return data as { id: string; name: string; description: string | null }
  }

  /**
   * 获取话题下的素材（历史采访 + 外部文献）
   */
  private async getTopicMaterials(topicId: string) {
    const { data, error } = await this.client
      .from('reference_materials')
      .select('title, content, source')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      this.logger.error(`Failed to fetch materials: ${error.message}`)
      return []
    }
    return (data || []) as { title: string; content: string; source: string }[]
  }

  /**
   * 为话题生成故事
   */
  async generateStoryForTopic(topicId: string): Promise<StoryDetail | null> {
    // 1. 获取话题信息
    const topic = await this.getTopicInfo(topicId)
    if (!topic) {
      return null
    }

    // 2. 获取素材
    const materials = await this.getTopicMaterials(topicId)
    if (materials.length === 0) {
      this.logger.warn(`No materials found for topic: ${topicId}`)
      return null
    }

    // 3. 调用 LLM 生成故事
    const result = await this.storyGenerationSkill.generateStory(
      topic.name,
      topic.description,
      materials,
    )

    // 4. 检查是否已有故事，有则更新
    const existing = await this.findByTopicId(topicId)

    if (existing) {
      const { data, error } = await this.client
        .from('village_stories')
        .update({
          title: result.title,
          content: result.content,
          summary: result.summary,
          source_material_count: materials.length,
          status: 'published',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        this.logger.error(`Failed to update story: ${error.message}`)
        throw new Error(`更新故事失败: ${error.message}`)
      }
      return data as StoryDetail
    }

    // 5. 插入新故事
    const { data, error } = await this.client
      .from('village_stories')
      .insert({
        topic_id: topicId,
        title: result.title,
        content: result.content,
        summary: result.summary,
        source_material_count: materials.length,
        status: 'published',
      })
      .select()
      .single()

    if (error) {
      this.logger.error(`Failed to insert story: ${error.message}`)
      throw new Error(`创建故事失败: ${error.message}`)
    }

    this.logger.log(`Generated story "${result.title}" for topic: ${topic.name}`)
    return data as StoryDetail
  }

  /**
   * 删除故事
   */
  async deleteStory(id: string) {
    const { error } = await this.client
      .from('village_stories')
      .delete()
      .eq('id', id)

    if (error) {
      this.logger.error(`Failed to delete story: ${error.message}`)
      throw new Error(`删除故事失败: ${error.message}`)
    }
    return { success: true }
  }

  /**
   * 获取有素材可生成故事的话题列表
   */
  async getStoriableTopics() {
    // 获取有素材的话题，排除已有故事的话题
    const { data: stories } = await this.client
      .from('village_stories')
      .select('topic_id')

    const existingTopicIds = new Set((stories || []).map((s: { topic_id: string }) => s.topic_id))

    // 获取所有有素材的话题
    const { data: materialTopics } = await this.client
      .from('reference_materials')
      .select('topic_id, topic:topics(id, name, description)')

    const topicMap = new Map<string, { id: string; name: string; description: string | null; materialCount: number }>()
    for (const item of (materialTopics || [])) {
      const topicId = item.topic_id
      const topicInfo = (Array.isArray(item.topic) ? item.topic[0] : item.topic) as { id: string; name: string; description: string | null }
      if (!topicInfo) continue
      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, { ...topicInfo, materialCount: 0 })
      }
      topicMap.get(topicId)!.materialCount++
    }

    return Array.from(topicMap.values()).map((t) => ({
      ...t,
      hasStory: existingTopicIds.has(t.id),
    }))
  }
}
