const crypto = require('crypto');
const { logger } = require('./logger');

/**
 * Secure key management utility
 * Provides methods for encrypting/decrypting sensitive data
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate a secure key
 * In production, use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ENCRYPTION_KEY must be set in production environment');
        }
        logger.warn('ENCRYPTION_KEY not set, using default key (NOT SECURE FOR PRODUCTION)');
        return crypto.scryptSync('default-encryption-key', 'salt', 32);
    }
    
    return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV and auth tag
 */
function encrypt(text) {
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        // Return IV:AuthTag:EncryptedData
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
        logger.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedData - Encrypted text with IV and auth tag
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedData) {
    try {
        const key = getEncryptionKey();
        const parts = encryptedData.split(':');
        
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }
        
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        logger.error('Decryption failed:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Hash a password with salt
 * @param {string} password - Plain text password
 * @returns {Object} Object containing hash and salt
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return { hash, salt };
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} Random token
 */
function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Sensitive data to mask
 * @param {number} visibleChars - Number of characters to show (default 4)
 * @returns {string} Masked string
 */
function maskSensitiveData(data, visibleChars = 4) {
    if (!data || data.length <= visibleChars) {
        return '****';
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Securely compare two strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
function secureCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = {
    encrypt,
    decrypt,
    hashPassword,
    verifyPassword,
    generateSecureToken,
    maskSensitiveData,
    secureCompare,
};
