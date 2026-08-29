"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewScriptsModule = void 0;
const common_1 = require("@nestjs/common");
const interview_scripts_controller_1 = require("./interview-scripts.controller");
const interview_scripts_service_1 = require("./interview-scripts.service");
let InterviewScriptsModule = class InterviewScriptsModule {
};
exports.InterviewScriptsModule = InterviewScriptsModule;
exports.InterviewScriptsModule = InterviewScriptsModule = __decorate([
    (0, common_1.Module)({
        controllers: [interview_scripts_controller_1.InterviewScriptsController],
        providers: [interview_scripts_service_1.InterviewScriptsService],
        exports: [interview_scripts_service_1.InterviewScriptsService],
    })
], InterviewScriptsModule);
//# sourceMappingURL=interview-scripts.module.js.map