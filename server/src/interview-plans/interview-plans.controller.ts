import { Controller, Post, Get, Body, Param, Headers, HttpCode } from '@nestjs/common';
import { InterviewPlansService } from './interview-plans.service';
import type { OperatorHeaders } from '@/operators/operators.service';

@Controller('interview-plans')
export class InterviewPlansController {
  constructor(private readonly plansService: InterviewPlansService) {}

  @Post('generate')
  @HttpCode(200)
  async generate(
    @Body() body: { topic_id: string },
    @Headers() headers: OperatorHeaders,
  ) {
    const data = await this.plansService.generate(body.topic_id, headers);
    return { code: 200, msg: 'success', data };
  }

  @Get(':topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.plansService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }
}
