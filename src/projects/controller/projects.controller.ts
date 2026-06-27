import { Controller, Post, Body, Req, UseGuards, Get, Param, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto, UpdateProjectDto, CreateMilestoneDto, UpdateMilestoneDto, CreateTaskDto } from '../dto/projects.dto';

@Controller('/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
  ) { }
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async createProject(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.createProject(createProjectDto, req.user);
  }
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.DEPT_OFFICER, Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getProjectById(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.getProjectById(id, req.user);
  }
  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async updateProject(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() req: any,) {
    return this.projectsService.updateProject(id, updateProjectDto, req.user);
  }
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
   @Roles(Role.CITY_ADMIN,Role.DEPT_OFFICER,Role.SUPER_ADMIN)
  async getAllProjects(@Req() req: any) {
    return this.projectsService.getAllProjects(req.user);
  }
  @Post('/:id/milestones')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async addMilestone(@Param('id') id: string, @Body() createMilestoneDto: CreateMilestoneDto, @Req() req: any,
  ) {
    return this.projectsService.addMilestone(id, createMilestoneDto, req.user,);
  }

@Patch('/:id/milestones/:mid')
@UseGuards(AuthGuard('jwt'), DbRolesGuard)
@Roles(Role.CITY_ADMIN, Role.DEPT_OFFICER)
async updateMilestone(@Param('id')  id:  string,@Param('mid') mid: string,@Body() updateMilestoneDto: UpdateMilestoneDto,@Req() req: any,
) {
  return this.projectsService.updateMilestone(id,mid,updateMilestoneDto,req.user);
}
@Post('/:id/tasks')
@UseGuards(AuthGuard('jwt'), DbRolesGuard)
@Roles(Role.CITY_ADMIN)
async addTask( @Param('id') id: string, @Body() createTaskDto: CreateTaskDto, @Req() req: any,
) {
  return this.projectsService.addTask( id, createTaskDto, req.user);
}
}