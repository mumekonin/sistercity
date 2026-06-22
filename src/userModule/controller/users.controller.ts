import { Controller,Post ,Body,Req} from "@nestjs/common";
import {UserService }  from "../service/users.service";
import {CreateUserDto,LoginUserDto} from"../dto/users.dto";
import { JwtAuthGuard } from "src/common/guards/jwtauth.gourds";
@Controller("/users")
export class UsersConteroller {
  constructor(
    private readonly userService: UserService,
  ) { }
  @Post("/register")
   async createUser(@Body() createUserDto:CreateUserDto ){
   const reuslt = await this.userService.createUser(createUserDto);
   return reuslt;
  }
  @Post("/login")
  async loginUser(@Body() loginDto:LoginUserDto){
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
}