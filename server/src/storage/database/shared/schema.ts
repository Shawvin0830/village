import { pgTable, serial, timestamp, varchar, text, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 话题表
export const topics = pgTable(
	"topics",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("topics_status_idx").on(table.status),
		index("topics_created_at_idx").on(table.created_at),
	]
);

// 子话题表
export const subtopics = pgTable(
	"subtopics",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		topic_id: varchar("topic_id", { length: 36 }).notNull().references(() => topics.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		icon: varchar("icon", { length: 10 }).default("📌"),
		transcript_status: varchar("transcript_status", { length: 20 }).notNull().default("not_started"),
		verify_status: varchar("verify_status", { length: 20 }).notNull().default("not_started"),
		auth_level: varchar("auth_level", { length: 20 }).notNull().default("not_set"),
		auth_method: varchar("auth_method", { length: 50 }),
		auth_person: varchar("auth_person", { length: 100 }),
		auth_time: timestamp("auth_time", { withTimezone: true }),
		summary: text("summary"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("subtopics_topic_id_idx").on(table.topic_id),
		index("subtopics_transcript_status_idx").on(table.transcript_status),
		index("subtopics_auth_level_idx").on(table.auth_level),
	]
);

// 采访记录表
export const interview_records = pgTable(
	"interview_records",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		topic_id: varchar("topic_id", { length: 36 }).notNull().references(() => topics.id, { onDelete: "cascade" }),
		subtopic_id: varchar("subtopic_id", { length: 36 }).references(() => subtopics.id, { onDelete: "set null" }),
		audio_key: text("audio_key"),
		transcript_text: text("transcript_text"),
		dialect_original: text("dialect_original"),
		mandarin_text: text("mandarin_text"),
		start_time: integer("start_time").default(0),
		end_time: integer("end_time").default(0),
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		ai_analysis: jsonb("ai_analysis"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("interview_records_topic_id_idx").on(table.topic_id),
		index("interview_records_subtopic_id_idx").on(table.subtopic_id),
		index("interview_records_status_idx").on(table.status),
	]
);

// 采访策划表
export const interview_plans = pgTable(
	"interview_plans",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		topic_id: varchar("topic_id", { length: 36 }).notNull().references(() => topics.id, { onDelete: "cascade" }),
		context_summary: text("context_summary"),
		adult_questions: jsonb("adult_questions"),
		child_questions: jsonb("child_questions"),
		tips: jsonb("tips"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("interview_plans_topic_id_idx").on(table.topic_id),
	]
);

// 参考资料表（用户手动输入 + AI联网搜索）
export const reference_materials = pgTable(
	"reference_materials",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		topic_id: varchar("topic_id", { length: 36 }).notNull().references(() => topics.id, { onDelete: "cascade" }),
		subtopic_id: varchar("subtopic_id", { length: 36 }).references(() => subtopics.id, { onDelete: "set null" }),
		source: varchar("source", { length: 20 }).notNull().default("manual"), // manual | web_search | library
		title: varchar("title", { length: 255 }).notNull(),
		content: text("content").notNull(),
		structured_data: jsonb("structured_data"), // AI 结构化后的数据
		url: text("url"), // 来源链接（web_search 时记录）
		tags: jsonb("tags"), // 标签，用于分类
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("reference_materials_topic_id_idx").on(table.topic_id),
		index("reference_materials_subtopic_id_idx").on(table.subtopic_id),
		index("reference_materials_source_idx").on(table.source),
	]
);
