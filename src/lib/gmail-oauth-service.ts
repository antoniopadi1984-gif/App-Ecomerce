import { google } from 'googleapis';
import { prisma } from './prisma';

/**
 * GmailOAuthService
 * Lee y responde correos reales de clientes usando tokens OAuth del usuario.
 * Diferente al GmailService (Service Account) — este actúa como el propietario real del correo.
 *
 * Prerequisito: el usuario debe haber completado el flujo OAuth en /api/auth/google
 * con los scopes gmail.send, gmail.compose, gmail.readonly, gmail.modify.
 */
export class GmailOAuthService {

    private static async getOAuthClient(storeId: string) {
        const conn = await (prisma as any).connection.findFirst({
            where: { storeId, provider: 'GOOGLE_OAUTH', isActive: true }
        });

        if (!conn) throw new Error(`Gmail OAuth no configurado para tienda ${storeId}. Ve a /connections y autoriza Google.`);

        const config = JSON.parse(conn.extraConfig || '{}');
        const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID!;
        const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

        if (!clientId || !clientSecret) {
            throw new Error('GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET no configurados en .env');
        }

        const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
        oauth2.setCredentials({
            refresh_token: config.refresh_token || conn.apiSecret,
            access_token:  config.access_token  || conn.accessToken,
        });

        // Auto-refresh si el token expiró — persiste el nuevo access_token en BD
        oauth2.on('tokens', async (newTokens) => {
            if (newTokens.access_token) {
                const updated = { ...config, access_token: newTokens.access_token };
                await (prisma as any).connection.updateMany({
                    where: { storeId, provider: 'GOOGLE_OAUTH' },
                    data: {
                        accessToken: newTokens.access_token,
                        extraConfig: JSON.stringify(updated)
                    }
                });
            }
        });

        return oauth2;
    }

    /**
     * Listar correos recientes de clientes
     */
    static async listEmails(storeId: string, params: {
        maxResults?: number;
        query?: string;      // ej: "from:cliente@gmail.com is:unread"
        labelIds?: string[];
    } = {}) {
        const auth  = await this.getOAuthClient(storeId);
        const gmail = google.gmail({ version: 'v1', auth });

        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: params.maxResults || 20,
            q: params.query || 'is:unread',
            labelIds: params.labelIds,
        });

        if (!res.data.messages?.length) return [];

        const messages = await Promise.all(
            (res.data.messages).map(async (msg) => {
                const full = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id!,
                    format: 'full'
                });

                const headers = full.data.payload?.headers || [];
                const getHeader = (name: string) =>
                    headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

                // Extraer cuerpo — buscar text/plain primero, luego body directo
                let body = '';
                const parts = full.data.payload?.parts || [];
                for (const part of parts) {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        break;
                    }
                }
                if (!body && full.data.payload?.body?.data) {
                    body = Buffer.from(full.data.payload.body.data, 'base64').toString('utf-8');
                }

                return {
                    id:       msg.id,
                    threadId: full.data.threadId,
                    from:     getHeader('from'),
                    to:       getHeader('to'),
                    subject:  getHeader('subject'),
                    date:     getHeader('date'),
                    body:     body.slice(0, 2000), // primeros 2000 chars
                    snippet:  full.data.snippet,
                    labelIds: full.data.labelIds,
                    isUnread: full.data.labelIds?.includes('UNREAD') || false,
                };
            })
        );

        return messages;
    }

    /**
     * Responder a un correo (reply en el mismo hilo)
     */
    static async replyToEmail(storeId: string, params: {
        threadId:   string;
        messageId:  string;    // ID del mensaje al que se responde (cabecera Message-ID)
        to:         string;
        subject:    string;
        bodyHtml:   string;
        fromAlias?: string;    // ej: "Soporte AleCare <soporte@alecare.es>"
    }) {
        const auth  = await this.getOAuthClient(storeId);
        const gmail = google.gmail({ version: 'v1', auth });

        const subjectClean = params.subject.replace(/^Re:\s*/i, '');

        const emailLines = [
            ...(params.fromAlias ? [`From: ${params.fromAlias}`] : []),
            `To: ${params.to}`,
            `Subject: Re: ${subjectClean}`,
            `In-Reply-To: ${params.messageId}`,
            `References: ${params.messageId}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            params.bodyHtml
        ];

        const email   = emailLines.join('\n');
        const encoded = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encoded,
                threadId: params.threadId
            }
        });

        // Marcar el original como leído automáticamente
        await gmail.users.messages.modify({
            userId: 'me',
            id: params.messageId,
            requestBody: { removeLabelIds: ['UNREAD'] }
        });

        return { success: true, messageId: res.data.id };
    }

    /**
     * Marcar un correo como leído
     */
    static async markAsRead(storeId: string, messageId: string) {
        const auth  = await this.getOAuthClient(storeId);
        const gmail = google.gmail({ version: 'v1', auth });

        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: { removeLabelIds: ['UNREAD'] }
        });

        return { success: true };
    }

    /**
     * Enviar un correo nuevo (no reply)
     */
    static async sendEmail(storeId: string, params: {
        to:         string;
        subject:    string;
        bodyHtml:   string;
        fromAlias?: string;
        cc?:        string;
    }) {
        const auth  = await this.getOAuthClient(storeId);
        const gmail = google.gmail({ version: 'v1', auth });

        const emailLines = [
            ...(params.fromAlias ? [`From: ${params.fromAlias}`] : []),
            `To: ${params.to}`,
            ...(params.cc ? [`Cc: ${params.cc}`] : []),
            `Subject: ${params.subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            params.bodyHtml
        ];

        const email   = emailLines.join('\n');
        const encoded = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw: encoded }
        });

        return { success: true, messageId: res.data.id };
    }
}
