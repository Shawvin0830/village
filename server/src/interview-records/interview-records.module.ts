import { Module } from '@nestjs/common';
import { InterviewRecordsController } from './interview-records.controller';
import { InterviewRecordsService } from './interview-records.service';

@Module({
  controllers: [InterviewRecordsController],
  providers: [InterviewRecordsService],
})
export class InterviewRecordsModule {}
