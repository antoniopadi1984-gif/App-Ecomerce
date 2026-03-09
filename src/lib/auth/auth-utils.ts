
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'ecombom-jwt-secret-key-change-me-in-prod';

/**
 * Simple JWT utility using crypto to avoid dependencies if installation is slow.
 * In a real production environment, 'jose' or 'jsonwebtoken' is preferred.
 */

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    activeProductId?: string;
    exp?: number;
}

export function signJWT(payload: JWTPayload, expiresIn: string = '24h'): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

    const now = Math.floor(Date.now() / 1000);
    const expiration = expiresIn === '24h' ? now + (24 * 60 * 60) : now + (30 * 24 * 60 * 60); // 24h or 30d

    const fullPayload = { ...payload, iat: now, exp: expiration };
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
    try {
        const [headerB64, payloadB64, signature] = token.split('.');
        if (!headerB64 || !payloadB64 || !signature) return null;

        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${headerB64}.${payloadB64}`)
            .digest('base64url');

        if (signature !== expectedSignature) return null;

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as JWTPayload;

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }

        return payload;
    } catch (e) {
        return null;
    }
}

export async function validateExtensionAuth(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    return verifyJWT(token);
}
