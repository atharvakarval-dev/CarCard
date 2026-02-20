import express from 'express';
import {
    activateTag,
    createTag,
    getPublicTag,
    getTags,
    sendTagOtp,
    updatePrivacy,
    updateTag,
    verifyTagOtpAndUpdate,
} from '../controllers/tagController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Authenticated routes
router.get('/', authenticateToken, getTags);
router.post('/', authenticateToken, createTag);
router.post('/activate', authenticateToken, activateTag);
router.put('/:id', authenticateToken, updateTag);
router.patch('/:id/privacy', authenticateToken, updatePrivacy);
router.post('/:id/otp/send', authenticateToken, sendTagOtp);
router.post('/:id/otp/verify', authenticateToken, verifyTagOtpAndUpdate);

// Public route (scanned by anyone)
router.get('/public/:id', getPublicTag);

export default router;
