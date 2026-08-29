export declare class InterviewScriptsService {
    private get client();
    create(body: {
        topic_id: string;
        plan_id?: string;
        title?: string;
        selected_questions: unknown[];
        warmup_questions?: string[];
        closing_questions?: string[];
    }): Promise<any>;
    getLatest(topicId: string): Promise<any>;
    getByTopic(topicId: string): Promise<any[]>;
    getById(id: string): Promise<any>;
    update(id: string, body: {
        title?: string;
        selected_questions?: unknown[];
        warmup_questions?: string[];
        closing_questions?: string[];
        status?: string;
    }): Promise<any>;
    delete(id: string): Promise<boolean>;
}
