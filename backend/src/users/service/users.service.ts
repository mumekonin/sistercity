import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schema/users.shema';
import { Model } from 'mongoose';
import {
  CreateUserDto,
  LoginUserDto,
  UpdateUserDto,
  ChangePasswordDto,
} from '../dto/users.dto';
import * as bcrypt from 'bcrypt';
import { UserResponse } from '../response/users.response';
import { commonUtils } from '../../common/utils/utils';
import { Role } from 'src/common/enum/enum';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly emailService: EmailService,
  ) {}

  async createUser(createUserDto: CreateUserDto, currentUser: any) {
    if (currentUser.role === Role.CITY_ADMIN) {
      if (
        createUserDto.role === Role.CITY_ADMIN ||
        createUserDto.role === Role.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'City Admin can only create Department Officers',
        );
      }
      if (createUserDto.city !== currentUser.city) {
        throw new ForbiddenException(
          'You can only create users for your own city',
        );
      }
    }
    if (currentUser.role === Role.SUPER_ADMIN) {
      if (createUserDto.role === Role.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Super Admin cannot create another Super Admin',
        );
      }
    }
    if (createUserDto.role === Role.DEPT_OFFICER && !createUserDto.department) {
      throw new BadRequestException(
        'Department is required for Department Officer',
      );
    }
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new BadRequestException('A user already exists with this email');
    }
    const hashedPwd = await bcrypt.hash(createUserDto.password, 10);
    const newUser = new this.userModel({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      password: hashedPwd,
      role: createUserDto.role,
      city: createUserDto.city,
      department: createUserDto.department,
      jobTitle: createUserDto.jobTitle,
      phone: createUserDto.phone,
    });
    const savedUser = await newUser.save();
    const userResponse: UserResponse = {
      id: savedUser._id.toString(),
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      city: savedUser.city,
      department: savedUser.department,
      jobTitle: savedUser.jobTitle,
      phone: savedUser.phone,
    };
    return userResponse;
  }

  //login user
  async loginUser(loginDto: LoginUserDto) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Contact your administrator.',
      );
    }
    // Check if account is currently locked
    const now = new Date();
    if (user.lockUntil && user.lockUntil > now) {
      const msLeft = user.lockUntil.getTime() - now.getTime();
      const minutesLeft = Math.ceil(msLeft / 60000);
      throw new UnauthorizedException(
        `Your account is locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      );
    }
    // If lock has expired, reset automatically
    if (user.lockUntil && user.lockUntil <= now) {
      user.lockUntil = null;
      user.failedLoginAttempts = 0;
    }
    //Check password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
        await user.save();
        throw new UnauthorizedException(
          'Too many failed attempts. Your account is locked for 15 minutes.',
        );
      }
      await user.save();
      const attemptsLeft = 5 - user.failedLoginAttempts;
      throw new BadRequestException(
        `Invalid password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before account is locked.`,
      );
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = now;
    await user.save();

    const jwtData = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      city: user.city,
      department: user.department,
    };
    const token = commonUtils.generateJwtToken(jwtData);
    const refreshToken = commonUtils.generateRefreshToken({
      userId: user._id.toString(),
    });
    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();
    return {
      token,
      refreshToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        city: user.city,
        department: user.department,
        jobTitle: user.jobTitle,
      },
    };
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
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: any,
  ): Promise<UserResponse> {
    const targetUser = await this.userModel.findById(id);
    if (!targetUser) throw new NotFoundException('User not found');

    if (
      currentUser.role === Role.CITY_ADMIN &&
      targetUser.city !== currentUser.city
    ) {
      throw new ForbiddenException(
        'You can only update users in your own city',
      );
    }

    if (updateUserDto.role && currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can change roles');
    }

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
    if (updateUserDto.isActive !== undefined) {
      targetUser.isActive = updateUserDto.isActive;
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
      isActive: updatedUser.isActive,
    };

    return userResponse;
  }
  async changePassword(
    currentUserId: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.userModel.findById(currentUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(
        'Current password is incorrect. Please enter your login password.',
      );
    }
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as your current password',
      );
    }
    if (
      changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword
    ) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }
    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.refreshToken = null;
    await user.save();
    return {
      message: 'Password changed successfully. Please log in again.',
    };
  }
  async refreshTokens(refreshToken: string) {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
      const payload = jwt.verify(refreshToken, secret) as { userId: string };
      const user = await this.userModel.findById(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Access denied. User is inactive or does not exist.',
        );
      }
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token.');
      }
      const newJwtPayload = {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        city: user.city,
        department: user.department,
      };
      const newAccessToken = commonUtils.generateJwtToken(newJwtPayload);
      const newRefreshToken = commonUtils.generateRefreshToken({
        userId: user._id.toString(),
      });
      user.refreshToken = newRefreshToken;
      await user.save();
      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired session.');
    }
  }
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // don't reveal if email exists
      return { message: 'If this email exists, a reset link has been sent' };
    }

    // generate plain token to send to user
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    const expiry = new Date(Date.now() + 3600000);

    // save hashed token to user
    user.resetToken = hashedToken;
    user.resetTokenExpiry = expiry;
    await user.save();

    // send email with reset link containing the plain token
    await this.emailService.sendPasswordResetEmail(user.email, plainToken);

    return {
      message: 'If this email exists, a reset link has been sent',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userModel.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }
}
