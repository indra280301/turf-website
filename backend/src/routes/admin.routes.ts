import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getDashboardStats, getSettings, updateSettings,
    createCoupon, getCoupons, deleteCoupon,
    getCustomPricing, saveCustomPricing, forceToggleSlot, getBlockLogs,
    addGalleryImage, deleteGalleryImage, getGalleryCategories, createGalleryCategory,
    getAllUsers, toggleUserStatus, createWatchman,
    getAllBookings, createManualBooking, cancelBooking, refundBooking
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/gallery');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/dashboard', getDashboardStats);
router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.delete('/coupons/:id', deleteCoupon);
router.get('/pricing', getCustomPricing);
router.post('/pricing', saveCustomPricing);
router.post('/pricing/force-toggle', forceToggleSlot);
router.get('/pricing/logs', getBlockLogs);
router.post('/gallery', upload.single('image'), addGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);
router.get('/gallery/categories', getGalleryCategories);
router.post('/gallery/categories', createGalleryCategory);

// Users & Staff
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.post('/watchman', createWatchman);

// Bookings Management
router.get('/bookings', getAllBookings);
router.post('/bookings/manual', createManualBooking);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/refund', refundBooking);

export default router;
