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
}
