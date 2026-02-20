/**
 * CarCard QR Code Encryption Utility
 * 
 * Encrypts tag codes into proprietary payloads that are unreadable
 * by third-party QR scanners. Only the CarCard app can decode them.
 * 
 * QR Payload Format: CC::<version>:<encrypted_base64>
 * 
 * This file is shared between:
 *   - Backend generator script (Node.js)
 *   - Frontend app scanner (React Native)
 */

// ── Secret key for XOR cipher — MUST match between generator and app ──
// In production, this should be fetched from a secure config / keychain
const SECRET_KEY = 'C@rC4rd$ecr3tK3y!2026#QR';

/**
 * XOR-encrypt a plaintext string using the secret key.
 * Returns a Base64-encoded result.
 */
export function encryptTagCode(plaintext: string): string {
    const keyBytes = stringToBytes(SECRET_KEY);
    const plainBytes = stringToBytes(plaintext);
    const encrypted: number[] = [];

    for (let i = 0; i < plainBytes.length; i++) {
        encrypted.push(plainBytes[i] ^ keyBytes[i % keyBytes.length]);
    }

    return bytesToBase64(encrypted);
}

/**
 * Decrypt a Base64-encoded encrypted payload back to the original tag code.
 */
export function decryptTagCode(encryptedBase64: string): string {
    const keyBytes = stringToBytes(SECRET_KEY);
    const encryptedBytes = base64ToBytes(encryptedBase64);
    const decrypted: number[] = [];

    for (let i = 0; i < encryptedBytes.length; i++) {
        decrypted.push(encryptedBytes[i] ^ keyBytes[i % keyBytes.length]);
    }

    return bytesToString(decrypted);
}

/**
 * Build the full QR code payload string for a given tag code.
 * Format: CC::1:<encrypted_base64>
 */
export function buildQrPayload(tagCode: string): string {
    const encrypted = encryptTagCode(tagCode);
    return `CC::1:${encrypted}`;
}

/**
 * Parse a scanned QR code string. Returns the decrypted tag code
 * if it's a valid CarCard QR code, or null if unrecognized.
 */
export function parseQrPayload(scannedData: string): string | null {
    // New encrypted format: CC::1:<encrypted>
    if (scannedData.startsWith('CC::')) {
        const parts = scannedData.split(':');
        // parts = ['CC', '', '1', '<encrypted>']
        if (parts.length >= 4) {
            const encryptedBase64 = parts.slice(3).join(':'); // rejoin in case base64 has colons
            try {
                const decrypted = decryptTagCode(encryptedBase64);
                if (decrypted.startsWith('TAG-')) {
                    return decrypted;
                }
            } catch {
                return null;
            }
        }
        return null;
    }

    // Legacy support: plain TAG- codes or carcard.app URLs
    if (scannedData.startsWith('TAG-')) {
        return scannedData;
    }
    if (scannedData.includes('carcard.app/scan/')) {
        const code = scannedData.split('/scan/')[1];
        return code || null;
    }

    return null;
}

// ── Helpers (pure JS, no Node.js crypto needed) ──

function stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}

function bytesToString(bytes: number[]): string {
    return String.fromCharCode(...bytes);
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

function base64ToBytes(base64: string): number[] {
    const bytes: number[] = [];
    const cleanBase64 = base64.replace(/=+$/, '');

    for (let i = 0; i < cleanBase64.length; i += 4) {
        const c1 = BASE64_CHARS.indexOf(cleanBase64[i]);
        const c2 = i + 1 < cleanBase64.length ? BASE64_CHARS.indexOf(cleanBase64[i + 1]) : 0;
        const c3 = i + 2 < cleanBase64.length ? BASE64_CHARS.indexOf(cleanBase64[i + 2]) : -1;
        const c4 = i + 3 < cleanBase64.length ? BASE64_CHARS.indexOf(cleanBase64[i + 3]) : -1;

        bytes.push((c1 << 2) | (c2 >> 4));
        if (c3 !== -1) bytes.push(((c2 & 0xf) << 4) | (c3 >> 2));
        if (c4 !== -1) bytes.push(((c3 & 0x3) << 6) | c4);
    }
    return bytes;
}
