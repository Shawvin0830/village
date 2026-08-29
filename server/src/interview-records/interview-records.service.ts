import { Injectable } from '@nestjs/common';
import { TranscriptOrganizerSkill } from '@/skills/transcript-organizer.skill';
import { OperatorsService, type OperatorHeaders } from '@/operators/operators.service';

@Injectable()
export class InterviewRecordsService {
  constructor(
    private readonly organizerSkill: TranscriptOrganizerSkill,
    private readonly operatorsService: OperatorsService,
  ) {}

  async uploadAudio(file: Express.Multer.File, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    return this.organizerSkill.uploadAudio(file);
  }

  async transcribe(topicId: string, audioKey: string, subtopicId?: string, intervieweeName?: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    const result = await this.organizerSkill.transcribe(topicId, audioKey, subtopicId, operator);
    await this.operatorsService.writeLog({
      operator,
      actionType: 'create_interview_record',
      targetType: 'interview_record',
      targetId: result.record_id || null,
      targetName: '采访整理',
      summary: `${operator.display_name} 整理了一条采访记录`,
    });
    return result;
  }

  async transcribeText(topicId: string, text: string, subtopicId?: string, intervieweeName?: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    const result = await this.organizerSkill.transcribeText(topicId, text, subtopicId, operator);
    await this.operatorsService.writeLog({
      operator,
      actionType: 'create_interview_record',
      targetType: 'interview_record',
      targetId: result.record_id || null,
      targetName: '采访整理',
      summary: `${operator.display_name} 录入并整理了一条采访文本`,
    });
    return result;
  }

  async getByTopic(topicId: string) {
    return this.organizerSkill.getByTopic(topicId);
  }

  async getStoryMap(topicId: string) {
    return this.organizerSkill.getStoryMap(topicId);
  }

  async transcribeTextToArchive(
    topicId: string,
    text: string,
    subtopicId?: string,
    meta?: { title?: string; subtitle?: string; note?: string },
    headers?: OperatorHeaders,
  ) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    return this.organizerSkill.transcribeTextToArchive(topicId, text, subtopicId, meta);
  }

  async renderTopicArchive(
    topicId: string,
    meta?: { title?: string; subtitle?: string; note?: string },
  ) {
    return this.organizerSkill.renderTopicArchive(topicId, meta);
  }

  async confirmRecord(recordId: string, editedText?: string, subtopicId?: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    return this.organizerSkill.confirmRecord(recordId, editedText, subtopicId);
  }

  async rejectRecord(recordId: string, headers?: OperatorHeaders) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    return this.organizerSkill.rejectRecord(recordId);
  }

  async uploadAndParseDocument(
    file: Express.Multer.File,
    topicId: string,
    subtopicId?: string,
    intervieweeName?: string,
    headers?: OperatorHeaders,
  ) {
    const operator = await this.operatorsService.require(headers || {});
    this.operatorsService.assertCan(operator, 'create_interview_record');
    return this.organizerSkill.uploadAndParseDocument(file, topicId, subtopicId, intervieweeName, operator);
  }
}
