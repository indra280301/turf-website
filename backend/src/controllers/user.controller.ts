import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getMyBookings = async (req: any, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user.id },
            orderBy: { date: 'desc' },
            include: { coupon: true }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const cancelBooking = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const booking = await prisma.booking.findUnique({ where: { id: Number(id) } });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Enforce 4-hour cancellation policy
        const timePart = booking.startTime.split('-')[0].trim();
        const [hour, minute] = timePart.split(':');

        const bookingDateTime = new Date(booking.date);
        bookingDateTime.setHours(Number(hour), Number(minute), 0, 0);

        const now = new Date();
        const diffMs = bookingDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 4 && diffHours > 0) {
            return res.status(400).json({ message: 'Cancellations are only allowed at least 4 hours before the booking time.' });
        }

        if (diffHours <= 0) {
            return res.status(400).json({ message: 'Cannot cancel a past or ongoing booking.' });
        }
        const updatedBooking = await prisma.booking.update({
            where: { id: Number(id) },
            data: { status: 'CANCELLED' }
        });

        // Process refund logic if needed

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateProfile = async (req: any, res: Response) => {
    try {
        const { name, phone, email } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { name, phone, email },
            select: { id: true, name: true, phone: true, email: true, role: true }
        });
        res.json(updatedUser);
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: 'Failed to update profile. Email or phone might already be in use.' });
    }
};
