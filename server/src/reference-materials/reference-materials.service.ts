import { Injectable, Logger } from "@nestjs/common";
import { getSupabaseClient } from "../storage/database/supabase-client";
import { SearchClient, Config, LLMClient } from "coze-coding-dev-sdk";

@Injectable()
export class ReferenceMaterialsService {
	private readonly logger = new Logger(ReferenceMaterialsService.name);

	/**
	 * 获取话题下所有参考资料
	 */
	async findByTopic(topicId: string) {
		const { data, error } = await getSupabaseClient()
			.from("reference_materials")
			.select("*")
			.eq("topic_id", topicId)
			.order("created_at", { ascending: false });

		if (error) {
			this.logger.error("查询参考资料失败", error.message);
			throw new Error("查询参考资料失败");
		}

		return data || [];
	}

	/**
	 * 手动添加参考资料
	 */
	async addManual(data: {
		topic_id: string;
		subtopic_id?: string;
		title: string;
		content: string;
		tags?: string[];
	}) {
		const insertData = {
			topic_id: data.topic_id,
			subtopic_id: data.subtopic_id || null,
			source: "manual",
			title: data.title,
			content: data.content,
			tags: data.tags || [],
		};

		const { data: result, error } = await getSupabaseClient()
			.from("reference_materials")
			.insert(insertData)
			.select()
			.single();

		if (error) {
			this.logger.error("添加参考资料失败", error.message);
			throw new Error("添加参考资料失败");
		}

		return result;
	}

	/**
	 * 删除参考资料
	 */
	async remove(id: string) {
		const { error } = await getSupabaseClient()
			.from("reference_materials")
			.delete()
			.eq("id", id);

		if (error) {
			this.logger.error("删除参考资料失败", error.message);
			throw new Error("删除参考资料失败");
		}

		return { success: true };
	}

	/**
	 * AI 联网搜索并存储结构化结果
	 */
	async searchAndStore(data: {
		topic_id: string;
		query: string;
		count?: number;
	}) {
		const { topic_id, query, count = 5 } = data;

		// 1. 联网搜索
		const searchConfig = new Config();
		const searchClient = new SearchClient(searchConfig);
		const searchResponse = await searchClient.webSearch(query, count, true);

		if (!searchResponse.web_items || searchResponse.web_items.length === 0) {
			return {
				query,
				summary: "未找到相关搜索结果",
				items: [],
				stored_count: 0,
			};
		}

		// 2. 用 LLM 对搜索结果进行结构化整理
		const llmClient = new LLMClient(new Config());
		const searchResultsText = searchResponse.web_items
			.map(
				(item, i) =>
					`[${i + 1}] ${item.title}\n来源: ${item.site_name || "未知"}\nURL: ${item.url || "无"}\n摘要: ${item.snippet || "无"}\n${item.summary ? `详细摘要: ${item.summary}` : ""}`,
			)
			.join("\n\n---\n\n");

		const structurePrompt = `你是一个文化记录助手。请对以下搜索结果进行结构化整理。

搜索主题：${query}

搜索结果：
${searchResultsText}

请按以下 JSON 格式输出结构化数据：
{
  "key_facts": ["关键事实1", "关键事实2", ...],
  "knowledge_gaps": ["知识空白点1", "知识空白点2", ...],
  "suggested_questions": ["基于这些资料，可以追问的问题1", ...],
  "source_reliability": "对搜索结果可靠性的简要评估",
  "summary": "对搜索结果的总结（2-3句话）"
}

只输出 JSON，不要其他内容。`;

		let structuredData: any = {};
		try {
			const llmResponse = await llmClient.invoke([
				{ role: "user", content: structurePrompt },
			]);
			const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				structuredData = JSON.parse(jsonMatch[0]);
			}
		} catch (e) {
			this.logger.warn("LLM 结构化失败，使用原始数据", (e as Error).message);
			structuredData = {
				summary: searchResponse.summary || "搜索结果已保存",
				key_facts: [],
				knowledge_gaps: [],
				suggested_questions: [],
			};
		}

		// 3. 存储搜索结果
		const storedItems: any[] = [];

		// 存储整体搜索摘要
		const summaryContent = searchResponse.web_items
			.map((item) => `${item.title}: ${item.snippet || item.summary || ""}`)
			.join("\n");

		const { data: summaryRecord, error: summaryError } = await getSupabaseClient()
			.from("reference_materials")
			.insert({
				topic_id,
				source: "web_search",
				title: `联网搜索：${query}`,
				content: summaryContent,
				structured_data: structuredData,
				tags: [query, "联网搜索"],
			})
			.select()
			.single();

		if (!summaryError && summaryRecord) {
			storedItems.push(summaryRecord);
		}

		// 存储每条搜索结果
		for (const item of searchResponse.web_items) {
			const { data: itemRecord, error: itemError } = await getSupabaseClient()
				.from("reference_materials")
				.insert({
					topic_id,
					source: "web_search",
					title: item.title,
					content: item.snippet || item.summary || "",
					url: item.url || null,
					structured_data: {
						site_name: item.site_name,
						publish_time: item.publish_time,
						auth_info: item.auth_info_des,
						summary: item.summary,
					},
					tags: [query],
				})
				.select()
				.single();

			if (!itemError && itemRecord) {
				storedItems.push(itemRecord);
			}
		}

		return {
			query,
			summary: structuredData.summary || searchResponse.summary || "搜索完成",
			structured_data: structuredData,
			items: searchResponse.web_items.map((item) => ({
				title: item.title,
				url: item.url,
				snippet: item.snippet,
				summary: item.summary,
				site_name: item.site_name,
			})),
			stored: storedItems,
			stored_count: storedItems.length,
		};
	}
}
