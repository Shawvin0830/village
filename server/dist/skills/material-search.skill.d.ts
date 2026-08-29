export interface StructuredMaterial {
    title: string;
    content: string;
    source: string;
    url: string;
    tags: string[];
    structuredData: {
        summary: string;
        keyFacts: string[];
        relatedEntities: string[];
        credibility: 'high' | 'medium' | 'low';
    };
}
export interface SearchResult {
    searchSummary: string;
    materials: StructuredMaterial[];
}
export declare class MaterialSearchSkill {
    private readonly logger;
    private getSearchClient;
    private getLLMClient;
    searchAndStructure(query: string, topicName?: string): Promise<SearchResult>;
    private extractJSON;
}
