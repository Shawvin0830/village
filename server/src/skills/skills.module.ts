import { Module, Global } from '@nestjs/common';
import { InterviewPlannerSkill } from './interview-planner.skill';
import { TranscriptOrganizerSkill } from './transcript-organizer.skill';
import { AuthorizationManagerSkill } from './authorization-manager.skill';
import { MaterialSearchSkill } from './material-search.skill';
import { VillageResearchSkill } from './village-research.skill';
import { MaterialEmbeddingSkill } from './material-embedding.skill';

@Global()
@Module({
  providers: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill, VillageResearchSkill, MaterialEmbeddingSkill],
  exports: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill, VillageResearchSkill, MaterialEmbeddingSkill],
})
export class SkillsModule {}
