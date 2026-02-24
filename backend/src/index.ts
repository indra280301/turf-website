import dotenv from 'dotenv';
// Load environment variables before importing routes
// that might rely on process.env at the top level
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import bookingRoutes from './routes/booking.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import watchmanRoutes from './routes/watchman.routes';
import reviewRoutes from './routes/review.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/user', userRoutes); // Note: frontend uses /api/users, so let's also map users
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/watchman', watchmanRoutes);
app.use('/api/reviews', reviewRoutes);

// Basic route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Dhaval Mart Turf API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
