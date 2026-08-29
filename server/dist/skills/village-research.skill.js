"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VillageResearchSkill_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VillageResearchSkill = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
const AUTHORITY_KEYWORDS = '政府、博物馆、大学、研究院、地方志、文化遗产、非遗、文物局';
let VillageResearchSkill = VillageResearchSkill_1 = class VillageResearchSkill {
    constructor() {
        this.logger = new common_1.Logger(VillageResearchSkill_1.name);
    }
    getSearchClient() {
        return new coze_coding_dev_sdk_1.SearchClient(new coze_coding_dev_sdk_1.Config());
    }
    getLLMClient() {
        return new coze_coding_dev_sdk_1.LLMClient(new coze_coding_dev_sdk_1.Config());
    }
    async conductResearch(params) {
        const { topicName, topicDescription, subtopics, focusAreas } = params;
        const queries = this.generateQueries(topicName, topicDescription, subtopics, focusAreas);
        this.logger.log(`Generated ${queries.length} search queries for "${topicName}"`);
        const searchClient = this.getSearchClient();
        const emptyResult = { web_items: [], summary: '' };
        const searchPromises = queries.map((query) => searchClient
            .advancedSearch(query, {
            count: 6,
            needContent: true,
            needUrl: true,
            needSummary: true,
        })
            .catch((err) => {
            this.logger.warn(`Search failed for "${query}": ${err.message}`);
            return emptyResult;
        }));
        const searchResults = await Promise.all(searchPromises);
        const allItems = [];
        const seenUrls = new Set();
        const extractItems = (result, sourceQuery) => {
            if (result.web_items) {
                result.web_items.forEach((item) => {
                    const url = item.url || '';
                    if (url && !seenUrls.has(url)) {
                        seenUrls.add(url);
                        allItems.push({
                            title: item.title || '',
                            url,
                            site_name: item.site_name || '',
                            snippet: item.snippet || '',
                            content: item.content || '',
                            summary: item.summary || '',
                            auth_info_des: item.auth_info_des || '',
                            query: sourceQuery,
                        });
                    }
                });
            }
        };
        searchResults.forEach((result, idx) => {
            extractItems(result, queries[idx]);
        });
        this.logger.log(`Collected ${allItems.length} unique results across ${queries.length} queries`);
        if (allItems.length < 3) {
            this.logger.log('Too few authoritative results, supplementing with general search');
            const supplementQuery = `${topicName} 历史文化 传统`;
            const supplement = await searchClient
                .advancedSearch(supplementQuery, {
                count: 8,
                needContent: true,
                needUrl: true,
                needSummary: true,
            })
                .catch(() => emptyResult);
            extractItems(supplement, supplementQuery);
        }
        if (allItems.length === 0) {
            return {
                title: `${topicName} — 专题研究`,
                content: `抱歉，未能找到与"${topicName}"相关的权威资料。建议尝试调整关键词，或通过手动录入的方式添加资料。`,
                references: [],
                dimensions: [],
                queries,
            };
        }
        const document = await this.synthesizeDocument(topicName, topicDescription, subtopics, allItems);
        return {
            ...document,
            references: allItems.slice(0, 10).map((item) => ({
                title: item.title,
                source: item.site_name,
                url: item.url,
                snippet: item.snippet.substring(0, 150),
            })),
            dimensions: this.getDimensionLabels(queries),
            queries,
        };
    }
    generateQueries(topicName, description, subtopics, focusAreas) {
        const queries = [];
        queries.push(`${topicName} 历史沿革 文化`);
        if (subtopics && subtopics.length > 0) {
            subtopics.slice(0, 3).forEach((sub) => {
                queries.push(`${topicName} ${sub}`);
            });
        }
        if (focusAreas && focusAreas.length > 0) {
            focusAreas.forEach((area) => {
                queries.push(`${topicName} ${area}`);
            });
        }
        else {
            queries.push(`${topicName} 建筑特色 传统`);
            queries.push(`${topicName} 民俗 方言 非遗`);
        }
        if (description && description.length > 5) {
            queries.push(`${topicName} ${description.substring(0, 30)}`);
        }
        return [...new Set(queries)].slice(0, 6);
    }
    async synthesizeDocument(topicName, description, subtopics, items) {
        const llmClient = this.getLLMClient();
        const materialsText = items
            .map((item, i) => {
            const textContent = item.content
                ? item.content.substring(0, 800)
                : item.summary || item.snippet;
            return [
                `【资料${i + 1}】${item.title}`,
                `来源: ${item.site_name}（${item.auth_info_des || '未知'}）`,
                `搜索维度: ${item.query}`,
                `内容: ${textContent}`,
            ].join('\n');
        })
            .join('\n\n---\n\n');
        const systemPrompt = `你是一位资深的文化人类学研究者，正在为"村庄记忆"项目撰写一份专题研究文档。

"村庄记忆"是一个帮助乡村图书馆记录村庄文化和老人记忆的项目，目标用户是乡村图书馆负责人和 8-12 岁的孩子。

## 写作要求

1. **可读性第一**：语言平实、生动、有温度，让普通读者（包括孩子）都能读懂
2. **贴近村庄**：始终围绕"村庄"这个尺度，不要写成泛泛的文化概述
3. **来源优先**：优先引用政府网站、学术机构、博物馆、地方志等权威来源，对来源不明的信息要标注"（待核实）"
4. **去伪存真**：如果不同来源的信息有矛盾，指出来
5. **篇幅控制**：具体内容部分 800-1500 字，信息密度要高，不要水字数

## 输出格式（严格遵守）

请严格按以下两部分格式输出，不要使用 Markdown 标题符号（#、##），不要用加粗（**），不要用其他复杂格式：

一、具体内容

（在这里写研究正文。用自然段落组织内容，可以分段但不要用小标题。语言流畅连贯，像在给人讲故事一样。800-1500字。）

二、参考文献

1. 文献名称 — 网页链接
2. 文献名称 — 网页链接
3. 文献名称 — 网页链接
...

（列出所有引用过的资料来源，每条一行，格式为"序号. 来源名称 — URL"）`;
        const userPrompt = `## 研究话题
${topicName}
${description ? `\n话题描述：${description}` : ''}
${subtopics && subtopics.length > 0 ? `\n子话题方向：${subtopics.join('、')}` : ''}

## 搜索到的资料（共${items.length}条）

${materialsText}

请综合以上资料，严格按照"一、具体内容"和"二、参考文献"两部分格式，撰写关于"${topicName}"的专题研究文档。`;
        const response = await llmClient.invoke([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], { temperature: 0.4 });
        return {
            title: `${topicName} — 专题研究`,
            content: response.content,
        };
    }
    getDimensionLabels(queries) {
        const dimensionMap = {
            '历史沿革': '历史',
            '文化': '文化',
            '建筑特色': '建筑',
            '传统': '传统',
            '民俗': '民俗',
            '方言': '方言',
            '非遗': '非遗',
        };
        const labels = new Set();
        queries.forEach((q) => {
            Object.entries(dimensionMap).forEach(([key, label]) => {
                if (q.includes(key))
                    labels.add(label);
            });
        });
        return labels.size > 0 ? [...labels] : ['综合'];
    }
};
exports.VillageResearchSkill = VillageResearchSkill;
exports.VillageResearchSkill = VillageResearchSkill = VillageResearchSkill_1 = __decorate([
    (0, common_1.Injectable)()
], VillageResearchSkill);
//# sourceMappingURL=village-research.skill.js.map