import bcrypt from 'bcrypt';
import { IHashingService } from './IHashService';

export class HashingService implements IHashingService {
  private saltRounds: number;

  constructor() {
    const roundsStr = process.env.BCRYPT_SALT_ROUNDS;

    if (!roundsStr) {
      throw new Error('BCRYPT_SALT_ROUNDS is not set in environment variables');
    }

    const rounds = parseInt(roundsStr, 10);

    if (isNaN(rounds) || rounds < 8 || rounds > 15) {
      throw new Error(
        'BCRYPT_SALT_ROUNDS must be a number between 8 and 15 (typical range)'
      );
    }

    this.saltRounds = rounds;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}