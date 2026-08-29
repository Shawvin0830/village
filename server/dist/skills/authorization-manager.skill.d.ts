type TopicAffiliation = {
    primary: string;
    secondary: string;
};
type InterviewPackage = {
    id: string;
    title: string;
    summary: string;
    created_at: string | null;
};
type IntervieweeCard = {
    id: string;
    name: string;
    age: string | null;
    occupation: string | null;
    role: string | null;
    auth_status: string;
    auth_status_label: string;
    auth_note: string | null;
    topic_affiliations: TopicAffiliation[];
    suggested_affiliations: TopicAffiliation[];
    interview_packages: InterviewPackage[];
    source_count: number;
    source_summary: string;
    confirmed_at: string | null;
    is_temporary: boolean;
};
export declare class AuthorizationManagerSkill {
    private get client();
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
        interviewees: IntervieweeCard[];
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
    updateIntervieweeAuthorization(topicId: string, intervieweeId: string, payload: {
        name?: string;
        age?: string;
        occupation?: string;
        role?: string;
        authStatus: string;
        authNote?: string;
        topicAffiliations?: TopicAffiliation[];
    }): Promise<{
        id: string;
        name: string;
        age: string | null;
        occupation: string | null;
        role: string | null;
        auth_status: string;
        auth_status_label: "未设置" | "同意" | "不同意";
        auth_note: string | null;
        topic_affiliations: TopicAffiliation[];
        previous_status: string;
        changed: boolean;
        confirmed_at: string;
        next_interviewee_id: any;
    }>;
    updateAuth(topicId: string, subtopicId: string, _authLevel: string, authPerson?: string, restriction?: string): Promise<{
        id: string;
        name: string;
        age: string | null;
        occupation: string | null;
        role: string | null;
        auth_status: string;
        auth_status_label: "未设置" | "同意" | "不同意";
        auth_note: string | null;
        topic_affiliations: TopicAffiliation[];
        previous_status: string;
        changed: boolean;
        confirmed_at: string;
        next_interviewee_id: any;
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
            topic_affiliations: TopicAffiliation[];
            confirmed_at: string | null;
        }[];
        agreed_count: number;
        declined_count: number;
        unset_count: number;
        tagged_count: number;
    }>;
    private getSavedInterviewees;
    private getInferredInterviewees;
    private replaceTopicLinks;
    private writeAuthorizationHistory;
    private getNextUnsetInterviewee;
    getLegacyAuthLevel(status: string): "village" | "archive" | "not_set";
}
export {};
