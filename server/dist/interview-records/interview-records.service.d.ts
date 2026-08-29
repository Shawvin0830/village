import { TranscriptOrganizerSkill } from '@/skills/transcript-organizer.skill';
export declare class InterviewRecordsService {
    private readonly organizerSkill;
    constructor(organizerSkill: TranscriptOrganizerSkill);
    uploadAudio(file: Express.Multer.File): Promise<{
        audio_key: string;
    }>;
    transcribe(topicId: string, audioKey: string, subtopicId?: string, intervieweeName?: string): Promise<{
        transcript: string;
        record_id: string | null;
        fragments: import("@/skills/transcript-organizer.skill").StoryFragment[];
        narratives: import("@/skills/transcript-organizer.skill").GuidedNarrative[];
        timeline: import("@/skills/transcript-organizer.skill").TimelineEvent[];
        characters: import("@/skills/transcript-organizer.skill").Character[];
        relationship_map: import("@/skills/transcript-organizer.skill").Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
    transcribeText(topicId: string, text: string, subtopicId?: string, intervieweeName?: string): Promise<{
        transcript: string;
        record_id: string | null;
        fragments: import("@/skills/transcript-organizer.skill").StoryFragment[];
        narratives: import("@/skills/transcript-organizer.skill").GuidedNarrative[];
        timeline: import("@/skills/transcript-organizer.skill").TimelineEvent[];
        characters: import("@/skills/transcript-organizer.skill").Character[];
        relationship_map: import("@/skills/transcript-organizer.skill").Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
    getByTopic(topicId: string): Promise<any[]>;
    getStoryMap(topicId: string): Promise<{
        narratives: import("@/skills/transcript-organizer.skill").GuidedNarrative[];
        characters: import("@/skills/transcript-organizer.skill").Character[];
        timeline: import("@/skills/transcript-organizer.skill").TimelineEvent[];
        relationship_map: import("@/skills/transcript-organizer.skill").Relationship[];
        total_interviews: number;
    }>;
    transcribeTextToArchive(topicId: string, text: string, subtopicId?: string, meta?: {
        title?: string;
        subtitle?: string;
        note?: string;
    }): Promise<{
        analysis: import("@/skills/transcript-organizer.skill").OrganizeResult;
        merged: import("@/skills/transcript-organizer.skill").OrganizeResult;
        html: string;
        url: string | null;
    }>;
    renderTopicArchive(topicId: string, meta?: {
        title?: string;
        subtitle?: string;
        note?: string;
    }): Promise<{
        merged: import("@/skills/transcript-organizer.skill").OrganizeResult;
        html: string;
        url: string | null;
    }>;
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
        fragments: import("@/skills/transcript-organizer.skill").StoryFragment[];
        narratives: import("@/skills/transcript-organizer.skill").GuidedNarrative[];
        timeline: import("@/skills/transcript-organizer.skill").TimelineEvent[];
        characters: import("@/skills/transcript-organizer.skill").Character[];
        relationship_map: import("@/skills/transcript-organizer.skill").Relationship[];
        cross_references: string[];
        next_interview_plan: string[];
    }>;
}
