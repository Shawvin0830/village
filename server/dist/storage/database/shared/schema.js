"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogs = exports.operators = exports.referenceMaterials = exports.topics = exports.authorizationRecords = exports.intervieweeTopicLinks = exports.interviewees = exports.interviewRecords = exports.interviewPlans = exports.healthCheck = exports.subtopics = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.subtopics = (0, pg_core_1.pgTable)("subtopics", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    icon: (0, pg_core_1.varchar)({ length: 10 }).default('📌'),
    transcriptStatus: (0, pg_core_1.varchar)("transcript_status", { length: 20 }).default('not_started').notNull(),
    verifyStatus: (0, pg_core_1.varchar)("verify_status", { length: 20 }).default('not_started').notNull(),
    authLevel: (0, pg_core_1.varchar)("auth_level", { length: 20 }).default('not_set').notNull(),
    summary: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
    (0, pg_core_1.index)("subtopics_auth_level_idx").using("btree", table.authLevel.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("subtopics_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("subtopics_transcript_status_idx").using("btree", table.transcriptStatus.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "subtopics_topic_id_topics_id_fk"
    }).onDelete("cascade"),
]);
exports.healthCheck = (0, pg_core_1.pgTable)("health_check", {
    id: (0, pg_core_1.serial)().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
exports.interviewPlans = (0, pg_core_1.pgTable)("interview_plans", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    contextSummary: (0, pg_core_1.text)("context_summary"),
    adultQuestions: (0, pg_core_1.jsonb)("adult_questions"),
    childQuestions: (0, pg_core_1.jsonb)("child_questions"),
    tips: (0, pg_core_1.jsonb)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("interview_plans_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "interview_plans_topic_id_topics_id_fk"
    }).onDelete("cascade"),
]);
exports.interviewRecords = (0, pg_core_1.pgTable)("interview_records", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    subtopicId: (0, pg_core_1.varchar)("subtopic_id", { length: 36 }),
    audioKey: (0, pg_core_1.text)("audio_key"),
    transcriptText: (0, pg_core_1.text)("transcript_text"),
    dialectOriginal: (0, pg_core_1.text)("dialect_original"),
    mandarinText: (0, pg_core_1.text)("mandarin_text"),
    startTime: (0, pg_core_1.integer)("start_time").default(0),
    endTime: (0, pg_core_1.integer)("end_time").default(0),
    status: (0, pg_core_1.varchar)({ length: 20 }).default('pending').notNull(),
    aiAnalysis: (0, pg_core_1.jsonb)("ai_analysis"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
    (0, pg_core_1.index)("interview_records_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("interview_records_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("interview_records_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "interview_records_topic_id_topics_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.subtopicId],
        foreignColumns: [exports.subtopics.id],
        name: "interview_records_subtopic_id_subtopics_id_fk"
    }).onDelete("set null"),
]);
exports.interviewees = (0, pg_core_1.pgTable)("interviewees", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    name: (0, pg_core_1.varchar)({ length: 100 }).notNull(),
    age: (0, pg_core_1.varchar)({ length: 30 }),
    occupation: (0, pg_core_1.varchar)({ length: 100 }),
    role: (0, pg_core_1.varchar)({ length: 100 }),
    authStatus: (0, pg_core_1.varchar)("auth_status", { length: 30 }).default('unset').notNull(),
    authNote: (0, pg_core_1.text)("auth_note"),
    topicAffiliations: (0, pg_core_1.jsonb)("topic_affiliations").default((0, drizzle_orm_1.sql) `'[]'::jsonb`).notNull(),
    confirmedAt: (0, pg_core_1.timestamp)("confirmed_at", { withTimezone: true, mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
    (0, pg_core_1.index)("interviewees_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("interviewees_auth_status_idx").using("btree", table.authStatus.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "interviewees_topic_id_topics_id_fk"
    }).onDelete("cascade"),
]);
exports.intervieweeTopicLinks = (0, pg_core_1.pgTable)("interviewee_topic_links", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    intervieweeId: (0, pg_core_1.varchar)("interviewee_id", { length: 36 }).notNull(),
    primaryTopic: (0, pg_core_1.varchar)("primary_topic", { length: 100 }).notNull(),
    secondaryTopic: (0, pg_core_1.varchar)("secondary_topic", { length: 100 }).notNull(),
    source: (0, pg_core_1.varchar)({ length: 30 }).default('manual').notNull(),
    confidence: (0, pg_core_1.integer)().default(100).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("interviewee_topic_links_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("interviewee_topic_links_interviewee_id_idx").using("btree", table.intervieweeId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "interviewee_topic_links_topic_id_topics_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.intervieweeId],
        foreignColumns: [exports.interviewees.id],
        name: "interviewee_topic_links_interviewee_id_interviewees_id_fk"
    }).onDelete("cascade"),
]);
exports.authorizationRecords = (0, pg_core_1.pgTable)("authorization_records", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    intervieweeId: (0, pg_core_1.varchar)("interviewee_id", { length: 36 }),
    subtopicId: (0, pg_core_1.varchar)("subtopic_id", { length: 36 }),
    authStatus: (0, pg_core_1.varchar)("auth_status", { length: 30 }).notNull(),
    authPerson: (0, pg_core_1.varchar)("auth_person", { length: 100 }),
    restriction: (0, pg_core_1.text)(),
    topicAffiliations: (0, pg_core_1.jsonb)("topic_affiliations").default((0, drizzle_orm_1.sql) `'[]'::jsonb`).notNull(),
    authorizedAt: (0, pg_core_1.timestamp)("authorized_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    reversible: (0, pg_core_1.boolean)().default(true).notNull(),
    previousStatus: (0, pg_core_1.varchar)("previous_status", { length: 30 }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("authorization_records_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("authorization_records_interviewee_id_idx").using("btree", table.intervieweeId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("authorization_records_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("authorization_records_auth_status_idx").using("btree", table.authStatus.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "authorization_records_topic_id_topics_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.intervieweeId],
        foreignColumns: [exports.interviewees.id],
        name: "authorization_records_interviewee_id_interviewees_id_fk"
    }).onDelete("set null"),
    (0, pg_core_1.foreignKey)({
        columns: [table.subtopicId],
        foreignColumns: [exports.subtopics.id],
        name: "authorization_records_subtopic_id_subtopics_id_fk"
    }).onDelete("cascade"),
]);
exports.topics = (0, pg_core_1.pgTable)("topics", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    description: (0, pg_core_1.text)(),
    status: (0, pg_core_1.varchar)({ length: 20 }).default('active').notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
    (0, pg_core_1.index)("topics_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
    (0, pg_core_1.index)("topics_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);
exports.referenceMaterials = (0, pg_core_1.pgTable)("reference_materials", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    topicId: (0, pg_core_1.varchar)("topic_id", { length: 36 }).notNull(),
    subtopicId: (0, pg_core_1.varchar)("subtopic_id", { length: 36 }),
    source: (0, pg_core_1.varchar)({ length: 20 }).default('manual').notNull(),
    title: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    content: (0, pg_core_1.text)().notNull(),
    structuredData: (0, pg_core_1.jsonb)("structured_data"),
    url: (0, pg_core_1.text)(),
    tags: (0, pg_core_1.jsonb)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
    (0, pg_core_1.index)("reference_materials_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("reference_materials_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.index)("reference_materials_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
    (0, pg_core_1.foreignKey)({
        columns: [table.topicId],
        foreignColumns: [exports.topics.id],
        name: "reference_materials_topic_id_topics_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.subtopicId],
        foreignColumns: [exports.subtopics.id],
        name: "reference_materials_subtopic_id_subtopics_id_fk"
    }).onDelete("set null"),
    (0, pg_core_1.pgPolicy)("reference_materials_delete_all", { as: "permissive", for: "delete", to: ["public"], using: (0, drizzle_orm_1.sql) `true` }),
    (0, pg_core_1.pgPolicy)("reference_materials_update_all", { as: "permissive", for: "update", to: ["public"] }),
    (0, pg_core_1.pgPolicy)("reference_materials_insert_all", { as: "permissive", for: "insert", to: ["public"] }),
    (0, pg_core_1.pgPolicy)("reference_materials_select_all", { as: "permissive", for: "select", to: ["public"] }),
]);
exports.operators = (0, pg_core_1.pgTable)("operators", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    projectId: (0, pg_core_1.varchar)("project_id", { length: 100 }).default("village-memory").notNull(),
    displayName: (0, pg_core_1.varchar)("display_name", { length: 100 }).notNull(),
    role: (0, pg_core_1.varchar)({ length: 20 }).default("viewer").notNull(),
    operatorToken: (0, pg_core_1.varchar)("operator_token", { length: 120 }).notNull(),
    note: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
    lastSeenAt: (0, pg_core_1.timestamp)("last_seen_at", { withTimezone: true, mode: "string" }),
});
exports.activityLogs = (0, pg_core_1.pgTable)("activity_logs", {
    id: (0, pg_core_1.varchar)({ length: 36 }).default((0, drizzle_orm_1.sql) `gen_random_uuid()`).primaryKey().notNull(),
    projectId: (0, pg_core_1.varchar)("project_id", { length: 100 }).default("village-memory").notNull(),
    operatorId: (0, pg_core_1.varchar)("operator_id", { length: 36 }),
    operatorName: (0, pg_core_1.varchar)("operator_name", { length: 100 }),
    actionType: (0, pg_core_1.varchar)("action_type", { length: 60 }).notNull(),
    targetType: (0, pg_core_1.varchar)("target_type", { length: 60 }).notNull(),
    targetId: (0, pg_core_1.varchar)("target_id", { length: 36 }),
    targetName: (0, pg_core_1.varchar)("target_name", { length: 255 }),
    summary: (0, pg_core_1.text)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map