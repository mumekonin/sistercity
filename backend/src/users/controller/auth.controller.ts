import { Controller, Post, Body, Req } from '@nestjs/common';
import { UserService } from '../service/users.service';
import { JwtAuthGuard } from 'src/common/guards/jwtauth.gourds';
import {
  LoginUserDto,
  ChangePasswordDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dto/users.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
@Controller('/auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}
  @Post('/login')
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
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.userId;
    return this.userService.changePassword(userId, changePasswordDto);
  }
  @Post('/refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refreshTokens(refreshTokenDto.refreshToken);
  }
  @Post('/forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.userService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
