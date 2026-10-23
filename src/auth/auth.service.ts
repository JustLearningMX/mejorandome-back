import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthResponse, AuthenticatedUser, JwtPayload } from './interfaces/auth.interface.js';

@Injectable()
export class AuthService {
  private readonly oauth2Client: OAuth2Client;
  private readonly googleClientId: string;
  private readonly jwtExpiresIn: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.googleClientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    this.oauth2Client = new OAuth2Client(this.googleClientId);
  }

  async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.sub) {
        throw new UnauthorizedException('Token de Google inválido: faltan campos requeridos');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const payload = await this.verifyGoogleToken(idToken);
    const googleId = payload.sub;
    const email = payload.email!.toLowerCase();
    const name = payload.name || email.split('@')[0];

    let user = await this.findUserByGoogleId(googleId);

    if (!user) {
      user = await this.findOrCreateUser(googleId, email, name);
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
      },
    };
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    };
  }

  private async findUserByGoogleId(googleId: string) {
    const identity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: 'google',
          providerSubject: googleId,
        },
      },
      include: {
        user: true,
      },
    });

    return identity?.user ?? null;
  }

  private async findOrCreateUser(googleId: string, email: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await this.prisma.authIdentity.create({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerSubject: googleId,
        },
      });
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        email,
        name,
        authIdentities: {
          create: {
            provider: 'google',
            providerSubject: googleId,
          },
        },
      },
    });
  }
}
