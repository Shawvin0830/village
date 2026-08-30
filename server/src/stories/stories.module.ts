import { Module } from '@nestjs/common'
import { StoriesController } from './stories.controller'
import { StoriesService } from './stories.service'
import { SkillsModule } from '@/skills/skills.module'

@Module({
  imports: [SkillsModule],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
