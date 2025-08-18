import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rows = [
    { pincode: '500081', city: 'Hyderabad', state: 'Telangana', isActive: true, codAvailable: true, deliveryEtaDays: 2, lastMileFee: 49 },
    { pincode: '560001', city: 'Bengaluru', state: 'Karnataka', isActive: true, codAvailable: false, deliveryEtaDays: 3, lastMileFee: 0 },
    { pincode: '110001', city: 'New Delhi', state: 'Delhi', isActive: false, codAvailable: false, deliveryEtaDays: null, lastMileFee: null },
  ];

  for (const r of rows) {
    await prisma.serviceableArea.upsert({
      where: { pincode: r.pincode },
      update: r,
      create: r,
    });
  }
  console.log('Seeded serviceable pincodes.');
}

main().finally(() => prisma.$disconnect());
