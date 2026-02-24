import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Seed Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dhavalmartturf.com' },
        update: {},
        create: {
            email: 'admin@dhavalmartturf.com',
            name: 'Super Admin',
            phone: '9999999999',
            role: 'ADMIN',
            password: hashedPassword,
        },
    });

    // Seed Watchman
    const watchman = await prisma.user.upsert({
        where: { phone: '8888888888' },
        update: {},
        create: {
            email: 'prakash@dhavalmartturf.com',
            name: 'Prakash Watchman',
            phone: '8888888888',
            role: 'WATCHMAN',
            password: await bcrypt.hash('watchman123', 10),
        },
    });

    // Seed Initial Settings
    const settings = [
        { key: 'hourlyRate', value: '1000' },
        { key: 'peakHourRate', value: '1500' },
        { key: 'contactNumber', value: '+91 9876543210' },
        { key: 'address', value: 'Dhawal Plaza, Khend, Chiplun, Maharashtra 415605' },
        { key: 'googleMapsLink', value: 'https://maps.app.goo.gl/PSMyCpVYCbqWYmTQ7' }
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }

    // Seed Reviews
    const existingReviews = await prisma.review.count();
    if (existingReviews === 0) {
        await prisma.review.createMany({
            data: [
                {
                    userId: admin.id,
                    rating: 5,
                    comment: "The best turf in Chiplun! Excellent lighting and the grass feels almost like a professional stadium."
                },
                {
                    userId: watchman.id,
                    rating: 4,
                    comment: "Great experience playing late night box cricket here. Booking was easy."
                }
            ]
        });
    }

    console.log("Seeding complete:", { admin: admin.email, watchman: watchman.phone });
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
