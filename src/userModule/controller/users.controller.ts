import { Controller,Post ,Body} from "@nestjs/common";
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
  @JwtAuthGuard()
  @Post("/login")
  async loginUser(@Body() loginDto:LoginUserDto){
    const result = await this.userService.loginUser(loginDto);
    return result;
  }
}