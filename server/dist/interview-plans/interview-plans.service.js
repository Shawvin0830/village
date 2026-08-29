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
exports.InterviewPlansService = void 0;
const common_1 = require("@nestjs/common");
const interview_planner_skill_1 = require("../skills/interview-planner.skill");
let InterviewPlansService = class InterviewPlansService {
    constructor(plannerSkill) {
        this.plannerSkill = plannerSkill;
    }
    async generate(topicId, subtopicId, requirements) {
        return this.plannerSkill.generate(topicId, subtopicId, requirements);
    }
    async refine(planId, feedback) {
        return this.plannerSkill.refine(planId, feedback);
    }
    async supplement(planId, requirements, existingCount) {
        return this.plannerSkill.supplement(planId, requirements, existingCount);
    }
    async finalize(planId) {
        return this.plannerSkill.finalize(planId);
    }
    async getByTopic(topicId) {
        return this.plannerSkill.getByTopic(topicId);
    }
    async getVersionChain(planId) {
        return this.plannerSkill.getVersionChain(planId);
    }
};
exports.InterviewPlansService = InterviewPlansService;
exports.InterviewPlansService = InterviewPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [interview_planner_skill_1.InterviewPlannerSkill])
], InterviewPlansService);
//# sourceMappingURL=interview-plans.service.js.map