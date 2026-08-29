export interface ResearchDocument {
    title: string;
    content: string;
    references: Array<{
        title: string;
        source: string;
        url: string;
        snippet: string;
    }>;
    dimensions: string[];
    queries: string[];
}
interface ResearchParams {
    topicName: string;
    topicDescription?: string;
    subtopics?: string[];
    focusAreas?: string[];
}
export declare class VillageResearchSkill {
    private readonly logger;
    private getSearchClient;
    private getLLMClient;
    conductResearch(params: ResearchParams): Promise<ResearchDocument>;
    private generateQueries;
    private synthesizeDocument;
    private getDimensionLabels;
}
export {};
