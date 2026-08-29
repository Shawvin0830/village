import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { InterviewScriptsService } from './interview-scripts.service';

@Controller('interview-scripts')
export class InterviewScriptsController {
  constructor(private readonly scriptsService: InterviewScriptsService) {}

  @Post()
  @HttpCode(200)
  async create(@Body() body: {
    topic_id: string;
    plan_id?: string;
    title?: string;
    selected_questions: unknown[];
    warmup_questions?: string[];
    closing_questions?: string[];
  }) {
    const data = await this.scriptsService.create(body);
    return { code: 200, msg: 'success', data };
  }

  @Get('latest/:topicId')
  @HttpCode(200)
  async getLatest(@Param('topicId') topicId: string) {
    const data = await this.scriptsService.getLatest(topicId);
    return { code: 200, msg: 'success', data };
  }

  @Get('topic/:topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.scriptsService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }

  @Get(':id')
  @HttpCode(200)
  async getById(@Param('id') id: string) {
    const data = await this.scriptsService.getById(id);
    return { code: 200, msg: 'success', data };
  }
}
