import { InterviewPlannerSkill } from '@/skills/interview-planner.skill';
export declare class InterviewPlansService {
    private readonly plannerSkill;
    constructor(plannerSkill: InterviewPlannerSkill);
    generate(topicId: string, subtopicId?: string, requirements?: string): Promise<any>;
    refine(planId: string, feedback: string): Promise<any>;
    supplement(planId: string, requirements?: string, existingCount?: number): Promise<{
        core_questions: any;
    }>;
    finalize(planId: string): Promise<any>;
    getByTopic(topicId: string): Promise<any[]>;
    getVersionChain(planId: string): Promise<Record<string, unknown>[]>;
}
