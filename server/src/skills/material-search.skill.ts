/**
 * 资料搜索 Skill — 网络搜索 + LLM 结构化整理
 *
 * 核心能力：
 * 1. 网络搜索：通过 SearchClient 搜索权威文献/资料
 * 2. LLM 整理：将搜索结果整理为结构化资料文档
 * 3. 来源标注：保留原始 URL、来源站点、权威度等信息
 */
import { Injectable, Logger } from '@nestjs/common';
import { SearchClient, Config, LLMClient } from 'coze-coding-dev-sdk';

/** 单条结构化资料 */
export interface StructuredMaterial {
  title: string;
  content: string;
  source: string;
  url: string;
  tags: string[];
  structuredData: {
    summary: string;
    keyFacts: string[];
    relatedEntities: string[];
    credibility: 'high' | 'medium' | 'low';
  };
}

/** 搜索结果 */
export interface SearchResult {
  searchSummary: string;
  materials: StructuredMaterial[];
}

@Injectable()
export class MaterialSearchSkill {
  private readonly logger = new Logger(MaterialSearchSkill.name);

  private getSearchClient() {
    return new SearchClient(new Config());
  }

  private getLLMClient() {
    return new LLMClient(new Config());
  }

  /**
   * 搜索网络资料并用 LLM 整理成结构化文档
   * @param query 搜索关键词
   * @param topicName 话题名称（用于上下文增强）
   */
  async searchAndStructure(query: string, topicName?: string): Promise<SearchResult> {
    // 1. 网络搜索
    const searchClient = this.getSearchClient();
    const searchQuery = topicName ? `${topicName} ${query}` : query;

    this.logger.log(`Searching web for: "${searchQuery}"`);

    const response = await searchClient.webSearch(searchQuery, 8, true);

    if (!response.web_items || response.web_items.length === 0) {
      return { searchSummary: '未找到相关资料，请尝试其他关键词。', materials: [] };
    }

    // 2. 用 LLM 整理搜索结果为结构化资料
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

    const llmResponse = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3 },
    );

    // 解析 LLM 返回的 JSON
    try {
      const cleanedContent = this.extractJSON(llmResponse.content);
      const parsed = JSON.parse(cleanedContent);

      const materials: StructuredMaterial[] = (parsed.materials || []).map(
        (m: Record<string, unknown>) => {
          const sd = (m.structured_data || {}) as Record<string, unknown>;
          return {
            title: (m.title as string) || '未命名资料',
            content: (m.content as string) || '',
            source: (m.source as string) || '网络搜索',
            url: (m.url as string) || '',
            tags: Array.isArray(m.tags) ? m.tags : [],
            structuredData: {
              summary: (sd.summary as string) || '',
              keyFacts: Array.isArray(sd.key_facts) ? sd.key_facts as string[] : [],
              relatedEntities: Array.isArray(sd.related_entities) ? sd.related_entities as string[] : [],
              credibility: (sd.credibility as 'high' | 'medium' | 'low') || 'medium',
            },
          };
        },
      );

      return {
        searchSummary: parsed.search_summary || '搜索完成',
        materials,
      };
    } catch (parseError) {
      this.logger.error(`Failed to parse LLM response: ${parseError}`);
      // 降级：直接返回搜索结果
      const fallbackMaterials: StructuredMaterial[] = response.web_items
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

  /**
   * 从 LLM 返回内容中提取 JSON
   */
  private extractJSON(content: string): string {
    // 尝试直接解析
    const trimmed = content.trim();
    if (trimmed.startsWith('{')) return trimmed;

    // 尝试从 markdown code block 中提取
    const jsonBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) return jsonBlockMatch[1].trim();

    // 尝试找到第一个 { 和最后一个 }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.substring(firstBrace, lastBrace + 1);
    }

    return trimmed;
  }
}
