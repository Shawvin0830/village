export interface SemanticSearchResult {
    id: string;
    title: string;
    content: string;
    source: string;
    tags: string[] | null;
    score: number;
    created_at: string;
}
export declare class MaterialEmbeddingSkill {
    private readonly logger;
    private get client();
    private getEmbeddingClient;
    generateEmbedding(text: string): Promise<number[] | null>;
    embedMaterial(materialId: string): Promise<void>;
    semanticSearch(topicId: string, query: string, topK?: number): Promise<SemanticSearchResult[]>;
    private cosineSimilarity;
}
