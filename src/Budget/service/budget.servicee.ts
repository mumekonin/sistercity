import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget } from '../schema/budget.schema';
import { Equipment } from '../schema/equipment.schema';
import { Project } from '../../projects/schema/projects.schema';
import { CreateExpenditureDto } from '../dto/budget.dto';
import { BudgetResponse } from '../response/budget.response';
import { Role, City, ProjectStatus, ExpenditureStatus, } from '../../common/enum/enum';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(Budget.name)
    private readonly budgetModel: Model<Budget>,

    @InjectModel(Equipment.name)
    private readonly equipmentModel: Model<Equipment>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,

    private readonly cloudinaryService: CloudinaryService,
  ) { }
  async recordExpenditure(projectId: string, createExpenditureDto: CreateExpenditureDto, file: any, currentUser: any): Promise<BudgetResponse> {

    const project = await this.projectModel.findById(projectId).lean();

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot record expenditure on a project with status ${project.status}. Project must be IN_PROGRESS`);
    }
    if (currentUser.role === Role.DEPT_OFFICER) {
      const isAssigned =
        (currentUser.city === City.ADAMA &&
          project.adama?.department === currentUser.department) ||
        (currentUser.city === City.AURORA &&
          project.aurora?.department === currentUser.department);

      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to this project');
      }
    }

    if (currentUser.role === Role.CITY_ADMIN) {
      const isInvolved =
        project.proposedBy === currentUser.city ||
        (currentUser.city === City.ADAMA && project.adama !== null) ||
        (currentUser.city === City.AURORA && project.aurora !== null);

      if (!isInvolved) {
        throw new ForbiddenException('You can only record expenditures for projects involving your city');
      }
    }
    if (!file) {
      throw new BadRequestException('Receipt file is required for expenditure recording');
    }
    const uploadedFile = await this.cloudinaryService.uploadFile(file, 'sister-city/receipts');
    if (createExpenditureDto.date > new Date()) {
      throw new BadRequestException('Expenditure date cannot be in the future');
    }
    let budget = await this.budgetModel.findOne({ project: projectId });

    if (!budget) {
      budget = new this.budgetModel({ project: projectId,spentAdama: 0, spentAurora: 0, spentTotal: 0, expenditures: [],});
    }
    budget.expenditures.push({
      city: currentUser.city,
      category: createExpenditureDto.category,
      description: createExpenditureDto.description,
      amount: createExpenditureDto.amount,
      date: createExpenditureDto.date,
      receiptUrl: uploadedFile.fileUrl,
      recordedBy: currentUser.userId,
      status: ExpenditureStatus.PENDING,
      approvedBy: null,
      rejectionReason: null,
      approvedAt: null,
    } as any);

    //  Mark modified and save 
    budget.markModified('expenditures');
    const savedBudget = await budget.save();
    return this.mapToResponse(savedBudget, project);
  }
  private mapToResponse(budget: any, project: any): BudgetResponse {
    return {
      id: budget._id.toString(),
      project: budget.project.toString(),
      // Planned amounts from Project document
      plannedAdama: project.budgetAdama,
      plannedAurora: project.budgetAurora,
      plannedTotal: project.budgetTotal,
      // Actual spending from Budget document
      spentAdama: budget.spentAdama,
      spentAurora: budget.spentAurora,
      spentTotal: budget.spentTotal,
      // Calculated in service  not stored in DB
      remainingAdama: project.budgetAdama - budget.spentAdama,
      remainingAurora: project.budgetAurora - budget.spentAurora,
      remainingTotal: project.budgetTotal - budget.spentTotal,

      expenditures: budget.expenditures.map((e: any) => ({
        id: e._id.toString(),
        city: e.city,
        category: e.category,
        description: e.description,
        amount: e.amount,
        date: e.date,
        receiptUrl: e.receiptUrl,
        recordedBy: e.recordedBy.toString(),
        status: e.status,
        approvedBy: e.approvedBy ? e.approvedBy.toString() : null,
        rejectionReason: e.rejectionReason,
        approvedAt: e.approvedAt,
      })),
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
  async getBudgetByProject(projectId: string,currentUser: any): Promise<BudgetResponse> {

  const project = await this.projectModel.findById(projectId).lean();

  if (!project) {
    throw new NotFoundException('Project not found');
  }
  if (currentUser.role === Role.DEPT_OFFICER) {
    const isAssigned =
      (currentUser.city === City.ADAMA &&
       project.adama?.department === currentUser.department) ||
      (currentUser.city === City.AURORA &&
       project.aurora?.department === currentUser.department);

    if (!isAssigned) {
      throw new ForbiddenException('You are not assigned to this project');
    }
  }

  if (currentUser.role === Role.CITY_ADMIN) {
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA  && project.adama  !== null) ||
      (currentUser.city === City.AURORA && project.aurora !== null);

    if (!isInvolved) {
      throw new ForbiddenException('You can only view budgets for projects involving your city');
    }
  }
  const budget = await this.budgetModel.findOne({ project: projectId }).lean();
  if (!budget) {
    return {
      id:              null ,
      project:         projectId,
      plannedAdama:    project.budgetAdama,
      plannedAurora:   project.budgetAurora,
      plannedTotal:    project.budgetTotal,
      spentAdama:      0,
      spentAurora:     0,
      spentTotal:      0,
      remainingAdama:  project.budgetAdama,
      remainingAurora: project.budgetAurora,
      remainingTotal:  project.budgetTotal,
      expenditures:    [],
      createdAt:null,
      updatedAt:       null,
    };
  }
  return this.mapToResponse(budget, project);
}
}