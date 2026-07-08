export class ServiceEntity {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
