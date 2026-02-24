import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearBookings() {
    try {
        console.log("Starting database cleanup...");
        const deletedBookings = await prisma.booking.deleteMany({});
        console.log(`Successfully deleted ${deletedBookings.count} bookings from the database.`);
    } catch (error) {
        console.error("Error clearing bookings:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearBookings();
