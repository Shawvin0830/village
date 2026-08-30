import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'
import { StoryGenerationSkill } from '@/skills/story-generation.skill'

/** 故事列表项 */
export interface StoryListItem {
  id: string
  topic_id: string
  subtopic_id: string | null
  title: string
  summary: string | null
  source_material_count: number
  status: string
  topic_name: string
  subtopic_name: string | null
  created_at: string
}

/** 故事详情 */
export interface StoryDetail {
  id: string
  topic_id: string
  subtopic_id: string | null
  title: string
  content: string
  summary: string | null
  source_material_count: number
  status: string
  created_at: string
  updated_at: string | null
}

/** 可生成故事的话题项（主话题→子话题层级） */
export interface StoriableTopicItem {
  topic_id: string
  topic_name: string
  subtopic_id: string | null
  subtopic_name: string | null
  material_count: number
  has_story: boolean
  story_id: string | null
}

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name)

  constructor(private readonly storyGenerationSkill: StoryGenerationSkill) {}

  private get client() {
    return getSupabaseClient()
  }

  /**
   * 获取所有故事列表（关联主话题和子话题名称）
   */
  async findAll(): Promise<StoryListItem[]> {
    const { data, error } = await this.client
      .from('village_stories')
      .select('*, topics(name), subtopics(name)')
      .order('created_at', { ascending: false })

    if (error) {
      this.logger.error(`Failed to fetch stories: ${error.message}`)
      return []
    }

    return (data || []).map((item: Record<string, unknown>) => {
      const topic = item.topics as { name: string } | { name: string }[] | null
      const subtopic = item.subtopics as { name: string } | { name: string }[] | null
      const topicName = Array.isArray(topic) ? topic[0]?.name : topic?.name
      const subtopicName = Array.isArray(subtopic) ? subtopic[0]?.name : subtopic?.name
      return {
        id: item.id as string,
        topic_id: item.topic_id as string,
        subtopic_id: item.subtopic_id as string | null,
        title: item.title as string,
        summary: item.summary as string | null,
        source_material_count: item.source_material_count as number,
        status: item.status as string,
        topic_name: topicName || '未知话题',
        subtopic_name: subtopicName || null,
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
   * 根据话题ID获取故事（可选子话题）
   */
  async findByTopicId(topicId: string, subtopicId?: string): Promise<StoryDetail | null> {
    let query = this.client
      .from('village_stories')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (subtopicId) {
      query = query.eq('subtopic_id', subtopicId)
    } else {
      query = query.is('subtopic_id', null)
    }

    const { data, error } = await query.maybeSingle()

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
   * 获取子话题信息
   */
  private async getSubtopicInfo(subtopicId: string) {
    const { data, error } = await this.client
      .from('subtopics')
      .select('id, name, topic_id')
      .eq('id', subtopicId)
      .maybeSingle()

    if (error || !data) {
      this.logger.error(`Subtopic not found: ${subtopicId}`)
      return null
    }
    return data as { id: string; name: string; topic_id: string }
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
   * 获取子话题下的素材（通过 interview_quotes 和 reference_materials）
   */
  private async getSubtopicMaterials(subtopicId: string) {
    // 获取子话题关联的采访引用
    const { data: quotes } = await this.client
      .from('interview_quotes')
      .select('content, source_material_id')
      .eq('subtopic_id', subtopicId)
      .limit(20)

    // 获取子话题关联的素材ID
    const { data: subtopicMaterials } = await this.client
      .from('subtopic_materials')
      .select('material_id')
      .eq('subtopic_id', subtopicId)

    const materialIds = (subtopicMaterials || []).map(m => m.material_id)

    // 获取具体素材内容
    let materials: { title: string; content: string; source: string }[] = []
    if (materialIds.length > 0) {
      const { data: refs } = await this.client
        .from('reference_materials')
        .select('title, content, source')
        .in('id', materialIds)
        .limit(20)
      materials = (refs || []) as { title: string; content: string; source: string }[]
    }

    // 合并采访引用
    const quoteContents = (quotes || []).map(q => ({
      title: '采访引用',
      content: q.content,
      source: 'interview',
    }))

    return [...quoteContents, ...materials]
  }

  /**
   * 为话题/子话题生成故事
   */
  async generateStoryForTopic(topicId: string, subtopicId?: string): Promise<StoryDetail | null> {
    // 1. 获取话题信息
    const topic = await this.getTopicInfo(topicId)
    if (!topic) {
      return null
    }

    // 2. 获取子话题信息（如果有）
    let subtopicName = topic.name
    if (subtopicId) {
      const subtopic = await this.getSubtopicInfo(subtopicId)
      if (subtopic) {
        subtopicName = subtopic.name
      }
    }

    // 3. 获取素材
    let materials: { title: string; content: string; source: string }[]
    if (subtopicId) {
      materials = await this.getSubtopicMaterials(subtopicId)
    } else {
      materials = await this.getTopicMaterials(topicId)
    }

    if (materials.length === 0) {
      this.logger.warn(`No materials found for topic: ${topicId}, subtopic: ${subtopicId || 'none'}`)
      return null
    }

    // 4. 调用 LLM 生成故事
    const result = await this.storyGenerationSkill.generateStory(
      subtopicName,
      topic.description,
      materials,
    )

    // 5. 检查是否已有故事，有则更新
    const existing = await this.findByTopicId(topicId, subtopicId)

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

    // 6. 插入新故事
    const { data, error } = await this.client
      .from('village_stories')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
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

    this.logger.log(`Generated story "${result.title}" for topic: ${topic.name}, subtopic: ${subtopicName}`)
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
   * 获取可生成故事的话题列表（主话题→子话题层级）
   */
  async getStoriableTopics(): Promise<StoriableTopicItem[]> {
    // 获取所有主话题
    const { data: topics } = await this.client
      .from('topics')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (!topics || topics.length === 0) {
      return []
    }

    // 获取所有子话题
    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name, topic_id')

    // 获取所有故事
    const { data: stories } = await this.client
      .from('village_stories')
      .select('id, topic_id, subtopic_id')

    const storyMap = new Map<string, string>()
    for (const s of (stories || [])) {
      const key = s.subtopic_id ? `${s.topic_id}:${s.subtopic_id}` : s.topic_id
      storyMap.set(key, s.id)
    }

    const result: StoriableTopicItem[] = []

    for (const topic of topics) {
      // 获取主话题的素材数量
      const { count: topicMaterialCount } = await this.client
        .from('reference_materials')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topic.id)

      const topicKey = topic.id
      const topicStoryId = storyMap.get(topicKey) || null

      // 主话题本身
      result.push({
        topic_id: topic.id,
        topic_name: topic.name,
        subtopic_id: null,
        subtopic_name: null,
        material_count: topicMaterialCount || 0,
        has_story: !!topicStoryId,
        story_id: topicStoryId,
      })

      // 子话题
      const topicSubtopics = (subtopics || []).filter(s => s.topic_id === topic.id)
      for (const subtopic of topicSubtopics) {
        // 获取子话题的素材数量（采访引用 + 关联素材）
        const { count: quoteCount } = await this.client
          .from('interview_quotes')
          .select('*', { count: 'exact', head: true })
          .eq('subtopic_id', subtopic.id)

        const { count: subtopicMaterialCount } = await this.client
          .from('subtopic_materials')
          .select('*', { count: 'exact', head: true })
          .eq('subtopic_id', subtopic.id)

        const subtopicKey = `${topic.id}:${subtopic.id}`
        const subtopicStoryId = storyMap.get(subtopicKey) || null

        result.push({
          topic_id: topic.id,
          topic_name: topic.name,
          subtopic_id: subtopic.id,
          subtopic_name: subtopic.name,
          material_count: (quoteCount || 0) + (subtopicMaterialCount || 0),
          has_story: !!subtopicStoryId,
          story_id: subtopicStoryId,
        })
      }
    }

    return result
  }
}
