import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { TopicsModule } from '@/topics/topics.module';
import { InterviewPlansModule } from '@/interview-plans/interview-plans.module';
import { InterviewRecordsModule } from '@/interview-records/interview-records.module';
import { SkillsModule } from '@/skills/skills.module';
import { ReferenceMaterialsModule } from '@/reference-materials/reference-materials.module';

@Module({
  imports: [TopicsModule, InterviewPlansModule, InterviewRecordsModule, SkillsModule, ReferenceMaterialsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
