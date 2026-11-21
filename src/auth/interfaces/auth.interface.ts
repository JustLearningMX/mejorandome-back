export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string | number;
  user: AuthenticatedUser;
}

export interface IssuedRefreshToken {
  id: string;
  value: string;
  expiresAt: Date;
}

export interface RotatedRefreshToken {
  userId: string;
  token: IssuedRefreshToken;
}
