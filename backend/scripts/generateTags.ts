import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateRandomCode = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TAG-${result}`;
};

const BATCH_SIZE = 5000;
const CHUNK_SIZE = 100; // Insert in chunks to avoid memory issues

import fs from 'fs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

async function main() {
    console.log(`🚀 Starting batch generation of ${BATCH_SIZE} tags...`);

    const tagsToCreate = [];
    const existingCodes = new Set(); // To ensure uniqueness within the batch

    // PDF Setup
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const outputStream = fs.createWriteStream('generated_tags.pdf');
    doc.pipe(outputStream);

    console.log('📄 Generating PDF...');

    let x = 30;
    let y = 30;
    const qrSize = 100;
    const gap = 20;
    const cols = 4;
    let colCounter = 0;

    // 1. Generate unique codes
    while (tagsToCreate.length < BATCH_SIZE) {
        const code = generateRandomCode();
        if (!existingCodes.has(code)) {
            existingCodes.add(code);
            tagsToCreate.push({
                code,
                type: 'car', // Default type, can be changed on activation
                isActive: false, // Not active until claimed
                status: 'created',
                // Default privacy settings
                allowMaskedCall: true,
                allowWhatsapp: true,
                allowSms: true,
                showEmergencyContact: false
            });

            // Generate QR Code Buffer
            const qrBuffer = await QRCode.toBuffer(code);

            // Add to PDF
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
                y += qrSize + gap + 20; // Move to next row
            } else {
                x += qrSize + gap; // Move to next column
            }
        }
    }

    doc.end();
    console.log(`✅ Generated ${tagsToCreate.length} unique codes in memory and PDF.`);

    // 2. Insert into DB in chunks
    let insertedCount = 0;
    for (let i = 0; i < tagsToCreate.length; i += CHUNK_SIZE) {
        const chunk = tagsToCreate.slice(i, i + CHUNK_SIZE);
        try {
            await prisma.tag.createMany({
                data: chunk.map(t => ({ // Only take necessary fields for DB
                    code: t.code,
                    type: t.type,
                    isActive: t.isActive,
                    status: t.status,
                    allowMaskedCall: t.allowMaskedCall,
                    allowWhatsapp: t.allowWhatsapp,
                    allowSms: t.allowSms,
                    showEmergencyContact: t.showEmergencyContact
                })),
                skipDuplicates: true
            });
            insertedCount += chunk.length;
            process.stdout.write(`\rCreating tags: ${insertedCount}/${BATCH_SIZE}`);
        } catch (error) {
            console.error(`\n❌ Error inserting chunk ${i}:`, error);
        }
    }

    console.log(`\n✨ Successfully inserted ${insertedCount} tags into the database.`);
    console.log('📄 PDF saved to generated_tags.pdf');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
