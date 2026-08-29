import { Module } from '@nestjs/common';
import { InterviewPlannerSkill } from './interview-planner.skill';
import { TranscriptOrganizerSkill } from './transcript-organizer.skill';
import { AuthorizationManagerSkill } from './authorization-manager.skill';

@Module({
  providers: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill],
  exports: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill],
})
export class SkillsModule {}
