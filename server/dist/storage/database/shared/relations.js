"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceMaterialsRelations = exports.interviewRecordsRelations = exports.interviewPlansRelations = exports.topicsRelations = exports.subtopicsRelations = void 0;
const relations_1 = require("drizzle-orm/relations");
const schema_1 = require("./schema");
exports.subtopicsRelations = (0, relations_1.relations)(schema_1.subtopics, ({ one, many }) => ({
    topic: one(schema_1.topics, {
        fields: [schema_1.subtopics.topicId],
        references: [schema_1.topics.id]
    }),
    interviewRecords: many(schema_1.interviewRecords),
    referenceMaterials: many(schema_1.referenceMaterials),
}));
exports.topicsRelations = (0, relations_1.relations)(schema_1.topics, ({ many }) => ({
    subtopics: many(schema_1.subtopics),
    interviewPlans: many(schema_1.interviewPlans),
    interviewRecords: many(schema_1.interviewRecords),
    referenceMaterials: many(schema_1.referenceMaterials),
}));
exports.interviewPlansRelations = (0, relations_1.relations)(schema_1.interviewPlans, ({ one }) => ({
    topic: one(schema_1.topics, {
        fields: [schema_1.interviewPlans.topicId],
        references: [schema_1.topics.id]
    }),
}));
exports.interviewRecordsRelations = (0, relations_1.relations)(schema_1.interviewRecords, ({ one }) => ({
    topic: one(schema_1.topics, {
        fields: [schema_1.interviewRecords.topicId],
        references: [schema_1.topics.id]
    }),
    subtopic: one(schema_1.subtopics, {
        fields: [schema_1.interviewRecords.subtopicId],
        references: [schema_1.subtopics.id]
    }),
}));
exports.referenceMaterialsRelations = (0, relations_1.relations)(schema_1.referenceMaterials, ({ one }) => ({
    topic: one(schema_1.topics, {
        fields: [schema_1.referenceMaterials.topicId],
        references: [schema_1.topics.id]
    }),
    subtopic: one(schema_1.subtopics, {
        fields: [schema_1.referenceMaterials.subtopicId],
        references: [schema_1.subtopics.id]
    }),
}));
//# sourceMappingURL=relations.js.map