/**
 * 村庄故事生成 Skill
 *
 * 将话题下的历史采访和外部文献素材，通过 LLM 总结成可读性强、去 AI 味的历史故事。
 */
import { Injectable, Logger } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'

/** 素材摘要 */
interface MaterialBrief {
  title: string
  content: string
  source: string
}

/** 生成结果 */
export interface StoryGenerationResult {
  title: string
  content: string
  summary: string
}

@Injectable()
export class StoryGenerationSkill {
  private readonly logger = new Logger(StoryGenerationSkill.name)

  private getLLMClient() {
    return new LLMClient(new Config())
  }

  /**
   * 根据话题信息和素材生成村庄故事
   */
  async generateStory(
    topicName: string,
    topicDescription: string | null,
    materials: MaterialBrief[],
  ): Promise<StoryGenerationResult> {
    const client = this.getLLMClient()

    // 组装素材文本
    const materialTexts = materials.map((m, i) => {
      const sourceLabel = m.source === 'interview' ? '历史采访' : '外部文献'
      return `【素材${i + 1}（${sourceLabel}）】${m.title}\n${m.content}`
    }).join('\n\n---\n\n')

    const systemPrompt = `你是一位资深的乡村文化记录者，擅长将零散的采访记录和文献资料整理成引人入胜的村庄故事。

你的写作风格要求：
1. **去 AI 味**：不要使用"让我们""值得一提的是""不禁让人"等 AI 常用套话。语言要朴实自然，像一个见多识广的老人在讲故事。
2. **可读性强**：用叙事性语言，有场景感、有人物、有细节。避免干巴巴的罗列。
3. **忠于素材**：故事内容必须基于提供的素材，不要凭空编造。如果素材中有矛盾之处，可以并列呈现不同说法。
4. **结构清晰**：故事有开头（引入背景）、中间（核心叙事）、结尾（余韵或反思），但不要刻意分段标注。
5. **保留原味**：如果素材中有方言表达、口语化的描述，尽量保留其原汁原味，用引号标注。
6. **篇幅适中**：故事正文控制在 800-1500 字之间。

输出格式要求（严格遵守）：
- 第一行：故事标题（简洁有力，10 字以内）
- 第二行：---（分隔线）
- 第三行起：故事正文（自然段落，段落间空一行）
- 最后一段之后，另起一行：===（分隔线）
- 最后一行：一句话摘要（50 字以内，概括故事核心）`

    const userPrompt = `话题名称：${topicName}
${topicDescription ? `话题描述：${topicDescription}` : ''}

以下是该话题下收集到的素材，请根据这些素材撰写一个村庄故事：

${materialTexts}`

    this.logger.log(`Generating story for topic: ${topicName}, materials count: ${materials.length}`)

    const response = await client.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.85,
      },
    )

    const rawText = response.content.trim()
    this.logger.log(`Story generated, length: ${rawText.length}`)

    // 解析输出
    return this.parseStoryOutput(rawText, topicName)
  }

  /**
   * 解析 LLM 输出的故事文本
   */
  private parseStoryOutput(rawText: string, fallbackTitle: string): StoryGenerationResult {
    // 尝试按格式解析：标题\n---\n正文\n===\n摘要
    const titleSepIdx = rawText.indexOf('\n---')
    const summarySepIdx = rawText.lastIndexOf('===\n')

    let title: string
    let content: string
    let summary: string

    if (titleSepIdx > 0) {
      title = rawText.substring(0, titleSepIdx).trim()
      const afterTitle = rawText.substring(titleSepIdx + 4).trim() // skip \n---

      if (summarySepIdx > 0) {
        content = rawText.substring(titleSepIdx + 4, summarySepIdx).trim()
        summary = rawText.substring(summarySepIdx + 4).trim()
      } else {
        content = afterTitle
        summary = content.substring(0, 50)
      }
    } else {
      // 解析失败，用原文
      title = fallbackTitle
      content = rawText
      summary = rawText.substring(0, 50)
    }

    // 清理标题中可能的多余字符
    title = title.replace(/^#+\s*/, '').replace(/^["'"「『]/, '').replace(/["'"」』]$/, '').trim()
    if (title.length > 30) {
      title = title.substring(0, 30)
    }

    return { title, content, summary }
  }
}
