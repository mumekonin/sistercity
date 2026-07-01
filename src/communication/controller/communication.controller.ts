import {  Controller,  Get,  Post,  Patch,  Param,  Body,  Req,  Query,  UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { MessageService } from '../service/communication.service';
import {  CreateMessageDto,  ReplyMessageDto,  UpdateMessageDto,} from '../dto/communication.dto';
import {  MessageResponse,  MessageListResponse} from '../response/communication.response';

@Controller('/messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService
  ) {}
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.DEPT_OFFICER, Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async sendMessage(@Body() createMessageDto: CreateMessageDto,@Req() req: any) {
    return this.messageService.sendMessage(createMessageDto, req.user);
  }
  @Get('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.DEPT_OFFICER, Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getMessages(  @Query('type') type: string = 'received',  @Req() req: any){
    return this.messageService.getMessages(req.user, type);
  }
}