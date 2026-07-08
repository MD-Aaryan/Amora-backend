import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'CUSTOMER', description: 'Regular customer who consumes content and books services' },
  { name: 'CREATOR', description: 'Content creator who uploads videos' },
  { name: 'SALON', description: 'Salon owner who manages services and bookings' },
  { name: 'ADMIN', description: 'Platform administrator' },
] as const;

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
    console.log(`Role "${role.name}" seeded`);
  }

  console.log('All roles seeded successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
