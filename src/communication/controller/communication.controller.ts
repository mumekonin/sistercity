import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { MessageService } from "../service/communication.service";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enum/enum";

@Controller("/messages")
export class MessageController {
  constructor(
    private readonly messageService: MessageService
  ) { }
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.DEPT_OFFICER, Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getMessageById(@Param('id') id: string, @Req() req: any,
  ) {
    return this.messageService.getMessageById(id, req.user);
  }
}

