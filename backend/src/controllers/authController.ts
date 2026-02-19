import { Request, Response } from 'express';
import User from '../models/User';

// Mock OTP storage (in-memory for demo, use Redis/DB in production)
const otpStore: Record<string, string> = {};

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[phoneNumber] = otp;

        console.log(`🔐 OTP for ${phoneNumber}: ${otp}`); // Log for testing

        // TODO: Integrate actual SMS service (Twilio/MSG91)

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, otp } = req.body;
        if (!phoneNumber || !otp) return res.status(400).json({ message: 'Phone number and OTP are required' });

        if (otpStore[phoneNumber] === otp) {
            delete otpStore[phoneNumber]; // Clear OTP after use

            // Find or create user
            let user = await User.findOne({ phoneNumber });
            if (!user) {
                user = new User({ phoneNumber });
                await user.save();
            }

            // Generate JWT (simplified for now, use library in real app)
            const token = `mock-jwt-token-for-${user._id}`;

            res.status(200).json({ message: 'Login successful', token, user });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
