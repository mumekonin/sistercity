import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schema/reports.schema';
import { Project } from '../../projects/schema/projects.schema';
import { Message } from '../../communication/schema/communication.schema';
import { Budget } from '../../budget/schema/budget.schema';
import { DocumentFile } from '../../documents/schema/documents.shema';
import { CreateReportDto } from '../dto/reports.dto';
import { ReportResponse, ReportListResponse } from '../response/reports.response';
import {Role,City,ReportType,ReportCity,ProjectStatus,MessageStatus,DocumentApprovalStatus} from '../../common/enum/enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<Report>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,

    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,

    @InjectModel(Budget.name)
    private readonly budgetModel: Model<Budget>,

    @InjectModel(DocumentFile.name)
    private readonly documentModel: Model<DocumentFile>,
  ) {}
  async getAllReports(currentUser: any): Promise<ReportListResponse[]> {
    let reports: any[] = [];
    // Super Admin sees all reports
    if (currentUser.role === Role.SUPER_ADMIN) {
      reports = await this.reportModel.find().sort({ createdAt: -1 }).lean();
    }
    // City Admin sees only their own reports
    if (currentUser.role === Role.CITY_ADMIN) {
      reports = await this.reportModel.find({ generatedBy: currentUser.userId }).sort({ createdAt: -1 }).lean();
    }
    if (!reports || reports.length === 0) return [];
    return reports.map((r: any) => this.mapToListResponse(r));
  }
  private mapToListResponse(report: any): ReportListResponse {
    return {
      id:report._id.toString(),
      reportType:  report.reportType,
      generatedBy: report.generatedBy.toString(),
      city:report.city,
      dateFrom:report.dateFrom,
      dateTo:report.dateTo,
      generatedAt: report.generatedAt,
      createdAt:report.createdAt,
    };
  }
  async generateReport( createReportDto: CreateReportDto, currentUser: any): Promise<ReportResponse> {
    //  dateFrom must be before dateTo 
    if (createReportDto.dateFrom >= createReportDto.dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }
    // City Admin cannot request BOTH 
    if (currentUser.role === Role.CITY_ADMIN && createReportDto.city === ReportCity.BOTH) {
      throw new ForbiddenException('City Admin can only generate reports for their own city');
    }
    // City Admin can only request own city 
    if (currentUser.role === Role.CITY_ADMIN) {
      if (createReportDto.city !== ReportCity.BOTH &&createReportDto.city !== currentUser.city ) {
        throw new ForbiddenException('You can only generate reports for your own city');
      }
    }
    // Compute report data 
    let data: Record<string, any> = {};
    switch (createReportDto.reportType) {
      case ReportType.PARTNERSHIP_PROGRESS:
        data = await this.computePartnershipProgress(createReportDto.city,createReportDto.dateFrom,createReportDto.dateTo);
        break;
      case ReportType.PROJECT_COMPLETION:
        data = await this.computeProjectCompletion(createReportDto.city,createReportDto.dateFrom,createReportDto.dateTo);
        break;
      case ReportType.COMMUNICATION_ACTIVITY:
        data = await this.computeCommunicationActivity(createReportDto.city,createReportDto.dateFrom,createReportDto.dateTo);
        break;
      case ReportType.BUDGET_UTILIZATION:
        data = await this.computeBudgetUtilization(createReportDto.city,createReportDto.dateFrom,createReportDto.dateTo);
        break;
      case ReportType.DOCUMENT_ACTIVITY:
        data = await this.computeDocumentActivity(createReportDto.city,createReportDto.dateFrom,createReportDto.dateTo);
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${createReportDto.reportType}`);
    }
    const report = new this.reportModel({
      reportType:  createReportDto.reportType,
      generatedBy: currentUser.userId,
      city:createReportDto.city,
      dateFrom:createReportDto.dateFrom,
      dateTo:createReportDto.dateTo,
      data,
      generatedAt: new Date(),
    });

    const saved = await report.save();
    return this.mapToResponse(saved);
  }

}