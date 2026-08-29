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
exports.TopicsController = void 0;
const common_1 = require("@nestjs/common");
const topics_service_1 = require("./topics.service");
let TopicsController = class TopicsController {
    constructor(topicsService) {
        this.topicsService = topicsService;
    }
    async getDashboard() {
        const data = await this.topicsService.getDashboard();
        return { code: 200, msg: 'success', data };
    }
    async findAll() {
        const data = await this.topicsService.findAll();
        return { code: 200, msg: 'success', data };
    }
    async findOne(id) {
        const data = await this.topicsService.findOne(id);
        return { code: 200, msg: 'success', data };
    }
    async create(body) {
        const data = await this.topicsService.create(body.name, body.description);
        return { code: 200, msg: 'success', data };
    }
    async deleteTopic(id) {
        const data = await this.topicsService.deleteTopic(id);
        return { code: 200, msg: 'success', data };
    }
    async getSubtopics(id) {
        const data = await this.topicsService.getSubtopics(id);
        return { code: 200, msg: 'success', data };
    }
    async createSubtopic(id, body) {
        const data = await this.topicsService.createSubtopic(id, body.name, body.icon);
        return { code: 200, msg: 'success', data };
    }
    async getSubtopicMaterials(id, subId) {
        const data = await this.topicsService.getSubtopicMaterials(id, subId);
        return { code: 200, msg: 'success', data };
    }
    async updateAuth(id, subId, body) {
        const data = await this.topicsService.updateSubtopicAuth(id, subId, body.auth_level, body.auth_person, body.restriction);
        return { code: 200, msg: 'success', data };
    }
    async updateIntervieweeAuthorization(id, intervieweeId, body) {
        const data = await this.topicsService.updateIntervieweeAuthorization(id, intervieweeId, {
            name: body.name,
            age: body.age,
            occupation: body.occupation,
            role: body.role,
            authStatus: body.auth_status,
            authNote: body.auth_note,
            topicAffiliations: body.topic_affiliations,
        });
        return { code: 200, msg: 'success', data };
    }
    async deleteSubtopic(id, subId) {
        const data = await this.topicsService.deleteSubtopic(id, subId);
        return { code: 200, msg: 'success', data };
    }
    async getQuotes(id, subId) {
        const data = await this.topicsService.getQuotes(id, subId);
        return { code: 200, msg: 'success', data };
    }
    async createQuote(id, subId, body) {
        const data = await this.topicsService.createQuote(id, subId, body);
        return { code: 200, msg: 'success', data };
    }
    async updateQuote(id, subId, quoteId, body) {
        const data = await this.topicsService.updateQuote(id, subId, quoteId, body);
        return { code: 200, msg: 'success', data };
    }
    async deleteQuote(id, subId, quoteId) {
        const data = await this.topicsService.deleteQuote(id, subId, quoteId);
        return { code: 200, msg: 'success', data };
    }
    async getAuthList(id) {
        const data = await this.topicsService.getAuthList(id);
        return { code: 200, msg: 'success', data };
    }
    async getAuthOverview(id) {
        const data = await this.topicsService.getAuthOverview(id);
        return { code: 200, msg: 'success', data };
    }
    async archiveTopic(id) {
        const data = await this.topicsService.archiveTopic(id);
        return { code: 200, msg: 'success', data };
    }
};
exports.TopicsController = TopicsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(200),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "deleteTopic", null);
__decorate([
    (0, common_1.Get)(':id/subtopics'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getSubtopics", null);
__decorate([
    (0, common_1.Post)(':id/subtopics'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "createSubtopic", null);
__decorate([
    (0, common_1.Get)(':id/subtopics/:subId/materials'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getSubtopicMaterials", null);
__decorate([
    (0, common_1.Post)(':id/subtopics/:subId/auth'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "updateAuth", null);
__decorate([
    (0, common_1.Post)(':id/interviewees/:intervieweeId/authorization'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('intervieweeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "updateIntervieweeAuthorization", null);
__decorate([
    (0, common_1.Delete)(':id/subtopics/:subId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "deleteSubtopic", null);
__decorate([
    (0, common_1.Get)(':id/subtopics/:subId/quotes'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getQuotes", null);
__decorate([
    (0, common_1.Post)(':id/subtopics/:subId/quotes'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "createQuote", null);
__decorate([
    (0, common_1.Put)(':id/subtopics/:subId/quotes/:quoteId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Param)('quoteId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "updateQuote", null);
__decorate([
    (0, common_1.Delete)(':id/subtopics/:subId/quotes/:quoteId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "deleteQuote", null);
__decorate([
    (0, common_1.Get)(':id/auth-list'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getAuthList", null);
__decorate([
    (0, common_1.Get)(':id/auth-overview'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "getAuthOverview", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "archiveTopic", null);
exports.TopicsController = TopicsController = __decorate([
    (0, common_1.Controller)('topics'),
    __metadata("design:paramtypes", [topics_service_1.TopicsService])
], TopicsController);
//# sourceMappingURL=topics.controller.js.map