import { Controller, Post, Get, Body, Param, HttpCode } from '@nestjs/common';
import { InterviewPlansService } from './interview-plans.service';

@Controller('interview-plans')
export class InterviewPlansController {
  constructor(private readonly plansService: InterviewPlansService) {}

  @Post('generate')
  @HttpCode(200)
  async generate(@Body() body: { topic_id: string }) {
    const data = await this.plansService.generate(body.topic_id);
    return { code: 200, msg: 'success', data };
  }

  @Get(':topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.plansService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }
}
