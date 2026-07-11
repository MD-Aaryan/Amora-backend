import { ApiProperty } from '@nestjs/swagger';

export class SearchPaginationMeta {
  @ApiProperty({ description: 'Next page cursor (null if no more results)' })
  nextCursor: string | null;

  @ApiProperty({ description: 'Whether there are more results' })
  hasMore: boolean;

  @ApiProperty({ description: 'Total count of matching items' })
  total: number;
}
