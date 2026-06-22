import { Controller,Post ,Body} from "@nestjs/common";
import {UserService }  from "../service/users.service";
import {CreateUserDto} from"../dto/users.dto";
@Controller()
export class UsersConteroller {
  constructor(
    private readonly userService: UserService,
  ) { }
  @Post("/users")
   async createUser(@Body() createUserDto:CreateUserDto ){
   const reuslt = await this.userService.createUser(createUserDto);
   return reuslt;
  }
}