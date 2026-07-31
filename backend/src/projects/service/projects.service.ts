import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../schema/projects.schema';
import {
  CreateIssueDto,
  CreateMilestoneDto,
  CreateProjectDto,
  CreateTaskDto,
  UpdateIssueDto,
  UpdateMilestoneDto,
  UpdateProjectDto,
  UpdateTaskDto,
} from '../dto/projects.dto';
import {
  ProjectListResponse,
  ProjectResponse,
} from '../response/projects..response';
import {
  City,
  ProjectStatus,
  Role,
  MilestoneStatus,
  Responsible,
  TaskStatus,
  IssueStatus,
  NotificationType,
  NotificationPriority,
} from '../../common/enum/enum';
import { User } from 'src/users/schema/users.shema';
import { NotificationService } from 'src/notifications/service/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createProject(
    createProjectDto: CreateProjectDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
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
      adama: project.adama
        ? {
            department: project.adama.department,
            focalPerson: project.adama.focalPerson.toString(),
          }
        : null,
      aurora: project.aurora
        ? {
            department: project.aurora.department,
            focalPerson: project.aurora.focalPerson.toString(),
          }
        : null,
      budgetAdama: project.budgetAdama,
      budgetAurora: project.budgetAurora,
      adamaPlanned: project.adamaPlanned,
      auroraPlanned: project.auroraPlanned,
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
        throw new ForbiddenException('You are not assigned to this project');
      }
    }

    if (currentUser.role === Role.CITY_ADMIN) {
      const ownCityAssignment =
        currentUser.city === City.ADAMA ? project.adama : project.aurora;

      const isInvolved =
        project.proposedBy === currentUser.city ||
        ownCityAssignment != null ||
        // The partner city must be able to review a proposal awaiting its decision
        (project.status === ProjectStatus.PROPOSED &&
          project.proposedBy !== currentUser.city);

      if (!isInvolved) {
        throw new ForbiddenException(
          'You can only view projects involving your city',
        );
      }
    }

    return this.mapToResponse(project);
  }

  async updateProject(
    id: string,
    updateProjectDto: UpdateProjectDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Approving and rejecting are deliberately open to the partner city; driving
    // an accepted project's execution is not, so those actions need a stake in it.
    const executionActions = ['plan', 'update-status', 'complete'];
    if (
      executionActions.includes(updateProjectDto.action) &&
      currentUser.role === Role.CITY_ADMIN
    ) {
      const ownAssignment =
        currentUser.city === City.ADAMA ? project.adama : project.aurora;

      if (ownAssignment == null && project.proposedBy !== currentUser.city) {
        throw new ForbiddenException(
          'Your city is not involved in this project',
        );
      }
    }

    switch (updateProjectDto.action) {
      case 'approve': {
        // Only RECEIVING city can approve
        if (currentUser.city === project.proposedBy) {
          throw new ForbiddenException(
            'You cannot approve your own city project proposal',
          );
        }
        // Must be PROPOSED
        if (project.status !== ProjectStatus.PROPOSED) {
          throw new BadRequestException(
            `Cannot approve a project with status ${project.status}`,
          );
        }
        project.status = ProjectStatus.APPROVED;
        // Notify the proposing city admins
        const proposingAdmins = await this.userModel
          .find({
            city: project.proposedBy,
            role: Role.CITY_ADMIN,
            isActive: true,
          })
          .select('_id')
          .lean();
        const proposingAdminIds = proposingAdmins.map((u: any) =>
          u._id.toString(),
        );
        if (proposingAdminIds.length) {
          await this.notificationService.createMany(proposingAdminIds, {
            type: NotificationType.PROJECT_APPROVED,
            title: `Project approved: ${project.title}`,
            body: `Your project proposal has been approved by ${currentUser.city}.`,
            link: `/projects/${project._id}`,
            priority: NotificationPriority.NORMAL,
          });
        }
        break;
      }
      case 'reject': {
        // Only RECEIVING city can reject
        if (currentUser.city === project.proposedBy) {
          throw new ForbiddenException(
            'You cannot reject your own city project proposal',
          );
        }

        // Must be PROPOSED
        if (project.status !== ProjectStatus.PROPOSED) {
          throw new BadRequestException(
            `Cannot reject a project with status ${project.status}`,
          );
        }
        // Rejection reason required
        if (!updateProjectDto.rejectionReason) {
          throw new BadRequestException(
            'Rejection reason is required when rejecting a project',
          );
        }

        project.status = ProjectStatus.REJECTED;
        project.rejectionReason = updateProjectDto.rejectionReason;
        // Notify the proposing city admins
        const rejectingAdmins = await this.userModel
          .find({
            city: project.proposedBy,
            role: Role.CITY_ADMIN,
            isActive: true,
          })
          .select('_id')
          .lean();
        const rejectingAdminIds = rejectingAdmins.map((u: any) =>
          u._id.toString(),
        );
        if (rejectingAdminIds.length) {
          await this.notificationService.createMany(rejectingAdminIds, {
            type: NotificationType.PROJECT_REJECTED,
            title: `Project rejected: ${project.title}`,
            body: `Your project proposal was rejected. Reason: ${updateProjectDto.rejectionReason}`,
            link: `/projects/${project._id}`,
            priority: NotificationPriority.URGENT,
          });
        }
        break;
      }
      case 'assign': {
        // Must be APPROVED
        if (project.status !== ProjectStatus.APPROVED) {
          throw new BadRequestException(
            'Project must be APPROVED before assigning departments',
          );
        }

        // Department required
        if (!updateProjectDto.department) {
          throw new BadRequestException(
            'Department is required for assignment',
          );
        }

        //  Check focal person exists and belongs to same city

        if (!updateProjectDto.focalPerson) {
          throw new BadRequestException(
            'Focal person is required for assignment',
          );
        }

        const focalPerson = await this.userModel.findById(
          updateProjectDto.focalPerson,
        );

        if (!focalPerson) {
          throw new NotFoundException('Focal person not found');
        }

        if (focalPerson.city !== currentUser.city) {
          throw new ForbiddenException('Focal person must belong to your city');
        }

        // Focal person must belong to the assigned department
        if (focalPerson.department !== updateProjectDto.department) {
          throw new BadRequestException(
            'Focal person must belong to the assigned department',
          );
        }

        if (!focalPerson.isActive) {
          throw new BadRequestException(
            'Cannot assign a deactivated user as focal person',
          );
        }

        // Adama assigns their side
        if (currentUser.city === City.ADAMA) {
          if (project.adama != null) {
            throw new BadRequestException(
              'Adama has already assigned their department',
            );
          }
          project.adama = {
            department: updateProjectDto.department,
            focalPerson: updateProjectDto.focalPerson,
          } as any;
        }

        // Aurora assigns their side
        if (currentUser.city === City.AURORA) {
          if (project.aurora != null) {
            throw new BadRequestException(
              'Aurora has already assigned their department',
            );
          }
          project.aurora = {
            department: updateProjectDto.department,
            focalPerson: updateProjectDto.focalPerson,
          } as any;
        }

        // Both assigned — auto move to PLANNED
        if (project.adama != null && project.aurora != null) {
          project.status = ProjectStatus.PLANNED;
        }

        // Notify the assigned focal person
        await this.notificationService.create({
          recipient: updateProjectDto.focalPerson,
          type: NotificationType.PROJECT_APPROVED,
          title: `You have been assigned as focal person`,
          body: `You are the focal person for project: ${project.title}`,
          link: `/projects/${project._id}`,
          priority: NotificationPriority.NORMAL,
        });

        break;
      }
      case 'plan': {
        // Must be PLANNED status
        if (project.status !== ProjectStatus.PLANNED) {
          throw new BadRequestException(
            'Project must be in PLANNED status before setting budget',
          );
        }

        // Budget required
        if (updateProjectDto.budget === undefined) {
          throw new BadRequestException('Budget is required for planning');
        }

        // Start date required
        if (!updateProjectDto.startDate) {
          throw new BadRequestException('Start date is required for planning');
        }

        // End date required
        if (!updateProjectDto.endDate) {
          throw new BadRequestException('End date is required for planning');
        }

        // End date must be after start date
        if (updateProjectDto.endDate <= updateProjectDto.startDate) {
          throw new BadRequestException('End date must be after start date');
        }

        // Adama sets their budget
        if (currentUser.city === City.ADAMA) {
          if (project.adamaPlanned) {
            throw new BadRequestException(
              'Adama has already submitted their budget',
            );
          }
          project.budgetAdama = updateProjectDto.budget;
          project.adamaPlanned = true;
        }

        // Aurora sets their budget
        if (currentUser.city === City.AURORA) {
          if (project.auroraPlanned) {
            throw new BadRequestException(
              'Aurora has already submitted their budget',
            );
          }
          project.budgetAurora = updateProjectDto.budget;
          project.auroraPlanned = true;
        }

        // Only publish a combined total once both cities have planned; otherwise
        // a half-finished plan looks like a final budget in lists and reports.
        if (project.adamaPlanned && project.auroraPlanned) {
          project.budgetTotal = project.budgetAdama + project.budgetAurora;
        }

        // The schedule is shared, not per city. Whoever plans first establishes
        // it; the second city must submit the same dates rather than silently
        // overwriting an agreed timeline.
        if (project.startDate != null && project.endDate != null) {
          const sameSchedule =
            new Date(project.startDate).getTime() ===
              new Date(updateProjectDto.startDate).getTime() &&
            new Date(project.endDate).getTime() ===
              new Date(updateProjectDto.endDate).getTime();

          if (!sameSchedule) {
            throw new BadRequestException(
              `The partner city already set the schedule to ${new Date(
                project.startDate,
              )
                .toISOString()
                .slice(0, 10)} – ${new Date(project.endDate)
                .toISOString()
                .slice(0, 10)}. Submit the same dates or agree on a change first.`,
            );
          }
        } else {
          project.startDate = updateProjectDto.startDate;
          project.endDate = updateProjectDto.endDate;
        }

        break;
      }

      case 'update-status': {
        // Status required
        if (!updateProjectDto.status) {
          throw new BadRequestException(
            'Status is required for update-status action',
          );
        }

        // Cannot use this action for COMPLETED
        if (updateProjectDto.status === ProjectStatus.COMPLETED) {
          throw new BadRequestException(
            'Use action complete to mark a project as completed',
          );
        }

        // Before IN_PROGRESS both cities must have planned
        if (updateProjectDto.status === ProjectStatus.IN_PROGRESS) {
          if (!project.adamaPlanned || !project.auroraPlanned) {
            throw new BadRequestException(
              'Both cities must submit their budget before starting the project',
            );
          }
        }

        // Allowed transitions
        const allowedTransitions: Record<string, ProjectStatus[]> = {
          [ProjectStatus.PLANNED]: [ProjectStatus.IN_PROGRESS],
          [ProjectStatus.IN_PROGRESS]: [
            ProjectStatus.ON_HOLD,
            ProjectStatus.DELAYED,
          ],
          [ProjectStatus.ON_HOLD]: [ProjectStatus.IN_PROGRESS],
          [ProjectStatus.DELAYED]: [ProjectStatus.IN_PROGRESS],
        };

        const allowed = allowedTransitions[project.status];

        if (!allowed || !allowed.includes(updateProjectDto.status)) {
          throw new BadRequestException(
            `Cannot move project from ${project.status} to ${updateProjectDto.status}`,
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
            'Project must be IN_PROGRESS to mark as completed',
          );
        }

        // City already confirmed
        if (project.completedBy.includes(currentUser.city)) {
          throw new BadRequestException(
            'Your city has already confirmed completion',
          );
        }

        // Add current city to completedBy
        project.completedBy.push(currentUser.city);

        // Both cities confirmed — close project
        if (
          project.completedBy.includes(City.ADAMA) &&
          project.completedBy.includes(City.AURORA)
        ) {
          const openMilestones = project.milestones.filter(
            (m: any) => m.status !== MilestoneStatus.COMPLETED,
          );
          if (
            project.milestones.length > 0 &&
            (project.progressPercent !== 100 || openMilestones.length > 0)
          ) {
            throw new BadRequestException(
              'All milestones must be completed before the project can be closed',
            );
          }
          project.status = ProjectStatus.COMPLETED;
          project.actualEndDate = new Date();
        }

        break;
      }

      default: {
        throw new BadRequestException(
          `Unknown action: ${updateProjectDto.action}`,
        );
      }
    }
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  async deleteProject(
    id: string,
    currentUser: any,
  ): Promise<{ success: boolean; message: string }> {
    const project = await this.projectModel.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.proposedBy !== currentUser.city) {
      throw new ForbiddenException(
        'You can only delete proposals made by your city',
      );
    }

    if (project.status !== ProjectStatus.PROPOSED) {
      throw new BadRequestException(
        'Cannot delete a project that is no longer in PROPOSED status',
      );
    }

    await this.projectModel.findByIdAndDelete(id);
    return { success: true, message: 'Project proposal deleted successfully' };
  }

  async getAllProjects(currentUser: any): Promise<ProjectListResponse[]> {
    let projects: any[] = [];
    //super admin see all projects
    if (currentUser.role === Role.SUPER_ADMIN) {
      projects = await this.projectModel.find().lean();
    }

    //city admin only see their own city projects + PROPOSED projects from the other city (to approve/reject)
    if (currentUser.role === Role.CITY_ADMIN) {
      if (currentUser.city === City.ADAMA) {
        projects = await this.projectModel
          .find({
            $or: [
              { proposedBy: City.ADAMA },
              { 'adama.department': { $exists: true, $ne: null } },
              // Adama needs to see Aurora's proposals awaiting its decision
              { proposedBy: City.AURORA, status: ProjectStatus.PROPOSED },
            ],
          })
          .lean();
      }

      if (currentUser.city === City.AURORA) {
        projects = await this.projectModel
          .find({
            $or: [
              { proposedBy: City.AURORA },
              { 'aurora.department': { $exists: true, $ne: null } },
              // Aurora needs to see Adama's proposals awaiting its decision
              { proposedBy: City.ADAMA, status: ProjectStatus.PROPOSED },
            ],
          })
          .lean();
      }
    }

    //department seee thir own department projects
    if (currentUser.role === Role.DEPT_OFFICER) {
      if (currentUser.city === City.ADAMA) {
        projects = await this.projectModel
          .find({
            'adama.department': currentUser.department,
          })
          .lean();
      }

      if (currentUser.city === City.AURORA) {
        projects = await this.projectModel
          .find({
            'aurora.department': currentUser.department,
          })
          .lean();
      }
    }

    if (!projects || projects.length === 0) return [];

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
  async addMilestone(
    projectId: string,
    createMilestoneDto: CreateMilestoneDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    //City Admin must belong to this project
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA && project.adama != null) ||
      (currentUser.city === City.AURORA && project.aurora != null);

    if (!isInvolved) {
      throw new ForbiddenException(
        'You can only add milestones to projects involving your city',
      );
    }

    // Project must be PLANNED or IN_PROGRESS
    const allowedStatuses = [
      ProjectStatus.PLANNED,
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.ON_HOLD,
      ProjectStatus.DELAYED,
    ];

    if (!allowedStatuses.includes(project.status)) {
      throw new BadRequestException(
        `Cannot add milestones to a project with status ${project.status}`,
      );
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
    });

    // Adding a milestone changes the denominator, so a project sitting at 100%
    // with 2 of 2 done must drop to 67% once a third is added.
    this.recalculateProgress(project);
    project.markModified('milestones');

    //Save and return
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  private recalculateProgress(project: any): void {
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(
      (m: any) => m.status === MilestoneStatus.COMPLETED,
    ).length;

    project.progressPercent =
      totalMilestones === 0
        ? 0
        : Math.round((completedMilestones / totalMilestones) * 100);
  }

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    updateMilestoneDto: UpdateMilestoneDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
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
        throw new ForbiddenException('You are not assigned to this project');
      }
    }

    // City Admin must be involved
    if (currentUser.role === Role.CITY_ADMIN) {
      const isInvolved =
        project.proposedBy === currentUser.city ||
        (currentUser.city === City.ADAMA && project.adama != null) ||
        (currentUser.city === City.AURORA && project.aurora != null);

      if (!isInvolved) {
        throw new ForbiddenException(
          'You can only update milestones for projects involving your city',
        );
      }
    }

    // Find milestone index
    const milestoneIndex = project.milestones.findIndex(
      (m: any) => m._id.toString() === milestoneId,
    );

    if (milestoneIndex === -1) {
      throw new NotFoundException('Milestone not found');
    }

    const milestone = project.milestones[milestoneIndex];

    // Officers/admins may only complete milestones their city owns (or BOTH).
    if (
      milestone.responsible !== Responsible.BOTH &&
      milestone.responsible !== currentUser.city
    ) {
      throw new ForbiddenException(
        'You can only update milestones assigned to your city',
      );
    }

    // Only City Admin can update completed milestone
    if (
      milestone.status === MilestoneStatus.COMPLETED &&
      currentUser.role !== Role.CITY_ADMIN
    ) {
      throw new BadRequestException(
        'Only City Admin can update a completed milestone',
      );
    }

    //Handle delayReason
    if (updateMilestoneDto.status === MilestoneStatus.DELAYED) {
      if (!updateMilestoneDto.delayReason) {
        throw new BadRequestException(
          'delayReason is required when milestone status is DELAYED',
        );
      }

      project.milestones[milestoneIndex].delayReason =
        updateMilestoneDto.delayReason;
    } else {
      project.milestones[milestoneIndex].delayReason = null;
    }

    // Handle completedAt
    if (updateMilestoneDto.status === MilestoneStatus.COMPLETED) {
      // Only set if not already completed
      if (milestone.status !== MilestoneStatus.COMPLETED) {
        project.milestones[milestoneIndex].completedAt = new Date();
      }
    } else {
      project.milestones[milestoneIndex].completedAt = null;
    }

    //Update status directly on array
    project.milestones[milestoneIndex].status = updateMilestoneDto.status;

    this.recalculateProgress(project);

    //Mark array as modified for Mongoose
    project.markModified('milestones');

    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }

  async addTask(
    projectId: string,
    createTaskDto: CreateTaskDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // City Admin must be involved in this project
    const isInvolved =
      project.proposedBy === currentUser.city ||
      (currentUser.city === City.ADAMA && project.adama != null) ||
      (currentUser.city === City.AURORA && project.aurora != null);

    if (!isInvolved) {
      throw new ForbiddenException(
        'You can only add tasks to projects involving your city',
      );
    }
    // Tasks are added to only the started project
    const allowedStatuses = [
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.ON_HOLD,
      ProjectStatus.DELAYED,
    ];

    if (!allowedStatuses.includes(project.status)) {
      throw new BadRequestException(
        `Cannot add tasks to a project with status ${project.status}. Project must be IN_PROGRESS, ON_HOLD or DELAYED`,
      );
    }

    const assignedUser = await this.userModel.findById(
      createTaskDto.assignedTo,
    );

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }
    if (assignedUser.city !== currentUser.city) {
      throw new ForbiddenException(
        'You can only assign tasks to staff members from your own city',
      );
    }

    if (!assignedUser.isActive) {
      throw new BadRequestException(
        'Cannot assign a task to a deactivated user',
      );
    }
    project.tasks.push({
      title: createTaskDto.title,
      description: createTaskDto.description,
      assignedTo: createTaskDto.assignedTo,
      assignedCity: currentUser.city,
      priority: createTaskDto.priority,
      dueDate: createTaskDto.dueDate,
      status: TaskStatus.TODO,
      completedAt: null,
    } as any);
    project.markModified('tasks');
    const updatedProject = await project.save();
    // Notify the assigned user
    await this.notificationService.create({
      recipient: createTaskDto.assignedTo,
      type: NotificationType.TASK_DUE,
      title: `New task assigned: ${createTaskDto.title}`,
      body: `You have been assigned a task on project: ${project.title}`,
      link: `/projects/${project._id}`,
      priority: NotificationPriority.NORMAL,
    });
    return this.mapToResponse(updatedProject);
  }

  async updateTask(
    projectId: string,
    taskId: string,
    updateTaskDto: UpdateTaskDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const taskIndex = project.tasks.findIndex(
      (t: any) => t._id.toString() === taskId,
    );

    if (taskIndex === -1) {
      throw new NotFoundException('Task not found');
    }

    const task = project.tasks[taskIndex];

    if (currentUser.role === Role.DEPT_OFFICER) {
      if (task.assignedTo.toString() !== currentUser.userId) {
        throw new ForbiddenException(
          'You can only update tasks assigned to you',
        );
      }
    }
    if (currentUser.role === Role.CITY_ADMIN) {
      if (task.assignedCity !== currentUser.city) {
        throw new ForbiddenException(
          'You can only update tasks belonging to your city',
        );
      }
    }
    if (currentUser.role === Role.DEPT_OFFICER) {
      if (updateTaskDto.priority || updateTaskDto.dueDate) {
        throw new ForbiddenException(
          'Department Officers can only update task status',
        );
      }
    }
    if (updateTaskDto.status) {
      const allowedTransitions: Record<string, TaskStatus[]> = {
        [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
        [TaskStatus.IN_PROGRESS]: [TaskStatus.DONE, TaskStatus.TODO],
        [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
      };

      const allowed = allowedTransitions[task.status];

      if (!allowed || !allowed.includes(updateTaskDto.status)) {
        throw new BadRequestException(
          `Cannot move task from ${task.status} to ${updateTaskDto.status}`,
        );
      }
      if (
        task.status === TaskStatus.DONE &&
        currentUser.role === Role.DEPT_OFFICER
      ) {
        throw new ForbiddenException(
          'Only City Admin can reopen a completed task',
        );
      }

      if (updateTaskDto.status === TaskStatus.DONE) {
        project.tasks[taskIndex].completedAt = new Date();
      }
      if (
        task.status === TaskStatus.DONE &&
        updateTaskDto.status !== TaskStatus.DONE
      ) {
        project.tasks[taskIndex].completedAt = null;
      }

      project.tasks[taskIndex].status = updateTaskDto.status;
    }
    if (updateTaskDto.priority) {
      project.tasks[taskIndex].priority = updateTaskDto.priority;
    }
    if (updateTaskDto.dueDate) {
      if (updateTaskDto.dueDate < new Date()) {
        throw new BadRequestException('Due date cannot be in the past');
      }

      project.tasks[taskIndex].dueDate = updateTaskDto.dueDate;
    }
    project.markModified('tasks');
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }
  async addIssue(
    projectId: string,
    createIssueDto: CreateIssueDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

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
        (currentUser.city === City.ADAMA && project.adama != null) ||
        (currentUser.city === City.AURORA && project.aurora != null);

      if (!isInvolved) {
        throw new ForbiddenException(
          'You can only report issues on projects involving your city',
        );
      }
    }
    const allowedStatuses = [
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.ON_HOLD,
      ProjectStatus.DELAYED,
    ];

    if (!allowedStatuses.includes(project.status)) {
      throw new BadRequestException(
        `Cannot report issues on a project with status ${project.status}`,
      );
    }
    project.issues.push({
      description: createIssueDto.description,
      severity: createIssueDto.severity,
      affectedCity: createIssueDto.affectedCity,
      raisedBy: currentUser.userId,
      raisedAt: new Date(),
      status: IssueStatus.OPEN,
      resolution: null,
      resolvedAt: null,
    });

    project.markModified('issues');
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }
  async updateIssue(
    projectId: string,
    issueId: string,
    updateIssueDto: UpdateIssueDto,
    currentUser: any,
  ): Promise<ProjectResponse> {
    const project = await this.projectModel.findById(projectId);

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
        (currentUser.city === City.ADAMA && project.adama != null) ||
        (currentUser.city === City.AURORA && project.aurora != null);

      if (!isInvolved) {
        throw new ForbiddenException(
          'You can only update issues on projects involving your city',
        );
      }
    }
    const issueIndex = project.issues.findIndex(
      (i: any) => i._id.toString() === issueId,
    );

    if (issueIndex === -1) {
      throw new NotFoundException('Issue not found');
    }

    const issue = project.issues[issueIndex];

    if (
      issue.status === IssueStatus.RESOLVED &&
      currentUser.role === Role.DEPT_OFFICER
    ) {
      throw new ForbiddenException(
        'Only City Admin can reopen a resolved issue',
      );
    }

    const allowedTransitions: Record<string, IssueStatus[]> = {
      [IssueStatus.OPEN]: [IssueStatus.IN_PROGRESS],
      [IssueStatus.IN_PROGRESS]: [IssueStatus.RESOLVED, IssueStatus.OPEN],
      [IssueStatus.RESOLVED]: [IssueStatus.IN_PROGRESS],
    };

    const allowed = allowedTransitions[issue.status];

    if (!allowed || !allowed.includes(updateIssueDto.status)) {
      throw new BadRequestException(
        `Cannot move issue from ${issue.status} to ${updateIssueDto.status}`,
      );
    }

    if (updateIssueDto.status === IssueStatus.RESOLVED) {
      if (!updateIssueDto.resolution) {
        throw new BadRequestException(
          'Resolution explanation is required when resolving an issue',
        );
      }
      project.issues[issueIndex].resolution = updateIssueDto.resolution;
      project.issues[issueIndex].resolvedAt = new Date();
    }
    if (
      issue.status === IssueStatus.RESOLVED &&
      updateIssueDto.status !== IssueStatus.RESOLVED
    ) {
      project.issues[issueIndex].resolution = null;
      project.issues[issueIndex].resolvedAt = null;
    }

    project.issues[issueIndex].status = updateIssueDto.status;
    project.markModified('issues');
    const updatedProject = await project.save();
    return this.mapToResponse(updatedProject);
  }
}
