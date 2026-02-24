import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log("Latest 10 Bookings:");
  console.dir(bookings, { depth: null });
}
main().catch(console.error).finally(() => prisma.$disconnect());
