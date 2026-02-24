import { google } from 'googleapis';
import { prisma } from './prisma';
import { getConnectionSecret } from '@/lib/server/connections';
import { getGoogleAuth } from './google-auth';

/**
 * Google Sheets Service
 * 
 * Automatically logs metrics, performance data, and KPIs to Google Sheets
 * Uses Service Account authentication
 */
export class GoogleSheetsService {
    private static async getAuth() {
        return getGoogleAuth('store-main');
    }

    /**
     * Create a new spreadsheet
     */
    static async createSheet(params: {
        title: string;
        headers?: string[];
        folderId?: string;
    }): Promise<{ id: string; url: string }> {
        try {
            const auth = await this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth: auth as any });
            const drive = google.drive({ version: 'v3', auth: auth as any });

            // Create spreadsheet
            const response = await sheets.spreadsheets.create({
                requestBody: {
                    properties: {
                        title: params.title
                    },
                    sheets: [{
                        properties: {
                            title: 'Sheet1'
                        }
                    }]
                }
            });

            const spreadsheetId = response.data.spreadsheetId!;

            // Add headers if provided
            if (params.headers && params.headers.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Sheet1!A1',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [params.headers]
                    }
                });

                // Format header row (bold)
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: 0,
                                    endRowIndex: 1
                                },
                                cell: {
                                    userEnteredFormat: {
                                        textFormat: { bold: true },
                                        backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                                    }
                                },
                                fields: 'userEnteredFormat(textFormat,backgroundColor)'
                            }
                        }]
                    }
                });
            }

            // Move to folder if specified
            if (params.folderId) {
                await drive.files.update({
                    fileId: spreadsheetId,
                    addParents: params.folderId,
                    fields: 'id, parents'
                });
            }

            return {
                id: spreadsheetId,
                url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
            };

        } catch (error: any) {
            console.error('[GoogleSheetsService] Create sheet error:', error);
            throw error;
        }
    }

    /**
     * Append a row to a spreadsheet
     */
    static async appendRow(
        spreadsheetId: string,
        values: any[],
        sheetName: string = 'Sheet1'
    ): Promise<void> {
        try {
            const auth = await this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth: auth as any });

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [values]
                }
            });

        } catch (error: any) {
            console.error('[GoogleSheetsService] Append row error:', error);
            throw error;
        }
    }

    /**
     * Update multiple rows at once
     */
    static async batchAppend(
        spreadsheetId: string,
        rows: any[][],
        sheetName: string = 'Sheet1'
    ): Promise<void> {
        try {
            const auth = await this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth: auth as any });

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: rows
                }
            });

        } catch (error: any) {
            console.error('[GoogleSheetsService] Batch append error:', error);
            throw error;
        }
    }

    /**
     * Read data from a spreadsheet
     */
    static async readRange(
        spreadsheetId: string,
        range: string
    ): Promise<any[][]> {
        try {
            const auth = await this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth: auth as any });

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range
            });

            return response.data.values || [];

        } catch (error: any) {
            console.error('[GoogleSheetsService] Read range error:', error);
            throw error;
        }
    }

    /**
     * Log research lab metrics
     */
    static async logResearchMetrics(data: {
        productName: string;
        duration: string;
        qualityScore: number;
        totalTokens?: number;
        phases?: number;
    }): Promise<void> {
        const METRICS_SHEET_ID = process.env.RESEARCH_METRICS_SHEET_ID;

        if (!METRICS_SHEET_ID) {
            console.warn('[GoogleSheetsService] RESEARCH_METRICS_SHEET_ID not configured');
            return;
        }

        await this.appendRow(METRICS_SHEET_ID, [
            new Date().toISOString(),
            data.productName,
            data.duration,
            data.qualityScore,
            data.totalTokens || 0,
            data.phases || 0
        ]);
    }

    /**
     * Log video processing metrics
     */
    static async logVideoMetrics(data: {
        productName: string;
        videoName: string;
        concept: number;
        awarenessLevel: string;
        funnelStage: string;
        processingTime: string;
        scriptLength?: number;
    }): Promise<void> {
        const METRICS_SHEET_ID = process.env.VIDEO_METRICS_SHEET_ID;

        if (!METRICS_SHEET_ID) {
            console.warn('[GoogleSheetsService] VIDEO_METRICS_SHEET_ID not configured');
            return;
        }

        await this.appendRow(METRICS_SHEET_ID, [
            new Date().toISOString(),
            data.productName,
            data.videoName,
            data.concept,
            data.awarenessLevel,
            data.funnelStage,
            data.processingTime,
            data.scriptLength || 0
        ]);
    }

    /**
     * Log bot/AI performance metrics
     */
    static async logBotMetrics(data: {
        botName: string;
        taskType: string;
        status: 'SUCCESS' | 'FAILED';
        responseTime: number;
        tokensUsed?: number;
        errorMessage?: string;
    }): Promise<void> {
        const METRICS_SHEET_ID = process.env.BOT_METRICS_SHEET_ID;

        if (!METRICS_SHEET_ID) {
            console.warn('[GoogleSheetsService] BOT_METRICS_SHEET_ID not configured');
            return;
        }

        await this.appendRow(METRICS_SHEET_ID, [
            new Date().toISOString(),
            data.botName,
            data.taskType,
            data.status,
            data.responseTime,
            data.tokensUsed || 0,
            data.errorMessage || ''
        ]);
    }
}
