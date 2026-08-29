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
exports.OperatorsController = void 0;
const common_1 = require("@nestjs/common");
const operators_service_1 = require("./operators.service");
let OperatorsController = class OperatorsController {
    constructor(operatorsService) {
        this.operatorsService = operatorsService;
    }
    async identify(body) {
        const operator = await this.operatorsService.identify(body.display_name, body.role || 'viewer', body.project_code || 'village-memory', body.note);
        await this.operatorsService.logActivity({
            operator,
            actionType: 'identify',
            targetType: 'operator',
            targetId: operator.id,
            targetName: operator.displayName,
            summary: `${operator.displayName}（${this.operatorsService.roleLabel(operator.role)}）进入项目`,
        });
        return {
            data: {
                operator_id: operator.id,
                operator_token: operator.operatorToken,
                display_name: operator.displayName,
                role: operator.role,
                role_label: this.operatorsService.roleLabel(operator.role),
            },
        };
    }
    async me(token, projectCode) {
        const operator = await this.operatorsService.require({ 'x-operator-token': token });
        return {
            data: {
                operator_id: operator.id,
                display_name: operator.displayName,
                role: operator.role,
                role_label: this.operatorsService.roleLabel(operator.role),
                can_write: this.operatorsService.roleCan(operator, 'write'),
                can_admin: this.operatorsService.roleCan(operator, 'admin'),
            },
        };
    }
    async getActivityLogs(token, projectCode, limit) {
        const operator = await this.operatorsService.require({ 'x-operator-token': token });
        const logs = await this.operatorsService.getActivityLogs(projectCode || 'village-memory', limit ? parseInt(limit, 10) : 50);
        return { data: logs };
    }
};
exports.OperatorsController = OperatorsController;
__decorate([
    (0, common_1.Post)('identify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "identify", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Headers)('x-operator-token')),
    __param(1, (0, common_1.Headers)('x-project-code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('activity-logs'),
    __param(0, (0, common_1.Headers)('x-operator-token')),
    __param(1, (0, common_1.Headers)('x-project-code')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "getActivityLogs", null);
exports.OperatorsController = OperatorsController = __decorate([
    (0, common_1.Controller)('operators'),
    __metadata("design:paramtypes", [operators_service_1.OperatorsService])
], OperatorsController);
//# sourceMappingURL=operators.controller.js.map