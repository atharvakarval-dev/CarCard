import { Request, Response } from 'express';
import prisma from '../prisma';

// Helper to get a mock user ID for demo purposes
const getMockUserId = async () => {
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: { phoneNumber: '9999999999', name: 'Demo User' }
        });
    }
    return user.id;
};

export const getTags = async (req: Request, res: Response) => {
    try {
        const userId = await getMockUserId();
        const tags = await prisma.tag.findMany({
            where: { userId },
            include: { scans: true }
        });
        res.json(tags);
    } catch (error) {
        console.error('Get Tags Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, type, plateNumber } = req.body;

        // Check if tag already exists
        const existingTag = await prisma.tag.findUnique({
            where: { code }
        });

        if (existingTag) {
            return res.status(400).json({ message: 'Tag code already registered' });
        }

        const userId = await getMockUserId();
        const newTag = await prisma.tag.create({
            data: {
                code,
                nickname,
                type,
                plateNumber,
                userId
            }
        });

        res.status(201).json(newTag);
    } catch (error) {
        console.error('Create Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updatePrivacy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { setting } = req.body; // e.g., 'allowMaskedCall'

        // Verify tag exists
        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Update the specific setting using dynamic key
        // Note: Prisma update expects known keys. We need to cast or construct object.
        // But setting is a string from body.
        const updateData: any = {};
        updateData[setting] = !((tag as any)[setting]);

        const updatedTag = await prisma.tag.update({
            where: { id },
            data: updateData
        });

        res.json(updatedTag);
    } catch (error) {
        console.error('Update Privacy Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getPublicTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tag = await prisma.tag.findUnique({
            where: { id }
        });

        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Log scan
        await prisma.scan.create({
            data: {
                tagId: tag.id,
                location: 'Unknown', // In real app, get from req.body or IP
                timestamp: new Date()
            }
        });

        res.json(tag);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const activateTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, plateNumber } = req.body;

        // In real app, userId comes from auth middleware
        const userId = await getMockUserId();

        // 1. Find the tag by code
        const tag = await prisma.tag.findUnique({
            where: { code }
        });

        if (!tag) {
            return res.status(404).json({ message: 'Invalid tag code' });
        }

        // 2. Check if already active/claimed
        if (tag.status === 'active' || tag.userId) {
            return res.status(400).json({ message: 'This tag is already linked to another user' });
        }

        // 3. Update the tag
        const updatedTag = await prisma.tag.update({
            where: { id: tag.id },
            data: {
                userId,
                nickname: nickname || 'My Vehicle',
                plateNumber: plateNumber || '',
                status: 'active',
                isActive: true
            }
        });

        res.json({ message: 'Tag activated successfully', tag: updatedTag });

    } catch (error) {
        console.error('Activate Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
