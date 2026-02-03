
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class GoogleSheetsClient {
    private client: OAuth2Client;

    constructor(accessToken: string, refreshToken?: string) {
        this.client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET
        );
        this.client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }

    /**
     * Appends rows to a spreadsheet
     */
    async appendRows(spreadsheetId: string, range: string, values: any[][]) {
        const sheets = google.sheets({ version: "v4", auth: this.client });
        try {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    majorDimension: "ROWS",
                    values: values
                }
            });
            return { success: true };
        } catch (error: any) {
            console.error("[Sheets Error]", error);
            throw new Error(`Google Sheets Append Error: ${error.message}`);
        }
    }

    /**
     * Reads rows from a spreadsheet
     */
    async readRows(spreadsheetId: string, range: string) {
        const sheets = google.sheets({ version: "v4", auth: this.client });
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range
            });
            return res.data.values || [];
        } catch (error: any) {
            console.error("[Sheets Read Error]", error);
            throw error;
        }
    }
}
