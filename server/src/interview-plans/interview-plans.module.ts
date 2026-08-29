import { Module } from '@nestjs/common';
import { InterviewPlansController } from './interview-plans.controller';
import { InterviewPlansService } from './interview-plans.service';
import { SkillsModule } from '@/skills/skills.module';
import { OperatorsModule } from '@/operators/operators.module';

@Module({
  imports: [SkillsModule, OperatorsModule],
  controllers: [InterviewPlansController],
  providers: [InterviewPlansService],
})
export class InterviewPlansModule {}
