import { Controller, Post, Body, Req, Param, Put, Get } from "@nestjs/common";
import { CityProfileService } from "../service/cityProfile.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "../../common/enum/enum";
import { CreateCityProfileDto, UpdateCityProfileDto } from "../dto/cityProfile.dto";
import { CityProfileResponse } from "../response/cityProfile.response";
@Controller("/cities")
export class CityProfileController {
  constructor(
    private readonly cityProfileService: CityProfileService
  ) { }
  @Post("/createProfile")
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createCityProfile(@Body() createCityProfileDto: CreateCityProfileDto,) {
    return this.cityProfileService.createCityProfile(createCityProfileDto);
  }
  @Put('/updateCityProfile/:cityName')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async updateCityProfile(@Param('cityName') cityName: string, @Body() updateCityProfileDto: UpdateCityProfileDto, @Req() req: any,): Promise<CityProfileResponse> {
    return this.cityProfileService.updateCityProfile(cityName, updateCityProfileDto, req.user);
  }
  @Get("/getAllCityProfiles")
  async getAllCityProfiles() {
    return this.cityProfileService.getAllCityProfiles();
  }
  @Get('/getCityProfileByName/:city')
  async getCityProfileByCity(@Param('city') city: string) {
    return this.cityProfileService.getCityProfileByCity(city);
  }
}