"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewRecordsService = void 0;
const common_1 = require("@nestjs/common");
const transcript_organizer_skill_1 = require("../skills/transcript-organizer.skill");
let InterviewRecordsService = class InterviewRecordsService {
    constructor(organizerSkill) {
        this.organizerSkill = organizerSkill;
    }
    async uploadAudio(file) {
        return this.organizerSkill.uploadAudio(file);
    }
    async transcribe(topicId, audioKey, subtopicId, intervieweeName) {
        return this.organizerSkill.transcribe(topicId, audioKey, subtopicId, intervieweeName);
    }
    async transcribeText(topicId, text, subtopicId, intervieweeName) {
        return this.organizerSkill.transcribeText(topicId, text, subtopicId, intervieweeName);
    }
    async getByTopic(topicId) {
        return this.organizerSkill.getByTopic(topicId);
    }
    async getStoryMap(topicId) {
        return this.organizerSkill.getStoryMap(topicId);
    }
    async transcribeTextToArchive(topicId, text, subtopicId, meta) {
        return this.organizerSkill.transcribeTextToArchive(topicId, text, subtopicId, meta);
    }
    async renderTopicArchive(topicId, meta) {
        return this.organizerSkill.renderTopicArchive(topicId, meta);
    }
    async confirmRecord(recordId, editedText, subtopicId) {
        return this.organizerSkill.confirmRecord(recordId, editedText, subtopicId);
    }
    async rejectRecord(recordId) {
        return this.organizerSkill.rejectRecord(recordId);
    }
    async uploadAndParseDocument(file, topicId, subtopicId, intervieweeName) {
        return this.organizerSkill.uploadAndParseDocument(file, topicId, subtopicId, intervieweeName);
    }
};
exports.InterviewRecordsService = InterviewRecordsService;
exports.InterviewRecordsService = InterviewRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [transcript_organizer_skill_1.TranscriptOrganizerSkill])
], InterviewRecordsService);
//# sourceMappingURL=interview-records.service.js.map