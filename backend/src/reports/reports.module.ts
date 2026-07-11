// src/reports/reports.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schema/reports.schema';
import { Project, ProjectSchema } from '../projects/schema/projects.schema';
import { Message, MessageSchema } from '../communication/schema/communication.schema';
import { Budget, BudgetSchema } from '../budget/schema/budget.schema';
import { DocumentFile, DocumentFileSchema } from '../documents/schema/documents.shema';
import { ReportsController } from './controller/reports.controller';
import { ReportsService } from './service/reports.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name,schema: ReportSchema },
      { name: Project.name,schema: ProjectSchema },
      { name: Message.name,schema: MessageSchema },
      { name: Budget.name,schema: BudgetSchema },
      { name: DocumentFile.name, schema: DocumentFileSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers:   [ReportsService],
})
export class ReportsModule {}