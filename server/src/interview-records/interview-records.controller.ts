import { Controller, Post, Get, Body, Param, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InterviewRecordsService } from './interview-records.service';

@Controller('interview-records')
export class InterviewRecordsController {
  constructor(private readonly recordsService: InterviewRecordsService) {}

  @Post('upload-audio')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    console.log('收到音频文件:', file?.originalname, '大小:', file?.size);
    const data = await this.recordsService.uploadAudio(file);
    return { code: 200, msg: 'success', data };
  }

  @Post('transcribe')
  @HttpCode(200)
  async transcribe(
    @Body() body: { topic_id: string; subtopic_id?: string; audio_key: string; interviewee_name?: string },
  ) {
    const data = await this.recordsService.transcribe(
      body.topic_id,
      body.audio_key,
      body.subtopic_id,
      body.interviewee_name,
    );
    return { code: 200, msg: 'success', data };
  }

  @Post('transcribe-text')
  @HttpCode(200)
  async transcribeText(
    @Body() body: { topic_id: string; subtopic_id?: string; text: string; interviewee_name?: string },
  ) {
    const data = await this.recordsService.transcribeText(
      body.topic_id,
      body.text,
      body.subtopic_id,
      body.interviewee_name,
    );
    return { code: 200, msg: 'success', data };
  }

  @Get(':topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.recordsService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }

  /** v3 新增：获取话题的故事地图 */
  @Get(':topicId/story-map')
  @HttpCode(200)
  async getStoryMap(@Param('topicId') topicId: string) {
    const data = await this.recordsService.getStoryMap(topicId);
    return { code: 200, msg: 'success', data };
  }

  /** v3 新增：一步从文本到故事档案馆 */
  @Post('transcribe-text-to-archive')
  @HttpCode(200)
  async transcribeTextToArchive(
    @Body() body: {
      topic_id: string;
      subtopic_id?: string;
      text: string;
      meta?: { title?: string; subtitle?: string; note?: string };
    },
  ) {
    const data = await this.recordsService.transcribeTextToArchive(
      body.topic_id,
      body.text,
      body.subtopic_id,
      body.meta,
    );
    return { code: 200, msg: 'success', data };
  }

  /** v3 新增：渲染话题的故事档案馆 HTML */
  @Post(':topicId/render-archive')
  @HttpCode(200)
  async renderTopicArchive(
    @Param('topicId') topicId: string,
    @Body() body: { meta?: { title?: string; subtitle?: string; note?: string } },
  ) {
    const data = await this.recordsService.renderTopicArchive(topicId, body.meta);
    return { code: 200, msg: 'success', data };
  }

  /** 确认采访记录（归入资料库） */
  @Post(':recordId/confirm')
  @HttpCode(200)
  async confirmRecord(
    @Param('recordId') recordId: string,
    @Body() body: { edited_text?: string; subtopic_id?: string },
  ) {
    const data = await this.recordsService.confirmRecord(recordId, body.edited_text, body.subtopic_id);
    return { code: 200, msg: 'success', data };
  }

  /** 驳回采访记录 */
  @Post(':recordId/reject')
  @HttpCode(200)
  async rejectRecord(@Param('recordId') recordId: string) {
    const data = await this.recordsService.rejectRecord(recordId);
    return { code: 200, msg: 'success', data };
  }

  /** 文档上传 + 解析 + 整理 */
  @Post('upload-document')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('document', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { topic_id: string; subtopic_id?: string; interviewee_name?: string },
  ) {
    console.log('收到文档文件:', file?.originalname, '大小:', file?.size);
    const data = await this.recordsService.uploadAndParseDocument(
      file,
      body.topic_id,
      body.subtopic_id,
      body.interviewee_name,
    );
    return { code: 200, msg: 'success', data };
  }
}
