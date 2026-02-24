import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getGallery = async (req: Request, res: Response) => {
    try {
        const gallery = await prisma.gallery.findMany({
            orderBy: { createdAt: 'desc' },
            include: { category: true }
        });
        // Map to flat format for backward compat
        res.json(gallery.map(g => ({ id: g.id, category: g.category.name, url: g.url, createdAt: g.createdAt })));
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        // Default mock data if empty
        if (Object.keys(settingsMap).length === 0) {
            res.json({
                "hourlyRate": "1000",
                "peakHourRate": "1500",
                "contactNumber": "+91 9876543210",
                "address": "Dhawal Plaza, Khend, Chiplun, Maharashtra 415605",
                "googleMapsLink": "https://maps.app.goo.gl/PSMyCpVYCbqWYmTQ7"
            });
            return;
        }

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
    try {
        const { date, sport } = req.query;

        if (!date || !sport) {
            return res.status(400).json({ message: 'date and sport are required query params' });
        }

        const requestedDate = new Date(date as string);

        // Get all bookings for this date and sport
        const bookings = await prisma.booking.findMany({
            where: {
                date: requestedDate,
                sport: sport as any,
                status: { in: ['CONFIRMED', 'PENDING'] } // lock slots that are currently paying
            }
        });

        const bookedSlots = bookings.map(b => `${b.startTime}-${b.endTime}`);

        // Generate all standard slots for the day (e.g. 6AM to 11PM)
        const allSlots = [];
        for (let i = 6; i < 24; i++) {
            const start = `${i.toString().padStart(2, '0')}:00`;
            const end = `${(i + 1).toString().padStart(2, '0')}:00`;
            allSlots.push({
                startTime: start,
                endTime: end,
                isBooked: bookedSlots.includes(`${start}-${end}`)
            });
        }

        res.json(allSlots);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getTurfInfo = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        const next14Days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d.toISOString().split('T')[0];
        });

        const overrides = await prisma.setting.findMany({
            where: {
                key: { in: next14Days.map(dateStr => `CUSTOM_PRICING_${dateStr}`) }
            }
        });

        let minPrice = 1500; // default rate

        overrides.forEach(setting => {
            try {
                const data = JSON.parse(setting.value);
                data.forEach((slot: any) => {
                    if (slot.price && slot.price < minPrice && !slot.isBlocked) {
                        minPrice = slot.price;
                    }
                });
            } catch (e) {
                // ignore invalid json
            }
        });

        res.json({
            minPrice,
            openTime: "6:00 AM",
            closeTime: "12:00 AM" // 00:00 is 12:00 AM
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
