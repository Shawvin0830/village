import { InterviewPlansService } from './interview-plans.service';
export declare class InterviewPlansController {
    private readonly plansService;
    constructor(plansService: InterviewPlansService);
    generate(body: {
        topic_id: string;
        subtopic_id?: string;
        requirements?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    refine(planId: string, body: {
        feedback: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    supplement(planId: string, body: {
        requirements?: string;
        existing_count?: number;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            core_questions: any;
        };
    }>;
    finalize(planId: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getByTopic(topicId: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    getVersionChain(planId: string): Promise<{
        code: number;
        msg: string;
        data: Record<string, unknown>[];
    }>;
}
