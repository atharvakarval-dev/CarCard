import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import prisma from '../prisma';

export const generateBatch = async (req: Request, res: Response) => {
    try {
        let { quantity } = req.body;

        // Default to 100 if not provided or invalid
        if (!quantity || isNaN(quantity) || quantity < 1) {
            quantity = 100;
        }

        // Limit maximum quantity to prevent timeout/memory issues
        const MAX_QUANTITY = 10000;
        if (quantity > MAX_QUANTITY) {
            return res.status(400).json({ message: `Quantity cannot exceed ${MAX_QUANTITY}` });
        }

        const BATCH_SIZE = quantity;
        const generateRandomCode = (length: number = 8): string => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return `TAG-${result}`;
        };

        const tagsToCreate = [];
        const existingCodes = new Set();

        // PDF Setup
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=generated_tags.pdf');

        doc.pipe(res);

        let x = 30;
        let y = 30;
        const qrSize = 100;
        const gap = 20;
        const cols = 4;
        let colCounter = 0;

        // Generate Codes and PDF Content
        while (tagsToCreate.length < BATCH_SIZE) {
            const code = generateRandomCode();
            if (!existingCodes.has(code)) {
                existingCodes.add(code);

                const tagData = {
                    code,
                    type: 'car',
                    isActive: false,
                    status: 'created',
                    allowMaskedCall: true,
                    allowWhatsapp: true,
                    allowSms: true,
                    showEmergencyContact: false
                };
                tagsToCreate.push(tagData);

                // Add to PDF
                const qrBuffer = await QRCode.toBuffer(code);

                if (y + qrSize + 40 > doc.page.height - 30) {
                    doc.addPage();
                    x = 30;
                    y = 30;
                    colCounter = 0;
                }

                doc.image(qrBuffer, x, y, { width: qrSize });
                doc.fontSize(10).text(code, x, y + qrSize + 5, { width: qrSize, align: 'center' });

                colCounter++;
                if (colCounter >= cols) {
                    colCounter = 0;
                    x = 30;
                    y += qrSize + gap + 20;
                } else {
                    x += qrSize + gap;
                }
            }
        }

        doc.end();

        // Async Insert into DB (fire and forget or wait? For 5000, better to wait to confirm)
        // Note: In production, this might be better as a background job (Bull/Redis)
        // But for this requirement, we'll await it.

        const CHUNK_SIZE = 100;
        for (let i = 0; i < tagsToCreate.length; i += CHUNK_SIZE) {
            const chunk = tagsToCreate.slice(i, i + CHUNK_SIZE);
            await prisma.tag.createMany({
                data: chunk,
                skipDuplicates: true
            });
        }

        console.log(`✅ Admin generated ${tagsToCreate.length} tags.`);

    } catch (error) {
        console.error('Batch Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error generating tags', error });
        }
    }
};
