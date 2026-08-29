import { Injectable, BadRequestException } from '@nestjs/common';
import { ASRClient, LLMClient, Config, S3Storage } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as fs from 'fs';

@Injectable()
export class InterviewRecordsService {
  private get client() {
    return getSupabaseClient();
  }

  private getASRClient() {
    const config = new Config();
    return new ASRClient(config);
  }

  private getLLMClient() {
    const config = new Config();
    return new LLMClient(config);
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

  async uploadAudio(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('未收到音频文件');
    }

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

    console.log('音频已上传，key:', audioKey);

    return { audio_key: audioKey };
  }

  async transcribe(topicId: string, audioKey: string, subtopicId?: string) {
    const storage = this.getStorage();

    // 生成音频的签名 URL
    const audioUrl = await storage.generatePresignedUrl({
      key: audioKey,
      expireTime: 3600,
    });

    console.log('音频 URL 已生成');

    // 调用 ASR 识别
    const asrClient = this.getASRClient();
    let transcript = '';
    try {
      const result = await asrClient.recognize({
        uid: 'village-memory',
        url: audioUrl,
      });
      transcript = result.text || '';
      console.log('ASR 识别结果:', transcript.substring(0, 200));
    } catch (err) {
      console.error('ASR 识别失败:', err);
      throw new BadRequestException('语音识别失败，请重试');
    }

    if (!transcript) {
      throw new BadRequestException('未识别到语音内容');
    }

    // 使用 LLM 分析转写内容
    const analysis = await this.analyzeTranscript(topicId, transcript);

    // 保存采访记录
    const { data: record, error } = await this.client
      .from('interview_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
        audio_key: audioKey,
        transcript_text: transcript,
        dialect_original: analysis.segments?.[0]?.dialect_original || transcript,
        mandarin_text: analysis.segments?.[0]?.mandarin_text || transcript,
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

    return {
      transcript,
      segments: analysis.segments || [],
    };
  }

  async transcribeText(topicId: string, text: string, subtopicId?: string) {
    // 直接使用 LLM 分析文本内容
    const analysis = await this.analyzeTranscript(topicId, text);

    // 保存采访记录
    const { data: record, error } = await this.client
      .from('interview_records')
      .insert({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
        transcript_text: text,
        dialect_original: analysis.segments?.[0]?.dialect_original || text,
        mandarin_text: analysis.segments?.[0]?.mandarin_text || text,
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

    return {
      transcript: text,
      segments: analysis.segments || [],
    };
  }

  private async analyzeTranscript(topicId: string, text: string) {
    // 获取话题和子话题信息
    const { data: topic } = await this.client
      .from('topics')
      .select('name, description')
      .eq('id', topicId)
      .maybeSingle();

    const { data: subtopics } = await this.client
      .from('subtopics')
      .select('id, name')
      .eq('topic_id', topicId);

    const subtopicNames = (subtopics || []).map((s) => s.name).join('、');

    const llmClient = this.getLLMClient();
    const systemPrompt = `你是一个采访内容整理助手。你的任务是分析采访转写文本，并按子话题进行分段整理。

核心原则：
1. 方言原话要保留，不要改写
2. 提供普通话转写版本
3. 标记待核实的信息（日期、人名、事实性信息）
4. 标记新发现（知识库中没有的信息）

请严格按以下JSON格式返回：
{
  "segments": [
    {
      "subtopic_name": "子话题名称",
      "dialect_original": "方言原话（保留原文）",
      "mandarin_text": "普通话转写",
      "flags": ["⚠️ 待核实：xxx", "🆕 新发现：xxx", "✅ 信息明确"]
    }
  ]
}

如果没有明确的子话题划分，就按内容自然分段。`;

    const userPrompt = `话题：${topic?.name || '未知'}
${topic?.description ? `描述：${topic.description}` : ''}
${subtopicNames ? `子话题列表：${subtopicNames}` : ''}

采访内容：
${text}

请按子话题分段整理。`;

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
      console.error('LLM 分析失败:', err);
    }

    // 默认返回
    return {
      segments: [
        {
          subtopic_name: subtopicNames?.split('、')[0] || '采访内容',
          dialect_original: text,
          mandarin_text: text,
          flags: ['✅ 信息明确'],
        },
      ],
    };
  }

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
