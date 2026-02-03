
import AdmZip from 'adm-zip';
import path from 'path';

export interface ThemeMetadata {
    name: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    sections: Array<{
        name: string;
        fileName: string;
        schema: any;
    }>;
}

/**
 * Theme Analyzer Engine
 * Parses a Shopify Theme ZIP and extracts design tokens and section architecture.
 */
export class ThemeAnalyzer {
    private zip: AdmZip;

    constructor(zipBuffer: Buffer) {
        this.zip = new AdmZip(zipBuffer);
    }

    public analyze(): ThemeMetadata {
        const zipEntries = this.zip.getEntries();
        const metadata: ThemeMetadata = {
            name: "Unknown Theme",
            sections: []
        };

        // 1. Detect Colors & Design Tokens from settings_data.json
        const settingsEntry = zipEntries.find(e => e.entryName.endsWith('config/settings_data.json'));
        if (settingsEntry) {
            try {
                const settings = JSON.parse(settingsEntry.getData().toString('utf8'));
                // Common Shopify design token paths
                const current = settings.current || {};
                metadata.primaryColor = current.color_accent || current.colors_accent_1 || current.accent_color;
                metadata.secondaryColor = current.color_secondary || current.colors_background_2;
                metadata.fontFamily = current.font_body_family || current.type_body_font;
            } catch (e) {
                console.error("Error parsing settings_data.json", e);
            }
        }

        // 2. Scan Sections
        zipEntries.forEach(entry => {
            if (entry.entryName.startsWith('sections/') && entry.entryName.endsWith('.liquid')) {
                const content = entry.getData().toString('utf8');
                const schema = this.extractSchema(content);
                if (schema) {
                    metadata.sections.push({
                        name: schema.name || entry.name.replace('.liquid', ''),
                        fileName: entry.name,
                        schema
                    });
                }
            }
        });

        return metadata;
    }

    /**
     * Extracts the JSON schema from a Liquid section file.
     */
    private extractSchema(content: string): any {
        const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
        if (schemaMatch && schemaMatch[1]) {
            try {
                return JSON.parse(schemaMatch[1].trim());
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}
