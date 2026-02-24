import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { sendBookingReceipt, sendRefundReceipt } from '../utils/mailer';
import fs from 'fs';
import path from 'path';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const offsetIST = 5.5 * 60 * 60 * 1000;
        const now = new Date();
        const nowIST = new Date(now.getTime() + offsetIST);

        // IST current hour
        const currentHour = nowIST.getUTCHours().toString().padStart(2, '0') + ':00';

        // Last 7 days revenue (based on the date of the booking event, not when payment was made)
        const last7Days: { date: string; revenue: number; bookings: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const dIST_UTC = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate() - i, 0, 0, 0, 0));

            const dayRevenue = await prisma.booking.aggregate({
                where: {
                    date: dIST_UTC,
                    status: 'CONFIRMED'
                },
                _sum: { amount: true },
                _count: true
            });

            last7Days.push({
                date: dIST_UTC.toISOString().split('T')[0],
                revenue: dayRevenue._sum.amount || 0,
                bookings: dayRevenue._count || 0
            });
        }

        const todayRevenue = last7Days[last7Days.length - 1]?.revenue || 0;

        // For date fields matching, we should also match against the IST Date string since we store it as a Date object at UTC midnight.
        // Actually, Prisma stores db.Date as UTC midnight. Let's just create the actual UTC midnight for the IST Date string.
        const todayInDB = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), nowIST.getUTCDate()));

        // Active bookings from now till next 30 days
        const next30DaysInDB = new Date(todayInDB);
        next30DaysInDB.setDate(next30DaysInDB.getDate() + 30);

        const activeBookingsRows = await prisma.booking.findMany({
            where: {
                date: { gte: todayInDB, lte: next30DaysInDB },
                status: { in: ['CONFIRMED', 'PENDING'] }
            }
        });

        let activeBookings = 0;
        activeBookingsRows.forEach(b => {
            if (b.date.getTime() === todayInDB.getTime()) {
                if (b.endTime > currentHour) {
                    const startHour = Math.max(parseInt(b.startTime.split(':')[0]), parseInt(currentHour.split(':')[0]));
                    const endHour = parseInt(b.endTime.split(':')[0]);
                    activeBookings += Math.max(0, endHour - startHour);
                }
            } else {
                const startHour = parseInt(b.startTime.split(':')[0]);
                const endHour = parseInt(b.endTime.split(':')[0]);
                activeBookings += Math.max(0, endHour - startHour);
            }
        });

        const totalUsers = await prisma.user.count({ where: { role: 'USER' } });

        // Occupancy rate: confirmed slots today / total slots of the day
        const confirmedTodayRows = await prisma.booking.findMany({
            where: { date: todayInDB, status: 'CONFIRMED' }
        });

        let confirmedTodaySlots = 0;
        confirmedTodayRows.forEach(b => {
            const startHour = parseInt(b.startTime.split(':')[0]);
            const endHour = parseInt(b.endTime.split(':')[0]);
            confirmedTodaySlots += Math.max(0, endHour - startHour);
        });

        // 18 standard slots per day (06:00 to 24:00)
        let totalSlotsPerDay = 18;

        // Add custom slot extensions to denominator
        const todayStr = todayInDB.toISOString().split('T')[0];
        const overrideSetting = await prisma.setting.findUnique({ where: { key: `CUSTOM_PRICING_${todayStr}` } });
        if (overrideSetting) {
            const overrides: { slot: string }[] = JSON.parse(overrideSetting.value);
            const defaultSlots = Array.from({ length: 18 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00-${(i + 7).toString().padStart(2, '0')}:00`);
            const customSlots = overrides.filter(o => !defaultSlots.includes(o.slot));
            totalSlotsPerDay += customSlots.length;
        }

        const occupancyRate = Math.min(100, Math.round((confirmedTodaySlots / totalSlotsPerDay) * 100));

        res.json({
            todayRevenue,
            activeBookings,
            totalUsers,
            occupancyRate,
            last7Days
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany({
            where: { key: { in: ['contactNumber', 'address', 'facebookUrl', 'instagramUrl', 'googleMapsLink'] } }
        });
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        if (!settingsMap.contactNumber) settingsMap.contactNumber = "+91 9876543210";
        if (!settingsMap.address) settingsMap.address = "Dhawal Plaza, Khend, Chiplun, Maharashtra 415605";
        if (!settingsMap.facebookUrl) settingsMap.facebookUrl = "";
        if (!settingsMap.instagramUrl) settingsMap.instagramUrl = "";

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settings = req.body;
        for (const [key, value] of Object.entries(settings)) {
            if (typeof value === 'string') {
                await prisma.setting.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value }
                });
            }
        }
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const { code, type, value, expiryDate, maxUsage, maxDiscount, validDate, validSlots } = req.body;

        if (!code || !type || !value || !expiryDate) {
            return res.status(400).json({ message: 'Code, type, value, and expiryDate are required.' });
        }

        const existing = await prisma.coupon.findUnique({ where: { code } });
        if (existing) {
            return res.status(400).json({ message: 'Coupon code already exists.' });
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                type,
                value: Number(value),
                expiryDate: new Date(expiryDate),
                maxUsage: maxUsage ? Number(maxUsage) : null,
                maxDiscount: maxDiscount ? Number(maxDiscount) : null,
                validDate: validDate ? new Date(validDate) : null,
                validSlots: validSlots ? JSON.stringify(validSlots) : null
            }
        });
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { bookings: true } }
            }
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getCustomPricing = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });
        const settingKey = `CUSTOM_PRICING_${date}`;
        const override = await prisma.setting.findUnique({ where: { key: settingKey } });

        const [year, month, day] = String(date).split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day));

        const bookings = await prisma.booking.findMany({
            where: { date: targetDate, status: { in: ['PENDING', 'CONFIRMED'] } }
        });

        res.json({ override, bookings });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const saveCustomPricing = async (req: Request, res: Response) => {
    try {
        const { date, overrides, applyForward } = req.body;
        if (!date || !overrides) return res.status(400).json({ message: 'Date and overrides required' });

        const saveDayOverrides = async (targetDateStr: string) => {
            const settingKey = `CUSTOM_PRICING_${targetDateStr}`;
            const existingSetting = await prisma.setting.findUnique({ where: { key: settingKey } });

            let existingOverrides: { slot: string, price: number, isBlocked: boolean }[] = [];
            if (existingSetting) {
                existingOverrides = JSON.parse(existingSetting.value);
            }

            // Merge new overrides into existing ones, prioritizing the new ones
            const mergedMap = new Map(existingOverrides.map(o => [o.slot, o]));
            for (const newOverride of overrides) {
                mergedMap.set(newOverride.slot, newOverride);
            }
            const mergedOverrides = Array.from(mergedMap.values());
            const valueString = JSON.stringify(mergedOverrides);

            await prisma.setting.upsert({
                where: { key: settingKey },
                update: { value: valueString },
                create: { key: settingKey, value: valueString }
            });
        };

        // Save for targeted day
        await saveDayOverrides(date);

        // If applyForward, save for next 30 days too
        if (applyForward) {
            for (let i = 1; i <= 30; i++) {
                const d = new Date(date);
                d.setDate(d.getDate() + i);
                await saveDayOverrides(d.toISOString().split('T')[0]);
            }
        }

        res.json({ message: applyForward ? 'Pricing applied for today and next 30 days' : 'Pricing saved for today only' });
    } catch (error) {
        console.error("Save custom pricing error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const forceToggleSlot = async (req: Request, res: Response) => {
    try {
        const { date, slot, isBlocked } = req.body;
        // @ts-ignore
        const adminName = req.user?.name || "Admin";

        if (!date || !slot) return res.status(400).json({ message: 'Date and slot required' });

        const [startTime, endTime] = slot.split("-");
        const [year, month, day] = String(date).split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day));

        // If blocking, gracefully cancel any overlapping bookings
        if (isBlocked) {
            await prisma.booking.updateMany({
                where: {
                    date: targetDate,
                    startTime,
                    status: { in: ['CONFIRMED', 'PENDING'] }
                },
                data: { status: 'CANCELLED' }
            });
        }

        // Update Custom Pricing Setting
        const settingKey = `CUSTOM_PRICING_${date}`;
        const override = await prisma.setting.findUnique({ where: { key: settingKey } });
        let overrides: { slot: string, price: number, isBlocked: boolean }[] = override ? JSON.parse(override.value) : [];

        overrides = overrides.filter(o => o.slot !== slot);
        if (isBlocked) {
            overrides.push({ slot, price: 1500, isBlocked: true }); // Default to 1500 price since it's blocked anyway
        }
        await prisma.setting.upsert({
            where: { key: settingKey },
            update: { value: JSON.stringify(overrides) },
            create: { key: settingKey, value: JSON.stringify(overrides) }
        });

        // Add to Block Logs
        const logsKey = 'ACTIVITY_BLOCK_LOGS';
        const logsRecord = await prisma.setting.findUnique({ where: { key: logsKey } });
        let logs: any[] = logsRecord ? JSON.parse(logsRecord.value) : [];

        logs.unshift({
            date: new Date().toISOString(),
            targetDate: date,
            slot,
            action: isBlocked ? 'BLOCKED' : 'UNBLOCKED',
            admin: adminName
        });

        // Keep last 100 logs
        logs = logs.slice(0, 100);

        await prisma.setting.upsert({
            where: { key: logsKey },
            update: { value: JSON.stringify(logs) },
            create: { key: logsKey, value: JSON.stringify(logs) }
        });

        res.json({ message: `Slot successfully ${isBlocked ? 'Blocked' : 'Unblocked'}` });
    } catch (error) {
        console.error("forceToggleSlot error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getBlockLogs = async (req: Request, res: Response) => {
    try {
        const logsRecord = await prisma.setting.findUnique({ where: { key: 'ACTIVITY_BLOCK_LOGS' } });
        const logs = logsRecord ? JSON.parse(logsRecord.value) : [];
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const addGalleryImage = async (req: Request, res: Response) => {
    try {
        const { categoryName } = req.body;

        let url = req.body.url; // fallback if URL is passed instead of file

        if (req.file) {
            url = `/uploads/gallery/${req.file.filename}`;
        }

        if (!categoryName || !url) return res.status(400).json({ message: 'Category name and Image are required' });

        // Find or create category
        let category = await prisma.galleryCategory.findUnique({ where: { name: categoryName } });
        if (!category) {
            category = await prisma.galleryCategory.create({ data: { name: categoryName } });
        }

        const image = await prisma.gallery.create({ data: { categoryId: category.id, url } });
        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteGalleryImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const image = await prisma.gallery.findUnique({ where: { id: Number(id) } });

        if (image && image.url.startsWith('/uploads/gallery/')) {
            const filePath = path.join(__dirname, '../../', image.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await prisma.gallery.delete({ where: { id: Number(id) } });
        res.json({ message: 'Image deleted' });
    } catch (error) {
        console.error("Delete gallery error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getGalleryCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.galleryCategory.findMany({
            include: { galleries: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createGalleryCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name required' });
        const cat = await prisma.galleryCategory.create({ data: { name } });
        res.status(201).json(cat);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// ============= USER & STAFF MANAGEMENT =============

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, phone: true, email: true, role: true, status: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const updated = await prisma.user.update({
            where: { id: Number(id) },
            data: { status: newStatus }
        });
        res.json({ message: `User ${newStatus.toLowerCase()}`, user: updated });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createWatchman = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !password) return res.status(400).json({ message: 'Name, phone, and password are required' });

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const watchman = await prisma.user.create({
            data: { name, phone, email: email || null, password: hashedPassword, role: 'WATCHMAN' }
        });
        res.status(201).json({ watchman: { id: watchman.id, name: watchman.name, phone: watchman.phone, role: watchman.role } });
    } catch (error: any) {
        if (error.code === 'P2002') return res.status(400).json({ message: 'Phone or email already in use' });
        res.status(500).json({ message: 'Server Error' });
    }
};

// ============= BOOKING MANAGEMENT =============

export const getAllBookings = async (req: Request, res: Response) => {
    try {
        const { fromDate, toDate, searchName } = req.query;

        let whereClause: any = {};

        if (fromDate || toDate) {
            whereClause.date = {};
            if (fromDate) whereClause.date.gte = new Date(fromDate as string);
            if (toDate) whereClause.date.lte = new Date(toDate as string);
        }

        if (searchName) {
            whereClause.OR = [
                { guestName: { contains: searchName as string, mode: 'insensitive' } },
                { user: { name: { contains: searchName as string, mode: 'insensitive' } } }
            ];
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            orderBy: { date: 'desc' },
            include: { user: { select: { name: true, phone: true } } }
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createManualBooking = async (req: Request, res: Response) => {
    try {
        const { date, startTime, endTime, sport, amount, guestName, guestPhone, paymentMode } = req.body;
        if (!date || !startTime || !endTime || !sport || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const bookingDate = new Date(date);

        const existingBookings = await prisma.booking.findMany({
            where: {
                date: bookingDate,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });

        const isOverlap = existingBookings.some(b => {
            return (startTime >= b.startTime && startTime < b.endTime) ||
                (endTime > b.startTime && endTime <= b.endTime) ||
                (startTime <= b.startTime && endTime >= b.endTime);
        });

        if (isOverlap) return res.status(400).json({ message: 'One or more selected slots are already booked.' });

        const booking = await prisma.booking.create({
            data: {
                date: bookingDate,
                startTime,
                endTime,
                sport,
                amount,
                guestName,
                guestPhone,
                paymentMode: paymentMode || 'COD',
                status: paymentMode === 'COD' ? 'CONFIRMED' : 'CONFIRMED',
            }
        });
        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const cancelBooking = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'Admin password required' });

        const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!admin || !admin.password) return res.status(403).json({ message: 'Unauthorized' });

        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) return res.status(403).json({ message: 'Invalid password' });

        const targetBooking = await prisma.booking.findUnique({ where: { id: Number(id) } });
        if (!targetBooking) return res.status(404).json({ message: 'Booking not found' });

        const eventDateStr = targetBooking.date.toISOString().split('T')[0];
        const eventDateTimeStr = `${eventDateStr}T${targetBooking.startTime}:00+05:30`;
        const eventTime = new Date(eventDateTimeStr);

        if (eventTime < new Date()) {
            return res.status(400).json({ message: 'Cannot modify past bookings' });
        }

        const booking = await prisma.booking.update({
            where: { id: Number(id) },
            data: { status: 'CANCELLED' }
        });
        res.json({ message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const refundBooking = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password) return res.status(400).json({ message: 'Admin password required' });

        const admin = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!admin || !admin.password) return res.status(403).json({ message: 'Unauthorized' });

        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) return res.status(403).json({ message: 'Invalid password' });

        const targetBooking = await prisma.booking.findUnique({ where: { id: Number(id) } });
        if (!targetBooking) return res.status(404).json({ message: 'Booking not found' });

        const eventDateStr = targetBooking.date.toISOString().split('T')[0];
        const eventDateTimeStr = `${eventDateStr}T${targetBooking.startTime}:00+05:30`;
        const eventTime = new Date(eventDateTimeStr);

        if (eventTime < new Date()) {
            return res.status(400).json({ message: 'Cannot modify past bookings' });
        }

        if (targetBooking.paymentMode === 'ONLINE' && targetBooking.paymentId) {
            const Razorpay = require('razorpay');
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || '',
                key_secret: process.env.RAZORPAY_KEY_SECRET || '',
            });

            try {
                // @ts-ignore
                await razorpay.payments.refund(targetBooking.paymentId, { amount: targetBooking.amount * 100, speed: "normal" });
                console.log(`Successfully refunded payment ID ${targetBooking.paymentId} via Razorpay API.`);
            } catch (rzpErr: any) {
                console.error("Razorpay Refund Error: ", rzpErr);
                const exactError = rzpErr.error?.description || rzpErr.error?.reason || rzpErr.description || rzpErr.message || 'Razorpay Gateway Rejected Refund natively.';
                return res.status(500).json({ message: `Razorpay: ${exactError}`, error: exactError });
            }
        }

        const booking = await prisma.booking.update({
            where: { id: Number(id) },
            data: { isRefunded: true, status: 'CANCELLED' },
            include: { user: true }
        });

        // Trigger Refund Email
        const recipientEmail = booking.guestEmail || booking.user?.email;
        if (recipientEmail) {
            sendRefundReceipt(recipientEmail, {
                customerName: booking.guestName || booking.user?.name || 'Customer',
                turfName: 'Dhaval Mart Turf',
                bookingDate: booking.date.toISOString().split('T')[0],
                timeSlot: `${booking.startTime} - ${booking.endTime}`,
                amountPaid: booking.amount,
                bookingId: String(booking.id),
            });
        }

        res.json({ message: 'Booking refunded & money dispatched via Razorpay', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.coupon.delete({ where: { id: Number(id) } });
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ message: 'Server Error. Coupon may be in use by past bookings.' });
    }
};
