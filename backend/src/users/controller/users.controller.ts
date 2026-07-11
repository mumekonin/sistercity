import { Controller, Post, Patch, Body, Req, Get, Param } from "@nestjs/common";
import { UserService } from "../service/users.service";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dto/users.dto";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DbRolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorator/role.decorator";
import { Role } from "src/common/enum/enum";
@Controller("/users")
export class UsersConteroller {
  constructor(
    private readonly userService: UserService,
  ) { }
  @Post('/create')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CITY_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    return this.userService.createUser(createUserDto, req.user);
  }
  @Get('/allUsersByRole')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  getAllUsers(@Req() req) {
    return this.userService.getAllUsers(req.user);
  }
  @Patch('/updateUser/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.CITY_ADMIN, Role.SUPER_ADMIN)
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    return this.userService.updateUser(id, updateUserDto, req.user);
  }
}