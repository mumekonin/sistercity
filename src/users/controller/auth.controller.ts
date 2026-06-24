import { Controller, Post, Body, Req } from "@nestjs/common";
import { UserService } from "../service/users.service";
import { JwtAuthGuard } from "src/common/guards/jwtauth.gourds";
import { LoginUserDto ,ChangePasswordDto} from "../dto/users.dto";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
@Controller("/auth")
export class AuthController {
  constructor(
    private readonly userService: UserService
  ) { }
  @Post("/login")
  async loginUser(@Body() loginDto: LoginUserDto) {
    const result = await this.userService.loginUser(loginDto);
    return result;
  }

  @JwtAuthGuard()
  @Post('/logout')
  async logoutUser(@Req() req) {
    const userId = req.user.userId;
    const result = await this.userService.logoutUser(userId);
    return result;
  }
  @Post('/change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
    const userId = req.user.userId;
    return this.userService.changePassword(userId, changePasswordDto);
  }
}