export declare const subtopicsRelations: import("drizzle-orm/relations").Relations<"subtopics", {
    topic: import("drizzle-orm/relations").One<"topics", true>;
    interviewRecords: import("drizzle-orm/relations").Many<"interview_records">;
    referenceMaterials: import("drizzle-orm/relations").Many<"reference_materials">;
}>;
export declare const topicsRelations: import("drizzle-orm/relations").Relations<"topics", {
    subtopics: import("drizzle-orm/relations").Many<"subtopics">;
    interviewPlans: import("drizzle-orm/relations").Many<"interview_plans">;
    interviewRecords: import("drizzle-orm/relations").Many<"interview_records">;
    referenceMaterials: import("drizzle-orm/relations").Many<"reference_materials">;
}>;
export declare const interviewPlansRelations: import("drizzle-orm/relations").Relations<"interview_plans", {
    topic: import("drizzle-orm/relations").One<"topics", true>;
}>;
export declare const interviewRecordsRelations: import("drizzle-orm/relations").Relations<"interview_records", {
    topic: import("drizzle-orm/relations").One<"topics", true>;
    subtopic: import("drizzle-orm/relations").One<"subtopics", false>;
}>;
export declare const referenceMaterialsRelations: import("drizzle-orm/relations").Relations<"reference_materials", {
    topic: import("drizzle-orm/relations").One<"topics", true>;
    subtopic: import("drizzle-orm/relations").One<"subtopics", false>;
}>;
