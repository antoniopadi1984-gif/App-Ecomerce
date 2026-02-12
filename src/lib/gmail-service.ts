import { google } from 'googleapis';
import { prisma } from './prisma';

/**
 * Gmail Service
 * 
 * Send automated emails using Service Account with domain-wide delegation
 * Note: Requires Google Workspace (not available for personal Gmail)
 */
export class GmailService {
    private static async getAuth(impersonateEmail?: string) {
        // Load Service Account from database
        const sa = await prisma.connection.findFirst({
            where: { provider: "GOOGLE_SERVICE_ACCOUNT", isActive: true }
        });

        if (!sa || !sa.extraConfig) {
            throw new Error('Service Account not configured');
        }

        const credentials = JSON.parse(sa.extraConfig as string);

        // Use impersonation email from env or parameter
        const subject = impersonateEmail || process.env.GOOGLE_IMPERSONATION_EMAIL;

        if (!subject) {
            throw new Error('GOOGLE_IMPERSONATION_EMAIL not configured in .env');
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.compose'
            ],
            clientOptions: {
                subject // Email to impersonate
            }
        });

        return auth;
    }

    /**
     * Send an email
     */
    static async sendEmail(params: {
        to: string | string[];
        subject: string;
        text?: string;
        html?: string;
        cc?: string | string[];
        bcc?: string | string[];
        from?: string; // Override sender email
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const auth = await this.getAuth(params.from);
            const gmail = google.gmail({ version: 'v1', auth: auth as any });

            // Build email
            const to = Array.isArray(params.to) ? params.to.join(', ') : params.to;
            const cc = params.cc ? (Array.isArray(params.cc) ? params.cc.join(', ') : params.cc) : '';
            const bcc = params.bcc ? (Array.isArray(params.bcc) ? params.bcc.join(', ') : params.bcc) : '';

            const emailLines = [
                `To: ${to}`,
                cc ? `Cc: ${cc}` : '',
                bcc ? `Bcc: ${bcc}` : '',
                `Subject: ${params.subject}`,
                'MIME-Version: 1.0',
                'Content-Type: text/html; charset=utf-8',
                '',
                params.html || params.text || ''
            ].filter(Boolean);

            const email = emailLines.join('\n');
            const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            return {
                success: true,
                messageId: response.data.id || undefined
            };

        } catch (error: any) {
            console.error('[GmailService] Send email error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send notification when research is completed
     */
    static async sendResearchCompleteNotification(data: {
        productName: string;
        qualityScore: number;
        reportUrl: string;
        duration: string;
    }): Promise<void> {
        const recipients = process.env.RESEARCH_NOTIFICATION_EMAILS?.split(',') || [];

        if (recipients.length === 0) {
            console.warn('[GmailService] No RESEARCH_NOTIFICATION_EMAILS configured');
            return;
        }

        await this.sendEmail({
            to: recipients,
            subject: `✅ Research Completado: ${data.productName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #10b981;">✅ Research Lab - Completado</h2>
                    
                    <h3>${data.productName}</h3>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Quality Score:</strong> ${data.qualityScore}/10</p>
                        <p><strong>Duración:</strong> ${data.duration}</p>
                        <p><strong>Status:</strong> Ready for creative assets</p>
                    </div>
                    
                    <a href="${data.reportUrl}" 
                       style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Ver Reporte Completo
                    </a>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Sistema automatizado - Ecombom Control
                    </p>
                </div>
            `
        });
    }

    /**
     * Send notification when video processing fails
     */
    static async sendVideoProcessingError(data: {
        videoName: string;
        productName: string;
        error: string;
    }): Promise<void> {
        const recipients = process.env.ERROR_NOTIFICATION_EMAILS?.split(',') || [];

        if (recipients.length === 0) return;

        await this.sendEmail({
            to: recipients,
            subject: `❌ Error procesando video: ${data.videoName}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #ef4444;">❌ Error en Video Processing</h2>
                    <p><strong>Video:</strong> ${data.videoName}</p>
                    <p><strong>Producto:</strong> ${data.productName}</p>
                    <p><strong>Error:</strong></p>
                    <pre style="background: #fee; padding: 15px; border-radius: 4px;">${data.error}</pre>
                </div>
            `
        });
    }

    /**
     * Send daily/weekly metrics report
     */
    static async sendMetricsReport(data: {
        period: 'daily' | 'weekly';
        stats: {
            researchCompleted: number;
            videosProcessed: number;
            avgQualityScore: number;
            totalTokens: number;
        };
        sheetUrl?: string;
    }): Promise<void> {
        const recipients = process.env.METRICS_REPORT_EMAILS?.split(',') || [];

        if (recipients.length === 0) return;

        await this.sendEmail({
            to: recipients,
            subject: `📊 ${data.period === 'daily' ? 'Daily' : 'Weekly'} Metrics Report`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>📊 Ecombom Control - ${data.period === 'daily' ? 'Daily' : 'Weekly'} Report</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f3f4f6;">
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Research Completados</strong></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${data.stats.researchCompleted}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Videos Procesados</strong></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${data.stats.videosProcessed}</td>
                        </tr>
                        <tr style="background: #f3f4f6;">
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Avg Quality Score</strong></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${data.stats.avgQualityScore.toFixed(1)}/10</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Total Tokens</strong></td>
                            <td style="padding: 12px; border: 1px solid #e5e7eb;">${data.stats.totalTokens.toLocaleString()}</td>
                        </tr>
                    </table>
                    
                    ${data.sheetUrl ? `
                        <a href="${data.sheetUrl}" style="color: #3b82f6;">Ver métricas completas en Google Sheets →</a>
                    ` : ''}
                </div>
            `
        });
    }
}
