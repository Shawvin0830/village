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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewRecordsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const interview_records_service_1 = require("./interview-records.service");
let InterviewRecordsController = class InterviewRecordsController {
    constructor(recordsService) {
        this.recordsService = recordsService;
    }
    async uploadAudio(file) {
        console.log('收到音频文件:', file?.originalname, '大小:', file?.size);
        const data = await this.recordsService.uploadAudio(file);
        return { code: 200, msg: 'success', data };
    }
    async transcribe(body) {
        const data = await this.recordsService.transcribe(body.topic_id, body.audio_key, body.subtopic_id, body.interviewee_name);
        return { code: 200, msg: 'success', data };
    }
    async transcribeText(body) {
        const data = await this.recordsService.transcribeText(body.topic_id, body.text, body.subtopic_id, body.interviewee_name);
        return { code: 200, msg: 'success', data };
    }
    async getByTopic(topicId) {
        const data = await this.recordsService.getByTopic(topicId);
        return { code: 200, msg: 'success', data };
    }
    async getStoryMap(topicId) {
        const data = await this.recordsService.getStoryMap(topicId);
        return { code: 200, msg: 'success', data };
    }
    async transcribeTextToArchive(body) {
        const data = await this.recordsService.transcribeTextToArchive(body.topic_id, body.text, body.subtopic_id, body.meta);
        return { code: 200, msg: 'success', data };
    }
    async renderTopicArchive(topicId, body) {
        const data = await this.recordsService.renderTopicArchive(topicId, body.meta);
        return { code: 200, msg: 'success', data };
    }
    async confirmRecord(recordId, body) {
        const data = await this.recordsService.confirmRecord(recordId, body.edited_text, body.subtopic_id);
        return { code: 200, msg: 'success', data };
    }
    async rejectRecord(recordId) {
        const data = await this.recordsService.rejectRecord(recordId);
        return { code: 200, msg: 'success', data };
    }
    async uploadDocument(file, body) {
        console.log('收到文档文件:', file?.originalname, '大小:', file?.size);
        const data = await this.recordsService.uploadAndParseDocument(file, body.topic_id, body.subtopic_id, body.interviewee_name);
        return { code: 200, msg: 'success', data };
    }
};
exports.InterviewRecordsController = InterviewRecordsController;
__decorate([
    (0, common_1.Post)('upload-audio'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Post)('transcribe'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "transcribe", null);
__decorate([
    (0, common_1.Post)('transcribe-text'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "transcribeText", null);
__decorate([
    (0, common_1.Get)(':topicId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "getByTopic", null);
__decorate([
    (0, common_1.Get)(':topicId/story-map'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "getStoryMap", null);
__decorate([
    (0, common_1.Post)('transcribe-text-to-archive'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "transcribeTextToArchive", null);
__decorate([
    (0, common_1.Post)(':topicId/render-archive'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "renderTopicArchive", null);
__decorate([
    (0, common_1.Post)(':recordId/confirm'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('recordId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "confirmRecord", null);
__decorate([
    (0, common_1.Post)(':recordId/reject'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('recordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "rejectRecord", null);
__decorate([
    (0, common_1.Post)('upload-document'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InterviewRecordsController.prototype, "uploadDocument", null);
exports.InterviewRecordsController = InterviewRecordsController = __decorate([
    (0, common_1.Controller)('interview-records'),
    __metadata("design:paramtypes", [interview_records_service_1.InterviewRecordsService])
], InterviewRecordsController);
//# sourceMappingURL=interview-records.controller.js.map