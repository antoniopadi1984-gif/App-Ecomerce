import { importGodTierPrompts } from '../src/lib/research/importer';

async function main() {
    console.log('--- STARTING PROMPT IMPORT ---');
    try {
        await importGodTierPrompts();
        console.log('--- IMPORT COMPLETED SUCCESSFULLY ---');
    } catch (error) {
        console.error('--- IMPORT FAILED ---');
        console.error(error);
        process.exit(1);
    }
}

main();
