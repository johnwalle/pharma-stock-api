import jwt, { JwtPayload } from 'jsonwebtoken';
import dayjs from 'dayjs';
import Token from '../models/token.model';
import User from '../models/user.model';
import tokenTypes from '../config/token';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import userService from './user.service';

class TokenService {
  private jwtSecret: string;

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret is not defined in environment variables');
    }
    this.jwtSecret = process.env.JWT_SECRET;
  }

  generateToken(userId: string, expires: dayjs.Dayjs, type: string): string {
    const payload = {
      sub: userId,
      iat: dayjs().unix(),
      exp: expires.unix(),
      type,
    };
    return jwt.sign(payload, this.jwtSecret);
  }

  async generateAuthTokens(userId: string, rememberMe: boolean) {
    const accessTokenExpires = dayjs().add(1, 'hour');
    const accessToken = this.generateToken(userId, accessTokenExpires, tokenTypes.ACCESS);

    const refreshTokenExpires = rememberMe
      ? dayjs().add(7, 'days')
      : dayjs().add(1, 'hour');

    const refreshToken = this.generateToken(userId, refreshTokenExpires, tokenTypes.REFRESH);

    await this.saveToken(refreshToken, userId, refreshTokenExpires.toDate(), tokenTypes.REFRESH);

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
      rememberMe, // ⬅️ Include the flag
    };
  }



  async saveToken(
    token: string,
    userId: string,
    expires: Date,
    type: string,
    blacklisted = false
  ) {
    return Token.create({
      token,
      user: userId,
      expires,
      type,
      blacklisted,
    });
  }

  async generateResetToken(userId: string): Promise<string> {
    const resetTokenExpires = dayjs().add(1, 'day');
    const resetToken = this.generateToken(userId, resetTokenExpires, tokenTypes.RESET_PASSWORD);
    await this.saveResetToken(userId, resetToken);
    return resetToken;
  }

  async saveResetToken(userId: string, token: string) {
    await Token.updateOne(
      { user: userId, type: tokenTypes.RESET_PASSWORD },
      { token, expires: dayjs().add(1, 'day').toDate() },
      { upsert: true }
    );
  }

  async verifyToken(token: string, type: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload & { sub: string; type: string };
      if (payload.type !== type) return null;

      console.log('Token payload:', payload);

      const storedToken = await Token.findOne({
        user: payload.sub,
        type,
        expires: { $gt: new Date() },
      });

      console.log('Stored token:', storedToken);

      if (!storedToken) return null;

      const user = await userService.getUserById(payload.sub);
      return user;
    } catch (err) {
      return null;
    }
  }

  async findUser(token: string) {
    const payload = jwt.verify(token, this.jwtSecret) as JwtPayload & { sub: string };
    return User.findById(payload.sub);
  }

  async removeToken(userId: string) {
    return Token.deleteMany({ user: userId });
  }

  async findToken(token: string) {
    return Token.find({ token });
  }

  async tokenExpired(tokenExp: number): Promise<boolean> {
    const expirationDate = dayjs.unix(tokenExp);
    return dayjs().isAfter(expirationDate);
  }
}

export default TokenService;
