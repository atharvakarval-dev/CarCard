import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Check
prisma.$connect()
    .then(() => console.log('✅ Connected to PostgreSQL via Prisma'))
    .catch((err: any) => console.error('❌ Prisma connection error:', err));

// Routes
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import tagRoutes from './routes/tagRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/admin', adminRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('CarCard Backend is Running! 🚀');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
