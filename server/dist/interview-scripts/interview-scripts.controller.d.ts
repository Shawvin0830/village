import { InterviewScriptsService } from './interview-scripts.service';
export declare class InterviewScriptsController {
    private readonly scriptsService;
    constructor(scriptsService: InterviewScriptsService);
    create(body: {
        topic_id: string;
        plan_id?: string;
        title?: string;
        selected_questions: unknown[];
        warmup_questions?: string[];
        closing_questions?: string[];
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getLatest(topicId: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getByTopic(topicId: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    getById(id: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    update(id: string, body: {
        title?: string;
        selected_questions?: unknown[];
        warmup_questions?: string[];
        closing_questions?: string[];
        status?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    delete(id: string): Promise<{
        code: number;
        msg: string;
    }>;
}
