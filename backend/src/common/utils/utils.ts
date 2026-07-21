import * as jwt from 'jsonwebtoken';
export class commonUtils {
  //jwt token generation
  static generateJwtToken(jwtData: { userId: string; role: string }) {
    return jwt.sign(jwtData, process.env.JWT_SECRET!, { expiresIn: '15m' });
  }
  static generateRefreshToken(jwtData: { userId: string }) {
    return jwt.sign(
      jwtData,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
      },
    );
  }
}
