import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import twilio from 'twilio';

// We will initialize the client dynamically inside the function to ensure env vars are loaded
const getTwilioClient = () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    return twilio(accountSid, authToken);
};

const getTwilioSmsNumber = () => process.env.TWILIO_PHONE_NUMBER || '';
const getTwilioNumber = () => process.env.TWILIO_WHATSAPP_NUMBER || '';
// Simple memory store for OTPs
const otpStore = new Map<string, { code: string, expiry: number }>();

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this phone number.' });
        }

        const phoneStr = phone.startsWith('+91') ? phone : `+91${phone}`;
        const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!verifySid) {
            console.error("TWILIO_VERIFY_SERVICE_SID is missing.");
            return res.status(500).json({ message: 'OTP Service is not configured. Admin must set TWILIO_VERIFY_SERVICE_SID.' });
        }

        const client = getTwilioClient();
        const verification = await client.verify.v2.services(verifySid)
            .verifications
            .create({ to: phoneStr, channel: 'sms' });

        res.json({ message: 'OTP sent successfully via SMS', status: verification.status });
    } catch (error: any) {
        console.error("Twilio Send OTP Error: ", error);
        res.status(500).json({ message: error.message || 'Failed to send OTP' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, phone, email, password, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required for registration.' });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ phone }, { email: email || 'nonexistent@email.com' }] },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this phone or email' });
        }

        const phoneStr = phone.startsWith('+91') ? phone : `+91${phone}`;
        const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!verifySid) {
            return res.status(500).json({ message: 'Server configuration error: Missing Verify SID.' });
        }

        const client = getTwilioClient();
        try {
            const verificationCheck = await client.verify.v2.services(verifySid)
                .verificationChecks
                .create({ to: phoneStr, code: otp });

            if (verificationCheck.status !== 'approved') {
                return res.status(400).json({ message: 'Invalid or expired OTP.' });
            }
        } catch (twilioErr: any) {
            console.error("Twilio Verify OTP Error: ", twilioErr);
            return res.status(400).json({ message: 'Failed to verify OTP. Please try again.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email,
                password: hashedPassword,
                // Default role is USER, set in schema
            },
        });

        // Link past guest orders to the new account
        try {
            await prisma.booking.updateMany({
                where: {
                    userId: null,
                    guestPhone: phone
                },
                data: {
                    userId: user.id
                }
            });
            console.log(`Linked past guest orders for newly registered user ${user.id}`);
        } catch (linkError) {
            console.error("Failed to link guest orders on registration:", linkError);
            // Non-blocking error, allow registration to complete
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.status(201).json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { phone, email, password, role } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: phone || 'somethingimpossible' },
                    { email: email || 'somethingimpossible' }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is blocked
        if (user.status === 'BLOCKED') {
            return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });
        }

        // specific role login check (e.g., admin trying to login via admin panel)
        if (role && user.role !== role) {
            return res.status(403).json({ message: 'Access denied for this role' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getMe = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, phone: true, email: true, role: true, isEmailVerified: true },
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const emailOtpStore = new Map<string, { code: string, expiry: number }>();

export const sendLoginOtp = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone is required' });

        const user = await prisma.user.findFirst({ where: { phone } });
        if (!user) return res.status(404).json({ message: 'No account found with this number' });
        if (user.status === 'BLOCKED') return res.status(403).json({ message: 'Account blocked' });

        const phoneStr = phone.startsWith('+91') ? phone : `+91${phone}`;
        const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (!verifySid) return res.status(500).json({ message: 'Twilio Verify not configured' });

        const client = getTwilioClient();
        await client.verify.v2.services(verifySid).verifications.create({ to: phoneStr, channel: 'sms' });

        res.json({ message: 'OTP sent successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

        const user = await prisma.user.findFirst({ where: { phone } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const phoneStr = phone.startsWith('+91') ? phone : `+91${phone}`;
        const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (!verifySid) return res.status(500).json({ message: 'Twilio Verify not configured' });

        const client = getTwilioClient();
        try {
            const verificationCheck = await client.verify.v2.services(verifySid).verificationChecks.create({ to: phoneStr, code: otp });
            if (verificationCheck.status !== 'approved') return res.status(400).json({ message: 'Invalid or expired OTP' });
        } catch (twilioErr) {
            return res.status(400).json({ message: 'Failed to verify OTP' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

import { sendAuthOtpEmail } from '../utils/mailer';

export const sendEmailOtp = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || !user.email) return res.status(400).json({ message: 'No email found on profile' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        emailOtpStore.set(user.email, { code: otpCode, expiry: Date.now() + 10 * 60 * 1000 });

        await sendAuthOtpEmail(user.email, user.name, otpCode, 'Verification');
        res.json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send email OTP' });
    }
};

export const verifyEmailOtp = async (req: any, res: Response) => {
    try {
        const { otp } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || !user.email) return res.status(400).json({ message: 'User not found' });

        const storedOtp = emailOtpStore.get(user.email);
        if (!storedOtp || storedOtp.code !== otp || Date.now() > storedOtp.expiry) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        emailOtpStore.delete(user.email);
        await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPasswordInitiate = async (req: Request, res: Response) => {
    try {
        const { identifier } = req.body; // can be phone or email
        if (!identifier) return res.status(400).json({ message: 'Phone or Email is required' });

        const user = await prisma.user.findFirst({
            where: { OR: [{ phone: identifier }, { email: identifier }] }
        });

        if (!user) return res.status(404).json({ message: 'No account found with this identifier' });

        if (identifier.includes('@')) {
            // Email reset flow
            if (!user.isEmailVerified) {
                return res.status(403).json({ message: 'Email is not verified. Please log in using Phone OTP and verify your email in your profile first.' });
            }
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            emailOtpStore.set(user.email!, { code: otpCode, expiry: Date.now() + 10 * 60 * 1000 });
            await sendAuthOtpEmail(user.email!, user.name, otpCode, 'Password Reset');
            return res.json({ message: 'OTP sent to your verified email', channel: 'email' });
        } else {
            // Phone reset flow
            const phoneStr = identifier.startsWith('+91') ? identifier : `+91${identifier}`;
            const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
            if (!verifySid) return res.status(500).json({ message: 'Twilio Verify not configured' });

            const client = getTwilioClient();
            await client.verify.v2.services(verifySid).verifications.create({ to: phoneStr, channel: 'sms' });
            return res.json({ message: 'OTP sent via SMS', channel: 'phone' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPasswordReset = async (req: Request, res: Response) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        if (!identifier || !otp || !newPassword) return res.status(400).json({ message: 'Missing required fields' });

        const user = await prisma.user.findFirst({
            where: { OR: [{ phone: identifier }, { email: identifier }] }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (identifier.includes('@')) {
            // Email verification
            const storedOtp = emailOtpStore.get(user.email!);
            if (!storedOtp || storedOtp.code !== otp || Date.now() > storedOtp.expiry) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
            emailOtpStore.delete(user.email!);
        } else {
            // Phone verification
            const phoneStr = identifier.startsWith('+91') ? identifier : `+91${identifier}`;
            const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
            const client = getTwilioClient();
            try {
                const check = await client.verify.v2.services(verifySid!).verificationChecks.create({ to: phoneStr, code: otp });
                if (check.status !== 'approved') return res.status(400).json({ message: 'Invalid or expired OTP' });
            } catch (err) {
                return res.status(400).json({ message: 'Failed to verify OTP' });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
