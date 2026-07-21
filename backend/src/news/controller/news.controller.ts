import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Param,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { DbRolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/role.decorator';
import { Role } from '../../common/enum/enum';
import { NewsService } from '../service/news.service';
import { CreateNewsDto, UpdateNewsDto } from '../dto/news.dto';
@Controller('/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}
  @Post('/')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 5))
  async createNews(
    @Body() createNewsDto: CreateNewsDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.newsService.createNews(createNewsDto, files, req.user);
  }
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(FilesInterceptor('images', 5))
  async updateNews(
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.newsService.updateNews(id, updateNewsDto, files, req.user);
  }
  @Get('/manage')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getManageNews(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return this.newsService.getManageNews(
      category,
      city,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      req.user,
    );
  }

  @Get('/manage/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async getManageNewsById(@Param('id') id: string, @Req() req?: any) {
    return this.newsService.getManageNewsById(id, req.user);
  }

  @Get('/')
  async getAllNews(
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.getAllNews(
      category,
      city,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
  @Get(':id')
  async getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN)
  async deleteNews(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    return this.newsService.deleteNews(id, req.user);
  }
}
