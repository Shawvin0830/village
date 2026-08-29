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

/** 权威来源白名单 */
const AUTHORITATIVE_SITES = [
  // 政府文化部门
  'gov.cn',
  'mhfl.gov.cn',
  'nrcta.gov.cn',
  // 文化遗产
  'ihchina.cn',
  'whycw.com',
  // 学术/百科
  'cnki.net',
  'wikipedia.org',
  'baike.baidu.com',
  // 博物馆/文化机构
  'nmchina.cn',
  'dpm.org.cn',
  // 地方志/方志
  'difangzhi.cn',
  // 传统文化促进
  'tcpc.org.cn',
  // 学术搜索
  'xueshu.baidu.com',
].join(',');

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
    const searchPromises = queries.map((query) =>
      searchClient
        .advancedSearch(query, {
          count: 5,
          needContent: true,
          needUrl: true,
          sites: AUTHORITATIVE_SITES,
          needSummary: true,
        })
        .catch((err) => {
          this.logger.warn(`Search failed for "${query}": ${err.message}`);
          return { web_items: [], summary: '' };
        }),
    );

    const searchResults = await Promise.all(searchPromises);

    // 3. 汇总所有搜索结果
    const allItems: Array<{
      title: string;
      url: string;
      site_name: string;
      snippet: string;
      content: string;
      summary: string;
      auth_info_des: string;
      query: string;
    }> = [];
    const seenUrls = new Set<string>();

    searchResults.forEach((result, idx) => {
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
              query: queries[idx],
            });
          }
        });
      }
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
        .catch(() => ({ web_items: [], summary: '' }));

      if (supplement.web_items) {
        supplement.web_items.forEach((item) => {
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
              query: supplementQuery,
            });
          }
        });
      }
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

1. **可读性第一**：这不是学术论文，而是一份让普通读者（包括孩子）都能读懂的研究资料。语言要平实、生动、有温度。
2. **结构清晰**：使用 Markdown 格式，包含以下章节（根据实际内容灵活调整）：
   - **概述**：这个话题是什么，为什么重要（2-3 段）
   - **历史脉络**：时间线上的关键节点
   - **文化特色**：建筑、民俗、方言、技艺等方面的特色
   - **重要人物与事件**：如果有的话
   - **现状与保护**：当前的保护状况、面临的问题
   - **采访线索**：基于研究，建议采访时重点关注的方向（3-5 条）
3. **引用标注**：在引用具体事实时，用 [来源名称] 标注出处
4. **去伪存真**：如果不同来源的信息有矛盾，指出来，不要随意取舍
5. **贴近村庄**：始终围绕"村庄"这个尺度，不要写成泛泛的文化概述
6. **篇幅控制**：1500-3000 字，信息密度要高，不要水字数

## 格式要求

直接输出 Markdown 格式的文档内容。不要输出 JSON，不要输出任何解释性文字。
文档标题用 # 开头，章节用 ## 开头。`;

    const userPrompt = `## 研究话题
${topicName}
${description ? `\n## 话题描述\n${description}` : ''}
${subtopics && subtopics.length > 0 ? `\n## 子话题方向\n${subtopics.join('、')}` : ''}

## 搜索到的资料（共${items.length}条）

${materialsText}

请综合以上资料，撰写一份关于"${topicName}"的专题研究文档。要求：
1. 可读性强，让普通读者和孩子都能看懂
2. 结构清晰，使用 Markdown 格式
3. 具体事实要标注来源
4. 最后给出采访线索建议
5. 如果资料中有矛盾之处，请指出`;

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
