import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { EventService } from "../service/events.service";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enum/enum";
import { CreateEventDto } from "../dto/events.dto";
@Controller('/events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
  ) { }
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async createEvent(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    return this.eventService.createEvent(createEventDto, req.user);
  }
  @Get('/')
  async getAllEvents(@Query('month') month?: string, @Query('year') year?: string, @Req() req?: any) {
    return this.eventService.getAllEvents(req?.user,month ? parseInt(month) : undefined,year ? parseInt(year) : undefined );
  }
}