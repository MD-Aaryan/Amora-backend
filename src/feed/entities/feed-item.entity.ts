export class FeedItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  duration: number;
  language: string;
  visibility: string;
  viewsCount: number;
  createdAt: Date;
  categories: { id: string; name: string }[];
  tags: string[];
  creator: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  salon: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
}

export class FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
