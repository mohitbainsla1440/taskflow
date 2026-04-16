import jwt, { type SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = '7d';

export function sign(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verify(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  const { userId, email } = decoded as JwtPayload;
  if (typeof userId !== 'number' || typeof email !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { userId, email };
}
