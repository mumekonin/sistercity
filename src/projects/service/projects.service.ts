import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../schema/projects.schema';
import { CreateMilestoneDto, CreateProjectDto, CreateTaskDto, UpdateMilestoneDto, UpdateProjectDto } from '../dto/projects.dto';
import { ProjectListResponse, ProjectResponse } from '../response/projects..response';
import { City, ProjectStatus, Role, MilestoneStatus, TaskStatus } from '../../common/enum/enum';
import { User } from 'src/users/schema/users.shema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
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

  async getProjectById(id: string, currentUser: any): Promise<ProjectResponse> {

    const project = await this.projectModel.findById(id).lean();

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
        throw new ForbiddenException(
          'You are not assigned to this project'
        );
      }
    }

    if (currentUser.role === Role.CITY_ADMIN) {
      const isInvolved =
        project.proposedBy === currentUser.city ||
        (currentUser.city === City.ADAMA && project.adama !== null) ||
        (currentUser.city === City.AURORA && project.aurora !== null);

      if (!isInvolved) {
        throw new ForbiddenException(
          'You can only view projects involving your city'
        );
      }
    }

    return this.mapToResponse(project);
  }

  async updateProject(id: string, updateProjectDto: UpdateProjectDto, currentUser: any): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    switch (updateProjectDto.action) {
      case 'approve': {
        // Only RECEIVING city can approve
        if (currentUser.city === project.proposedBy) {
          throw new ForbiddenException(
            'You cannot approve your own city project proposal'
          );
        }
        // Must be PROPOSED
        if (project.status !== ProjectStatus.PROPOSED) {
          throw new BadRequestException(
            `Cannot approve a project with status ${project.status}`
          );
        }
        project.status = ProjectStatus.APPROVED;
        break;
      }
      case 'reject': {

        // Only RECEIVING city can reject
        if (currentUser.city === project.proposedBy) {
          throw new ForbiddenException(
            'You cannot reject your own city project proposal'
          );
        }

        // Must be PROPOSED
        if (project.status !== ProjectStatus.PROPOSED) {
          throw new BadRequestException(
            `Cannot reject a project with status ${project.status}`
          );
        }
        // Rejection reason required
        if (!updateProjectDto.rejectionReason) {
          throw new BadRequestException(
            'Rejection reason is required when rejecting a project'
          );
        }

        project.status = ProjectStatus.REJECTED;
        project.rejectionReason = updateProjectDto.rejectionReason;
        break;
      }
      case 'assign': {

        // Must be APPROVED
        if (project.status !== ProjectStatus.APPROVED) {
          throw new BadRequestException(
            'Project must be APPROVED before assigning departments'
          );
        }

        // Department required
        if (!updateProjectDto.department) {
          throw new BadRequestException(
            'Department is required for assignment'
          );
        }

        //  Check focal person exists and belongs to same city 

        if (!updateProjectDto.focalPerson) {
          throw new BadRequestException(
            'Focal person is required for assignment'
          );
        }

        const focalPerson = await this.userModel.findById(
          updateProjectDto.focalPerson
        );

        if (!focalPerson) {
          throw new NotFoundException('Focal person not found');
        }

        if (focalPerson.city !== currentUser.city) {
          throw new ForbiddenException(
            'Focal person must belong to your city'
          );
        }

        // Focal person must belong to the assigned department
        if (focalPerson.department !== updateProjectDto.department) {
          throw new BadRequestException(
            'Focal person must belong to the assigned department'
          );
        }

        // Adama assigns their side
        if (currentUser.city === City.ADAMA) {
          if (project.adama !== null) {
            throw new BadRequestException(
              'Adama has already assigned their department'
            );
          }
          project.adama = {
            department: updateProjectDto.department,
            focalPerson: updateProjectDto.focalPerson,
          } as any;
        }

        // Aurora assigns their side
        if (currentUser.city === City.AURORA) {
          if (project.aurora !== null) {
            throw new BadRequestException(
              'Aurora has already assigned their department'
            );
          }
          project.aurora = {
            department: updateProjectDto.department,
            focalPerson: updateProjectDto.focalPerson,
          } as any;
        }

        // Both assigned — auto move to PLANNED
        if (project.adama !== null && project.aurora !== null) {
          project.status = ProjectStatus.PLANNED;
        }

        break;
      }
      case 'plan': {

        // Must be PLANNED status
        if (project.status !== ProjectStatus.PLANNED) {
          throw new BadRequestException(
            'Project must be in PLANNED status before setting budget'
          );
        }

        // Budget required
        if (updateProjectDto.budget === undefined) {
          throw new BadRequestException(
            'Budget is required for planning'
          );
        }

        // Start date required
        if (!updateProjectDto.startDate) {
          throw new BadRequestException(
            'Start date is required for planning'
          );
        }

        // End date required
        if (!updateProjectDto.endDate) {
          throw new BadRequestException(
            'End date is required for planning'
          );
        }

        // End date must be after start date
        if (updateProjectDto.endDate <= updateProjectDto.startDate) {
          throw new BadRequestException(
            'End date must be after start date'
          );
        }

        // Adama sets their budget
        if (currentUser.city === City.ADAMA) {
          if (project.adamaPlanned) {
            throw new BadRequestException(
              'Adama has already submitted their budget'
            );
          }
          project.budgetAdama = updateProjectDto.budget;
          project.adamaPlanned = true;
        }

        // Aurora sets their budget
        if (currentUser.city === City.AURORA) {
          if (project.auroraPlanned) {
            throw new BadRequestException(
              'Aurora has already submitted their budget'
            );
          }
          project.budgetAurora = updateProjectDto.budget;
          project.auroraPlanned = true;
        }

        // Recalculate total
        project.budgetTotal = project.budgetAdama + project.budgetAurora;

        project.startDate = updateProjectDto.startDate;
        project.endDate = updateProjectDto.endDate;

        break;
      }

      case 'update-status': {
        // Status required
        if (!updateProjectDto.status) {
          throw new BadRequestException(
            'Status is required for update-status action'
          );
        }

        // Cannot use this action for COMPLETED
        if (updateProjectDto.status === ProjectStatus.COMPLETED) {
          throw new BadRequestException(
            'Use action complete to mark a project as completed'
          );
        }

        // Before IN_PROGRESS both cities must have planned
        if (updateProjectDto.status === ProjectStatus.IN_PROGRESS) {
          if (!project.adamaPlanned || !project.auroraPlanned) {
            throw new BadRequestException(
              'Both cities must submit their budget before starting the project'
            );
          }
        }

        // Allowed transitions
        const allowedTransitions: Record<string, ProjectStatus[]> = {
          [ProjectStatus.PLANNED]: [ProjectStatus.IN_PROGRESS],
          [ProjectStatus.IN_PROGRESS]: [ProjectStatus.ON_HOLD, ProjectStatus.DELAYED],
          [ProjectStatus.ON_HOLD]: [ProjectStatus.IN_PROGRESS],
          [ProjectStatus.DELAYED]: [ProjectStatus.IN_PROGRESS],
        };

        const allowed = allowedTransitions[project.status];

        if (!allowed || !allowed.includes(updateProjectDto.status)) {
          throw new BadRequestException(
            `Cannot move project from ${project.status} to ${updateProjectDto.status}`
          );
        }

        // Set actualStartDate first time project moves to IN_PROGRESS
        if (
          updateProjectDto.status === ProjectStatus.IN_PROGRESS &&
          !project.actualStartDate
        ) {
          project.actualStartDate = new Date();
        }

        project.status = updateProjectDto.status;
        break;
      }

      case 'complete': {

        // Must be IN_PROGRESS
        if (project.status !== ProjectStatus.IN_PROGRESS) {
          throw new BadRequestException(
            'Project must be IN_PROGRESS to mark as completed'
          );
        }

        // City already confirmed
        if (project.completedBy.includes(currentUser.city)) {
          throw new BadRequestException(
            'Your city has already confirmed completion'
          );
        }

        // Add current city to completedBy
        project.completedBy.push(currentUser.city);

        // Both cities confirmed — close project
        if (
          project.completedBy.includes(City.ADAMA) &&
          project.completedBy.includes(City.AURORA)
        ) {
          project.status = ProjectStatus.COMPLETED;
          project.actualEndDate = new Date();
        }

        break;
      }

      default: {
        throw new BadRequestException(
          `Unknown action: ${updateProjectDto.action}`
        );
      }
    }
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  async getAllProjects(currentUser: any): Promise<ProjectListResponse[]> {

    let projects: any[] = [];
    //super admin see all projects 
    if (currentUser.role === Role.SUPER_ADMIN) {
      projects = await this.projectModel.find().lean();
    }

    //city admin only see thir own city projects
    if (currentUser.role === Role.CITY_ADMIN) {
      if (currentUser.city === City.ADAMA) {
        projects = await this.projectModel.find({
          $or: [
            { proposedBy: City.ADAMA },
            { 'adama.department': { $exists: true, $ne: null } },
          ]
        }).lean();
      }

      if (currentUser.city === City.AURORA) {
        projects = await this.projectModel.find({
          $or: [
            { proposedBy: City.AURORA },
            { 'aurora.department': { $exists: true, $ne: null } },
          ]
        }).lean();
      }
    }

    //department seee thir own department projects 
    if (currentUser.role === Role.DEPT_OFFICER) {

      if (currentUser.city === City.ADAMA) {
        projects = await this.projectModel.find({
          'adama.department': currentUser.department,
        }).lean();
      }

      if (currentUser.city === City.AURORA) {
        projects = await this.projectModel.find({
          'aurora.department': currentUser.department,
        }).lean();
      }
    }

    if (!projects || projects.length === 0)
      return [];

    return projects.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      description: p.description,
      proposedBy: p.proposedBy,
      priority: p.priority,
      status: p.status,
      beneficiary: p.beneficiary,
      progressPercent: p.progressPercent,
      budgetTotal: p.budgetTotal,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
    }));
  }
  async addMilestone(projectId: string, createMilestoneDto: CreateMilestoneDto, currentUser: any,): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    //City Admin must belong to this project 
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA && project.adama !== null) ||
      (currentUser.city === City.AURORA && project.aurora !== null);

    if (!isInvolved) {
      throw new ForbiddenException('You can only add milestones to projects involving your city');
    }

    // Project must be PLANNED or IN_PROGRESS 
    const allowedStatuses = [
      ProjectStatus.PLANNED,
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.ON_HOLD,
      ProjectStatus.DELAYED
    ];

    if (!allowedStatuses.includes(project.status)) {
      throw new BadRequestException(`Cannot add milestones to a project with status ${project.status}`);
    }

    // Add milestone 
    project.milestones.push({
      title: createMilestoneDto.title,
      description: createMilestoneDto.description,
      deadline: createMilestoneDto.deadline,
      responsible: createMilestoneDto.responsible,
      status: MilestoneStatus.NOT_STARTED,
      completedAt: null,
      delayReason: null,
    } as any);

    //Save and return 
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  async updateMilestone(projectId: string, milestoneId: string, updateMilestoneDto: UpdateMilestoneDto,
    currentUser: any,): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    //Dept Officer must be assigned 
    if (currentUser.role === Role.DEPT_OFFICER) {
      const isAssigned =
        (currentUser.city === City.ADAMA &&
          project.adama?.department === currentUser.department) ||
        (currentUser.city === City.AURORA &&
          project.aurora?.department === currentUser.department);

      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to this project' );
      }
    }

    // City Admin must be involved 
    if (currentUser.role === Role.CITY_ADMIN) {
      const isInvolved =
        project.proposedBy === currentUser.city ||
        (currentUser.city === City.ADAMA && project.adama !== null) ||
        (currentUser.city === City.AURORA && project.aurora !== null);

      if (!isInvolved) {
        throw new ForbiddenException('You can only update milestones for projects involving your city');
      }
    }

    // Find milestone index 
    const milestoneIndex = project.milestones.findIndex(
      (m: any) => m._id.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      throw new NotFoundException('Milestone not found');
    }

    const milestone = project.milestones[milestoneIndex];

    // Only City Admin can update completed milestone
    if (
      milestone.status === MilestoneStatus.COMPLETED &&
      currentUser.role !== Role.CITY_ADMIN
    ) {
      throw new BadRequestException(
        'Only City Admin can update a completed milestone'
      );
    }

    //Handle delayReason 
    if (updateMilestoneDto.status === MilestoneStatus.DELAYED) {

      if (!updateMilestoneDto.delayReason) {
        throw new BadRequestException('delayReason is required when milestone status is DELAYED');
      }

      project.milestones[milestoneIndex].delayReason =
        updateMilestoneDto.delayReason as any;

    } else {
      project.milestones[milestoneIndex].delayReason = null as any;
    }

    // Handle completedAt 
    if (updateMilestoneDto.status === MilestoneStatus.COMPLETED) {

      // Only set if not already completed
      if (milestone.status !== MilestoneStatus.COMPLETED) {
        project.milestones[milestoneIndex].completedAt = new Date() as any;
      }

    } else {
      project.milestones[milestoneIndex].completedAt = null as any;
    }

    //Update status directly on array 
    project.milestones[milestoneIndex].status =
      updateMilestoneDto.status as any;

    //Recalculate progressPercent 
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(
      (m: any) => m.status === MilestoneStatus.COMPLETED
    ).length;

    project.progressPercent = totalMilestones === 0
      ? 0
      : Math.round((completedMilestones / totalMilestones) * 100);

    //Mark array as modified for Mongoose 
    project.markModified('milestones');

    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  async addTask(projectId: string,createTaskDto: CreateTaskDto,currentUser: any): Promise<ProjectResponse> {
  const project = await this.projectModel.findById(projectId);

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  // ── Step 2: City Admin must be involved in this project ─────
  const isInvolved =
    project.proposedBy === currentUser.city ||
    (currentUser.city === City.ADAMA  && project.adama  !== null) ||
    (currentUser.city === City.AURORA && project.aurora !== null);

  if (!isInvolved) {
    throw new ForbiddenException(
      'You can only add tasks to projects involving your city'
    );
  }
  // Tasks are actual work items — only added when work has started
  const allowedStatuses = [
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.ON_HOLD,
    ProjectStatus.DELAYED,
  ];

  if (!allowedStatuses.includes(project.status)) {
    throw new BadRequestException(
      `Cannot add tasks to a project with status ${project.status}. Project must be IN_PROGRESS, ON_HOLD or DELAYED`
    );
  }

  const assignedUser = await this.userModel.findById(
    createTaskDto.assignedTo
  );

  if (!assignedUser) {
    throw new NotFoundException('Assigned user not found');
  }
  if (assignedUser.city !== currentUser.city) {
    throw new ForbiddenException(
      'You can only assign tasks to staff members from your own city'
    );
  }

  if (!assignedUser.isActive) {
    throw new BadRequestException(
      'Cannot assign a task to a deactivated user'
    );
  }
  project.tasks.push({
    title:        createTaskDto.title,
    description:  createTaskDto.description,
    assignedTo:   createTaskDto.assignedTo,
    assignedCity: currentUser.city,    
    priority:     createTaskDto.priority,
    dueDate:      createTaskDto.dueDate,
    status:       TaskStatus.TODO,     
    completedAt:  null,
  } as any);
  project.markModified('tasks');
  const updatedProject = await project.save();
  return this.mapToResponse(updatedProject);
}
}