import { MaterialEmbeddingSkill } from '@/skills/material-embedding.skill';
export declare class MaterialsService {
    private readonly embeddingSkill;
    private readonly logger;
    constructor(embeddingSkill: MaterialEmbeddingSkill);
    private get client();
    librarySearch(query: string, source?: string): Promise<{
        topicId: string;
        topicName: string;
        topicDescription: string | null;
        materialCount: number;
    }[]>;
    findTopicsWithMaterials(source?: string): Promise<{
        topicId: string;
        topicName: string;
        topicDescription: string | null;
        materialCount: number;
    }[]>;
    findAll(source?: string): Promise<any[]>;
    globalSearch(query: string, source?: string): Promise<any[]>;
    findByTopic(topicId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    create(data: {
        topicId: string;
        subtopicId?: string;
        source?: string;
        title: string;
        content: string;
        url?: string;
        structuredData?: Record<string, unknown>;
        tags?: string[];
    }): Promise<any>;
    update(id: string, data: {
        title?: string;
        content?: string;
        url?: string;
        structuredData?: Record<string, unknown>;
        tags?: string[];
    }): Promise<any>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    getMaterialsSummary(topicId: string): Promise<string>;
}
