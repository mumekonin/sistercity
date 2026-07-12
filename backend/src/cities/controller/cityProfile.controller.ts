import { Controller, Post, Body, Req, Param, Put, Get} from "@nestjs/common";
import { CityProfileService } from "../service/cityProfile.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "../../common/enum/enum";
import { CreateCityProfileDto, UpdateCityProfileDto} from "../dto/cityProfile.dto";

@Controller("/cities")
export class CityProfileController {
  constructor(
    private readonly cityProfileService: CityProfileService
  ) {}
  @Post("/")
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createCityProfile(
    @Body() createCityProfileDto: CreateCityProfileDto
  ) {
    return this.cityProfileService.createCityProfile(createCityProfileDto);
  }
  @Get("/")
  async getAllCityProfiles() {
    return this.cityProfileService.getAllCityProfiles();
  }
  @Get("/:city")
  async getCityProfileByCityName(
    @Param('city') city: string
  ) {
    return this.cityProfileService.getCityProfileByCity(city);
  }

  @Get("/:city/departments")
  async getCityDepartments(
    @Param('city') city: string
  ) {
    return this.cityProfileService.getCityDepartments(city);
  }
  @Put("/:city")
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  async updateCityProfile(
    @Param('city') city: string,
    @Body() updateCityProfileDto: UpdateCityProfileDto,
    @Req() req: any
  ) {
    return this.cityProfileService.updateCityProfile(
      city, 
      updateCityProfileDto, 
      req.user
    );
  }
}