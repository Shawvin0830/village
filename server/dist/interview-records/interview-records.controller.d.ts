import { InterviewRecordsService } from './interview-records.service';
export declare class InterviewRecordsController {
    private readonly recordsService;
    constructor(recordsService: InterviewRecordsService);
    uploadAudio(file: Express.Multer.File): Promise<{
        code: number;
        msg: string;
        data: {
            audio_key: string;
        };
    }>;
    transcribe(body: {
        topic_id: string;
        subtopic_id?: string;
        audio_key: string;
        interviewee_name?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            transcript: string;
            record_id: string | null;
            fragments: import("../skills/transcript-organizer.skill").StoryFragment[];
            narratives: import("../skills/transcript-organizer.skill").GuidedNarrative[];
            timeline: import("../skills/transcript-organizer.skill").TimelineEvent[];
            characters: import("../skills/transcript-organizer.skill").Character[];
            relationship_map: import("../skills/transcript-organizer.skill").Relationship[];
            cross_references: string[];
            next_interview_plan: string[];
        };
    }>;
    transcribeText(body: {
        topic_id: string;
        subtopic_id?: string;
        text: string;
        interviewee_name?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            transcript: string;
            record_id: string | null;
            fragments: import("../skills/transcript-organizer.skill").StoryFragment[];
            narratives: import("../skills/transcript-organizer.skill").GuidedNarrative[];
            timeline: import("../skills/transcript-organizer.skill").TimelineEvent[];
            characters: import("../skills/transcript-organizer.skill").Character[];
            relationship_map: import("../skills/transcript-organizer.skill").Relationship[];
            cross_references: string[];
            next_interview_plan: string[];
        };
    }>;
    getByTopic(topicId: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    getStoryMap(topicId: string): Promise<{
        code: number;
        msg: string;
        data: {
            narratives: import("../skills/transcript-organizer.skill").GuidedNarrative[];
            characters: import("../skills/transcript-organizer.skill").Character[];
            timeline: import("../skills/transcript-organizer.skill").TimelineEvent[];
            relationship_map: import("../skills/transcript-organizer.skill").Relationship[];
            total_interviews: number;
        };
    }>;
    transcribeTextToArchive(body: {
        topic_id: string;
        subtopic_id?: string;
        text: string;
        meta?: {
            title?: string;
            subtitle?: string;
            note?: string;
        };
    }): Promise<{
        code: number;
        msg: string;
        data: {
            analysis: import("../skills/transcript-organizer.skill").OrganizeResult;
            merged: import("../skills/transcript-organizer.skill").OrganizeResult;
            html: string;
            url: string | null;
        };
    }>;
    renderTopicArchive(topicId: string, body: {
        meta?: {
            title?: string;
            subtitle?: string;
            note?: string;
        };
    }): Promise<{
        code: number;
        msg: string;
        data: {
            merged: import("../skills/transcript-organizer.skill").OrganizeResult;
            html: string;
            url: string | null;
        };
    }>;
    confirmRecord(recordId: string, body: {
        edited_text?: string;
        subtopic_id?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            record: any;
            material: any;
        };
    }>;
    rejectRecord(recordId: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    uploadDocument(file: Express.Multer.File, body: {
        topic_id: string;
        subtopic_id?: string;
        interviewee_name?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            document_key: string;
            document_name: string;
            transcript: string;
            record_id: string | null;
            fragments: import("../skills/transcript-organizer.skill").StoryFragment[];
            narratives: import("../skills/transcript-organizer.skill").GuidedNarrative[];
            timeline: import("../skills/transcript-organizer.skill").TimelineEvent[];
            characters: import("../skills/transcript-organizer.skill").Character[];
            relationship_map: import("../skills/transcript-organizer.skill").Relationship[];
            cross_references: string[];
            next_interview_plan: string[];
        };
    }>;
}
