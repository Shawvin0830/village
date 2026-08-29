import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { SkillsModule } from '@/skills/skills.module';
import { OperatorsModule } from '@/operators/operators.module';

@Module({
  imports: [SkillsModule, OperatorsModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
