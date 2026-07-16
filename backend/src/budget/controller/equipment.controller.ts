import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { BudgetService } from '../service/budget.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from '../dto/equipment.dto';

@Controller('/equipment')
export class EquipmentController {
  constructor(
    private readonly budgetService: BudgetService,
  ) { }

  @Post('/:projectId')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async addEquipment(
    @Param('projectId') projectId: string,
    @Body() createEquipmentDto: CreateEquipmentDto,
    @Req() req: any,
  ) {
    return this.budgetService.addEquipment(projectId, createEquipmentDto, req.user);
  }

  @Get('/:projectId')
  @UseGuards(AuthGuard('jwt'))
  async getEquipmentByProject(
    @Param('projectId') projectId: string,
    @Req() req: any,
  ) {
    return this.budgetService.getEquipmentByProject(projectId, req.user);
  }

  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async updateEquipment(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @Req() req: any,
  ) {
    return this.budgetService.updateEquipment(id, updateEquipmentDto, req.user);
  }
}
