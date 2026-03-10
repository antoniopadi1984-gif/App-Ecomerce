/**
 * GOOGLE DOCS GENERATION MODULE
 * Auto-generate research documents in Google Drive
 */

import { google } from 'googleapis';
import { getConnectionSecret } from '@/lib/server/connections';

const docs = google.docs('v1');

async function getAuthClient() {
    const credsStr = await getConnectionSecret('store-main', 'GOOGLE_CLOUD_CREDENTIALS') || process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (credsStr) {
        const creds = JSON.parse(credsStr);
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: creds.client_email,
                private_key: creds.private_key,
            },
            scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
        });
    }
    return new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
    });
}

/**
 * Create a new Google Doc
 */
async function createGoogleDoc(title: string, parentFolderId: string): Promise<string> {
    try {
        const auth = await getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        // Create the document
        const createResponse = await docs.documents.create({
            auth,
            requestBody: {
                title
            }
        });

        const documentId = createResponse.data.documentId!;

        // Move to the correct folder
        await drive.files.update({
            fileId: documentId,
            addParents: parentFolderId,
            removeParents: 'root',
            fields: 'id, parents'
        });

        return documentId;

    } catch (error: any) {
        console.error('[createGoogleDoc] Error:', error);
        throw new Error(`Failed to create Google Doc: ${error.message}`);
    }
}

/**
 * Append formatted content to Google Doc
 */
async function appendToDoc(documentId: string, requests: any[]) {
    try {
        const auth = await getAuthClient();

        await docs.documents.batchUpdate({
            auth,
            documentId,
            requestBody: {
                requests
            }
        });

    } catch (error: any) {
        console.error('[appendToDoc] Error:', error);
        throw new Error(`Failed to append to doc: ${error.message}`);
    }
}

/**
 * Generate Product DNA Google Doc
 */
export async function generateProductDNADoc(
    researchData: any,
    folderId: string
): Promise<string> {
    try {
        const title = `Product_DNA_${researchData.productTitle || 'Product'}`;
        const docId = await createGoogleDoc(title, folderId);

        // Build content requests
        const requests = [];
        let index = 1;

        // Title
        requests.push({
            insertText: {
                location: { index },
                text: `PRODUCT DNA: ${researchData.productTitle}\n\n`
            }
        });
        index += `PRODUCT DNA: ${researchData.productTitle}\n\n`.length;

        // Summary
        if (researchData.summary) {
            requests.push({
                insertText: {
                    location: { index },
                    text: `📋 EXECUTIVE SUMMARY\n${researchData.summary}\n\n`
                }
            });
            index += `📋 EXECUTIVE SUMMARY\n${researchData.summary}\n\n`.length;
        }

        // Core Product Info
        if (researchData.core) {
            requests.push({
                insertText: {
                    location: { index },
                    text: `🎯 CORE PRODUCT\n`
                }
            });
            index += `🎯 CORE PRODUCT\n`.length;

            const core = researchData.core;
            const coreText = `
Problem: ${core.problem || 'N/A'}
Solution: ${core.solution || 'N/A'}
Category: ${core.category || 'N/A'}
Innovation: ${core.innovation || 'N/A'}

`;
            requests.push({
                insertText: {
                    location: { index },
                    text: coreText
                }
            });
            index += coreText.length;
        }

        // Market Intelligence
        if (researchData.market) {
            requests.push({
                insertText: {
                    location: { index },
                    text: `📊 MARKET INTELLIGENCE\n`
                }
            });
            index += `📊 MARKET INTELLIGENCE\n`.length;

            const market = researchData.market;
            const marketText = `
Size: ${market.size || 'N/A'}
Growth: ${market.growth || 'N/A'}
Trends: ${market.trends?.join(', ') || 'N/A'}
Competitors: ${market.competitors?.join(', ') || 'N/A'}

`;
            requests.push({
                insertText: {
                    location: { index },
                    text: marketText
                }
            });
            index += marketText.length;
        }

        // Avatar Profiles
        if (researchData.avatars && researchData.avatars.length > 0) {
            requests.push({
                insertText: {
                    location: { index },
                    text: `👥 TARGET AVATARS\n\n`
                }
            });
            index += `👥 TARGET AVATARS\n\n`.length;

            researchData.avatars.forEach((avatar: any, i: number) => {
                const avatarText = `
Avatar ${i + 1}: ${avatar.name || 'Unnamed'}
Demographics: ${avatar.demographics || 'N/A'}
Psychographics: ${avatar.psychographics || 'N/A'}
Pain Points: ${avatar.painPoints?.join(', ') || 'N/A'}
Desires: ${avatar.desires?.join(', ') || 'N/A'}
Score: ${avatar.score || 'N/A'}/10

`;
                requests.push({
                    insertText: {
                        location: { index },
                        text: avatarText
                    }
                });
                index += avatarText.length;
            });
        }

        // Apply formatting
        await appendToDoc(docId, requests);

        return docId;

    } catch (error: any) {
        console.error('[generateProductDNADoc] Error:', error);
        throw error;
    }
}

/**
 * Generate Truth Layer Evidence Doc
 */
export async function generateTruthLayerDoc(
    researchData: any,
    folderId: string
): Promise<string> {
    try {
        const title = `Truth_Layer_Evidence_${researchData.productTitle || 'Product'}`;
        const docId = await createGoogleDoc(title, folderId);

        const requests = [];
        let index = 1;

        // Title
        requests.push({
            insertText: {
                location: { index },
                text: `TRUTH LAYER EVIDENCE\n\n`
            }
        });
        index += `TRUTH LAYER EVIDENCE\n\n`.length;

        // Evidence citations
        if (researchData.evidence && researchData.evidence.length > 0) {
            requests.push({
                insertText: {
                    location: { index },
                    text: `📚 EVIDENCE CITATIONS\n\n`
                }
            });
            index += `📚 EVIDENCE CITATIONS\n\n`.length;

            researchData.evidence.forEach((item: any, i: number) => {
                const evidenceText = `
[${i + 1}] ${item.claim || 'Claim'}
Source: ${item.source || 'N/A'}
Type: ${item.type || 'N/A'}
Credibility: ${item.credibility || 'N/A'}/10
URL: ${item.url || 'N/A'}
Quote: "${item.quote || 'N/A'}"

`;
                requests.push({
                    insertText: {
                        location: { index },
                        text: evidenceText
                    }
                });
                index += evidenceText.length;
            });
        } else {
            requests.push({
                insertText: {
                    location: { index },
                    text: 'No evidence citations found.\n'
                }
            });
        }

        await appendToDoc(docId, requests);
        return docId;

    } catch (error: any) {
        console.error('[generateTruthLayerDoc] Error:', error);
        throw error;
    }
}

/**
 * Generate VOC Language Bank Doc
 */
export async function generateVOCDoc(
    researchData: any,
    folderId: string
): Promise<string> {
    try {
        const title = `VOC_Language_Bank_${researchData.productTitle || 'Product'}`;
        const docId = await createGoogleDoc(title, folderId);

        const requests = [];
        let index = 1;

        // Title
        requests.push({
            insertText: {
                location: { index },
                text: `VOC LANGUAGE BANK\n\n`
            }
        });
        index += `VOC LANGUAGE BANK\n\n`.length;

        // VOC dictionary
        if (researchData.voc) {
            const categories = ['painPoints', 'desires', 'objections', 'phrases'];

            categories.forEach(category => {
                if (researchData.voc[category] && researchData.voc[category].length > 0) {
                    const categoryTitle = category.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
                    requests.push({
                        insertText: {
                            location: { index },
                            text: `📝 ${categoryTitle}\n`
                        }
                    });
                    index += `📝 ${categoryTitle}\n`.length;

                    researchData.voc[category].forEach((item: string) => {
                        const itemText = `• ${item}\n`;
                        requests.push({
                            insertText: {
                                location: { index },
                                text: itemText
                            }
                        });
                        index += itemText.length;
                    });

                    requests.push({
                        insertText: {
                            location: { index },
                            text: '\n'
                        }
                    });
                    index += 1;
                }
            });
        }

        await appendToDoc(docId, requests);
        return docId;

    } catch (error: any) {
        console.error('[generateVOCDoc] Error:', error);
        throw error;
    }
}

/**
 * Generate Marketing Angles Doc
 */
export async function generateMarketingAnglesDoc(
    researchData: any,
    folderId: string
): Promise<string> {
    try {
        const title = `Marketing_Angles_${researchData.productTitle || 'Product'}`;
        const docId = await createGoogleDoc(title, folderId);

        const requests = [];
        let index = 1;

        // Title
        requests.push({
            insertText: {
                location: { index },
                text: `MARKETING ANGLES\n\n`
            }
        });
        index += `MARKETING ANGLES\n\n`.length;

        // Marketing angles
        if (researchData.angles && researchData.angles.length > 0) {
            researchData.angles.forEach((angle: any, i: number) => {
                const angleText = `
📐 ANGLE ${i + 1}: ${angle.name || 'Unnamed'}

Hook: ${angle.hook || 'N/A'}
Narrative: ${angle.narrative || 'N/A'}
Evidence Links: ${angle.evidenceLinks?.join(', ') || 'None'}
Score: ${angle.score || 'N/A'}/10
Primary Avatar: ${angle.avatar || 'N/A'}

`;
                requests.push({
                    insertText: {
                        location: { index },
                        text: angleText
                    }
                });
                index += angleText.length;
            });
        } else {
            requests.push({
                insertText: {
                    location: { index },
                    text: 'No marketing angles defined yet.\n'
                }
            });
        }

        await appendToDoc(docId, requests);
        return docId;

    } catch (error: any) {
        console.error('[generateMarketingAnglesDoc] Error:', error);
        throw error;
    }
}

/**
 * Generate all research docs
 */
export async function generateAllResearchDocs(
    researchData: any,
    researchFolderId: string
): Promise<{
    productDNAId: string;
    truthLayerId: string;
    vocId: string;
    anglesId: string;
}> {
    try {
        const [productDNAId, truthLayerId, vocId, anglesId] = await Promise.all([
            generateProductDNADoc(researchData, researchFolderId),
            generateTruthLayerDoc(researchData, researchFolderId),
            generateVOCDoc(researchData, researchFolderId),
            generateMarketingAnglesDoc(researchData, researchFolderId)
        ]);

        return {
            productDNAId,
            truthLayerId,
            vocId,
            anglesId
        };

    } catch (error: any) {
        console.error('[generateAllResearchDocs] Error:', error);
        throw error;
    }
}
