"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MaterialSearchSkill_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialSearchSkill = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
let MaterialSearchSkill = MaterialSearchSkill_1 = class MaterialSearchSkill {
    constructor() {
        this.logger = new common_1.Logger(MaterialSearchSkill_1.name);
    }
    getSearchClient() {
        return new coze_coding_dev_sdk_1.SearchClient(new coze_coding_dev_sdk_1.Config());
    }
    getLLMClient() {
        return new coze_coding_dev_sdk_1.LLMClient(new coze_coding_dev_sdk_1.Config());
    }
    async searchAndStructure(query, topicName) {
        const searchClient = this.getSearchClient();
        const searchQuery = topicName ? `${topicName} ${query}` : query;
        this.logger.log(`Searching web for: "${searchQuery}"`);
        const response = await searchClient.webSearch(searchQuery, 8, true);
        if (!response.web_items || response.web_items.length === 0) {
            return { searchSummary: '未找到相关资料，请尝试其他关键词。', materials: [] };
        }
        const llmClient = this.getLLMClient();
        const searchItemsText = response.web_items
            .map((item, i) => {
            return [
                `【资料${i + 1}】`,
                `标题: ${item.title}`,
                `来源: ${item.site_name || '未知'}`,
                `URL: ${item.url || ''}`,
                `权威度: ${item.auth_info_des || '未知'} (级别: ${item.auth_info_level})`,
                `摘要: ${item.snippet || ''}`,
                item.summary ? `详细摘要: ${item.summary}` : '',
                item.content ? `正文片段: ${item.content.substring(0, 500)}` : '',
            ]
                .filter(Boolean)
                .join('\n');
        })
            .join('\n\n---\n\n');
        const systemPrompt = `你是一个专业的文化资料整理专家，服务于"村庄记忆"项目——帮助乡村图书馆记录村庄文化和老人记忆。

你的任务是将网络搜索结果整理成结构化的资料文档。

## 整理原则

1. **去重合并**：多条搜索结果讲同一件事的，合并为一条资料
2. **提炼关键信息**：提取核心事实、数据、人物、时间、地点
3. **标注来源**：保留原始 URL 和来源站点
4. **评估可信度**：
   - high：政府网站、学术机构、权威媒体、地方志
   - medium：一般新闻、地方网站、百科
   - low：个人博客、论坛、未知名来源
5. **打标签**：为每条资料打上 2-5 个分类标签（如：历史、建筑、民俗、人物、方言、农耕等）
6. **村庄文化导向**：优先关注与村庄文化、历史、民俗、建筑、方言、传统技艺等相关的内容

请严格按以下 JSON 格式返回，不要有任何其他内容：
{
  "search_summary": "对本次搜索结果的整体概述（2-3句话）",
  "materials": [
    {
      "title": "资料标题（简洁准确）",
      "content": "整理后的资料正文（保留关键信息，去除无关内容，300-800字）",
      "source": "来源站点名称",
      "url": "原始链接URL",
      "tags": ["标签1", "标签2"],
      "structured_data": {
        "summary": "一句话摘要",
        "key_facts": ["关键事实1", "关键事实2"],
        "related_entities": ["相关人物/地点/事件"],
        "credibility": "high/medium/low"
      }
    }
  ]
}

注意：
- materials 数组中最多保留 5 条最有价值的资料
- 如果搜索结果与村庄文化/历史/民俗完全无关，返回空数组
- content 要保留有价值的细节（年份、人名、地名、数据等）`;
        const userPrompt = `## 搜索关键词
${query}
${topicName ? `\n## 话题背景\n${topicName}` : ''}

## 搜索结果
${searchItemsText}

${response.summary ? `\n## AI 搜索摘要\n${response.summary}` : ''}

请整理以上搜索结果为结构化资料文档。`;
        const llmResponse = await llmClient.invoke([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], { temperature: 0.3 });
        try {
            const cleanedContent = this.extractJSON(llmResponse.content);
            const parsed = JSON.parse(cleanedContent);
            const materials = (parsed.materials || []).map((m) => {
                const sd = (m.structured_data || {});
                return {
                    title: m.title || '未命名资料',
                    content: m.content || '',
                    source: m.source || '网络搜索',
                    url: m.url || '',
                    tags: Array.isArray(m.tags) ? m.tags : [],
                    structuredData: {
                        summary: sd.summary || '',
                        keyFacts: Array.isArray(sd.key_facts) ? sd.key_facts : [],
                        relatedEntities: Array.isArray(sd.related_entities) ? sd.related_entities : [],
                        credibility: sd.credibility || 'medium',
                    },
                };
            });
            return {
                searchSummary: parsed.search_summary || '搜索完成',
                materials,
            };
        }
        catch (parseError) {
            this.logger.error(`Failed to parse LLM response: ${parseError}`);
            const fallbackMaterials = response.web_items
                .slice(0, 5)
                .map((item) => ({
                title: item.title || '未命名资料',
                content: item.snippet || item.summary || '',
                source: item.site_name || '网络搜索',
                url: item.url || '',
                tags: [],
                structuredData: {
                    summary: item.summary || item.snippet || '',
                    keyFacts: [],
                    relatedEntities: [],
                    credibility: item.auth_info_level >= 3 ? 'high' : item.auth_info_level >= 2 ? 'medium' : 'low',
                },
            }));
            return {
                searchSummary: response.summary || '搜索完成（结构化整理失败，返回原始结果）',
                materials: fallbackMaterials,
            };
        }
    }
    extractJSON(content) {
        const trimmed = content.trim();
        if (trimmed.startsWith('{'))
            return trimmed;
        const jsonBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonBlockMatch)
            return jsonBlockMatch[1].trim();
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }
};
exports.MaterialSearchSkill = MaterialSearchSkill;
exports.MaterialSearchSkill = MaterialSearchSkill = MaterialSearchSkill_1 = __decorate([
    (0, common_1.Injectable)()
], MaterialSearchSkill);
//# sourceMappingURL=material-search.skill.js.map