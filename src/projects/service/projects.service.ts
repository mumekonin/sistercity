import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../schema/projects.schema';
import { CreateProjectDto } from '../dto/projects.dto';
import { ProjectResponse } from '../response/projects..response';
import { ProjectStatus, City } from '../../common/enum/enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
  ) { }

  async createProject(createProjectDto: CreateProjectDto, currentUser: any): Promise<ProjectResponse> {
    if (currentUser.role !== 'CITY_ADMIN') {
      throw new ForbiddenException('Only City Admins can propose a project');
    }
    const newProject = new this.projectModel({
      title: createProjectDto.title,
      description: createProjectDto.description,
      expectedOutcome: createProjectDto.expectedOutcome,
      priority: createProjectDto.priority,
      beneficiary: createProjectDto.beneficiary,
      proposedBy: currentUser.city,
      proposedByUser: currentUser.userId,
      status: ProjectStatus.PROPOSED,
      progressPercent: 0,
      milestones: [],
      tasks: [],
      issues: [],
      completedBy: [],
    });
    const savedProject = await newProject.save();
    return this.mapToResponse(savedProject);
  }

  private mapToResponse(project: any): ProjectResponse {
    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description,
      expectedOutcome: project.expectedOutcome,
      proposedBy: project.proposedBy,
      proposedByUser: project.proposedByUser.toString(),
      priority: project.priority,
      status: project.status,
      rejectionReason: project.rejectionReason,
      beneficiary: project.beneficiary,
      adama: project.adama ? {
        department: project.adama.department,
        focalPerson: project.adama.focalPerson.toString(),
      } : null,
      aurora: project.aurora ? {
        department: project.aurora.department,
        focalPerson: project.aurora.focalPerson.toString(),
      } : null,
      budgetAdama: project.budgetAdama,
      budgetAurora: project.budgetAurora,
      budgetTotal: project.budgetTotal,
      startDate: project.startDate,
      endDate: project.endDate,
      actualStartDate: project.actualStartDate,
      actualEndDate: project.actualEndDate,
      progressPercent: project.progressPercent,
      milestones: project.milestones.map((m: any) => ({
        id: m._id.toString(),
        title: m.title,
        description: m.description,
        deadline: m.deadline,
        responsible: m.responsible,
        status: m.status,
        completedAt: m.completedAt,
        delayReason: m.delayReason,
      })),
      tasks: project.tasks.map((t: any) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        assignedTo: t.assignedTo.toString(),
        assignedCity: t.assignedCity,
        priority: t.priority,
        dueDate: t.dueDate,
        status: t.status,
        completedAt: t.completedAt,
      })),
      issues: project.issues.map((i: any) => ({
        id: i._id.toString(),
        description: i.description,
        severity: i.severity,
        affectedCity: i.affectedCity,
        raisedBy: i.raisedBy.toString(),
        raisedAt: i.raisedAt,
        status: i.status,
        resolution: i.resolution,
        resolvedAt: i.resolvedAt,
      })),
      completedBy: project.completedBy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}