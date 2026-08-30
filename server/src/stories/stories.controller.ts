import { Controller, Get, Post, Delete, Param, Body, HttpCode } from '@nestjs/common'
import { StoriesService } from './stories.service'

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /**
   * 获取所有故事列表
   */
  @Get()
  @HttpCode(200)
  async findAll() {
    const stories = await this.storiesService.findAll()
    return { code: 200, msg: 'success', data: stories }
  }

  /**
   * 获取可生成故事的话题列表（含素材数量、是否已有故事）
   */
  @Get('topics')
  @HttpCode(200)
  async getStoriableTopics() {
    const topics = await this.storiesService.getStoriableTopics()
    return { code: 200, msg: 'success', data: topics }
  }

  /**
   * 获取故事详情
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    const story = await this.storiesService.findById(id)
    if (!story) {
      return { code: 404, msg: '故事不存在', data: null }
    }
    return { code: 200, msg: 'success', data: story }
  }

  /**
   * 为话题/子话题生成故事
   */
  @Post('generate')
  @HttpCode(200)
  async generate(@Body() body: { topicId: string; subtopicId?: string }) {
    if (!body.topicId?.trim()) {
      return { code: 400, msg: '话题ID不能为空', data: null }
    }
    const story = await this.storiesService.generateStoryForTopic(
      body.topicId.trim(),
      body.subtopicId?.trim(),
    )
    if (!story) {
      return { code: 404, msg: '话题不存在或该话题下没有可用素材', data: null }
    }
    return { code: 200, msg: 'success', data: story }
  }

  /**
   * 删除故事
   */
  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const result = await this.storiesService.deleteStory(id)
    return { code: 200, msg: 'success', data: result }
  }
}
