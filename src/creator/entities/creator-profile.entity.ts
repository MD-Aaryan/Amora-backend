export class CreatorProfileEntity {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  websiteUrl: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  preferredLanguage: string;
  verificationStatus: string;
  kycStatus: string | null;
  joinedAt: Date;
}
