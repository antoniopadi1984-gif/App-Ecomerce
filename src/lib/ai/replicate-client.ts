import Replicate from "replicate";
import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Centralized Replicate Client
 * Handles authentication, prediction creation, and security token generation.
 */
export class ReplicateClient {
    private replicate: Replicate;
    private webhookSecret: string;

    constructor() {
        if (!process.env.REPLICATE_API_TOKEN) {
            throw new Error("REPLICATE_API_TOKEN is missing in environment");
        }
        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });
        this.webhookSecret = process.env.REPLICATE_WEBHOOK_SECRET || "default_internal_secret_change_me";
    }

    /**
     * Creates a prediction on Replicate with a secure webhook.
     */
    async createPrediction({
        jobId,
        ref,
        version,
        input,
        isImage = true
    }: {
        jobId: string;
        ref: string;
        version?: string;
        input: any;
        isImage?: boolean;
    }) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ecombom-control.com";
        const hmacToken = this.generateHmacToken(jobId);
        const webhookUrl = `${baseUrl}/api/webhooks/replicate?jobId=${jobId}&token=${hmacToken}`;

        console.log(`[ReplicateClient] Creating prediction for Job: ${jobId}`);

        // Construct prediction options
        const isHttps = baseUrl.startsWith('https://');
        const options: any = {
            input,
        };

        if (isHttps) {
            options.webhook = webhookUrl;
            options.webhook_events_filter = isImage ? ["completed"] : ["start", "completed"];
        }

        const [owner, name] = ref.split('/');
        const modelIdentifier = version ? `${owner}/${name}:${version}` : `${owner}/${name}`;

        console.log(`[REPLICATE_REQUEST] Job: ${jobId} | Model: ${modelIdentifier}`);

        // Call Replicate
        let prediction;
        try {
            if (version) {
                prediction = await this.replicate.predictions.create({
                    version,
                    ...options
                });
            } else {
                prediction = await this.replicate.predictions.create({
                    model: `${owner}/${name}` as any,
                    ...options
                });
            }

            console.log(`[REPLICATE_RESPONSE] Job: ${jobId} | PredictionID: ${prediction.id} | Status: ${prediction.status}`);
            return prediction;
        } catch (error: any) {
            console.error(`[REPLICATE_ERROR] Job: ${jobId} | Model: ${modelIdentifier} | Error: ${error.message}`);
            throw error; // Re-throw to ensure the job handler catches it
        }
    }

    /**
     * Generates an HMAC token for webhook validation.
     */
    generateHmacToken(jobId: string): string {
        return crypto
            .createHmac("sha256", this.webhookSecret)
            .update(jobId)
            .digest("hex");
    }

    /**
     * Retrieves a prediction from Replicate by its ID.
     */
    async getPrediction(id: string) {
        return await this.replicate.predictions.get(id);
    }

    /**
     * Polls a prediction until it completes, fails, or times out.
     */
    async waitForPrediction(predictionId: string, timeoutMs: number = 300000) {
        const start = Date.now();
        const pollInterval = 3000; // 3 seconds

        while (Date.now() - start < timeoutMs) {
            const prediction = await this.getPrediction(predictionId);
            console.log(`[ReplicateClient] Polling ${predictionId}: status=${prediction.status}`);

            if (prediction.status === "succeeded") {
                return prediction;
            }

            if (prediction.status === "failed" || prediction.status === "canceled") {
                throw new Error(`Prediction ${predictionId} ended with status: ${prediction.status}. Error: ${prediction.error}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error(`Prediction ${predictionId} timed out after ${timeoutMs}ms`);
    }

    /**
     * Downloads a file from a URL to a local path.
     */
    async downloadFile(url: string, localPath: string) {
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        console.log(`[ReplicateClient] Downloading ${url} to ${localPath}`);
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        return new Promise<void>((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', (err) => reject(err));
        });
    }

    /**
     * Validates a webhook token.
     */
    validateWebhookToken(jobId: string, token: string): boolean {
        const expectedToken = this.generateHmacToken(jobId);
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(expectedToken)
        );
    }
}

export const replicateClient = new ReplicateClient();
