import { Controller, Get, Post, Delete, Body, Param, HttpCode, Query } from "@nestjs/common";
import { ReferenceMaterialsService } from "./reference-materials.service";

@Controller("reference-materials")
export class ReferenceMaterialsController {
	constructor(private readonly service: ReferenceMaterialsService) {}

	/**
	 * 获取话题下所有参考资料
	 */
	@Get("topic/:topicId")
	@HttpCode(200)
	async findByTopic(@Param("topicId") topicId: string) {
		const data = await this.service.findByTopic(topicId);
		return { code: 200, msg: "success", data };
	}

	/**
	 * 手动添加参考资料
	 */
	@Post()
	@HttpCode(200)
	async addManual(
		@Body()
		body: {
			topic_id: string;
			subtopic_id?: string;
			title: string;
			content: string;
			tags?: string[];
		},
	) {
		const data = await this.service.addManual(body);
		return { code: 200, msg: "success", data };
	}

	/**
	 * 删除参考资料
	 */
	@Delete(":id")
	@HttpCode(200)
	async remove(@Param("id") id: string) {
		const data = await this.service.remove(id);
		return { code: 200, msg: "success", data };
	}

	/**
	 * AI 联网搜索并存储结构化结果
	 */
	@Post("search")
	@HttpCode(200)
	async searchAndStore(
		@Body()
		body: {
			topic_id: string;
			query: string;
			count?: number;
		},
	) {
		const data = await this.service.searchAndStore(body);
		return { code: 200, msg: "success", data };
	}
}
