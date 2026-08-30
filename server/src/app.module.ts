import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TopicsModule } from '@/topics/topics.module';
import { InterviewPlansModule } from '@/interview-plans/interview-plans.module';
import { InterviewRecordsModule } from '@/interview-records/interview-records.module';
import { MaterialsModule } from '@/materials/materials.module';
import { SkillsModule } from '@/skills/skills.module';
import { InterviewScriptsModule } from '@/interview-scripts/interview-scripts.module';
import { OperatorsModule } from '@/operators/operators.module';
import { StoriesModule } from '@/stories/stories.module';

@Module({
  imports: [OperatorsModule, TopicsModule, InterviewPlansModule, InterviewRecordsModule, MaterialsModule, SkillsModule, InterviewScriptsModule, StoriesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
