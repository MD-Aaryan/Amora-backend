export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export class PaginationUtil {
  static encodeCursor(id: string): string {
    return Buffer.from(id)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('ascii');
  }
}
