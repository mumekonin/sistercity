import { Controller, Post, Body, Req, UseGuards, UseInterceptors, UploadedFiles, Patch, Param } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { NewsService } from '../service/news.service';
import { CreateNewsDto, UpdateNewsDto } from '../dto/news.dto';

@Controller('/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 5)) // ← max 5 images
  async createNews(@Body() createNewsDto: CreateNewsDto, @UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    return this.newsService.createNews(createNewsDto, files, req.user);
  }
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 5))
  async updateNews(@Param('id') id: string, @Body() updateNewsDto: UpdateNewsDto, @UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    return this.newsService.updateNews(id, updateNewsDto, files, req.user);
  }
}