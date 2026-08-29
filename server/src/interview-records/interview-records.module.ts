import { Module } from '@nestjs/common';
import { InterviewRecordsController } from './interview-records.controller';
import { InterviewRecordsService } from './interview-records.service';
import { SkillsModule } from '@/skills/skills.module';

@Module({
  imports: [SkillsModule],
  controllers: [InterviewRecordsController],
  providers: [InterviewRecordsService],
})
export class InterviewRecordsModule {}
