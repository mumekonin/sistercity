import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schema/reports.schema';
import { Project } from '../../projects/schema/projects.schema';
import { Message } from '../../communication/schema/communication.schema';
import { Budget } from '../../budget/schema/budget.schema';
import { DocumentFile } from '../../documents/schema/documents.shema';
import { CreateReportDto } from '../dto/reports.dto';
import { ReportResponse, ReportListResponse } from '../response/reports.response';
import { Role, City, ReportType, ReportCity, ProjectStatus, MessageStatus, DocumentApprovalStatus } from '../../common/enum/enum';

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
  ) { }
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
  async generateReport(createReportDto: CreateReportDto, currentUser: any): Promise<ReportResponse> {
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
      if (createReportDto.city !== ReportCity.BOTH && createReportDto.city !== currentUser.city) {
        throw new ForbiddenException('You can only generate reports for your own city');
      }
    }
    // Compute report data 
    let data: Record<string, any> = {};
    switch (createReportDto.reportType) {
      case ReportType.PARTNERSHIP_PROGRESS:
        data = await this.computePartnershipProgress(createReportDto.city, createReportDto.dateFrom, createReportDto.dateTo);
        break;
      case ReportType.PROJECT_COMPLETION:
        data = await this.computeProjectCompletion(createReportDto.city, createReportDto.dateFrom, createReportDto.dateTo);
        break;
      case ReportType.COMMUNICATION_ACTIVITY:
        data = await this.computeCommunicationActivity(createReportDto.city, createReportDto.dateFrom, createReportDto.dateTo);
        break;
      case ReportType.BUDGET_UTILIZATION:
        data = await this.computeBudgetUtilization(createReportDto.city, createReportDto.dateFrom, createReportDto.dateTo);
        break;
      case ReportType.DOCUMENT_ACTIVITY:
        data = await this.computeDocumentActivity(createReportDto.city, createReportDto.dateFrom, createReportDto.dateTo);
        break;
      default:
        throw new BadRequestException(`Unknown report type: ${createReportDto.reportType}`);
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
  private buildCityFilter(city: ReportCity): any {
    if (city === ReportCity.BOTH) {
      return {};  // no city filter — all cities
    }
    return {
      $or: [
        { proposedBy: city },
        {
          'adama.department': { $exists: true, $ne: null },
          proposedBy: city === ReportCity.ADAMA
            ? City.ADAMA : City.AURORA
        },
        {
          'aurora.department': { $exists: true, $ne: null },
          proposedBy: city === ReportCity.AURORA
            ? City.AURORA : City.ADAMA
        },
      ]
    };
  }
  //  PRIVATE  Compute PARTNERSHIP_PROGRESS
  private async computePartnershipProgress(city: ReportCity, dateFrom: Date, dateTo: Date): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);
    const projects = await this.projectModel.find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo }, }).lean();
    // Count by status
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
        case ProjectStatus.PROPOSED: byStatus.proposed++;
          break;
        case ProjectStatus.APPROVED: byStatus.approved++;
          break;
        case ProjectStatus.PLANNED: byStatus.planned++;
          break;
        case ProjectStatus.IN_PROGRESS: byStatus.inProgress++;
          break;
        case ProjectStatus.ON_HOLD: byStatus.onHold++;
          break;
        case ProjectStatus.DELAYED: byStatus.delayed++;
          break;
        case ProjectStatus.COMPLETED: byStatus.completed++;
          break;
        case ProjectStatus.REJECTED: byStatus.rejected++;
          break;
      }
    });
    return {
      totalProjects: projects.length, byStatus,
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
  //  PRIVATE — Compute PROJECT_COMPLETION
  private async computeProjectCompletion(city: ReportCity, dateFrom: Date, dateTo: Date): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);
    // All completed projects in period
    const completedProjects = await this.projectModel.find({ ...cityFilter, status: ProjectStatus.COMPLETED, actualEndDate: { $gte: dateFrom, $lte: dateTo } }).lean();
    let onTime = 0;
    let delayed = 0;
    completedProjects.forEach((p: any) => {
      if (p.actualEndDate && p.endDate) {
        if (p.actualEndDate <= p.endDate) {
          onTime++;
        } else {
          delayed++;
        }
      }
    });
    // Total projects in period for rate calculation
    const totalProjects = await this.projectModel.countDocuments({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } });
    const completionRate = totalProjects === 0 ? 0 : Math.round((completedProjects.length / totalProjects) * 100);
    return {
      totalProjects,
      totalCompleted: completedProjects.length,
      onTime,
      delayed,
      completionRate,
      projects: completedProjects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        plannedEnd: p.endDate,
        actualEnd: p.actualEndDate,
        isOnTime: p.actualEndDate <= p.endDate,
      })),
    };
  }
  //  PRIVATE  Compute COMMUNICATION_ACTIVITY
  private async computeCommunicationActivity(city: ReportCity, dateFrom: Date, dateTo: Date): Promise<Record<string, any>> {
    let cityFilter: any = {};
    if (city !== ReportCity.BOTH) {
      cityFilter = {
        $or: [
          { 'from.city': city },
          { 'to.city': city },
        ]
      };
    }
    const messages = await this.messageModel.find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } }).lean();
    // Count sent and received
    const sent = messages.filter((m: any) => m.from.city === city).length;
    const received = messages.filter((m: any) => m.to.city === city).length;
    // Count overdue
    const overdue = messages.filter((m: any) => m.responseDeadline < new Date() &&
      (m.status === MessageStatus.SENT || m.status === MessageStatus.READ)).length;
    // Average response time in days
    const repliedMessages = messages.filter((m: any) => m.readAt !== null);
    let avgResponseDays = 0;
    if (repliedMessages.length > 0) {
      const totalDays = repliedMessages.reduce((sum: number, m: any) => {
        const diffMs = m.readAt - m.createdAt;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgResponseDays = Math.round(
        (totalDays / repliedMessages.length) * 10
      ) / 10;
    }
    // Count by message type
    const byType: Record<string, number> = {};
    messages.forEach((m: any) => {
      byType[m.messageType] = (byType[m.messageType] || 0) + 1;
    });
    return {
      totalMessages: messages.length,
      sent,
      received,
      overdue,
      avgResponseDays,
      byType,
    };
  }
  //  PRIVATE Compute BUDGET_UTILIZATION
  private async computeBudgetUtilization(city: ReportCity, dateFrom: Date, dateTo: Date): Promise<Record<string, any>> {
    const cityFilter = this.buildCityFilter(city);
    // Get projects in period
    const projects = await this.projectModel.find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo }, budgetTotal: { $gt: 0 }, }).lean();
    const projectIds = projects.map((p: any) => p._id);
    // Get budgets for these projects
    const budgets = await this.budgetModel.find({ project: { $in: projectIds } }).lean();
    // Calculate totals
    let totalPlanned = 0;
    let totalSpent = 0;

    const byProject = projects.map((project: any) => {
      const budget = budgets.find((b: any) => b.project.toString() === project._id.toString());

      const planned = project.budgetTotal;
      const spent = budget ? budget.spentTotal : 0;
      const remaining = planned - spent;
      const percentageUsed = planned === 0 ? 0 : Math.round((spent / planned) * 100);
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
      percentageUsed: totalPlanned === 0 ? 0 : Math.round((totalSpent / totalPlanned) * 100),
      isOverBudget: totalSpent > totalPlanned,
      byProject,
    };
  }
  //  PRIVATE Compute DOCUMENT_ACTIVITY
  private async computeDocumentActivity(city: ReportCity, dateFrom: Date, dateTo: Date,): Promise<Record<string, any>> {
    // Build city filter for documents
    let cityFilter: any = {};
    if (city !== ReportCity.BOTH) {
      cityFilter = { city };
    }
    const documents = await this.documentModel.find({ ...cityFilter, createdAt: { $gte: dateFrom, $lte: dateTo } }).lean();
    // Count by approval status
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
    // Count by category
    const byCategory: Record<string, number> = {};
    documents.forEach((d: any) => {
      byCategory[d.category] =
        (byCategory[d.category] || 0) + 1;
    });
    return {
      totalDocuments: documents.length,
      byStatus,
      byCategory,
    };
  }
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
  async getReportById(reportId: string, currentUser: any): Promise<ReportResponse> {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    if (currentUser.role === Role.CITY_ADMIN && report.generatedBy.toString() !== currentUser.userId) {
      throw new ForbiddenException('You can only view your own reports');
    }
    return this.mapToResponse(report);
  }
  async downloadReport(reportId: string, fileType: string, currentUser: any, res: any): Promise<void> {
    const report = await this.reportModel.findById(reportId).lean();
    if (!report) throw new NotFoundException('Report not found');
    if (currentUser.role === Role.CITY_ADMIN && (report as any).generatedBy.toString() !== currentUser.userId) {
      throw new ForbiddenException('You can only download your own reports');
    }
    if (fileType === 'excel') {
      await this.downloadAsExcel(report, res);
    } else {
      await this.downloadAsPdf(report, res);
    }
  }
  private async downloadAsPdf(report: any, res: any): Promise<void> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.pdf`);
    doc.pipe(res);
    // header
    doc.fontSize(20).text('Sister City Portal', { align: 'center' });
    doc.fontSize(14).text(`Report Type: ${report.reportType}`, { align: 'center' });
    doc.moveDown();
    // info
    doc.fontSize(12).text(`City: ${report.city}`);
    doc.text(`Period: ${new Date(report.dateFrom).toDateString()} - ${new Date(report.dateTo).toDateString()}`);
    doc.text(`Generated At: ${new Date(report.generatedAt).toDateString()}`);
    doc.moveDown();
    // data
    doc.fontSize(14).text('Report Data:');
    doc.moveDown();
    doc.fontSize(10).text(JSON.stringify(report.data, null, 2));
    doc.end();
  }
  private async downloadAsExcel(report: any, res: any): Promise<void> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report._id}.xlsx`);
    // header row
    sheet.addRow(['Sister City Portal Report']);
    sheet.addRow(['Report Type', report.reportType]);
    sheet.addRow(['City', report.city]);
    sheet.addRow(['Period', `${new Date(report.dateFrom).toDateString()} - ${new Date(report.dateTo).toDateString()}`]);
    sheet.addRow(['Generated At', new Date(report.generatedAt).toDateString()]);
    sheet.addRow([]);
    // data rows
    sheet.addRow(['Report Data']);
    const flattenData = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
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
}