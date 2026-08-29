"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsModule = void 0;
const common_1 = require("@nestjs/common");
const interview_planner_skill_1 = require("./interview-planner.skill");
const transcript_organizer_skill_1 = require("./transcript-organizer.skill");
const authorization_manager_skill_1 = require("./authorization-manager.skill");
const material_search_skill_1 = require("./material-search.skill");
const village_research_skill_1 = require("./village-research.skill");
const material_embedding_skill_1 = require("./material-embedding.skill");
let SkillsModule = class SkillsModule {
};
exports.SkillsModule = SkillsModule;
exports.SkillsModule = SkillsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [interview_planner_skill_1.InterviewPlannerSkill, transcript_organizer_skill_1.TranscriptOrganizerSkill, authorization_manager_skill_1.AuthorizationManagerSkill, material_search_skill_1.MaterialSearchSkill, village_research_skill_1.VillageResearchSkill, material_embedding_skill_1.MaterialEmbeddingSkill],
        exports: [interview_planner_skill_1.InterviewPlannerSkill, transcript_organizer_skill_1.TranscriptOrganizerSkill, authorization_manager_skill_1.AuthorizationManagerSkill, material_search_skill_1.MaterialSearchSkill, village_research_skill_1.VillageResearchSkill, material_embedding_skill_1.MaterialEmbeddingSkill],
    })
], SkillsModule);
//# sourceMappingURL=skills.module.js.map