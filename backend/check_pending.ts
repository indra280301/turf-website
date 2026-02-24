import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.booking.findMany({
    where: { date: new Date('2026-02-24T00:00:00.000Z') }
  });
  console.log(all.map((b: any) => `${b.id}: ${b.status} ${b.startTime}-${b.endTime}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
