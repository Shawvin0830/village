import { Module } from '@nestjs/common'
import { MaterialsController } from './materials.controller'
import { MaterialsService } from './materials.service'
import { SkillsModule } from '@/skills/skills.module'
import { OperatorsModule } from '@/operators/operators.module'

@Module({
  imports: [SkillsModule, OperatorsModule],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
