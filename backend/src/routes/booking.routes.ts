import express from 'express';
import { initiateBooking, verifyPayment, getSlots, validateCoupon } from '../controllers/booking.controller';
import jwt from 'jsonwebtoken';

const router = express.Router();

const optionalAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log("[optionalAuth] Token attached:", token.substring(0, 10) + '...');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            req.user = { id: decoded.id, role: decoded.role };
            console.log("[optionalAuth] Successfully decoded token for user:", req.user.id);
        } catch (error) {
            console.error("[optionalAuth] JWT Verify failed!", error);
            // Invalid token, ignore and proceed as guest
        }
    }
    next();
};

router.get('/slots', getSlots);
router.post('/initiate', optionalAuth, initiateBooking);
router.post('/validate-coupon', optionalAuth, validateCoupon);
router.post('/verify', verifyPayment);

export default router;
