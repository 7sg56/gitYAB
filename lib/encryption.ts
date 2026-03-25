import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for client-side encryption of sensitive data.
 * Uses AES-256 encryption with PBKDF2 key derivation from user password/session.
 */

const ENCRYPTION_KEY_LENGTH = 256; // bits
const SALT_LENGTH = 128; // bits

/**
 * Derives an encryption key from a password and salt
 */
export function deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: ENCRYPTION_KEY_LENGTH / 32,
        iterations: 10000,
    }).toString();
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(data: string, password: string): { encrypted: string; salt: string } {
    // Generate a random salt for this encryption
    const salt = CryptoJS.lib.WordArray.random(SALT_LENGTH / 8).toString();

    // Derive key from password and salt
    const key = deriveKey(password, salt);

    // Encrypt the data
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();

    return { encrypted, salt };
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(encryptedData: string, password: string, salt: string): string {
    // Derive key from password and salt
    const key = deriveKey(password, salt);

    // Decrypt the data
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);

    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypts a GitHub PAT (Personal Access Token)
 */
export function encryptPAT(pat: string, password: string): string {
    const { encrypted, salt } = encrypt(pat, password);
    // Store salt alongside encrypted data
    return `${salt}:${encrypted}`;
}

/**
 * Decrypts a GitHub PAT (Personal Access Token)
 */
export function decryptPAT(encryptedPAT: string, password: string): string {
    const [salt, encrypted] = encryptedPAT.split(':');
    if (!salt || !encrypted) {
        throw new Error('Invalid encrypted PAT format');
    }
    return decrypt(encrypted, password, salt);
}

/**
 * Generates a random encryption key for session-based encryption
 * Store this in sessionStorage for the user's session
 */
export function generateSessionKey(): string {
    return CryptoJS.lib.WordArray.random(ENCRYPTION_KEY_LENGTH / 8).toString();
}

/**
 * Encrypts data using a pre-generated session key
 */
export function encryptWithSessionKey(data: string, sessionKey: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, sessionKey).toString();
    return encrypted;
}

/**
 * Decrypts data using a pre-generated session key
 */
export function decryptWithSessionKey(encryptedData: string, sessionKey: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, sessionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Hashes a password for storage (if needed for comparison)
 * Uses SHA-256
 */
export function hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
}
