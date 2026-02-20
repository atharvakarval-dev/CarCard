import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

// ── Import the shared crypto utility ──
// We inline the functions here because this script runs standalone via ts-node
// and doesn't share the React Native bundle path.

const SECRET_KEY = 'C@rC4rd$ecr3tK3y!2026#QR';

function stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: number[]): string {
    let result = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i];
        const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        result += BASE64_CHARS[(b1 >> 2) & 0x3f];
        result += BASE64_CHARS[((b1 << 4) | (b2 >> 4)) & 0x3f];
        result += i + 1 < bytes.length ? BASE64_CHARS[((b2 << 2) | (b3 >> 6)) & 0x3f] : '=';
        result += i + 2 < bytes.length ? BASE64_CHARS[b3 & 0x3f] : '=';
    }
    return result;
}

function encryptTagCode(plaintext: string): string {
    const keyBytes = stringToBytes(SECRET_KEY);
    const plainBytes = stringToBytes(plaintext);
    const encrypted: number[] = [];
    for (let i = 0; i < plainBytes.length; i++) {
        encrypted.push(plainBytes[i] ^ keyBytes[i % keyBytes.length]);
    }
    return bytesToBase64(encrypted);
}

function buildQrPayload(tagCode: string): string {
    return `CC::1:${encryptTagCode(tagCode)}`;
}

// ──────────────────────────────────────────────

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
const CHUNK_SIZE = 100;

async function main() {
    console.log(`🚀 Starting batch generation of ${BATCH_SIZE} encrypted blank tags...`);

    const tagsToCreate: any[] = [];
    const existingCodes = new Set<string>();

    // PDF Setup
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const outputStream = fs.createWriteStream('generated_tags.pdf');
    doc.pipe(outputStream);

    console.log('📄 Generating PDF with encrypted QR codes...');

    let x = 30;
    let y = 30;
    const qrSize = 100;
    const gap = 20;
    const cols = 4;
    let colCounter = 0;

    // 1. Generate unique codes with ENCRYPTED QR payloads
    while (tagsToCreate.length < BATCH_SIZE) {
        const code = generateRandomCode();
        if (!existingCodes.has(code)) {
            existingCodes.add(code);
            tagsToCreate.push({
                code,
                type: 'car',
                isActive: false,
                status: 'created',
                allowMaskedCall: true,
                allowWhatsapp: true,
                allowSms: true,
                showEmergencyContact: false,
            });

            // ── Generate ENCRYPTED QR Code ──
            // Instead of a plain URL, encode a proprietary encrypted payload.
            // Third-party scanners will see: CC::1:aBcDeFgHiJk... (gibberish)
            // Only the CarCard app can decrypt this to get TAG-XXXXXXXX
            const qrData = buildQrPayload(code);
            const qrBuffer = await QRCode.toBuffer(qrData, {
                errorCorrectionLevel: 'M',
                margin: 2,
            });

            // Add to PDF
            if (y + qrSize + 40 > doc.page.height - 30) {
                doc.addPage();
                x = 30;
                y = 30;
                colCounter = 0;
            }

            doc.image(qrBuffer, x, y, { width: qrSize });
            doc.fontSize(8).text(code, x, y + qrSize + 5, { width: qrSize, align: 'center' });

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
    console.log(`✅ Generated ${tagsToCreate.length} encrypted blank QR codes.`);

    // 2. Insert into DB in chunks
    let insertedCount = 0;
    for (let i = 0; i < tagsToCreate.length; i += CHUNK_SIZE) {
        const chunk = tagsToCreate.slice(i, i + CHUNK_SIZE);
        try {
            await prisma.tag.createMany({
                data: chunk.map((t: any) => ({
                    code: t.code,
                    type: t.type,
                    isActive: t.isActive,
                    status: t.status,
                    allowMaskedCall: t.allowMaskedCall,
                    allowWhatsapp: t.allowWhatsapp,
                    allowSms: t.allowSms,
                    showEmergencyContact: t.showEmergencyContact,
                })),
                skipDuplicates: true,
            });
            insertedCount += chunk.length;
            process.stdout.write(`\rCreating tags: ${insertedCount}/${BATCH_SIZE}`);
        } catch (error) {
            console.error(`\n❌ Error inserting chunk ${i}:`, error);
        }
    }

    console.log(`\n✨ Successfully inserted ${insertedCount} tags into the database.`);
    console.log('📄 PDF saved to generated_tags.pdf');
    console.log('🔒 All QR codes are encrypted — only readable by the CarCard app.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
