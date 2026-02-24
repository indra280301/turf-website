import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await prisma.review.findMany({
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createReview = async (req: any, res: Response) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }

        const review = await prisma.review.create({
            data: {
                rating: Number(rating),
                comment,
                userId: req.user.id
            },
            include: { user: { select: { id: true, name: true } } }
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
