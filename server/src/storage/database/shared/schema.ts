import { pgTable, index, foreignKey, varchar, timestamp, text, serial, jsonb, integer, boolean, pgPolicy } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const subtopics = pgTable("subtopics", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 10 }).default('📌'),
	transcriptStatus: varchar("transcript_status", { length: 20 }).default('not_started').notNull(),
	verifyStatus: varchar("verify_status", { length: 20 }).default('not_started').notNull(),
	authLevel: varchar("auth_level", { length: 20 }).default('not_set').notNull(),
	summary: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("subtopics_auth_level_idx").using("btree", table.authLevel.asc().nullsLast().op("text_ops")),
	index("subtopics_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	index("subtopics_transcript_status_idx").using("btree", table.transcriptStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "subtopics_topic_id_topics_id_fk"
		}).onDelete("cascade"),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const interviewPlans = pgTable("interview_plans", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	contextSummary: text("context_summary"),
	adultQuestions: jsonb("adult_questions"),
	childQuestions: jsonb("child_questions"),
	tips: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("interview_plans_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "interview_plans_topic_id_topics_id_fk"
		}).onDelete("cascade"),
]);

export const interviewRecords = pgTable("interview_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	subtopicId: varchar("subtopic_id", { length: 36 }),
	audioKey: text("audio_key"),
	transcriptText: text("transcript_text"),
	dialectOriginal: text("dialect_original"),
	mandarinText: text("mandarin_text"),
	startTime: integer("start_time").default(0),
	endTime: integer("end_time").default(0),
	status: varchar({ length: 20 }).default('pending').notNull(),
	aiAnalysis: jsonb("ai_analysis"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("interview_records_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("interview_records_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
	index("interview_records_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "interview_records_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.id],
			name: "interview_records_subtopic_id_subtopics_id_fk"
		}).onDelete("set null"),
]);

export const interviewees = pgTable("interviewees", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	age: varchar({ length: 30 }),
	occupation: varchar({ length: 100 }),
	role: varchar({ length: 100 }),
	authStatus: varchar("auth_status", { length: 30 }).default('pending').notNull(),
	authMethod: varchar("auth_method", { length: 50 }),
	authNote: text("auth_note"),
	topicAffiliations: jsonb("topic_affiliations").default(sql`'[]'::jsonb`).notNull(),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("interviewees_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	index("interviewees_auth_status_idx").using("btree", table.authStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "interviewees_topic_id_topics_id_fk"
		}).onDelete("cascade"),
]);

export const intervieweeTopicLinks = pgTable("interviewee_topic_links", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	intervieweeId: varchar("interviewee_id", { length: 36 }).notNull(),
	primaryTopic: varchar("primary_topic", { length: 100 }).notNull(),
	secondaryTopic: varchar("secondary_topic", { length: 100 }).notNull(),
	source: varchar({ length: 30 }).default('manual').notNull(),
	confidence: integer().default(100).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("interviewee_topic_links_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	index("interviewee_topic_links_interviewee_id_idx").using("btree", table.intervieweeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "interviewee_topic_links_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.intervieweeId],
			foreignColumns: [interviewees.id],
			name: "interviewee_topic_links_interviewee_id_interviewees_id_fk"
		}).onDelete("cascade"),
]);

export const authorizationRecords = pgTable("authorization_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	intervieweeId: varchar("interviewee_id", { length: 36 }),
	subtopicId: varchar("subtopic_id", { length: 36 }),
	authStatus: varchar("auth_status", { length: 30 }).notNull(),
	authMethod: varchar("auth_method", { length: 50 }),
	authPerson: varchar("auth_person", { length: 100 }),
	restriction: text(),
	topicAffiliations: jsonb("topic_affiliations").default(sql`'[]'::jsonb`).notNull(),
	authorizedAt: timestamp("authorized_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	reversible: boolean().default(true).notNull(),
	previousStatus: varchar("previous_status", { length: 30 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("authorization_records_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	index("authorization_records_interviewee_id_idx").using("btree", table.intervieweeId.asc().nullsLast().op("text_ops")),
	index("authorization_records_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
	index("authorization_records_auth_status_idx").using("btree", table.authStatus.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "authorization_records_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.intervieweeId],
			foreignColumns: [interviewees.id],
			name: "authorization_records_interviewee_id_interviewees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.id],
			name: "authorization_records_subtopic_id_subtopics_id_fk"
		}).onDelete("cascade"),
]);

export const topics = pgTable("topics", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("topics_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("topics_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const referenceMaterials = pgTable("reference_materials", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	topicId: varchar("topic_id", { length: 36 }).notNull(),
	subtopicId: varchar("subtopic_id", { length: 36 }),
	source: varchar({ length: 20 }).default('manual').notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	structuredData: jsonb("structured_data"),
	url: text(),
	tags: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("reference_materials_source_idx").using("btree", table.source.asc().nullsLast().op("text_ops")),
	index("reference_materials_subtopic_id_idx").using("btree", table.subtopicId.asc().nullsLast().op("text_ops")),
	index("reference_materials_topic_id_idx").using("btree", table.topicId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "reference_materials_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.id],
			name: "reference_materials_subtopic_id_subtopics_id_fk"
		}).onDelete("set null"),
	pgPolicy("reference_materials_delete_all", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("reference_materials_update_all", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("reference_materials_insert_all", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("reference_materials_select_all", { as: "permissive", for: "select", to: ["public"] }),
]);
