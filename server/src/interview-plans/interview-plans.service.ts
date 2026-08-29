import { Injectable } from '@nestjs/common';
import { InterviewPlannerSkill } from '@/skills/interview-planner.skill';
import { OperatorsService, type OperatorHeaders } from '@/operators/operators.service';

@Injectable()
export class InterviewPlansService {
  constructor(
    private readonly plannerSkill: InterviewPlannerSkill,
    private readonly operatorsService: OperatorsService,
  ) {}

  async generate(topicId: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'generate_plan');
    const plan = await this.plannerSkill.generate(topicId);
    await this.operatorsService.writeLog({
      operator,
      actionType: 'generate_plan',
      targetType: 'interview_plan',
      targetId: plan.id,
      targetName: '采访策划',
      summary: `${operator.display_name} 生成了采访策划`,
    });
    return plan;
  }

  async getByTopic(topicId: string) {
    return this.plannerSkill.getByTopic(topicId);
  }
}
