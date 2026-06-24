import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { ProjectsService } from '../service/projects.service';
import { CreateProjectDto } from '../dto/projects.dto';

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
}