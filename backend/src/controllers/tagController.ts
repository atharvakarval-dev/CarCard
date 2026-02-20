import { Request, Response } from 'express';
import prisma from '../prisma';

// ── In-memory OTP store for tag phone edits (use Redis in production) ──
const tagOtpStore: Record<string, { otp: string; expiresAt: number; pendingData: any }> = {};

// Helper to format tag response for frontend consistency
const formatTagResponse = (tag: any) => {
    if (!tag) return null;
    return {
        ...tag,
        _id: tag.id, // Frontend uses _id
        privacy: {
            allowMaskedCall: tag.allowMaskedCall,
            allowWhatsapp: tag.allowWhatsapp,
            allowSms: tag.allowSms,
            showEmergencyContact: tag.showEmergencyContact,
        },
        emergencyContact: {
            name: tag.emergencyContactName,
            phone: tag.emergencyContactPhone,
        },
    };
};

// ── GET /tags ── List authenticated user's tags ──
export const getTags = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const tags = await prisma.tag.findMany({
            where: { userId },
            include: { scans: true },
        });
        res.json(tags.map(formatTagResponse));
    } catch (error) {
        console.error('Get Tags Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── POST /tags ── Create a brand-new tag (manual entry) ──
export const createTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, type, plateNumber } = req.body;

        const existingTag = await prisma.tag.findUnique({ where: { code } });
        if (existingTag) {
            return res.status(400).json({ message: 'Tag code already registered' });
        }

        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const newTag = await prisma.tag.create({
            data: { code, nickname, type, plateNumber, userId, status: 'active', isActive: true },
        });

        res.status(201).json(formatTagResponse(newTag));
    } catch (error) {
        console.error('Create Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── PUT /tags/:id ── Update tag details (all editable fields) ──
export const updateTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag) return res.status(404).json({ message: 'Tag not found' });
        if (tag.userId !== userId) return res.status(403).json({ message: 'You do not own this tag' });

        const {
            nickname,
            plateNumber,
            type,
            vehicleColor,
            vehicleMake,
            vehicleModel,
            emergencyContactName,
            emergencyContactPhone,
            allowMaskedCall,
            allowWhatsapp,
            allowSms,
            showEmergencyContact,
        } = req.body;

        // ── Check if phone number is being changed ──
        const isPhoneChanging =
            emergencyContactPhone !== undefined &&
            emergencyContactPhone !== tag.emergencyContactPhone &&
            emergencyContactPhone !== '';

        if (isPhoneChanging) {
            // Don't save yet — require OTP verification first
            return res.status(200).json({
                otpRequired: true,
                message: 'Phone number changed. OTP verification required before saving.',
            });
        }

        // ── No phone change — save directly ──
        const updateData: any = {};
        if (nickname !== undefined) updateData.nickname = nickname;
        if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
        if (type !== undefined) updateData.type = type;
        if (vehicleColor !== undefined) updateData.vehicleColor = vehicleColor;
        if (vehicleMake !== undefined) updateData.vehicleMake = vehicleMake;
        if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel;
        if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
        if (allowMaskedCall !== undefined) updateData.allowMaskedCall = allowMaskedCall;
        if (allowWhatsapp !== undefined) updateData.allowWhatsapp = allowWhatsapp;
        if (allowSms !== undefined) updateData.allowSms = allowSms;
        if (showEmergencyContact !== undefined) updateData.showEmergencyContact = showEmergencyContact;

        const updatedTag = await prisma.tag.update({ where: { id }, data: updateData });
        res.json({ message: 'Tag updated successfully', tag: formatTagResponse(updatedTag) });
    } catch (error) {
        console.error('Update Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── POST /tags/:id/otp/send ── Send OTP for phone number change ──
export const sendTagOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phoneNumber, pendingData } = req.body;

        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag) return res.status(404).json({ message: 'Tag not found' });
        if (tag.userId !== userId) return res.status(403).json({ message: 'You do not own this tag' });

        if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        tagOtpStore[`${id}:${phoneNumber}`] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            pendingData: pendingData || {},
        };

        console.log(`🔐 Tag OTP for ${phoneNumber}: ${otp}`); // Log for testing

        // TODO: Integrate actual SMS service (Twilio/MSG91)

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send Tag OTP Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── POST /tags/:id/otp/verify ── Verify OTP and save all pending changes ──
export const verifyTagOtpAndUpdate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { phoneNumber, otp, pendingData } = req.body;

        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Not authenticated' });

        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag) return res.status(404).json({ message: 'Tag not found' });
        if (tag.userId !== userId) return res.status(403).json({ message: 'You do not own this tag' });

        const storeKey = `${id}:${phoneNumber}`;
        const stored = tagOtpStore[storeKey];

        if (!stored) return res.status(400).json({ message: 'No OTP was sent for this number' });
        if (Date.now() > stored.expiresAt) {
            delete tagOtpStore[storeKey];
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

        // OTP verified — delete from store
        delete tagOtpStore[storeKey];

        // Build update from pendingData (sent from frontend)
        const data = pendingData || stored.pendingData || {};
        const updateData: any = {};
        if (data.nickname !== undefined) updateData.nickname = data.nickname;
        if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.vehicleColor !== undefined) updateData.vehicleColor = data.vehicleColor;
        if (data.vehicleMake !== undefined) updateData.vehicleMake = data.vehicleMake;
        if (data.vehicleModel !== undefined) updateData.vehicleModel = data.vehicleModel;
        if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
        if (data.allowMaskedCall !== undefined) updateData.allowMaskedCall = data.allowMaskedCall;
        if (data.allowWhatsapp !== undefined) updateData.allowWhatsapp = data.allowWhatsapp;
        if (data.allowSms !== undefined) updateData.allowSms = data.allowSms;
        if (data.showEmergencyContact !== undefined) updateData.showEmergencyContact = data.showEmergencyContact;
        // The phone number that was OTP-verified
        updateData.emergencyContactPhone = phoneNumber;

        const updatedTag = await prisma.tag.update({ where: { id }, data: updateData });
        res.json({ message: 'Tag updated successfully after OTP verification', tag: formatTagResponse(updatedTag) });
    } catch (error) {
        console.error('Verify Tag OTP Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── PATCH /tags/:id/privacy ── Toggle a single privacy setting ──
export const updatePrivacy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { setting } = req.body;

        const tag = await prisma.tag.findUnique({ where: { id } });
        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        const updateData: any = {};
        updateData[setting] = !((tag as any)[setting]);

        const updatedTag = await prisma.tag.update({ where: { id }, data: updateData });
        res.json(formatTagResponse(updatedTag));
    } catch (error) {
        console.error('Update Privacy Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── Helper: find tag by ID or code ──
const findTagByIdOrCode = async (identifier: string) => {
    if (identifier.startsWith('TAG-')) {
        return prisma.tag.findUnique({ where: { code: identifier } });
    }
    return prisma.tag.findUnique({ where: { id: identifier } });
};

// ── GET /tags/public/:id ── Public scan endpoint ──
export const getPublicTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tag = await findTagByIdOrCode(id);

        if (!tag) return res.status(404).json({ message: 'Tag not found' });

        // ── Handle unformatted/blank tags ──
        if (tag.status === 'created' && !tag.userId) {
            // Check User-Agent to distinguish app vs browser
            const ua = (req.headers['user-agent'] || '').toLowerCase();
            const isFromApp = req.headers['x-carcard-app'] === 'true';

            if (isFromApp) {
                // App is scanning — return tag data so app can show activation screen
                return res.json({
                    ...formatTagResponse(tag),
                    isBlank: true,
                    message: 'This tag is blank and can be formatted through the CarCard app.',
                });
            } else {
                // External scanner / browser — restrict access
                return res.status(403).json({
                    locked: true,
                    message: 'This QR code can only be used with the CarCard app. Download it from the App Store or Play Store.',
                    appStoreUrl: 'https://apps.apple.com/app/carcard',
                    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.carcard.app',
                });
            }
        }

        // Log scan for active tags
        await prisma.scan.create({
            data: {
                tagId: tag.id,
                location: 'Unknown',
                timestamp: new Date(),
            },
        });

        res.json(formatTagResponse(tag));
    } catch (error) {
        console.error('Get Public Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// ── POST /tags/activate ── Activate a blank tag (claim it) ──
export const activateTag = async (req: Request, res: Response) => {
    try {
        const { code, nickname, plateNumber } = req.body;

        // @ts-ignore
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const tag = await prisma.tag.findUnique({ where: { code } });
        if (!tag) return res.status(404).json({ message: 'Invalid tag code' });

        if (tag.status === 'active' || tag.userId) {
            return res.status(400).json({ message: 'This tag is already linked to another user' });
        }

        const updatedTag = await prisma.tag.update({
            where: { id: tag.id },
            data: {
                userId,
                nickname: nickname || 'My Vehicle',
                plateNumber: plateNumber || '',
                status: 'active',
                isActive: true,
            },
        });

        res.json({ message: 'Tag activated successfully', tag: formatTagResponse(updatedTag) });
    } catch (error) {
        console.error('Activate Tag Error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
