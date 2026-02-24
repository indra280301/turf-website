import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log(all.map((b: any) => `${b.id}: ${b.status} ${b.date.toISOString()} ${b.startTime}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
