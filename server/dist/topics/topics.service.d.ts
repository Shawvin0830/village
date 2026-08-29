import { AuthorizationManagerSkill } from '@/skills/authorization-manager.skill';
type TopicAffiliation = {
    primary: string;
    secondary: string;
};
export declare class TopicsService {
    private readonly authSkill;
    private get client();
    constructor(authSkill: AuthorizationManagerSkill);
    findAll(): Promise<{
        subtopic_count: number;
        has_interview_plan: boolean | null;
        authorized_count: number;
        interview_count: number;
        organized_count: number;
        reference_count: number;
        id: any;
        name: any;
        description: any;
        status: any;
        created_at: any;
    }[]>;
    findOne(id: string): Promise<{
        subtopics: {
            id: any;
            name: any;
            icon: any;
            transcript_status: any;
            verify_status: any;
            auth_level: any;
            summary: any;
        }[];
        id: any;
        name: any;
        description: any;
        status: any;
        created_at: any;
    }>;
    create(name: string, description?: string): Promise<any>;
    deleteTopic(id: string): Promise<{
        success: boolean;
    }>;
    getSubtopics(topicId: string): Promise<{
        id: any;
        name: any;
        icon: any;
        transcript_status: any;
        verify_status: any;
        auth_level: any;
        summary: any;
    }[]>;
    createSubtopic(topicId: string, name: string, icon?: string): Promise<any>;
    getSubtopicMaterials(topicId: string, subtopicId: string): Promise<{
        topic_id: any;
        topic_name: any;
        subtopic: {
            id: any;
            name: any;
            icon: any;
            summary: any;
            transcript_status: any;
            verify_status: any;
        };
        essence_summary: string;
        quotes: {
            id: string;
            quote: string;
            summary: string;
            full_interview: string;
            created_at: string | null;
            interviewee: {
                id: {};
                name: string;
                age: {} | null;
                occupation: {} | null;
                role: {} | null;
                auth_status: {};
                auth_note: {} | null;
                topic_affiliations: TopicAffiliation[];
                confirmed_at: {} | null;
            };
        }[];
        references: {
            id: any;
            title: any;
            source: any;
            url: any;
            tags: any;
            summary: string;
            content: any;
            created_at: any;
        }[];
    }>;
    private buildEssenceSummary;
    deleteSubtopic(topicId: string, subtopicId: string): Promise<{
        success: boolean;
    }>;
    updateSubtopicAuth(topicId: string, subtopicId: string, authLevel: string, authPerson?: string, restriction?: string): Promise<{
        id: string;
        name: string;
        age: string | null;
        occupation: string | null;
        role: string | null;
        auth_status: string;
        auth_status_label: "未设置" | "同意" | "不同意";
        auth_note: string | null;
        topic_affiliations: {
            primary: string;
            secondary: string;
        }[];
        previous_status: string;
        changed: boolean;
        confirmed_at: string;
        next_interviewee_id: any;
    }>;
    updateIntervieweeAuthorization(topicId: string, intervieweeId: string, payload: {
        name?: string;
        age?: string;
        occupation?: string;
        role?: string;
        authStatus: string;
        authNote?: string;
        topicAffiliations?: Array<{
            primary: string;
            secondary: string;
        }>;
    }): Promise<{
        id: string;
        name: string;
        age: string | null;
        occupation: string | null;
        role: string | null;
        auth_status: string;
        auth_status_label: "未设置" | "同意" | "不同意";
        auth_note: string | null;
        topic_affiliations: {
            primary: string;
            secondary: string;
        }[];
        previous_status: string;
        changed: boolean;
        confirmed_at: string;
        next_interviewee_id: any;
    }>;
    getAuthList(topicId: string): Promise<{
        topic_id: any;
        topic_name: any;
        stats: {
            total: number;
            unset: number;
            agreed: number;
            declined: number;
            tagged: number;
        };
        interviewees: {
            id: string;
            name: string;
            age: string | null;
            occupation: string | null;
            role: string | null;
            auth_status: string;
            auth_status_label: string;
            auth_note: string | null;
            topic_affiliations: {
                primary: string;
                secondary: string;
            }[];
            suggested_affiliations: {
                primary: string;
                secondary: string;
            }[];
            interview_packages: {
                id: string;
                title: string;
                summary: string;
                created_at: string | null;
            }[];
            source_count: number;
            source_summary: string;
            confirmed_at: string | null;
            is_temporary: boolean;
        }[];
        taxonomy: {
            code: string;
            primary: string;
            secondary: string[];
        }[];
        auth_statuses: {
            readonly unset: "未设置";
            readonly agreed: "同意";
            readonly declined: "不同意";
        };
        reminder: string;
    }>;
    getAuthOverview(topicId: string): Promise<{
        topic_id: any;
        topic_name: any;
        stats: {
            total: number;
            unset: number;
            agreed: number;
            declined: number;
            tagged: number;
        };
        people: {
            id: string;
            name: string;
            age: string | null;
            occupation: string | null;
            role: string | null;
            auth_status: string;
            auth_status_label: string;
            auth_note: string | null;
            topic_affiliations: {
                primary: string;
                secondary: string;
            }[];
            confirmed_at: string | null;
        }[];
        agreed_count: number;
        declined_count: number;
        unset_count: number;
        tagged_count: number;
    }>;
    getDashboard(): Promise<{
        topic: null;
        nextSteps: never[];
    } | {
        topic: {
            subtopics: {
                id: any;
                name: any;
                icon: any;
                transcript_status: any;
                verify_status: any;
                auth_level: any;
                summary: any;
            }[];
            id: any;
            name: any;
            description: any;
            status: any;
            created_at: any;
        };
        nextSteps: string[];
    }>;
    getQuotes(topicId: string, subtopicId: string): Promise<{
        id: string;
        quote: string;
        summary: string;
        full_interview: string;
        created_at: string | null;
        interviewee: {
            id: {};
            name: string;
            age: {} | null;
            occupation: {} | null;
            role: {} | null;
        };
    }[]>;
    createQuote(topicId: string, subtopicId: string, body: {
        interviewee_name: string;
        age?: string | null;
        occupation?: string | null;
        role?: string | null;
        quote?: string | null;
        full_interview: string;
    }): Promise<{
        id: any;
        quote: string;
        full_interview: string;
        created_at: any;
        interviewee: {
            id: string | null;
            name: string;
            age: string | null;
            occupation: string | null;
            role: string | null;
        };
    }>;
    updateQuote(topicId: string, subtopicId: string, quoteId: string, body: {
        interviewee_name?: string;
        age?: string | null;
        occupation?: string | null;
        role?: string | null;
        quote?: string | null;
        full_interview?: string;
    }): Promise<{
        id: any;
        quote: string;
        full_interview: any;
        created_at: any;
        interviewee: {
            name: string;
            age: string | null;
            occupation: string | null;
            role: string | null;
        };
    }>;
    deleteQuote(topicId: string, subtopicId: string, quoteId: string): Promise<{
        success: boolean;
    }>;
    archiveTopic(topicId: string): Promise<any>;
}
export {};
