import { Injectable } from '@nestjs/common';
import { InterviewPlannerSkill } from '@/skills/interview-planner.skill';

@Injectable()
export class InterviewPlansService {
  constructor(private readonly plannerSkill: InterviewPlannerSkill) {}

  async generate(topicId: string) {
    return this.plannerSkill.generate(topicId);
  }

  async getByTopic(topicId: string) {
    return this.plannerSkill.getByTopic(topicId);
  }
}
