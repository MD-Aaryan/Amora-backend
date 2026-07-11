export interface SearchCursor {
  createdAt: Date;
  id: string;
}

export interface SearchVideoItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  duration: number;
  language: string;
  viewsCount: number;
  createdAt: Date;
  categories: { id: string; name: string }[];
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

export interface SearchCreatorItem {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  followerCount: number;
  videoCount: number;
}

export interface SearchSalonItem {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  address: string;
  city: string;
  state: string;
  isVerified: boolean;
  rating: number | null;
}

export interface SearchCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  videoCount: number;
  creatorCount: number;
  salonCount: number;
}

export interface SearchTagItem {
  id: string;
  name: string;
  videoCount: number;
}

export interface SearchSuggestionsItem {
  type: 'video' | 'creator' | 'salon' | 'category';
  id: string;
  text: string;
  image: string | null;
}
