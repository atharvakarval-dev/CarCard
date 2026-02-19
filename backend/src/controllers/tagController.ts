import { Request, Response } from 'express';
import Tag from '../models/Tag';

// Mock User ID for demo until Auth Middleware is fully integrated
const MOCK_USER_ID = '6620c3a0e1b2c3d4e5f6a7b8';

export const getTags = async (req: Request, res: Response) => {
    try {
        // In real app: req.user._id
        const tags = await Tag.find({ userId: MOCK_USER_ID });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, type, plateNumber } = req.body;

        // Check if tag already exists
        const existingTag = await Tag.findOne({ code });
        if (existingTag) {
            return res.status(400).json({ message: 'Tag code already registered' });
        }

        const newTag = new Tag({
            code,
            nickname,
            type,
            plateNumber,
            userId: MOCK_USER_ID
        });

        await newTag.save();
        res.status(201).json(newTag);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updatePrivacy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { setting } = req.body; // e.g., 'allowMaskedCall'

        const tag = await Tag.findById(id);
        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Toggle the setting
        // @ts-ignore
        tag.privacy[setting] = !tag.privacy[setting];
        await tag.save();

        res.json(tag);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getPublicTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tag = await Tag.findById(id).select('-userId -__v'); // Exclude sensitive info

        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // Log scan (optional location)
        tag.scans.push({ timestamp: new Date(), location: 'Unknown' });
        await tag.save();

        res.json(tag);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
