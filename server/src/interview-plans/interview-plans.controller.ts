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

  @Post(':planId/refine')
  @HttpCode(200)
  async refine(@Param('planId') planId: string, @Body() body: { feedback: string }) {
    const data = await this.plansService.refine(planId, body.feedback);
    return { code: 200, msg: 'success', data };
  }

  @Post(':planId/finalize')
  @HttpCode(200)
  async finalize(@Param('planId') planId: string) {
    const data = await this.plansService.finalize(planId);
    return { code: 200, msg: 'success', data };
  }

  @Get(':topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.plansService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }

  @Get('versions/:planId')
  @HttpCode(200)
  async getVersionChain(@Param('planId') planId: string) {
    const data = await this.plansService.getVersionChain(planId);
    return { code: 200, msg: 'success', data };
  }
}
