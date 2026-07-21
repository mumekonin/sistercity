import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Get('/')
  async search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Req() req?: any,
  ) {
    return this.searchService.search(query, type, req?.user ?? null);
  }
}
