import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sampark';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import tagRoutes from './routes/tagRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/shop', shopRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Sampark Backend is Running! 🚀');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
