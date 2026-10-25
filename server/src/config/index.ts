import dotenv from 'dotenv';

dotenv.config();

function list(value: string | undefined, fallback: string): string[] {
  return (value || fallback).split(',').map((item) => item.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  secret: process.env.APP_SECRET || 'dev-only-change-me',
  jwtExpires: '7d' as const,
  clientOrigins: list(process.env.CLIENT_ORIGIN, 'https://sandbox.local,https://www.sandbox.local'),
  db: {
    host: process.env.DB_HOST || '127.0.1.19',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'usr_internal',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_sandbox',
  },
  maxContacts: 500,
  isProduction: process.env.NODE_ENV === 'production',
};
