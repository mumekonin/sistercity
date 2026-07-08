import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Budget, BudgetSchema } from "./schema/budget.schema";
import { Equipment, EquipmentSchema } from "./schema/equipment.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Equipment.name, schema: EquipmentSchema }

    ])
  ],
  controllers: [],
  providers: [],
})
export class BudgetModule { }