import crypto from 'crypto';

const SECRET_KEY = process.env.NEXTAUTH_SECRET;

// Note: Critical checks moved inside functions to prevent build-time crashes
// when environment variables are not yet available.

/**
 * Generates a URL-safe HMAC-SHA256 signature for the given data with 7-day expiration.
 * @param data The data to sign (e.g., ID, email, or a combination).
 * @returns The token string (signature.expiresAt).
 */
export function generateSecureToken(data: string): string {
    if (!SECRET_KEY) {
        throw new Error('NEXTAUTH_SECRET is required for token generation.');
    }
    // Default expiration: 7 days
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
    const payload = `${data}|${expiresAt}`;

    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payload)
        .digest('hex');

    return `${signature}.${expiresAt}`;
}

/**
 * Verifies if the provided token matches the signature and is not expired.
 * @param token The token received from the URL (signature.expiresAt).
 * @param data The data that was originally signed.
 * @returns true if valid and not expired, false otherwise.
 */
export function verifySecureToken(token: string, data: string): boolean {
    if (!token || !data || !SECRET_KEY) return false;

    const [signature, expiresAtStr] = token.split('.');
    if (!signature || !expiresAtStr) return false;

    // Check expiration
    const expiresAt = parseInt(expiresAtStr);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return false;
    }

    const payload = `${data}|${expiresAt}`;
    const expectedSignature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(payload)
        .digest('hex');

    try {
        // Timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (e) {
        return false;
    }
}

/**
 * Simple sanitizer to remove HTML tags and trim strings.
 * Used to prevent stored XSS in user-provided text.
 */
export function sanitizeInput(input: string | null | undefined): string {
    if (!input) return '';
    return input.toString().replace(/<[^>]*>?/gm, '').trim();
}
