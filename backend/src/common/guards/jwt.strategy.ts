import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { Model } from 'mongoose';
import { User } from '../../users/schema/users.shema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    };
    super(options);
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.userId).lean();
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Access denied. User is inactive or does not exist.',
      );
    }
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new UnauthorizedException(
        'Your account is locked. Please try again later.',
      );
    }
    // Fresh values from the database so demotions / city moves take effect
    // immediately instead of waiting for the access token to expire.
    return {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      city: user.city,
      department: user.department,
    };
  }
}
