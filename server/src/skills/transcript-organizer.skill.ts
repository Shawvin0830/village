/**
 * 转录整理师 Skill — 专业化采访内容整理
 *
 * 核心能力：
 * 1. 按子话题智能分段：识别话题切换信号
 * 2. 方言原文保留 + 普通话转写：双版本对照
 * 3. 待核实标记：自动识别日期、人名、事实性信息
 * 4. 新发现标记：与已有知识库对比，标记新信息
 * 5. 交叉引用：同一子话题在不同时段出现时互相链接
 * 6. 子话题深化建议：如果某个子话题讲得浅，建议再安排采访
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ASRClient, LLMClient, Config, S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as fs from 'fs';

@Injectable()
export class TranscriptOrganizerSkill {
  private get client() {
    return getSupabaseClient();
  }

  private getASRClient() {
    return new ASRClient(new Config());
  }

  private getLLMClient() {
    return new LLMClient(new Config());
  }

  private getStorage() {
    return new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }

  /**
   * 上传音频文件到对象存储
   */
  async uploadAudio(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未收到音频文件');

    const storage = this.getStorage();
    let fileBuffer: Buffer;
    if (file.path) {
      fileBuffer = await fs.promises.readFile(file.path);
    } else if (file.buffer) {
      fileBuffer = file.buffer;
    } else {
      throw new BadRequestException('无法获取文件内容');
    }

    console.log('音频文件大小:', fileBuffer.length, '类型:', file.mimetype);

    const fileName = `audio/${Date.now()}_${file.originalname || 'recording.wav'}`;
    const audioKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName,
      contentType: file.mimetype || 'audio/wav',
    });

    return { audio_key: audioKey };
  }

  /**
   * ASR 转写 + 智能整理
   */
  async transcribe(topicId: string, audioKey: string, subtopicId?: string) {
    const storage = this.getStorage();
    const audioUrl = await storage.generatePresignedUrl({ key: audioKey, expireTime: 3600 });

    // ASR 识别
    const asrClient = this.getASRClient();
    let transcript = '';
    try {
      const result = await asrClient.recognize({ uid: 'village-memory', url: audioUrl });
      transcript = result.text || '';
      console.log('ASR 识别结果长度:', transcript.length);
    } catch (err) {
      console.error('ASR 识别失败:', err);
      throw new BadRequestException('语音识别失败，请重试');
    }

    if (!transcript) throw new BadRequestException('未识别到语音内容');

    // 智能整理
    const analysis = await this.organizeTranscript(topicId, transcript);

    // 保存采访记录
    const { data: record, error } = await this.client
      .from('interview_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
        audio_key: audioKey,
        transcript_text: transcript,
        dialect_original: analysis.segments?.map((s) => s.dialect_original).join('\n\n') || transcript,
        mandarin_text: analysis.segments?.map((s) => s.mandarin_text).join('\n\n') || transcript,
        status: 'completed',
        ai_analysis: analysis,
      })
      .select()
      .single();

    if (error) throw new Error(`保存采访记录失败: ${error.message}`);

    // 更新子话题状态
    if (subtopicId) {
      await this.client
        .from('subtopics')
        .update({
          transcript_status: 'transcribed',
          summary: analysis.segments?.[0]?.subtopic_name
            ? `${analysis.segments[0].subtopic_name}的采访记录`
            : null,
        })
        .eq('id', subtopicId);
    }

    // 更新涉及到的所有子话题状态
    for (const seg of analysis.segments || []) {
      if (seg.matched_subtopic_id) {
        await this.client
          .from('subtopics')
          .update({ transcript_status: 'transcribed' })
          .eq('id', seg.matched_subtopic_id);
      }
    }

    return {
      transcript,
      segments: analysis.segments || [],
      cross_references: analysis.cross_references || [],
      deepening_suggestions: analysis.deepening_suggestions || [],
    };
  }

  /**
   * 文本直接整理（跳过 ASR）
   */
  async transcribeText(topicId: string, text: string, subtopicId?: string) {
    const analysis = await this.organizeTranscript(topicId, text);

    const { data: record, error } = await this.client
      .from('interview_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
        transcript_text: text,
        dialect_original: analysis.segments?.map((s) => s.dialect_original).join('\n\n') || text,
        mandarin_text: analysis.segments?.map((s) => s.mandarin_text).join('\n\n') || text,
        status: 'completed',
        ai_analysis: analysis,
      })
      .select()
      .single();

    if (error) throw new Error(`保存采访记录失败: ${error.message}`);

    if (subtopicId) {
      await this.client
        .from('subtopics')
        .update({ transcript_status: 'transcribed' })
        .eq('id', subtopicId);
    }

    for (const seg of analysis.segments || []) {
      if (seg.matched_subtopic_id) {
        await this.client
          .from('subtopics')
          .update({ transcript_status: 'transcribed' })
          .eq('id', seg.matched_subtopic_id);
      }
    }

    return {
      transcript: text,
      segments: analysis.segments || [],
      cross_references: analysis.cross_references || [],
      deepening_suggestions: analysis.deepening_suggestions || [],
    };
  }

  /**
   * 核心：智能整理转写内容
   */
  private async organizeTranscript(topicId: string, text: string) {
    // 收集上下文
    const { data: topic } = await this.client
      .from('topics')
      .select('name, description')
      .eq('id', topicId)
      .maybeSingle();

    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name, icon, transcript_status, summary')
      .eq('topic_id', topicId);

    // 获取已有采访记录（用于交叉引用和新发现对比）
    const { data: existingRecords } = await this.client
      .from('interview_records')
      .select('mandarin_text, dialect_original, ai_analysis')
      .eq('topic_id', topicId)
      .eq('status', 'completed');

    const subtopicList = (subtopics || [])
      .map((s) => `${s.id}|${s.icon || '📌'} ${s.name}|${s.transcript_status}|${s.summary || ''}`)
      .join('\n');

    const existingKnowledge = (existingRecords || [])
      .map((r) => (r.mandarin_text || r.dialect_original || '').substring(0, 500))
      .filter(Boolean)
      .join('\n---\n');

    const systemPrompt = `你是"村庄记忆"的转录整理师，专业的文化记录整理专家。

## 你的任务
将采访转写文本进行专业整理，产出结构化的采访记录。

## 核心原则

1. **方言原话不可丢失**：保留老人原话（包括方言词汇、语法），普通话转写只是辅助理解层
2. **按子话题分段**：识别话题切换信号（如"说到木雕...""还有那个屋脊..."），将内容切分为不同子话题段落
3. **待核实标记**：自动识别以下类型的信息并标记为待核实：
   - 具体日期/年份（如"清道光年间""1920年代"）
   - 人名（如"陈爷爷""张师傅"）
   - 事实性断言（如"建于嘉庆年间""共有三进"）
   - 有争议的说法（如"听老人讲""据说"）
4. **新发现标记**：与已有知识对比，标记知识库中不存在的新信息
5. **交叉引用**：如果同一子话题在文本不同位置出现，标注交叉引用关系
6. **深化建议**：如果某个子话题讲得比较浅，建议后续深挖方向

## 输出格式

严格按以下JSON返回：
{
  "segments": [
    {
      "subtopic_name": "匹配到的子话题名称（或自动生成的名称）",
      "matched_subtopic_id": "匹配到的子话题ID（如果有的话，否则为null）",
      "icon": "子话题图标emoji",
      "dialect_original": "方言原话（完整保留原文，不改写）",
      "mandarin_text": "普通话转写（便于检索和理解）",
      "summary": "一两句话概括这段内容",
      "flags": [
        "⚠️ 待核实：具体待核实内容",
        "🆕 新发现：知识库中没有的新信息",
        "✅ 信息明确"
      ],
      "time_range": "估算的时间范围，如 [00:00-05:30]"
    }
  ],
  "cross_references": [
    "子话题A在[xx:xx]和[yy:yy]两处出现，内容关联：..."
  ],
  "deepening_suggestions": [
    "子话题B讲得比较浅，建议下次采访深挖：..."
  ]
}

注意：
- 如果没有明确的子话题划分，就按内容自然分段
- matched_subtopic_id 只在能明确匹配到已有子话题时填写
- flags 中每条都要具体说明是什么内容需要核实/是新发现`;

    const userPrompt = `## 话题
${topic?.name || '未知话题'}${topic?.description ? ` - ${topic.description}` : ''}

## 子话题列表（ID|名称|状态|摘要）
${subtopicList || '暂无子话题'}

## 已有知识（之前的采访内容）
${existingKnowledge ? existingKnowledge.substring(0, 1000) : '暂无已有知识'}

## 本次采访内容
${text}

请进行专业整理。`;

    const llmClient = this.getLLMClient();
    try {
      const response = await llmClient.invoke(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3 },
      );

      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error('LLM 整理失败:', err);
    }

    // 降级返回
    return {
      segments: [
        {
          subtopic_name: subtopics?.[0]?.name || '采访内容',
          matched_subtopic_id: subtopics?.[0]?.id || null,
          icon: subtopics?.[0]?.icon || '📌',
          dialect_original: text,
          mandarin_text: text,
          summary: '采访内容整理',
          flags: ['✅ 信息明确'],
          time_range: '[00:00-结束]',
        },
      ],
      cross_references: [],
      deepening_suggestions: [],
    };
  }

  /**
   * 获取话题的所有采访记录
   */
  async getByTopic(topicId: string) {
    const { data, error } = await this.client
      .from('interview_records')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`查询采访记录失败: ${error.message}`);
    return data || [];
  }
}
