import { Injectable } from '@nestjs/common';
import { TranscriptOrganizerSkill } from '@/skills/transcript-organizer.skill';

@Injectable()
export class InterviewRecordsService {
  constructor(private readonly organizerSkill: TranscriptOrganizerSkill) {}

  async uploadAudio(file: Express.Multer.File) {
    return this.organizerSkill.uploadAudio(file);
  }

  async transcribe(topicId: string, audioKey: string, subtopicId?: string, intervieweeName?: string) {
    return this.organizerSkill.transcribe(topicId, audioKey, subtopicId, intervieweeName);
  }

  async transcribeText(topicId: string, text: string, subtopicId?: string, intervieweeName?: string) {
    return this.organizerSkill.transcribeText(topicId, text, subtopicId, intervieweeName);
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

  /** 确认采访记录（归入资料库） */
  async confirmRecord(recordId: string, editedText?: string) {
    return this.organizerSkill.confirmRecord(recordId, editedText);
  }

  /** 驳回采访记录 */
  async rejectRecord(recordId: string) {
    return this.organizerSkill.rejectRecord(recordId);
  }

  /** 文档上传 + 解析 + 整理 */
  async uploadAndParseDocument(
    file: Express.Multer.File,
    topicId: string,
    subtopicId?: string,
    intervieweeName?: string,
  ) {
    return this.organizerSkill.uploadAndParseDocument(file, topicId, subtopicId, intervieweeName);
  }
}
