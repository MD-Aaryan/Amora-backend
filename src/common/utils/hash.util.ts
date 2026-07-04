import * as crypto from 'crypto';

export class HashUtil {
  static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
