import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Project, ProjectSchema } from "src/projects/schema/projects.schema";
import { CloudinaryModule } from "src/common/cloudinary/cloudinary.module";
import { Budget, BudgetSchema } from "./schema/budget.schema";
import { Equipment, EquipmentSchema } from "./schema/equipment.schema";
import { BudgetController } from "./controller/budget.controller";
import { EquipmentController } from "./controller/equipment.controller";
import { BudgetService } from "./service/budget.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Equipment.name, schema: EquipmentSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [BudgetController, EquipmentController],
  providers: [BudgetService],
})
export class BudgetModule { }