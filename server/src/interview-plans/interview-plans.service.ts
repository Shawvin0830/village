import { Injectable } from '@nestjs/common';
import { InterviewPlannerSkill } from '@/skills/interview-planner.skill';
import { OperatorsService, type OperatorHeaders } from '@/operators/operators.service';

@Injectable()
export class InterviewPlansService {
  constructor(
    private readonly plannerSkill: InterviewPlannerSkill,
    private readonly operatorsService: OperatorsService,
  ) {}

  async generate(topicId: string, subtopicId?: string, requirements?: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    const result = await this.plannerSkill.generate(topicId, subtopicId, requirements);
    await this.operatorsService.writeLog({
      operator,
      actionType: 'generate_interview_plan',
      targetType: 'interview_plan',
      targetId: result?.id || null,
      targetName: '采访提纲生成',
      summary: `${operator.display_name} 生成了采访提纲`,
    });
    return result;
  }

  async refine(planId: string, feedback: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    const result = await this.plannerSkill.refine(planId, feedback);
    await this.operatorsService.writeLog({
      operator,
      actionType: 'refine_interview_plan',
      targetType: 'interview_plan',
      targetId: planId,
      targetName: '采访提纲优化',
      summary: `${operator.display_name} 优化了采访提纲`,
    });
    return result;
  }

  async supplement(planId: string, requirements?: string, existingCount?: number, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    return this.plannerSkill.supplement(planId, requirements, existingCount);
  }

  async finalize(planId: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    return this.plannerSkill.finalize(planId);
  }

  async getByTopic(topicId: string) {
    return this.plannerSkill.getByTopic(topicId);
  }

  async getVersionChain(planId: string) {
    return this.plannerSkill.getVersionChain(planId);
  }
}
