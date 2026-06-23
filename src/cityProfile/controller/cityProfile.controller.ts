import { Controller,Post,Body } from "@nestjs/common";
import { CityProfileService } from "../service/cityProfile.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "../../common/enum/enum";
import { CreateCityProfileDto } from "../dto/cityProfile.dto";
@Controller("/cities")
export class CityProfileController {
  constructor(
    private readonly cityProfileService: CityProfileService
  ) {}
  @Post()
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createCityProfile(@Body() createCityProfileDto: CreateCityProfileDto,) {
    return this.cityProfileService.createCityProfile(createCityProfileDto);
  }
}