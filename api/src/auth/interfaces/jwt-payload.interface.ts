export interface JwtPayload {
    id: string;
    role: 'admin' | 'general' | 'investigator';
    iat?: number;
    exp?: number;
  }
  