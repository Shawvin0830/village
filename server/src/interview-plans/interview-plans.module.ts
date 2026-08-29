import { Module } from '@nestjs/common';
import { InterviewPlansController } from './interview-plans.controller';
import { InterviewPlansService } from './interview-plans.service';

@Module({
  controllers: [InterviewPlansController],
  providers: [InterviewPlansService],
})
export class InterviewPlansModule {}
