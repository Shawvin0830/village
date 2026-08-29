import { MaterialsService } from './materials.service';
import { MaterialSearchSkill } from '@/skills/material-search.skill';
import { VillageResearchSkill } from '@/skills/village-research.skill';
import { MaterialEmbeddingSkill } from '@/skills/material-embedding.skill';
export declare class MaterialsController {
    private readonly materialsService;
    private readonly materialSearchSkill;
    private readonly villageResearchSkill;
    private readonly materialEmbeddingSkill;
    constructor(materialsService: MaterialsService, materialSearchSkill: MaterialSearchSkill, villageResearchSkill: VillageResearchSkill, materialEmbeddingSkill: MaterialEmbeddingSkill);
    librarySearch(query: string, source?: string): Promise<{
        code: number;
        msg: string;
        data: {
            topicId: string;
            topicName: string;
            topicDescription: string | null;
            materialCount: number;
        }[];
    }>;
    findTopicsWithMaterials(source?: string): Promise<{
        code: number;
        msg: string;
        data: {
            topicId: string;
            topicName: string;
            topicDescription: string | null;
            materialCount: number;
        }[];
    }>;
    findAll(source?: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    globalSearch(query: string, source?: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    findByTopic(topicId: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    findById(id: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    create(body: {
        topicId: string;
        subtopicId?: string;
        source?: string;
        title: string;
        content: string;
        url?: string;
        structuredData?: Record<string, unknown>;
        tags?: string[];
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    update(id: string, body: {
        title?: string;
        content?: string;
        url?: string;
        structuredData?: Record<string, unknown>;
        tags?: string[];
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    delete(id: string): Promise<{
        code: number;
        msg: string;
        data: {
            success: boolean;
        };
    }>;
    searchMaterials(body: {
        query: string;
        topicName?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: import("@/skills/material-search.skill").SearchResult;
    }>;
    researchTopic(body: {
        topicId: string;
        topicName: string;
        topicDescription?: string;
        subtopics?: string[];
        focusAreas?: string[];
    }): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: import("@/skills/village-research.skill").ResearchDocument;
    }>;
    semanticSearch(topicId: string, query: string, limit?: string): Promise<{
        code: number;
        msg: string;
        data: import("@/skills/material-embedding.skill").SemanticSearchResult[];
    }>;
    getSummary(topicId: string): Promise<{
        code: number;
        msg: string;
        data: {
            summary: string;
        };
    }>;
}
