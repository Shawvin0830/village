import { relations } from "drizzle-orm/relations";
import { topics, subtopics, interviewPlans, interviewRecords, referenceMaterials } from "./schema";

export const subtopicsRelations = relations(subtopics, ({one, many}) => ({
	topic: one(topics, {
		fields: [subtopics.topicId],
		references: [topics.id]
	}),
	interviewRecords: many(interviewRecords),
	referenceMaterials: many(referenceMaterials),
}));

export const topicsRelations = relations(topics, ({many}) => ({
	subtopics: many(subtopics),
	interviewPlans: many(interviewPlans),
	interviewRecords: many(interviewRecords),
	referenceMaterials: many(referenceMaterials),
}));

export const interviewPlansRelations = relations(interviewPlans, ({one}) => ({
	topic: one(topics, {
		fields: [interviewPlans.topicId],
		references: [topics.id]
	}),
}));

export const interviewRecordsRelations = relations(interviewRecords, ({one}) => ({
	topic: one(topics, {
		fields: [interviewRecords.topicId],
		references: [topics.id]
	}),
	subtopic: one(subtopics, {
		fields: [interviewRecords.subtopicId],
		references: [subtopics.id]
	}),
}));

export const referenceMaterialsRelations = relations(referenceMaterials, ({one}) => ({
	topic: one(topics, {
		fields: [referenceMaterials.topicId],
		references: [topics.id]
	}),
	subtopic: one(subtopics, {
		fields: [referenceMaterials.subtopicId],
		references: [subtopics.id]
	}),
}));