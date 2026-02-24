import express from 'express';
import { getTodayBookings, markArrived } from '../controllers/watchman.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'WATCHMAN']));

router.get('/today', getTodayBookings);
router.post('/bookings/:id/arrive', markArrived);

export default router;
