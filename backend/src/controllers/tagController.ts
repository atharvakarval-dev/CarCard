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

// Helper to format tag response for frontend consistency
const formatTagResponse = (tag: any) => {
    if (!tag) return null;
    return {
        ...tag,
        privacy: {
            allowMaskedCall: tag.allowMaskedCall,
            allowWhatsapp: tag.allowWhatsapp,
            allowSms: tag.allowSms,
            showEmergencyContact: tag.showEmergencyContact
        },
        emergencyContact: {
            name: tag.emergencyContactName,
            phone: tag.emergencyContactPhone
        }
    };
};

export const getTags = async (req: Request, res: Response) => {
    try {
        const userId = await getMockUserId();
        const tags = await prisma.tag.findMany({
            where: { userId },
            include: { scans: true }
        });
        res.json(tags.map(formatTagResponse));
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

        res.status(201).json(formatTagResponse(newTag));
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

        res.json(formatTagResponse(updatedTag));
    } catch (error) {
        console.error('Update Privacy Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Re-write getPublicTag to handle ID or Code more cleanly
const findTagByIdOrCode = async (identifier: string) => {
    // Try by code first if it looks like a tag code
    if (identifier.startsWith('TAG-')) {
        return prisma.tag.findUnique({ where: { code: identifier } });
    }
    // Else try by ID
    return prisma.tag.findUnique({ where: { id: identifier } });
}

export const getPublicTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const tag = await findTagByIdOrCode(id);

        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Log scan
        await prisma.scan.create({
            data: {
                tagId: tag.id,
                location: 'Unknown',
                timestamp: new Date()
            }
        });

        res.json(formatTagResponse(tag));
    } catch (error) {
        console.error('Get Public Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const activateTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, plateNumber } = req.body;

        // User ID comes from auth middleware
        // @ts-ignore
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

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

        res.json({ message: 'Tag activated successfully', tag: formatTagResponse(updatedTag) });

    } catch (error) {
        console.error('Activate Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
