import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { SkillsModule } from '@/skills/skills.module';

@Module({
  imports: [SkillsModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
