import { createHmac } from 'node:crypto';

export type JwtPayload = {
  sub: string;
  email: string;
  role?: 'USER' | 'SUPER_ADMIN' | (string & {});
  iat?: number;
  exp?: number;
};

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-dev-secret';

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf-8');
}

function sign(input: string) {
  return createHmac('sha256', JWT_SECRET).update(input).digest('base64url');
}

export function signJwt(payload: JwtPayload, expiresInSeconds = 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(fullPayload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): JwtPayload {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    throw new Error('Invalid token');
  }

  const expectedSignature = sign(`${header}.${payload}`);

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const decodedPayload = JSON.parse(decodeBase64Url(payload)) as JwtPayload;

  if (!decodedPayload.exp || decodedPayload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return decodedPayload;
}
