import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Server-side PAT encryption/decryption API.
 *
 * SECURITY: The encryption key (PAT_ENCRYPTION_SECRET) lives exclusively on
 * the server as an environment variable. It never reaches the browser. This
 * eliminates the previous vulnerability where the key was stored in
 * localStorage and could be exfiltrated via XSS or browser extensions.
 *
 * Algorithm: AES-256-GCM with random IV per encryption, providing both
 * confidentiality and authenticity.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getEncryptionKey(): Buffer {
    const secret = process.env.PAT_ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error(
            'PAT_ENCRYPTION_SECRET environment variable is not set. ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    // Derive a 32-byte key from the secret using SHA-256
    return crypto.createHash('sha256').update(secret).digest();
}

function encryptValue(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

function decryptValue(encryptedStr: string): string {
    const parts = encryptedStr.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
    }

    const [ivB64, authTagB64, ciphertext] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * POST /api/pat
 * Body: { action: 'encrypt' | 'decrypt', data: string }
 *
 * - encrypt: takes plaintext PAT, returns encrypted string
 * - decrypt: takes encrypted PAT string, returns plaintext PAT
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, data } = body;

        if (!action || !data || typeof data !== 'string') {
            return NextResponse.json(
                { error: 'Missing required fields: action, data' },
                { status: 400 }
            );
        }

        if (action === 'encrypt') {
            const encrypted = encryptValue(data);
            return NextResponse.json({ result: encrypted });
        }

        if (action === 'decrypt') {
            const decrypted = decryptValue(data);
            return NextResponse.json({ result: decrypted });
        }

        return NextResponse.json(
            { error: 'Invalid action. Use "encrypt" or "decrypt".' },
            { status: 400 }
        );
    } catch (error) {
        console.error('PAT encryption/decryption error:', error);
        return NextResponse.json(
            { error: 'Encryption operation failed' },
            { status: 500 }
        );
    }
}
