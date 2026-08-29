import { Injectable } from '@nestjs/common';
import { InterviewPlannerSkill } from '@/skills/interview-planner.skill';

@Injectable()
export class InterviewPlansService {
  constructor(private readonly plannerSkill: InterviewPlannerSkill) {}

  async generate(topicId: string, subtopicId?: string, requirements?: string) {
    return this.plannerSkill.generate(topicId, subtopicId, requirements);
  }

  async refine(planId: string, feedback: string) {
    return this.plannerSkill.refine(planId, feedback);
  }

  async finalize(planId: string) {
    return this.plannerSkill.finalize(planId);
  }

  async getByTopic(topicId: string) {
    return this.plannerSkill.getByTopic(topicId);
  }

  async getVersionChain(planId: string) {
    return this.plannerSkill.getVersionChain(planId);
  }
}
