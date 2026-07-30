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
import {
  ReportResponse,
  ReportListResponse,
} from '../response/reports.response';
import {
  Role,
  City,
  ReportType,
  ReportCity,
  ProjectStatus,
  MessageStatus,
  DocumentApprovalStatus,
} from '../../common/enum/enum';

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

  // Get All Reports
  async getAllReports(currentUser: any): Promise<ReportListResponse[]> {
    let reports: any[] = [];

    if (currentUser.role === Role.SUPER_ADMIN) {
      reports = await this.reportModel.find().sort({ createdAt: -1 }).lean();
    }

    if (currentUser.role === Role.CITY_ADMIN) {
      reports = await this.reportModel
        .find({ generatedBy: currentUser.userId })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!reports || reports.length === 0) return [];
    return reports.map((r: any) => this.mapToListResponse(r));
  }

  // Generate Report
  async generateReport(
    createReportDto: CreateReportDto,
    currentUser: any,
  ): Promise<ReportResponse> {
    // dateFrom must be before dateTo
    if (createReportDto.dateFrom >= createReportDto.dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    // City Admin cannot request BOTH
    if (
      currentUser.role === Role.CITY_ADMIN &&
      createReportDto.city === ReportCity.BOTH
    ) {
      throw new ForbiddenException(
        'City Admin can only generate reports for their own city',
      );
    }

    // City Admin can only request own city
    if (currentUser.role === Role.CITY_ADMIN) {
      if (
        createReportDto.city !== ReportCity.BOTH &&
        createReportDto.city !== currentUser.city
      ) {
        throw new ForbiddenException(
          'You can only generate reports for your own city',
        );
      }
    }

    // Compute report data
    let data: Record<string, any> = {};

    switch (createReportDto.reportType) {
      case ReportType.PARTNERSHIP_PROGRESS:
        data = await this.computePartnershipProgress(
          createReportDto.city,
          createReportDto.dateFrom,
          createReportDto.dateTo,
        );
        break;

      case ReportType.PROJECT_COMPLETION:
        data = await this.computeProjectCompletion(
          createReportDto.city,
          createReportDto.dateFrom,
          createReportDto.dateTo,
        );
        break;

      case ReportType.COMMUNICATION_ACTIVITY:
        data = await this.computeCommunicationActivity(
          createReportDto.city,
          createReportDto.dateFrom,
          createReportDto.dateTo,
        );
        break;

      case ReportType.BUDGET_UTILIZATION:
        data = await this.computeBudgetUtilization(
          createReportDto.city,
          createReportDto.dateFrom,
          createReportDto.dateTo,
        );
        break;

      case ReportType.DOCUMENT_ACTIVITY:
        data = await this.computeDocumentActivity(
          createReportDto.city,
          createReportDto.dateFrom,
          createReportDto.dateTo,
        );
        break;

      default:
        throw new BadRequestException(
          `Unknown report type: ${createReportDto.reportType}`,
        );
    }

    const report = new this.reportModel({
      reportType: createReportDto.reportType,
      generatedBy: currentUser.userId,
      city: createReportDto.city,
      dateFrom: createReportDto.dateFrom,
      dateTo: createReportDto.dateTo,
      data,
      generatedAt: new Date(),
    });

    const saved = await report.save();
    return this.mapToResponse(saved);
  }

  // Get Report By Id
  async getReportById(
    reportId: string,
    currentUser: any,
  ): Promise<ReportResponse> {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) throw new NotFoundException('Report not found');

    if (
      currentUser.role === Role.CITY_ADMIN &&
      (report as any).generatedBy.toString() !== currentUser.userId
    ) {
      throw new ForbiddenException('You can only view your own reports');
    }

    return this.mapToResponse(report);
  }
  // Download Report
  async downloadReport(
    reportId: string,
    fileType: string,
    currentUser: any,
    res: any,
  ): Promise<void> {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) throw new NotFoundException('Report not found');

    if (
      currentUser.role === Role.CITY_ADMIN &&
      (report as any).generatedBy.toString() !== currentUser.userId
    ) {
      throw new ForbiddenException('You can only download your own reports');
    }

    if (fileType === 'excel') {
      await this.downloadAsExcel(report, res);
    } else {
      await this.downloadAsPdf(report, res);
    }
  }

  // Private — Build City Filter
  private buildCityFilter(city: ReportCity): any {
    if (city === ReportCity.BOTH) return {};

    // A city belongs in its report either because it proposed the project or
    // because it holds an assignment on it — the two are independent.
    const isAdama = city === ReportCity.ADAMA;
    const assignmentPath = isAdama ? 'adama.department' : 'aurora.department';

    return {
      $or: [
        { proposedBy: isAdama ? City.ADAMA : City.AURORA },
        { [assignmentPath]: { $exists: true, $ne: null } },
      ],
    };
  }
  // Private — Compute PARTNERSHIP_PROGRESS
  private async computePartnershipProgress(
    city: ReportCity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);
    const projects = await this.projectModel
      .find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } })
      .lean();

    const byStatus = {
      proposed: 0,
      approved: 0,
      planned: 0,
      inProgress: 0,
      onHold: 0,
      delayed: 0,
      completed: 0,
      rejected: 0,
    };

    projects.forEach((p: any) => {
      switch (p.status) {
        case ProjectStatus.PROPOSED:
          byStatus.proposed++;
          break;
        case ProjectStatus.APPROVED:
          byStatus.approved++;
          break;
        case ProjectStatus.PLANNED:
          byStatus.planned++;
          break;
        case ProjectStatus.IN_PROGRESS:
          byStatus.inProgress++;
          break;
        case ProjectStatus.ON_HOLD:
          byStatus.onHold++;
          break;
        case ProjectStatus.DELAYED:
          byStatus.delayed++;
          break;
        case ProjectStatus.COMPLETED:
          byStatus.completed++;
          break;
        case ProjectStatus.REJECTED:
          byStatus.rejected++;
          break;
      }
    });

    return {
      totalProjects: projects.length,
      byStatus,
      projects: projects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        status: p.status,
        progressPercent: p.progressPercent,
        proposedBy: p.proposedBy,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    };
  }
  // Private  Compute PROJECT_COMPLETION
  private async computeProjectCompletion(
    city: ReportCity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);

    const completedProjects = await this.projectModel
      .find({
        ...cityFilter,
        status: ProjectStatus.COMPLETED,
        endDate: { $gte: dateFrom, $lte: dateTo }, // ← fixed
      })
      .lean();

    const totalProjects = await this.projectModel.countDocuments({
      ...cityFilter,
      createdAt: { $gte: dateFrom, $lte: dateTo },
    });

    const completionRate =
      totalProjects === 0
        ? 0
        : Math.round((completedProjects.length / totalProjects) * 100);

    return {
      totalProjects,
      totalCompleted: completedProjects.length,
      completionRate,
      projects: completedProjects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        plannedEnd: p.endDate,
        status: p.status,
      })),
    };
  }

  // Private  Compute COMMUNICATION_ACTIVITY
  private async computeCommunicationActivity(
    city: ReportCity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, any>> {
    let cityFilter: any = {};
    if (city !== ReportCity.BOTH) {
      cityFilter = {
        $or: [{ 'from.city': city }, { 'to.city': city }],
      };
    }

    const messages = await this.messageModel
      .find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } })
      .lean();

    // `city` is ReportCity, so for a partnership-wide report it is BOTH and never
    // equals a message's city — comparing directly reported zero sent and received.
    const countSent = (c: City) =>
      messages.filter((m: any) => m.from.city === c).length;
    const countReceived = (c: City) =>
      messages.filter((m: any) => m.to.city === c).length;

    const byCity = {
      [City.ADAMA]: {
        sent: countSent(City.ADAMA),
        received: countReceived(City.ADAMA),
      },
      [City.AURORA]: {
        sent: countSent(City.AURORA),
        received: countReceived(City.AURORA),
      },
    };

    const isBoth = city === ReportCity.BOTH;
    // Every message in a joint report was sent by one city and received by the
    // other, so the totals coincide; `byCity` carries the meaningful split.
    const sent = isBoth
      ? messages.length
      : countSent(city as unknown as City);
    const received = isBoth
      ? messages.length
      : countReceived(city as unknown as City);
    const overdue = messages.filter(
      (m: any) =>
        m.responseDeadline < new Date() &&
        (m.status === MessageStatus.SENT || m.status === MessageStatus.READ),
    ).length;

    const repliedMessages = messages.filter((m: any) => m.readAt !== null);
    let avgResponseDays = 0;
    if (repliedMessages.length > 0) {
      const totalDays = repliedMessages.reduce((sum: number, m: any) => {
        const diffMs = m.readAt - m.createdAt;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgResponseDays =
        Math.round((totalDays / repliedMessages.length) * 10) / 10;
    }

    const byType: Record<string, number> = {};
    messages.forEach((m: any) => {
      byType[m.messageType] = (byType[m.messageType] || 0) + 1;
    });

    return {
      totalMessages: messages.length,
      sent,
      received,
      byCity,
      overdue,
      avgResponseDays,
      byType,
    };
  }

  // Private — Compute BUDGET_UTILIZATION
  private async computeBudgetUtilization(
    city: ReportCity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);

    const projects = await this.projectModel
      .find({
        ...cityFilter,
        createdAt: { $gte: dateFrom, $lte: dateTo },
        budgetTotal: { $gt: 0 },
      })
      .lean();

    const projectIds = projects.map((p: any) => p._id);
    const budgets = await this.budgetModel
      .find({ project: { $in: projectIds } })
      .lean();

    let totalPlanned = 0;
    let totalSpent = 0;

    const byProject = projects.map((project: any) => {
      const budget = budgets.find(
        (b: any) => b.project.toString() === project._id.toString(),
      );
      const planned = project.budgetTotal;
      const spent = budget ? (budget as any).spentTotal : 0;
      const remaining = planned - spent;
      const percentageUsed =
        planned === 0 ? 0 : Math.round((spent / planned) * 100);

      totalPlanned += planned;
      totalSpent += spent;

      return {
        projectId: project._id.toString(),
        projectTitle: project.title,
        planned,
        spent,
        remaining,
        percentageUsed,
        isOverBudget: spent > planned,
      };
    });

    return {
      totalPlanned,
      totalSpent,
      remaining: totalPlanned - totalSpent,
      percentageUsed:
        totalPlanned === 0 ? 0 : Math.round((totalSpent / totalPlanned) * 100),
      isOverBudget: totalSpent > totalPlanned,
      byProject,
    };
  }
  // Private — Compute DOCUMENT_ACTIVITY
  private async computeDocumentActivity(
    city: ReportCity,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Record<string, any>> {
    let cityFilter: any = {};
    if (city !== ReportCity.BOTH) {
      cityFilter = { city };
    }

    const documents = await this.documentModel
      .find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } })
      .lean();

    const byStatus = { draft: 0, approved: 0, rejected: 0 };
    documents.forEach((d: any) => {
      switch (d.approvalStatus) {
        case DocumentApprovalStatus.DRAFT:
          byStatus.draft++;
          break;
        case DocumentApprovalStatus.APPROVED:
          byStatus.approved++;
          break;
        case DocumentApprovalStatus.REJECTED:
          byStatus.rejected++;
          break;
      }
    });

    const byCategory: Record<string, number> = {};
    documents.forEach((d: any) => {
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    });

    return {
      totalDocuments: documents.length,
      byStatus,
      byCategory,
    };
  }
  // Private — Download as PDF
  private async downloadAsPdf(report: any, res: any): Promise<void> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${report._id}.pdf`,
    );

    doc.pipe(res);

    doc.fontSize(20).text('Sister City Portal', { align: 'center' });
    doc
      .fontSize(14)
      .text(`Report Type: ${report.reportType}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`City: ${report.city}`);
    doc.text(
      `Period: ${new Date(report.dateFrom).toDateString()} - ${new Date(report.dateTo).toDateString()}`,
    );
    doc.text(`Generated At: ${new Date(report.generatedAt).toDateString()}`);
    doc.moveDown();
    doc.fontSize(14).text('Report Data:');
    doc.moveDown();
    doc.fontSize(10).text(JSON.stringify(report.data, null, 2));

    doc.end();
  }
  // Private — Download as Excel
  private async downloadAsExcel(report: any, res: any): Promise<void> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-${report._id}.xlsx`,
    );

    sheet.addRow(['Sister City Portal Report']);
    sheet.addRow(['Report Type', report.reportType]);
    sheet.addRow(['City', report.city]);
    sheet.addRow([
      'Period',
      `${new Date(report.dateFrom).toDateString()} - ${new Date(report.dateTo).toDateString()}`,
    ]);
    sheet.addRow(['Generated At', new Date(report.generatedAt).toDateString()]);
    sheet.addRow([]);
    sheet.addRow(['Report Data']);

    const flattenData = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (
          typeof value === 'object' &&
          !Array.isArray(value) &&
          value !== null
        ) {
          flattenData(value, `${prefix}${key}.`);
        } else if (Array.isArray(value)) {
          sheet.addRow([`${prefix}${key}`, JSON.stringify(value)]);
        } else {
          sheet.addRow([`${prefix}${key}`, value]);
        }
      });
    };

    flattenData(report.data);
    await workbook.xlsx.write(res);
    res.end();
  }
  // Response Mappers
  private mapToResponse(report: any): ReportResponse {
    return {
      id: report._id.toString(),
      reportType: report.reportType,
      generatedBy: report.generatedBy.toString(),
      city: report.city,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      data: report.data,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
    };
  }

  private mapToListResponse(report: any): ReportListResponse {
    return {
      id: report._id.toString(),
      reportType: report.reportType,
      generatedBy: report.generatedBy.toString(),
      city: report.city,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
    };
  }
}
