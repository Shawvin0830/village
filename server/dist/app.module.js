"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const topics_module_1 = require("./topics/topics.module");
const interview_plans_module_1 = require("./interview-plans/interview-plans.module");
const interview_records_module_1 = require("./interview-records/interview-records.module");
const materials_module_1 = require("./materials/materials.module");
const skills_module_1 = require("./skills/skills.module");
const interview_scripts_module_1 = require("./interview-scripts/interview-scripts.module");
const operators_module_1 = require("./operators/operators.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [operators_module_1.OperatorsModule, topics_module_1.TopicsModule, interview_plans_module_1.InterviewPlansModule, interview_records_module_1.InterviewRecordsModule, materials_module_1.MaterialsModule, skills_module_1.SkillsModule, interview_scripts_module_1.InterviewScriptsModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map