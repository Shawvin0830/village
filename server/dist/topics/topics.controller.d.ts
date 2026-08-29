import { TopicsService } from './topics.service';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    getDashboard(): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    findAll(): Promise<{
        code: number;
        msg: string;
        data: {
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
        }[];
    }>;
    findOne(id: string): Promise<{
        code: number;
        msg: string;
        data: {
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
    }>;
    create(body: {
        name: string;
        description?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    deleteTopic(id: string): Promise<{
        code: number;
        msg: string;
        data: {
            success: boolean;
        };
    }>;
    getSubtopics(id: string): Promise<{
        code: number;
        msg: string;
        data: {
            id: any;
            name: any;
            icon: any;
            transcript_status: any;
            verify_status: any;
            auth_level: any;
            summary: any;
        }[];
    }>;
    createSubtopic(id: string, body: {
        name: string;
        icon?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getSubtopicMaterials(id: string, subId: string): Promise<{
        code: number;
        msg: string;
        data: {
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
                    topic_affiliations: {
                        primary: string;
                        secondary: string;
                    }[];
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
        };
    }>;
    updateAuth(id: string, subId: string, body: {
        auth_level: string;
        auth_person?: string;
        restriction?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    updateIntervieweeAuthorization(id: string, intervieweeId: string, body: {
        name?: string;
        age?: string;
        occupation?: string;
        role?: string;
        auth_status: string;
        auth_note?: string;
        topic_affiliations?: Array<{
            primary: string;
            secondary: string;
        }>;
    }): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    deleteSubtopic(id: string, subId: string): Promise<{
        code: number;
        msg: string;
        data: {
            success: boolean;
        };
    }>;
    getQuotes(id: string, subId: string): Promise<{
        code: number;
        msg: string;
        data: {
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
        }[];
    }>;
    createQuote(id: string, subId: string, body: {
        interviewee_name: string;
        age?: string | null;
        occupation?: string | null;
        role?: string | null;
        quote?: string | null;
        full_interview: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    updateQuote(id: string, subId: string, quoteId: string, body: {
        interviewee_name?: string;
        age?: string | null;
        occupation?: string | null;
        role?: string | null;
        quote?: string | null;
        full_interview?: string;
    }): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    deleteQuote(id: string, subId: string, quoteId: string): Promise<{
        code: number;
        msg: string;
        data: {
            success: boolean;
        };
    }>;
    getAuthList(id: string): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    getAuthOverview(id: string): Promise<{
        code: number;
        msg: string;
        data: {
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
        };
    }>;
    archiveTopic(id: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
}
