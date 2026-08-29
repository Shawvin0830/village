import { Module } from '@nestjs/common';
import { InterviewPlannerSkill } from './interview-planner.skill';
import { TranscriptOrganizerSkill } from './transcript-organizer.skill';
import { AuthorizationManagerSkill } from './authorization-manager.skill';
import { MaterialSearchSkill } from './material-search.skill';

@Module({
  providers: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill],
  exports: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill],
})
export class SkillsModule {}
