
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API KEY found");
    process.exit(1);
}

async function checkModels(version: 'v1' | 'v1beta') {
    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error(`Error fetching ${version}:`, data.error.message);
            return [];
        }
        return (data.models || []).map((m: any) => m.name.replace('models/', '')) as string[];
    } catch (e) {
        console.error(`Failed to fetch ${version}`, e);
        return [];
    }
}

async function main() {
    console.log("Checking v1 models...");
    const v1 = await checkModels('v1');
    console.log("v1 models:", v1.filter((m: string) => m.includes('gemini')));

    console.log("\nChecking v1beta models...");
    const v1beta = await checkModels('v1beta');
    console.log("v1beta models:", v1beta.filter((m: string) => m.includes('gemini')));
}

main();
