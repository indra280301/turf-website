import express from 'express';
import {
    register,
    login,
    getMe,
    sendOtp,
    sendLoginOtp,
    verifyLoginOtp,
    sendEmailOtp,
    verifyEmailOtp,
    forgotPasswordInitiate,
    forgotPasswordReset
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Advanced Auth Routes
router.post('/login/otp/send', sendLoginOtp);
router.post('/login/otp/verify', verifyLoginOtp);
router.post('/email/otp/send', authenticate, sendEmailOtp);
router.post('/email/otp/verify', authenticate, verifyEmailOtp);
router.post('/forgot-password/initiate', forgotPasswordInitiate);
router.post('/forgot-password/reset', forgotPasswordReset);

export default router;
