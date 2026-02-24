import express from 'express';
import { getReviews, createReview } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', getReviews);
router.post('/', authenticate, createReview);

export default router;
