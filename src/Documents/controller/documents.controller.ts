import { Controller, Post, Body, Req, UseGuards, UseInterceptors, UploadedFile, Get, Param, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { DocumentsService } from '../service/documents.service';
import { multerConfig } from '../../common/cloudinary/multer.config';
import { CreateDocumentDto } from '../dto/documents.dto';

@Controller('/documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
  ) { }
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.DEPT_OFFICER)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Body() createDocumentDto: CreateDocumentDto, @Req() req: any,
  ) {
    return this.documentsService.uploadDocument(createDocumentDto, file, req.user);
  }
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getAllDocuments(@Req() req: any) {
    return this.documentsService.getAllDocuments(req.user);
  }
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getDocumentById(@Param('id') id: string, @Req() req: any
  ){
    return this.documentsService.getDocumentById(id, req.user);
  }
}