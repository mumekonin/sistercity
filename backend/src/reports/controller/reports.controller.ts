import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { ReportsService } from '../service/reports.service';
import { CreateReportDto } from '../dto/reports.dto';
@Controller('/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}
  @Get('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getAllReports(@Req() req: any) {
    return this.reportsService.getAllReports(req.user);
  }
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async generateReport(
    @Body() createReportDto: CreateReportDto,
    @Req() req: any,
  ) {
    return this.reportsService.generateReport(createReportDto, req.user);
  }
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getReportById(@Param('id') id: string, @Req() req: any) {
    return this.reportsService.getReportById(id, req.user);
  }
  @Get('/:id/download')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async downloadReport(
    @Param('id') id: string,
    @Query('type') type: string = 'pdf',
    @Req() req: any,
    @Res() res: Response,
  ) {
    return this.reportsService.downloadReport(id, type, req.user, res);
  }
}
