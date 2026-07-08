export class SalonProfileEntity {
  id: string;
  userId: string;
  name: string;
  ownerName: string | null;
  logoUrl: string | null;
  description: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string | null;
  website: string | null;
  businessHours: Record<string, unknown>;
  preferredLanguage: string;
  verificationStatus: string;
  kycStatus: string | null;
  joinedAt: Date;
}
