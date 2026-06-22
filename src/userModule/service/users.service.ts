import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schema/users.shema";
import { Model } from "mongoose";
import { CreateUserDto, LoginUserDto } from "../dto/users.dto";
import * as bcrypt from "bcrypt";
import { UserResponse } from "../response/users.response";
import { commonUtils } from "../../common/utils/utils";
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  async createUser(createUserDto: CreateUserDto) {
    //check is the user already exists with the same email
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });

    if (existingUser) {
      throw new BadRequestException("user already exists with the same email");
    }

    //hashed password
    const hashedPwd = await bcrypt.hash(createUserDto.password, 10)
    //prepare instance to save it db
    const newUser = new this.userModel({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: hashedPwd,
      role: createUserDto.role,
      city: createUserDto.city,
      department: createUserDto.department,
      jobTitle: createUserDto.jobTitle,
      phone: createUserDto.phone,
    })

    const savedUser = await newUser.save();

    //prepare response object
    const userResponse: UserResponse = {
      id: savedUser._id.toString(),
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      city: savedUser.city,
      department: savedUser.department,
      jobTitle: savedUser.jobTitle,
      phone: savedUser.phone,

    }
    return userResponse;
  }

  //login user
  async loginUser(loginDto: LoginUserDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new BadRequestException('username is not found');
    }
    //compare password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('invalid password');
    }
    const jwtData = {
      userId: user._id.toString(), 
      role: user.role,
      email:user.email             
    }
    const generateJwtToken = commonUtils.generateJwtToken(jwtData);

    return {
        token:generateJwtToken
    }
  }
}