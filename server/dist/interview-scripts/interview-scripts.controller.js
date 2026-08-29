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
exports.InterviewScriptsController = void 0;
const common_1 = require("@nestjs/common");
const interview_scripts_service_1 = require("./interview-scripts.service");
let InterviewScriptsController = class InterviewScriptsController {
    constructor(scriptsService) {
        this.scriptsService = scriptsService;
    }
    async create(body) {
        const data = await this.scriptsService.create(body);
        return { code: 200, msg: 'success', data };
    }
    async getLatest(topicId) {
        const data = await this.scriptsService.getLatest(topicId);
        return { code: 200, msg: 'success', data };
    }
    async getByTopic(topicId) {
        const data = await this.scriptsService.getByTopic(topicId);
        return { code: 200, msg: 'success', data };
    }
    async getById(id) {
        const data = await this.scriptsService.getById(id);
        return { code: 200, msg: 'success', data };
    }
    async update(id, body) {
        const data = await this.scriptsService.update(id, body);
        return { code: 200, msg: 'success', data };
    }
    async delete(id) {
        await this.scriptsService.delete(id);
        return { code: 200, msg: 'success' };
    }
};
exports.InterviewScriptsController = InterviewScriptsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('latest/:topicId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Get)('topic/:topicId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "getByTopic", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewScriptsController.prototype, "delete", null);
exports.InterviewScriptsController = InterviewScriptsController = __decorate([
    (0, common_1.Controller)('interview-scripts'),
    __metadata("design:paramtypes", [interview_scripts_service_1.InterviewScriptsService])
], InterviewScriptsController);
//# sourceMappingURL=interview-scripts.controller.js.map