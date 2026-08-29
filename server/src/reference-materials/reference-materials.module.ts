import { Module } from "@nestjs/common";
import { ReferenceMaterialsController } from "./reference-materials.controller";
import { ReferenceMaterialsService } from "./reference-materials.service";

@Module({
	controllers: [ReferenceMaterialsController],
	providers: [ReferenceMaterialsService],
	exports: [ReferenceMaterialsService],
})
export class ReferenceMaterialsModule {}
