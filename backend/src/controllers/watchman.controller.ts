import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTodayBookings = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await prisma.booking.findMany({
            where: { date: today, status: 'CONFIRMED' },
            orderBy: { startTime: 'asc' },
            include: { user: true }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const markArrived = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const booking = await prisma.booking.update({
            where: { id: Number(id) },
            data: { isArrived: true }
        });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
