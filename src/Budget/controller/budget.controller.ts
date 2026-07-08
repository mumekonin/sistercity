import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { CreateExpenditureDto, UpdateExpenditureDto } from '../dto/budget.dto';
import { multerConfig } from '../../common/cloudinary/multer.config';
import { BudgetService } from '../service/budget.servicee';

@Controller('/budgets')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
  ) { }
  @Post('/:projectId')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.DEPT_OFFICER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async recordExpenditure(@Param('projectId') projectId: string, @UploadedFile() file: any, @Body() createExpenditureDto: CreateExpenditureDto, @Req() req: any) {
    return this.budgetService.recordExpenditure(projectId, createExpenditureDto, file, req.user);
  }
  @Get('/:projectId')
  @UseGuards(AuthGuard('jwt'))
  async getBudgetByProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.budgetService.getBudgetByProject(projectId, req.user,);
  }
  @Patch('/:projectId/expenditures/:eid')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async updateExpenditure(@Param('projectId') projectId: string, @Param('eid') eid: string, @Body() updateExpenditureDto: UpdateExpenditureDto, @Req() req: any) {
    return this.budgetService.updateExpenditure(projectId, eid, updateExpenditureDto, req.user);
  }

}