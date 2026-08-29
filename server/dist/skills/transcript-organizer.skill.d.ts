export type StoryCategory = 'building_history' | 'craft_culture' | 'iconography' | 'biography' | 'folk_custom' | 'village_change';
export interface StoryFragment {
    story_thread_id: string | null;
    story_thread_name: string;
    category: StoryCategory;
    icon: string;
    dialect_original: string;
    mandarin_text: string;
    summary: string;
    flags: string[];
    time_range?: string;
}
export interface GuidedNarrative {
    story_thread_name: string;
    category: StoryCategory;
    narrative: string;
    key_quote: string;
    visitor_hook: string;
    completeness: number;
    missing_pieces: string[];
}
export interface TimelineEvent {
    period: string;
    events: string[];
    related_people: string[];
    source_fragments: number[];
    confidence: '确定' | '待核实' | '推测';
}
export interface Character {
    name: string;
    aliases: string[];
    tags: string[];
    story: string;
    key_quotes: string[];
    related_story_threads: string[];
    mention_count: number;
    verify_flags: string[];
}
export interface Relationship {
    from: string;
    to: string;
    type: string;
    detail: string;
    source_fragment: number;
}
export interface OrganizeResult {
    fragments: StoryFragment[];
    narratives: GuidedNarrative[];
    timeline: TimelineEvent[];
    characters: Character[];
    relationship_map: Relationship[];
    cross_references: string[];
    next_interview_plan: string[];
}
export declare class TranscriptOrganizerSkill {
    private readonly SINGLE_CALL_LIMIT;
    private get client();
    private getASRClient;
    private getLLMClient;
    private getStorage;
    uploadAudio(file: Express.Multer.File): Promise<{
        audio_key: string;
    }>;
    transcribe(topicId: string, audioKey: string, subtopicId?: string, intervieweeName?: string): Promise<{
        transcript: string;
        record_id: string | null;
        fragments: StoryFragment[];
        narratives: GuidedNarrative[];
        timeline: TimelineEvent[];
        characters: Character[];
        relationship_map: Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
    transcribeText(topicId: string, text: string, subtopicId?: string, intervieweeName?: string): Promise<{
        transcript: string;
        record_id: string | null;
        fragments: StoryFragment[];
        narratives: GuidedNarrative[];
        timeline: TimelineEvent[];
        characters: Character[];
        relationship_map: Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
    getStoryMap(topicId: string): Promise<{
        narratives: GuidedNarrative[];
        characters: Character[];
        timeline: TimelineEvent[];
        relationship_map: Relationship[];
        total_interviews: number;
    }>;
    getByTopic(topicId: string): Promise<any[]>;
    confirmRecord(recordId: string, editedText?: string, subtopicId?: string): Promise<{
        record: any;
        material: any;
    }>;
    rejectRecord(recordId: string): Promise<any>;
    uploadAndParseDocument(file: Express.Multer.File, topicId: string, subtopicId?: string, intervieweeName?: string): Promise<{
        document_key: string;
        document_name: string;
        transcript: string;
        record_id: string | null;
        fragments: StoryFragment[];
        narratives: GuidedNarrative[];
        timeline: TimelineEvent[];
        characters: Character[];
        relationship_map: Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
    private getMimeType;
    private saveRecordAndUpdateStoryThreads;
    private formatResult;
    private organizeTranscript;
    private parseLLMResponse;
    private salvageJson;
    private fallbackResult;
    private deduplicateTimeline;
    private deduplicateRelationships;
    private splitIntoChunks;
    private mergeChunkResults;
    private renderStoryArchiveHtml;
    private aggregateTopic;
    private uploadHtml;
    transcribeTextToArchive(topicId: string, text: string, subtopicId?: string, meta?: {
        title?: string;
        subtitle?: string;
        note?: string;
    }): Promise<{
        analysis: OrganizeResult;
        merged: OrganizeResult;
        html: string;
        url: string | null;
    }>;
    renderTopicArchive(topicId: string, meta?: {
        title?: string;
        subtitle?: string;
        note?: string;
    }): Promise<{
        merged: OrganizeResult;
        html: string;
        url: string | null;
    }>;
    renderArchiveFromResult(result: OrganizeResult, meta?: {
        title?: string;
        subtitle?: string;
        note?: string;
    }): string;
}
