import { Module } from '@nestjs/common';
import { InterviewScriptsController } from './interview-scripts.controller';
import { InterviewScriptsService } from './interview-scripts.service';

@Module({
  controllers: [InterviewScriptsController],
  providers: [InterviewScriptsService],
  exports: [InterviewScriptsService],
})
export class InterviewScriptsModule {}
