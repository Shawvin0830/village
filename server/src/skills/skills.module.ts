import { Module, Global } from '@nestjs/common';
import { InterviewPlannerSkill } from './interview-planner.skill';
import { TranscriptOrganizerSkill } from './transcript-organizer.skill';
import { AuthorizationManagerSkill } from './authorization-manager.skill';
import { MaterialSearchSkill } from './material-search.skill';
import { VillageResearchSkill } from './village-research.skill';
import { MaterialEmbeddingSkill } from './material-embedding.skill';
import { StoryGenerationSkill } from './story-generation.skill';

@Global()
@Module({
  providers: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill, VillageResearchSkill, MaterialEmbeddingSkill, StoryGenerationSkill],
  exports: [InterviewPlannerSkill, TranscriptOrganizerSkill, AuthorizationManagerSkill, MaterialSearchSkill, VillageResearchSkill, MaterialEmbeddingSkill, StoryGenerationSkill],
})
export class SkillsModule {}
