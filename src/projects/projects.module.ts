import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController} from "./controller/projects.controller";
import {ProjectsService}  from "./service/projects.service";
import{ ProjectSchema,Project} from "./schema/projects.schema";
import{User,userSchema} from "../users/schema/users.shema";
@Module({
  imports: [
        MongooseModule.forFeature([
      { name: Project.name,schema: ProjectSchema  },
      { name: User.name,schema: userSchema  }
    ])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule{}
