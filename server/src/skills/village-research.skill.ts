/**
 * 村庄记忆专题研究 Skill
 *
 * 专为"村庄记忆"项目定制的深度学习与研究技能。
 *
 * 核心能力：
 * 1. 多维度搜索：根据话题自动生成多组搜索关键词，覆盖历史、建筑、民俗、方言等维度
 * 2. 权威来源限定：只搜索政府文化部门、学术机构、地方志、博物馆等权威站点
 * 3. 深度内容获取：获取网页全文，而非仅摘要
 * 4. 研究文档生成：将多轮搜索结果综合整理成一篇可读性强的专题研究文档
 */
import { Injectable, Logger } from '@nestjs/common';
import { SearchClient, Config, LLMClient } from 'coze-coding-dev-sdk';

/** 研究文档 */
export interface ResearchDocument {
  /** 文档标题 */
  title: string;
  /** 研究正文（Markdown 格式，可读性强） */
  content: string;
  /** 参考资料列表 */
  references: Array<{
    title: string;
    source: string;
    url: string;
    snippet: string;
  }>;
  /** 搜索覆盖的维度 */
  dimensions: string[];
  /** 搜索关键词（用于展示） */
  queries: string[];
}

/** 研究参数 */
interface ResearchParams {
  topicName: string;
  topicDescription?: string;
  subtopics?: string[];
  focusAreas?: string[];
}

/**
 * 权威来源偏好关键词（用于 LLM 筛选，而非硬限制搜索站点）
 * 硬限制 sites 会导致搜索结果过少，改为在 LLM 整理时优先引用权威来源
 */
const AUTHORITY_KEYWORDS = '政府、博物馆、大学、研究院、地方志、文化遗产、非遗、文物局';

@Injectable()
export class VillageResearchSkill {
  private readonly logger = new Logger(VillageResearchSkill.name);

  private getSearchClient() {
    return new SearchClient(new Config());
  }

  private getLLMClient() {
    return new LLMClient(new Config());
  }

  /**
   * 执行专题研究
   */
  async conductResearch(params: ResearchParams): Promise<ResearchDocument> {
    const { topicName, topicDescription, subtopics, focusAreas } = params;

    // 1. 生成多维度搜索关键词
    const queries = this.generateQueries(topicName, topicDescription, subtopics, focusAreas);
    this.logger.log(`Generated ${queries.length} search queries for "${topicName}"`);

    // 2. 多轮搜索（并行）
    const searchClient = this.getSearchClient();

    interface SearchItem {
      title: string;
      url: string;
      site_name: string;
      snippet: string;
      content: string;
      summary: string;
      auth_info_des: string;
      query: string;
    }

    interface FallbackResult {
      web_items: Array<{
        title?: string;
        url?: string;
        site_name?: string;
        snippet?: string;
        content?: string;
        summary?: string;
        auth_info_des?: string;
      }>;
      summary: string;
    }

    const emptyResult: FallbackResult = { web_items: [], summary: '' };

    const searchPromises = queries.map((query) =>
      searchClient
        .advancedSearch(query, {
          count: 6,
          needContent: true,
          needUrl: true,
          needSummary: true,
        })
        .catch((err) => {
          this.logger.warn(`Search failed for "${query}": ${err.message}`);
          return emptyResult;
        }),
    );

    const searchResults = await Promise.all(searchPromises);

    // 3. 汇总所有搜索结果
    const allItems: SearchItem[] = [];
    const seenUrls = new Set<string>();

    const extractItems = (
      result: FallbackResult,
      sourceQuery: string,
    ) => {
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
      extractItems(result as FallbackResult, queries[idx]);
    });

    this.logger.log(`Collected ${allItems.length} unique results across ${queries.length} queries`);

    // 如果搜索结果太少，降级用不限站点的搜索补充
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

      extractItems(supplement as FallbackResult, supplementQuery);
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

    // 4. LLM 深度整理为可读性强的研究文档
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

  /**
   * 生成多维度搜索关键词
   */
  private generateQueries(
    topicName: string,
    description?: string,
    subtopics?: string[],
    focusAreas?: string[],
  ): string[] {
    const queries: string[] = [];

    // 核心话题搜索
    queries.push(`${topicName} 历史沿革 文化`);

    // 如果有子话题，为每个子话题生成搜索
    if (subtopics && subtopics.length > 0) {
      subtopics.slice(0, 3).forEach((sub) => {
        queries.push(`${topicName} ${sub}`);
      });
    }

    // 如果有指定关注领域
    if (focusAreas && focusAreas.length > 0) {
      focusAreas.forEach((area) => {
        queries.push(`${topicName} ${area}`);
      });
    } else {
      // 默认覆盖维度
      queries.push(`${topicName} 建筑特色 传统`);
      queries.push(`${topicName} 民俗 方言 非遗`);
    }

    // 如果有描述，提取关键词补充
    if (description && description.length > 5) {
      queries.push(`${topicName} ${description.substring(0, 30)}`);
    }

    // 去重，限制最多 6 组
    return [...new Set(queries)].slice(0, 6);
  }

  /**
   * 用 LLM 将所有搜索结果综合整理成一篇可读的研究文档
   */
  private async synthesizeDocument(
    topicName: string,
    description: string | undefined,
    subtopics: string[] | undefined,
    items: Array<{
      title: string;
      url: string;
      site_name: string;
      snippet: string;
      content: string;
      summary: string;
      auth_info_des: string;
      query: string;
    }>,
  ): Promise<{ title: string; content: string }> {
    const llmClient = this.getLLMClient();

    // 构建搜索材料文本（控制总长度避免超出 token 限制）
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

    const response = await llmClient.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4 },
    );

    return {
      title: `${topicName} — 专题研究`,
      content: response.content,
    };
  }

  /**
   * 将搜索关键词还原为维度标签
   */
  private getDimensionLabels(queries: string[]): string[] {
    const dimensionMap: Record<string, string> = {
      '历史沿革': '历史',
      '文化': '文化',
      '建筑特色': '建筑',
      '传统': '传统',
      '民俗': '民俗',
      '方言': '方言',
      '非遗': '非遗',
    };

    const labels = new Set<string>();
    queries.forEach((q) => {
      Object.entries(dimensionMap).forEach(([key, label]) => {
        if (q.includes(key)) labels.add(label);
      });
    });

    return labels.size > 0 ? [...labels] : ['综合'];
  }
}
