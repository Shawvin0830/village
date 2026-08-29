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
  async transcribe(@Body() body: { topic_id: string; subtopic_id?: string; audio_key: string }) {
    const data = await this.recordsService.transcribe(
      body.topic_id,
      body.audio_key,
      body.subtopic_id,
    );
    return { code: 200, msg: 'success', data };
  }

  @Post('transcribe-text')
  @HttpCode(200)
  async transcribeText(@Body() body: { topic_id: string; subtopic_id?: string; text: string }) {
    const data = await this.recordsService.transcribeText(
      body.topic_id,
      body.text,
      body.subtopic_id,
    );
    return { code: 200, msg: 'success', data };
  }

  @Get(':topicId')
  @HttpCode(200)
  async getByTopic(@Param('topicId') topicId: string) {
    const data = await this.recordsService.getByTopic(topicId);
    return { code: 200, msg: 'success', data };
  }
}
