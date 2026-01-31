import crypto from 'crypto';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-do-not-use-in-production';

/**
 * Generates a URL-safe HMAC-SHA256 signature for the given data.
 * @param data The data to sign (e.g., ID, email, or a combination).
 * @returns The hex string of the signature.
 */
export function generateSecureToken(data: string): string {
    return crypto
        .createHmac('sha256', SECRET_KEY)
        .update(data)
        .digest('hex');
}

/**
 * Verifies if the provided token matches the signature of the data.
 * @param token The token received from the URL.
 * @param data The data that was originally signed.
 * @returns true if valid, false otherwise.
 */
export function verifySecureToken(token: string, data: string): boolean {
    if (!token || !data) return false;
    const expectedToken = generateSecureToken(data);
    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(expectedToken, 'hex')
    );
}
