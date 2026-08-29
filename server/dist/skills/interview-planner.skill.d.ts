export declare class InterviewPlannerSkill {
    private get client();
    private getLLMClient;
    generate(topicId: string, subtopicId?: string, requirements?: string): Promise<any>;
    refine(planId: string, feedback: string): Promise<any>;
    finalize(planId: string): Promise<any>;
    getByTopic(topicId: string): Promise<any[]>;
    getVersionChain(planId: string): Promise<Record<string, unknown>[]>;
    private collectContext;
    private get dimensionsReference();
    private generatePlan;
    private refinePlan;
    private getFallbackPlan;
    supplement(planId: string, requirements?: string, existingCount?: number): Promise<{
        core_questions: any;
    }>;
    private generateSupplementQuestions;
}
