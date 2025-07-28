import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const priceRanges = [
    { label: 'Upto 100', min: 0, max: 100 },
    { label: '100-500', min: 100, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000-5000', min: 1000, max: 5000 },
    { label: '5000+', min: 5000, max: null }
  ]

  for (const range of priceRanges) {
    await prisma.priceRange.upsert({
      where: { label: range.label },
      update: {},
      create: range
    })
  }

  console.log(' Seeded price ranges')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })