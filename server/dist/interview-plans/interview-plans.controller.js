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
exports.InterviewPlansController = void 0;
const common_1 = require("@nestjs/common");
const interview_plans_service_1 = require("./interview-plans.service");
let InterviewPlansController = class InterviewPlansController {
    constructor(plansService) {
        this.plansService = plansService;
    }
    async generate(body) {
        const data = await this.plansService.generate(body.topic_id, body.subtopic_id, body.requirements);
        return { code: 200, msg: 'success', data };
    }
    async refine(planId, body) {
        const data = await this.plansService.refine(planId, body.feedback);
        return { code: 200, msg: 'success', data };
    }
    async supplement(planId, body) {
        const data = await this.plansService.supplement(planId, body.requirements, body.existing_count);
        return { code: 200, msg: 'success', data };
    }
    async finalize(planId) {
        const data = await this.plansService.finalize(planId);
        return { code: 200, msg: 'success', data };
    }
    async getByTopic(topicId) {
        const data = await this.plansService.getByTopic(topicId);
        return { code: 200, msg: 'success', data };
    }
    async getVersionChain(planId) {
        const data = await this.plansService.getVersionChain(planId);
        return { code: 200, msg: 'success', data };
    }
};
exports.InterviewPlansController = InterviewPlansController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)(':planId/refine'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "refine", null);
__decorate([
    (0, common_1.Post)(':planId/supplement'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "supplement", null);
__decorate([
    (0, common_1.Post)(':planId/finalize'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "finalize", null);
__decorate([
    (0, common_1.Get)(':topicId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "getByTopic", null);
__decorate([
    (0, common_1.Get)('versions/:planId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InterviewPlansController.prototype, "getVersionChain", null);
exports.InterviewPlansController = InterviewPlansController = __decorate([
    (0, common_1.Controller)('interview-plans'),
    __metadata("design:paramtypes", [interview_plans_service_1.InterviewPlansService])
], InterviewPlansController);
//# sourceMappingURL=interview-plans.controller.js.map