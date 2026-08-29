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
exports.MaterialsController = void 0;
const common_1 = require("@nestjs/common");
const materials_service_1 = require("./materials.service");
const material_search_skill_1 = require("../skills/material-search.skill");
const village_research_skill_1 = require("../skills/village-research.skill");
const material_embedding_skill_1 = require("../skills/material-embedding.skill");
let MaterialsController = class MaterialsController {
    constructor(materialsService, materialSearchSkill, villageResearchSkill, materialEmbeddingSkill) {
        this.materialsService = materialsService;
        this.materialSearchSkill = materialSearchSkill;
        this.villageResearchSkill = villageResearchSkill;
        this.materialEmbeddingSkill = materialEmbeddingSkill;
    }
    async librarySearch(query, source) {
        if (!query?.trim()) {
            return { code: 200, msg: 'success', data: [] };
        }
        const results = await this.materialsService.librarySearch(query.trim(), source);
        return { code: 200, msg: 'success', data: results };
    }
    async findTopicsWithMaterials(source) {
        const topics = await this.materialsService.findTopicsWithMaterials(source);
        return { code: 200, msg: 'success', data: topics };
    }
    async findAll(source) {
        const materials = await this.materialsService.findAll(source);
        return { code: 200, msg: 'success', data: materials };
    }
    async globalSearch(query, source) {
        if (!query?.trim()) {
            return { code: 200, msg: 'success', data: [] };
        }
        const materials = await this.materialsService.globalSearch(query.trim(), source);
        return { code: 200, msg: 'success', data: materials };
    }
    async findByTopic(topicId) {
        const materials = await this.materialsService.findByTopic(topicId);
        return { code: 200, msg: 'success', data: materials };
    }
    async findById(id) {
        const material = await this.materialsService.findById(id);
        if (!material) {
            return { code: 404, msg: '资料不存在', data: null };
        }
        return { code: 200, msg: 'success', data: material };
    }
    async create(body) {
        const material = await this.materialsService.create(body);
        return { code: 200, msg: 'success', data: material };
    }
    async update(id, body) {
        const material = await this.materialsService.update(id, body);
        if (!material) {
            return { code: 404, msg: '资料不存在', data: null };
        }
        return { code: 200, msg: 'success', data: material };
    }
    async delete(id) {
        const result = await this.materialsService.delete(id);
        return { code: 200, msg: 'success', data: result };
    }
    async searchMaterials(body) {
        if (!body.query?.trim()) {
            return { code: 400, msg: '请输入搜索关键词', data: null };
        }
        const result = await this.materialSearchSkill.searchAndStructure(body.query.trim(), body.topicName?.trim());
        return { code: 200, msg: 'success', data: result };
    }
    async researchTopic(body) {
        if (!body.topicName?.trim()) {
            return { code: 400, msg: '话题名称不能为空', data: null };
        }
        const result = await this.villageResearchSkill.conductResearch({
            topicName: body.topicName.trim(),
            topicDescription: body.topicDescription?.trim(),
            subtopics: body.subtopics,
            focusAreas: body.focusAreas,
        });
        return { code: 200, msg: 'success', data: result };
    }
    async semanticSearch(topicId, query, limit) {
        if (!query?.trim()) {
            return { code: 400, msg: '请输入搜索内容', data: [] };
        }
        const topK = limit ? parseInt(limit, 10) : 10;
        const results = await this.materialEmbeddingSkill.semanticSearch(topicId, query.trim(), topK);
        return { code: 200, msg: 'success', data: results };
    }
    async getSummary(topicId) {
        const summary = await this.materialsService.getMaterialsSummary(topicId);
        return { code: 200, msg: 'success', data: { summary } };
    }
};
exports.MaterialsController = MaterialsController;
__decorate([
    (0, common_1.Get)('library-search'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "librarySearch", null);
__decorate([
    (0, common_1.Get)('topics'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "findTopicsWithMaterials", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "globalSearch", null);
__decorate([
    (0, common_1.Get)('topic/:topicId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "findByTopic", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "searchMaterials", null);
__decorate([
    (0, common_1.Post)('research'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "researchTopic", null);
__decorate([
    (0, common_1.Get)('topic/:topicId/search'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "semanticSearch", null);
__decorate([
    (0, common_1.Get)('topic/:topicId/summary'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MaterialsController.prototype, "getSummary", null);
exports.MaterialsController = MaterialsController = __decorate([
    (0, common_1.Controller)('materials'),
    __metadata("design:paramtypes", [materials_service_1.MaterialsService,
        material_search_skill_1.MaterialSearchSkill,
        village_research_skill_1.VillageResearchSkill,
        material_embedding_skill_1.MaterialEmbeddingSkill])
], MaterialsController);
//# sourceMappingURL=materials.controller.js.map