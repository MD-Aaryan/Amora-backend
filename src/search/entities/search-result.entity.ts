import { ApiProperty } from '@nestjs/swagger';

class VideoInfo {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string | null;
  @ApiProperty() thumbnailUrl: string;
  @ApiProperty() duration: number;
  @ApiProperty() language: string;
  @ApiProperty() viewsCount: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: [Object], example: [{ id: 'uuid', name: 'Nail Art' }] })
  categories: { id: string; name: string }[];
  @ApiProperty({ nullable: true })
  creator: { id: string; name: string | null; avatar: string | null } | null;
  @ApiProperty({ nullable: true })
  salon: { id: string; name: string; logo: string | null } | null;
}

class CreatorInfo {
  @ApiProperty() id: string;
  @ApiProperty() displayName: string | null;
  @ApiProperty() username: string | null;
  @ApiProperty() avatarUrl: string | null;
  @ApiProperty() bio: string | null;
  @ApiProperty() isVerified: boolean;
  @ApiProperty() followerCount: number;
  @ApiProperty() videoCount: number;
}

class SalonInfo {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() logo: string | null;
  @ApiProperty() description: string | null;
  @ApiProperty() address: string;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiProperty() isVerified: boolean;
  @ApiProperty() rating: number | null;
}

class CategoryInfo {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiProperty() description: string | null;
  @ApiProperty() videoCount: number;
  @ApiProperty() creatorCount: number;
  @ApiProperty() salonCount: number;
}

class TagInfo {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() videoCount: number;
}

class SectionMeta {
  @ApiProperty({ description: 'Items in this section' })
  items: any[];
  @ApiProperty() total: number;
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
}

export class GlobalSearchResponse {
  @ApiProperty({ type: SectionMeta })
  videos: SectionMeta;
  @ApiProperty({ type: SectionMeta })
  creators: SectionMeta;
  @ApiProperty({ type: SectionMeta })
  salons: SectionMeta;
  @ApiProperty({ type: SectionMeta })
  categories: SectionMeta;
}

export class SearchVideoResponse {
  @ApiProperty({ type: [VideoInfo] })
  items: any[];
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() total: number;
}

export class SearchCreatorResponse {
  @ApiProperty({ type: [CreatorInfo] })
  items: any[];
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() total: number;
}

export class SearchSalonResponse {
  @ApiProperty({ type: [SalonInfo] })
  items: any[];
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() total: number;
}

export class SearchCategoryResponse {
  @ApiProperty({ type: [CategoryInfo] })
  items: any[];
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() total: number;
}

export class SearchTagResponse {
  @ApiProperty({ type: [TagInfo] })
  items: any[];
  @ApiProperty() nextCursor: string | null;
  @ApiProperty() hasMore: boolean;
  @ApiProperty() total: number;
}

class SuggestionsItem {
  @ApiProperty({ enum: ['video', 'creator', 'salon', 'category'] })
  type: string;
  @ApiProperty() id: string;
  @ApiProperty() text: string;
  @ApiProperty() image: string | null;
}

export class SearchSuggestionsResponse {
  @ApiProperty({ type: [SuggestionsItem] })
  items: SuggestionsItem[];
}
