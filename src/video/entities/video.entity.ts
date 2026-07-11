export class VideoEntity {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  language: string;
  visibility: string;
  status: string;
  isFree: boolean;
  price: number | null;
  categories: { id: string; name: string }[];
  tags: string[];
  ownerName: string | null;
  ownerAvatar: string | null;
  partnerType: 'CREATOR' | 'SALON' | null;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
