import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Budget } from '../schema/budget.schema';
import { Equipment } from '../schema/equipment.schema';
import { Project } from '../../projects/schema/projects.schema';
import { CreateExpenditureDto, UpdateExpenditureDto } from '../dto/budget.dto';
import { BudgetResponse, BudgetSummaryResponse, EquipmentResponse } from '../response/budget.response';
import { Role, City, ProjectStatus, ExpenditureStatus, EquipmentStatus, } from '../../common/enum/enum';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from '../dto/equipment.dto';

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
      budget = new this.budgetModel({ project: projectId, spentAdama: 0, spentAurora: 0, spentTotal: 0, expenditures: [], });
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
  async getBudgetByProject(projectId: string, currentUser: any): Promise<BudgetResponse> {

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
        (currentUser.city === City.ADAMA && project.adama !== null) ||
        (currentUser.city === City.AURORA && project.aurora !== null);

      if (!isInvolved) {
        throw new ForbiddenException('You can only view budgets for projects involving your city');
      }
    }
    const budget = await this.budgetModel.findOne({ project: projectId }).lean();
    if (!budget) {
      return {
        id: null,
        project: projectId,
        plannedAdama: project.budgetAdama,
        plannedAurora: project.budgetAurora,
        plannedTotal: project.budgetTotal,
        spentAdama: 0,
        spentAurora: 0,
        spentTotal: 0,
        remainingAdama: project.budgetAdama,
        remainingAurora: project.budgetAurora,
        remainingTotal: project.budgetTotal,
        expenditures: [],
        createdAt: null,
        updatedAt: null,
      };
    }
    return this.mapToResponse(budget, project);
  }
  async updateExpenditure(projectId: string, expenditureId: string, updateExpenditureDto: UpdateExpenditureDto, currentUser: any): Promise<BudgetResponse> {
    const project = await this.projectModel.findById(projectId).lean();

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA && project.adama !== null) ||
      (currentUser.city === City.AURORA && project.aurora !== null);
    if (!isInvolved) {
      throw new ForbiddenException('You can only manage expenditures for projects involving your city');
    }
    const budget = await this.budgetModel.findOne({ project: projectId });

    if (!budget) {
      throw new NotFoundException('No budget found for this project');
    }
    const expenditureIndex = budget.expenditures.findIndex((e: any) => e._id.toString() === expenditureId);
    if (expenditureIndex === -1) {
      throw new NotFoundException('Expenditure not found');
    }
    const expenditure = budget.expenditures[expenditureIndex];
    // Only PENDING can be approved or rejected 
    if (expenditure.status !== ExpenditureStatus.PENDING) {
      throw new BadRequestException(
        `Cannot update an expenditure with status ${expenditure.status}`
      );
    }
    // Partner city (or SUPER_ADMIN) must approve the expenditure
    if (currentUser.role !== Role.SUPER_ADMIN && expenditure.city === currentUser.city) {
      throw new ForbiddenException('You cannot approve your own city\'s expenditures. The partner city must approve them.');
    }
    switch (updateExpenditureDto.action) {
      case 'approve': {
        budget.expenditures[expenditureIndex].status =
          ExpenditureStatus.APPROVED as any;
        budget.expenditures[expenditureIndex].approvedBy =
          currentUser.userId as any;
        budget.expenditures[expenditureIndex].approvedAt =
          new Date() as any;
        // Update spent totals only when approved, checking against planned budget
        if (expenditure.city === City.ADAMA) {
          if (budget.spentAdama + expenditure.amount > project.budgetAdama) {
            throw new BadRequestException('Approval denied: This expenditure exceeds the allocated budget for Adama.');
          }
          budget.spentAdama += expenditure.amount;
        }
        if (expenditure.city === City.AURORA) {
          if (budget.spentAurora + expenditure.amount > project.budgetAurora) {
            throw new BadRequestException('Approval denied: This expenditure exceeds the allocated budget for Aurora.');
          }
          budget.spentAurora += expenditure.amount;
        }
        budget.spentTotal = budget.spentAdama + budget.spentAurora;
        break;
      }
      case 'reject': {
        // Rejection reason required
        if (!updateExpenditureDto.rejectionReason) {
          throw new BadRequestException('Rejection reason is required when rejecting an expenditure');
        }
        budget.expenditures[expenditureIndex].status = ExpenditureStatus.REJECTED as any;
        budget.expenditures[expenditureIndex].rejectionReason = updateExpenditureDto.rejectionReason as any;
        break;
      }
      default: {
        throw new BadRequestException(`Unknown action: ${updateExpenditureDto.action}`);
      }
    }
    budget.markModified('expenditures');
    const updatedBudget = await budget.save();
    return this.mapToResponse(updatedBudget, project);
  }
  async getBudgetSummary(currentUser: any): Promise<BudgetSummaryResponse[]> {
    let projects: any[] = [];
    if (currentUser.role === Role.SUPER_ADMIN) {
      projects = await this.projectModel.find({ status: ProjectStatus.IN_PROGRESS }).lean();
    }
    if (currentUser.role === Role.CITY_ADMIN) {
      projects = await this.projectModel
        .find({
          status: ProjectStatus.IN_PROGRESS,
          $or: [
            { proposedBy: currentUser.city },
            { 'adama.department': { $exists: true, $ne: null }, proposedBy: City.AURORA },
            { 'aurora.department': { $exists: true, $ne: null }, proposedBy: City.ADAMA, }
          ]
        }).lean();
    }
    if (!projects || projects.length === 0) return [];
    //Get budgets for all projects 
    const projectIds = projects.map((p: any) => p._id);
    const budgets = await this.budgetModel.find({ project: { $in: projectIds } }).lean();

    return projects.map((project: any) => {
      const budget = budgets.find((b: any) => b.project.toString() === project._id.toString());
      const spentTotal = budget ? budget.spentTotal : 0;
      const plannedTotal = project.budgetTotal;
      const remainingTotal = plannedTotal - spentTotal;
      const percentageUsed = plannedTotal === 0 ? 0 : Math.round((spentTotal / plannedTotal) * 100);
      return {
        projectId: project._id.toString(),
        projectTitle: project.title,
        plannedTotal,
        spentTotal,
        remainingTotal,
        percentageUsed,
        isOverBudget: spentTotal > plannedTotal,
      };
    });
  }
  //equipment
  async addEquipment(projectId: string, createEquipmentDto: CreateEquipmentDto, currentUser: any): Promise<EquipmentResponse> {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot add equipment to a project with status ${project.status}. Project must be IN_PROGRESS`);
    }
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA && project.adama !== null) ||
      (currentUser.city === City.AURORA && project.aurora !== null);

    if (!isInvolved) {
      throw new ForbiddenException('You can only add equipment to projects involving your city');
    }
    if (createEquipmentDto.providedDate > new Date()) {
      throw new BadRequestException('Provided date cannot be in the future');
    } const newEquipment = new this.equipmentModel({
      project: projectId,
      itemName: createEquipmentDto.itemName,
      description: createEquipmentDto.description,
      quantity: createEquipmentDto.quantity,
      estimatedValue: createEquipmentDto.estimatedValue,
      providedDate: createEquipmentDto.providedDate,
      providedBy: currentUser.city,
      recordedBy: currentUser.userId,
      status: EquipmentStatus.AVAILABLE,
      damagedNote: null,
      returnedDate: null,
    });
    const savedEquipment = await newEquipment.save();
    return this.mapToEquipmentResponse(savedEquipment);
  }
  private mapToEquipmentResponse(equipment: any): EquipmentResponse {
    return {
      id: equipment._id.toString(),
      project: equipment.project.toString(),
      itemName: equipment.itemName,
      description: equipment.description,
      providedBy: equipment.providedBy,
      quantity: equipment.quantity,
      estimatedValue: equipment.estimatedValue,
      providedDate: equipment.providedDate,
      status: equipment.status,
      damagedNote: equipment.damagedNote,
      returnedDate: equipment.returnedDate,
      recordedBy: equipment.recordedBy.toString(),
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }
  async getEquipmentByProject(projectId: string, currentUser: any): Promise<EquipmentResponse[]> {
    const project = await this.projectModel.findById(projectId).lean();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (currentUser.role === Role.DEPT_OFFICER) {
      const isAssigned =
        (currentUser.city === City.ADAMA && project.adama?.department === currentUser.department) ||
        (currentUser.city === City.AURORA && project.aurora?.department === currentUser.department);
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
        throw new ForbiddenException('You can only view equipment for projects involving your city');
      }
    }
    const equipment = await this.equipmentModel.find({ project: projectId }).lean();
    if (!equipment || equipment.length === 0) return [];
    return equipment.map((e: any) => this.mapToEquipmentResponse(e));
  }
  async updateEquipment(equipmentId: string, updateEquipmentDto: UpdateEquipmentDto, currentUser: any): Promise<EquipmentResponse> {
    const equipment = await this.equipmentModel.findById(equipmentId);
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }
    if (equipment.providedBy !== currentUser.city) {
      throw new ForbiddenException('You can only update equipment provided by your own city');
    }
    const allowedTransitions: Record<string, EquipmentStatus[]> = {
      [EquipmentStatus.AVAILABLE]: [EquipmentStatus.IN_USE],
      [EquipmentStatus.IN_USE]: [EquipmentStatus.RETURNED, EquipmentStatus.DAMAGED],
      [EquipmentStatus.RETURNED]: [EquipmentStatus.AVAILABLE],
      [EquipmentStatus.DAMAGED]: [EquipmentStatus.REPAIRED, EquipmentStatus.RETURNED],
      [EquipmentStatus.REPAIRED]: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE],
    };
    const allowed = allowedTransitions[equipment.status];
    if (!allowed || !allowed.includes(updateEquipmentDto.status)) {
      throw new BadRequestException(`Cannot move equipment from ${equipment.status} to ${updateEquipmentDto.status}`);
    }
    if (updateEquipmentDto.status === EquipmentStatus.DAMAGED) {
      if (!updateEquipmentDto.damagedNote) {
        throw new BadRequestException('damagedNote is required when equipment status is DAMAGED');
      }
      equipment.damagedNote = updateEquipmentDto.damagedNote;
    }
    if (updateEquipmentDto.status === EquipmentStatus.RETURNED) {
      if (!updateEquipmentDto.returnedDate) {
        throw new BadRequestException('returnedDate is required when equipment status is RETURNED');
      }
      if (updateEquipmentDto.returnedDate > new Date()) {
        throw new BadRequestException('Return date cannot be in the future');
      }
      equipment.returnedDate = updateEquipmentDto.returnedDate;
    }
    if (updateEquipmentDto.status !== EquipmentStatus.DAMAGED) {
      equipment.damagedNote = null;
    }
    equipment.status = updateEquipmentDto.status;
    const updatedEquipment = await equipment.save();
    return this.mapToEquipmentResponse(updatedEquipment);
  }
}