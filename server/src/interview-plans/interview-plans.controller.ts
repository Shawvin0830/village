import { Controller, Post, Get, Body, Param, Headers, HttpCode } from '@nestjs/common';
import { InterviewPlansService } from './interview-plans.service';
import { type OperatorHeaders } from '@/operators/operators.service';

@Controller('interview-plans')
export class InterviewPlansController {
  constructor(private readonly plansService: InterviewPlansService) {}

  @Post('generate')
  @HttpCode(200)
  async generate(@Body() body: { topic_id: string; subtopic_id?: string; requirements?: string }, @Headers() headers?: OperatorHeaders) {
    const data = await this.plansService.generate(body.topic_id, body.subtopic_id, body.requirements, headers);
    return { code: 200, msg: 'success', data };
  }

  @Post(':planId/refine')
  @HttpCode(200)
  async refine(@Param('planId') planId: string, @Body() body: { feedback: string }, @Headers() headers?: OperatorHeaders) {
    const data = await this.plansService.refine(planId, body.feedback, headers);
    return { code: 200, msg: 'success', data };
  }

  @Post(':planId/supplement')
  @HttpCode(200)
  async supplement(@Param('planId') planId: string, @Body() body: { requirements?: string; existing_count?: number }, @Headers() headers?: OperatorHeaders) {
    const data = await this.plansService.supplement(planId, body.requirements, body.existing_count, headers);
    return { code: 200, msg: 'success', data };
  }

  @Post(':planId/finalize')
  @HttpCode(200)
  async finalize(@Param('planId') planId: string, @Headers() headers?: OperatorHeaders) {
    const data = await this.plansService.finalize(planId, headers);
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
