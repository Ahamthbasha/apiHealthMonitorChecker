
import dotenv from "dotenv";
import path from "path";

const envFile = process.env.NODE_ENV === "production" 
  ? ".env.production" 
  : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Loaded env file: ${envFile}`);

const criticalEnvVars = [
  "MONGODB_URI",
  "BCRYPT_SALT_ROUNDS",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
];

const missingVars = criticalEnvVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`Missing critical environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI!,
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS!, 10),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY ,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
  JWT_REGISTRATION_SECRET: process.env.JWT_REGISTRATION_SECRET!,
  JWT_REGISTRATION_EXPIRY: process.env.JWT_REGISTRATION_EXPIRY,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  GMAIL_FROM_NAME: process.env.GMAIL_FROM_NAME,
  hasGmailConfig: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
};