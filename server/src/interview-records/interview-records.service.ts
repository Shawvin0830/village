import { Injectable } from '@nestjs/common';
import { TranscriptOrganizerSkill } from '@/skills/transcript-organizer.skill';

@Injectable()
export class InterviewRecordsService {
  constructor(private readonly organizerSkill: TranscriptOrganizerSkill) {}

  async uploadAudio(file: Express.Multer.File) {
    return this.organizerSkill.uploadAudio(file);
  }

  async transcribe(topicId: string, audioKey: string, subtopicId?: string) {
    return this.organizerSkill.transcribe(topicId, audioKey, subtopicId);
  }

  async transcribeText(topicId: string, text: string, subtopicId?: string) {
    return this.organizerSkill.transcribeText(topicId, text, subtopicId);
  }

  async getByTopic(topicId: string) {
    return this.organizerSkill.getByTopic(topicId);
  }

  /** v3 新增：获取话题下所有故事线的最新导览叙事 */
  async getStoryMap(topicId: string) {
    return this.organizerSkill.getStoryMap(topicId);
  }

  /** v3 新增：一步从文本到故事档案馆（整理 + 存库 + 汇总 + 渲染 HTML + 上传） */
  async transcribeTextToArchive(
    topicId: string,
    text: string,
    subtopicId?: string,
    meta?: { title?: string; subtitle?: string; note?: string },
  ) {
    return this.organizerSkill.transcribeTextToArchive(topicId, text, subtopicId, meta);
  }

  /** v3 新增：渲染某话题已积累的全部采访为故事档案馆 HTML */
  async renderTopicArchive(
    topicId: string,
    meta?: { title?: string; subtitle?: string; note?: string },
  ) {
    return this.organizerSkill.renderTopicArchive(topicId, meta);
  }
}
