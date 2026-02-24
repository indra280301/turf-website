import express from 'express';
import { getMyBookings, cancelBooking, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

router.get('/bookings', getMyBookings);
router.post('/bookings/:id/cancel', cancelBooking);
router.put('/profile', updateProfile);

export default router;
