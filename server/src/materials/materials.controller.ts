import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common'
import { MaterialsService } from './materials.service'

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  /**
   * 获取话题下的所有资料
   */
  @Get('topic/:topicId')
  @HttpCode(200)
  async findByTopic(@Param('topicId') topicId: string) {
    const materials = await this.materialsService.findByTopic(topicId)
    return { code: 200, msg: 'success', data: materials }
  }

  /**
   * 获取单条资料
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    const material = await this.materialsService.findById(id)
    if (!material) {
      return { code: 404, msg: '资料不存在', data: null }
    }
    return { code: 200, msg: 'success', data: material }
  }

  /**
   * 创建资料（手动录入）
   */
  @Post()
  @HttpCode(200)
  async create(@Body() body: {
    topicId: string
    subtopicId?: string
    source?: string
    title: string
    content: string
    url?: string
    structuredData?: Record<string, unknown>
    tags?: string[]
  }) {
    const material = await this.materialsService.create(body)
    return { code: 200, msg: 'success', data: material }
  }

  /**
   * 更新资料
   */
  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() body: {
    title?: string
    content?: string
    url?: string
    structuredData?: Record<string, unknown>
    tags?: string[]
  }) {
    const material = await this.materialsService.update(id, body)
    if (!material) {
      return { code: 404, msg: '资料不存在', data: null }
    }
    return { code: 200, msg: 'success', data: material }
  }

  /**
   * 删除资料
   */
  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    const result = await this.materialsService.delete(id)
    return { code: 200, msg: 'success', data: result }
  }

  /**
   * 获取话题资料摘要（供采访策划使用）
   */
  @Get('topic/:topicId/summary')
  @HttpCode(200)
  async getSummary(@Param('topicId') topicId: string) {
    const summary = await this.materialsService.getMaterialsSummary(topicId)
    return { code: 200, msg: 'success', data: { summary } }
  }
}
