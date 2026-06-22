import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User } from "../schema/users.shema";
import { Model } from "mongoose";
import { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dto/users.dto";
import * as bcrypt from "bcrypt";
import { UserResponse } from "../response/users.response";
import { commonUtils } from "../../common/utils/utils";
import { Role } from "src/common/enum/enum";
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
      email: user.email,
      city: user.city,
      department: user.department,
    }
    const generateJwtToken = commonUtils.generateJwtToken(jwtData);

    return {
      token: generateJwtToken
    }
  }
  //logout user
  async logoutUser(currentUserId: string) {
    const user = await this.userModel.findById(currentUserId);
    if (!user) {
      throw new BadRequestException('user not found');
    }
    user.refreshToken = null;
    await user.save();
    return { message: 'user logged out successfully' };
  }
  //GET all users
  async getAllUsers(currentUser: any): Promise<UserResponse[]> {
    let users;

    const excludeFilter = {
      _id: { $ne: currentUser.userId },
      role: { $ne: Role.SUPER_ADMIN },
    };

    if (currentUser.role === Role.SUPER_ADMIN) {
      users = await this.userModel
        .find({ _id: { $ne: currentUser.userId } })
        .select('-password')
        .lean();
    }

    if (currentUser.role === Role.CITY_ADMIN) {
      users = await this.userModel
        .find({ city: currentUser.city, ...excludeFilter })
        .select('-password')
        .lean();
    }

    if (currentUser.role === Role.DEPT_OFFICER) {
      users = await this.userModel
        .find({ city: currentUser.city, department: currentUser.department, ...excludeFilter })
        .select('-password')
        .lean();
    }

    if (!users) return [];

    const usersResponse: UserResponse[] = users.map((user) => {
      return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        city: user.city,
        department: user.department,
        jobTitle: user.jobTitle,
        phone: user.phone,
        isActive: user.isActive,
        isLocked: user.isLocked,
        failedLoginAttempts: user.failedLoginAttempts,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      };
    });

    return usersResponse;
  }
  // service
  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUser: any): Promise<UserResponse> {
    const targetUser = await this.userModel.findById(id);
    if (!targetUser) throw new NotFoundException('User not found');

    if (currentUser.role === Role.CITY_ADMIN && targetUser.city !== currentUser.city) {
      throw new ForbiddenException('You can only update users in your own city');
    }

    if (updateUserDto.role && currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can change roles');
    }

    // profile fields
    if (updateUserDto.fullName) {
      targetUser.fullName = updateUserDto.fullName;
    }
    if (updateUserDto.email) {
      targetUser.email = updateUserDto.email;

    }
    if (updateUserDto.jobTitle) {
      targetUser.jobTitle = updateUserDto.jobTitle;
    }
    if (updateUserDto.department) {
      targetUser.department = updateUserDto.department;
    }
    if (updateUserDto.phone) {
      targetUser.phone = updateUserDto.phone;
    }
    if (updateUserDto.city) {
      targetUser.city = updateUserDto.city;
    }
    if (updateUserDto.role) {
      targetUser.role = updateUserDto.role;
    }

    const updatedUser = await targetUser.save();

    const userResponse: UserResponse = {
      id: updatedUser._id.toString(),
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      city: updatedUser.city,
      department: updatedUser.department,
      jobTitle: updatedUser.jobTitle,
      phone: updatedUser.phone,
    };

    return userResponse;
  }
}