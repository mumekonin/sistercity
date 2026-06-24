import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController} from "./controller/projects.controller";
import {ProjectsService}  from "./service/projects.service";
import{ ProjectSchema,Project} from "./schema/projects.schema";
@Module({
  imports: [
        MongooseModule.forFeature([
      { name: Project.name,schema: ProjectSchema  },
    ])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule{}
