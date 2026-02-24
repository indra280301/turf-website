import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import twilio from 'twilio';
import { sendBookingReceipt } from '../utils/mailer';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const initiateBooking = async (req: any, res: Response) => {
    try {
        const { date, startTime, endTime, slots, sport, amount, guestName, guestPhone, guestEmail, couponId } = req.body;
        const userId = req.user?.id; // Assuming user might be logged in or guest

        const [year, month, day] = String(date).split('T')[0].split('-').map(Number);
        const bookingDate = new Date(Date.UTC(year, month - 1, day));

        // Expire abandoned PENDING checkouts older than 10 mins
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        await prisma.booking.updateMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: tenMinsAgo }
            },
            data: { status: 'CANCELLED' }
        });

        let requestedSlots: { start: string, end: string }[] = [];
        if (slots && Array.isArray(slots)) {
            requestedSlots = slots.map(s => {
                const [start, end] = s.split('-');
                return { start, end };
            });
        } else if (startTime && endTime) {
            requestedSlots = [{ start: startTime, end: endTime }];
        } else {
            return res.status(400).json({ message: 'Must provide slots or startTime and endTime' });
        }

        // 1. Check for slot availability (concurrency safe)
        const existingBookings = await prisma.booking.findMany({
            where: {
                date: bookingDate,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });

        const isOverlap = existingBookings.some(b => {
            return requestedSlots.some(reqSlot => {
                const lap = (reqSlot.start >= b.startTime && reqSlot.start < b.endTime) ||
                    (reqSlot.end > b.startTime && reqSlot.end <= b.endTime) ||
                    (reqSlot.start <= b.startTime && reqSlot.end >= b.endTime);
                if (lap) {
                    console.log(`[DEBUG] Overlap detected! Req: ${reqSlot.start}-${reqSlot.end}, DB: ${b.startTime}-${b.endTime} (Status: ${b.status})`);
                }
                return lap;
            });
        });

        if (isOverlap) {
            return res.status(400).json({ message: 'One or more selected slots are already booked or currently being paid for.' });
        }

        let finalAmount = amount;
        let appliedCouponId: number | null = null;

        // Apply coupon if any
        if (couponId) {
            // Check if user is logged in
            if (!userId) {
                return res.status(401).json({ message: 'You must be logged in to use a coupon code.' });
            }

            // Client sends couponCode as couponId param for now (based on BookingPage input)
            // Let's find all coupons and find the matching one case-insensitively since SQLite doesn't support insensitive easily
            const coupons = await prisma.coupon.findMany();
            const coupon = coupons.find(c => c.code.toLowerCase() === String(couponId).toLowerCase());

            if (!coupon) {
                return res.status(404).json({ message: 'Invalid coupon code.' });
            }

            if (!coupon.isActive || new Date() > new Date(coupon.expiryDate)) {
                return res.status(400).json({ message: 'This coupon has expired or is inactive.' });
            }

            if (coupon.maxUsage && coupon.totalUsage >= coupon.maxUsage) {
                return res.status(400).json({ message: 'Coupon usage limit reached.' });
            }

            if (coupon.validDate) {
                const cDate = new Date(coupon.validDate).toISOString().split('T')[0];
                const reqDate = new Date(bookingDate).toISOString().split('T')[0];
                if (cDate !== reqDate) {
                    return res.status(400).json({ message: `This coupon is only valid for ${cDate}.` });
                }
            }

            if (coupon.validSlots && coupon.validSlots.length > 2) {
                try {
                    const validSlotsArr = JSON.parse(coupon.validSlots);
                    if (validSlotsArr.length > 0) {
                        const allSlotsValid = requestedSlots.every((reqSlot: any) => validSlotsArr.includes(reqSlot.start));
                        if (!allSlotsValid) {
                            return res.status(400).json({ message: `This coupon is only valid for specific slots: ${validSlotsArr.join(", ")}` });
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse validSlots:", e);
                }
            }

            appliedCouponId = coupon.id;

            if (coupon.type === 'FLAT') {
                finalAmount = Math.max(0, finalAmount - coupon.value);
            } else if (coupon.type === 'PERCENTAGE') {
                const discount = (finalAmount * coupon.value) / 100;
                const maxDiscount = coupon.maxDiscount || discount;
                finalAmount = Math.max(0, finalAmount - Math.min(discount, maxDiscount));
            }
        }

        // Create pending bookings
        const createdBookings = [];
        let remainingAmount = finalAmount;

        for (let i = 0; i < requestedSlots.length; i++) {
            const reqSlot = requestedSlots[i];
            const slotAmount = (i === requestedSlots.length - 1) ? remainingAmount : parseFloat((finalAmount / requestedSlots.length).toFixed(2));
            remainingAmount -= slotAmount;

            const booking = await prisma.booking.create({
                data: {
                    userId,
                    guestName,
                    guestPhone,
                    guestEmail,
                    date: bookingDate,
                    startTime: reqSlot.start,
                    endTime: reqSlot.end,
                    sport,
                    amount: slotAmount,
                    status: 'PENDING',
                    couponId: appliedCouponId,
                }
            });
            createdBookings.push(booking);
        }

        // 2. Create Razorpay order
        const options = {
            amount: Math.round(finalAmount * 100), // in paise
            currency: 'INR',
            receipt: `receipt_booking_${createdBookings[0].id}`,
        };

        const order = await razorpay.orders.create(options);

        // Update booking with paymentId
        await prisma.booking.updateMany({
            where: { id: { in: createdBookings.map(b => b.id) } },
            data: { paymentId: order.id }
        });

        res.json({ order, bookingIds: createdBookings.map(b => b.id) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, bookingIds } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            const idsToUpdate = bookingIds || (bookingId ? [bookingId] : []);

            await prisma.booking.updateMany({
                where: { id: { in: idsToUpdate } },
                data: { status: 'CONFIRMED', paymentId: razorpay_payment_id }
            });

            const updatedBookings = await prisma.booking.findMany({
                where: { id: { in: idsToUpdate } },
                include: { user: true },
                orderBy: { startTime: 'asc' }
            });

            if (updatedBookings.length === 0) {
                return res.status(404).json({ message: "Bookings not found" });
            }

            const firstBooking = updatedBookings[0];

            // Trigger Email Receipt
            const recipientEmail = firstBooking.guestEmail || firstBooking.user?.email;
            if (recipientEmail) {
                const slotStrings = updatedBookings.map(b => `${b.startTime} - ${b.endTime}`).join(", ");
                const totalAmount = updatedBookings.reduce((sum, b) => sum + b.amount, 0);
                sendBookingReceipt(recipientEmail, {
                    customerName: firstBooking.guestName || firstBooking.user?.name || 'Customer',
                    turfName: 'Dhaval Mart Turf',
                    bookingDate: firstBooking.date.toISOString().split('T')[0],
                    timeSlot: slotStrings,
                    amountPaid: totalAmount,
                    bookingId: updatedBookings.map(b => b.id).join(", "),
                });
            }

            // Update coupon usage if applicable
            if (firstBooking.couponId) {
                await prisma.coupon.update({
                    where: { id: firstBooking.couponId },
                    data: { totalUsage: { increment: 1 } }
                });
            }

            // Trigger WhatsApp notifications
            const recipientPhone = firstBooking.guestPhone || firstBooking.user?.phone;
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER && recipientPhone) {
                try {
                    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                    // Standardize phone to include +91 if length is 10
                    let phoneStr = recipientPhone;
                    if (phoneStr.length === 10) phoneStr = `+91${phoneStr}`;

                    const slotStrings = updatedBookings.map(b => `${b.startTime} - ${b.endTime}`).join(", ");
                    await client.messages.create({
                        body: `🏆 Game On! Your turf at Dhaval Plaza Arena is secured.\n\n🎟 ID: #${updatedBookings.map(b => b.id).join(", ")}\n📅 Date: ${firstBooking.date.toISOString().split('T')[0]}\n⏱ Slots: ${slotStrings}\n\nBring your 'A' game! See you on the pitch.`,
                        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                        to: `whatsapp:${phoneStr}`
                    });
                    console.log("WhatsApp message sent securely.");
                } catch (twError: any) {
                    console.error("Twilio Error Code:", twError.code, "Message:", twError.message);
                }
            }

            res.status(200).json({ message: "Payment verified successfully", bookings: updatedBookings });
        } else {
            res.status(400).json({ message: "Invalid signature sent!" });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Also add a cleanup function to be run periodically or manually to mark PENDING older than 15 mins as CANCELLED

export const getSlots = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Date is required' });

        const [year, month, day] = String(date).split('-').map(Number);
        const targetDate = new Date(Date.UTC(year, month - 1, day));

        // Expire abandoned PENDING checkouts older than 10 mins
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        await prisma.booking.updateMany({
            where: {
                status: 'PENDING',
                createdAt: { lt: tenMinsAgo }
            },
            data: { status: 'CANCELLED' }
        });

        const bookings = await prisma.booking.findMany({
            where: {
                date: targetDate,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        });

        const bookedTimeBlocks = bookings.map(b => ({ start: b.startTime, end: b.endTime }));

        const checkIsBooked = (start: string, end: string) => {
            return bookedTimeBlocks.some(b => {
                return (start >= b.start && start < b.end) || (end > b.start && end <= b.end) || (start <= b.start && end >= b.end);
            });
        };

        const settingKey = `CUSTOM_PRICING_${date}`;
        const override = await prisma.setting.findUnique({ where: { key: settingKey } });
        const overrideData: { slot: string, price: number, isBlocked: boolean }[] = override ? JSON.parse(override.value) : [];

        const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const nowStr = nowIST.getFullYear() + "-" + String(nowIST.getMonth() + 1).padStart(2, '0') + "-" + String(nowIST.getDate()).padStart(2, '0');
        const isToday = String(date) === nowStr;
        const isPastDate = String(date) < nowStr;
        const currentHour = nowIST.getHours();

        const defaultSlotsArr = Array.from({ length: 18 }, (_, i) => {
            const h = i + 6;
            return `${h.toString().padStart(2, '0')}:00-${(h + 1).toString().padStart(2, '0')}:00`;
        });
        const customSlotStrs = overrideData.filter(o => !defaultSlotsArr.includes(o.slot)).map(o => o.slot);
        const allDisplaySlots = [...defaultSlotsArr, ...customSlotStrs].sort();

        const slots = [];
        for (const slotStr of allDisplaySlots) {
            const startTime = slotStr.split('-')[0];
            const endTime = slotStr.split('-')[1];

            const existingOverride = overrideData.find(o => o.slot === slotStr);
            const isHardBooked = checkIsBooked(startTime, endTime);
            const isAdminBlocked = existingOverride ? existingOverride.isBlocked : false;

            // Indian Time Restriction logic:
            const startH = parseInt(startTime.split(':')[0], 10);
            const isPastSlot = isPastDate || (isToday && currentHour >= startH + 1);

            slots.push({
                startTime,
                endTime,
                price: existingOverride ? existingOverride.price : 1500,
                isBooked: isHardBooked || isAdminBlocked || isPastSlot
            });
        }

        res.json({ slots });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const validateCoupon = async (req: any, res: Response) => {
    try {
        const { couponCode, amount } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'You must be logged in to apply a coupon code.' });
        }

        if (!couponCode || amount === undefined) {
            return res.status(400).json({ message: 'Coupon code and amount are required.' });
        }

        const coupons = await prisma.coupon.findMany();
        const coupon = coupons.find(c => c.code.toLowerCase() === String(couponCode).toLowerCase());

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code.' });
        }

        if (!coupon.isActive || new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ message: 'This coupon has expired or is inactive.' });
        }

        if (coupon.maxUsage && coupon.totalUsage >= coupon.maxUsage) {
            return res.status(400).json({ message: 'Coupon usage limit reached.' });
        }

        let discount = 0;
        let finalAmount = amount;

        if (coupon.type === 'FLAT') {
            discount = coupon.value;
            finalAmount = Math.max(0, finalAmount - coupon.value);
        } else if (coupon.type === 'PERCENTAGE') {
            const calculatedDiscount = (finalAmount * coupon.value) / 100;
            // If no maxDiscount is set, use calculated. Otherwise, take the smaller of the two.
            discount = coupon.maxDiscount ? Math.min(calculatedDiscount, coupon.maxDiscount) : calculatedDiscount;
            finalAmount = Math.max(0, finalAmount - discount);
        }

        res.json({ message: 'Coupon applied successfully', discount, finalAmount, couponId: coupon.code });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
