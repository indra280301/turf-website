import express from 'express';
import { getGallery, getSettings, getAvailableSlots, getTurfInfo } from '../controllers/public.controller';

const router = express.Router();

router.get('/gallery', getGallery);
router.get('/settings', getSettings);
router.get('/slots', getAvailableSlots);
router.get('/info', getTurfInfo);

export default router;
