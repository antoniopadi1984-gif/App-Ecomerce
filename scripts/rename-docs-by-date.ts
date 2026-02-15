import fs from "fs";
import path from "path";

const DOCS_PATH = path.join(process.cwd(), "docs");

// Get date: arg override or today
function getDateString(): string {
    const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
    if (args[0]) return args[0]; // npx tsx scripts/rename-docs-by-date.ts 2026-03-01
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isDryRun = process.argv.includes("--dry-run");
const DATE = getDateString();

// Match files already dated with double underscore: NAME__YYYY-MM-DD.md
const DATED_PATTERN = /__\d{4}-\d{2}-\d{2}\.md$/;

function renameDocs(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            renameDocs(fullPath);
            return;
        }

        if (!file.endsWith(".md")) return;

        // Skip if already has double-underscore date suffix
        if (DATED_PATTERN.test(file)) {
            console.log(`  Skipped (already dated): ${file}`);
            return;
        }

        // Skip DOC_INDEX.md
        if (file === "DOC_INDEX.md") {
            console.log(`  Skipped (index): ${file}`);
            return;
        }

        const ext = ".md";
        const base = file.replace(ext, "");
        const newName = `${base}__${DATE}${ext}`;

        if (isDryRun) {
            console.log(`  [DRY-RUN] Would rename: ${file} → ${newName}`);
        } else {
            fs.renameSync(fullPath, path.join(dir, newName));
            console.log(`  Renamed: ${file} → ${newName}`);
        }
    });
}

console.log(`\n📄 Renombrando docs con fecha: ${DATE}`);
console.log(`   Directorio: ${DOCS_PATH}`);
console.log(`   Modo: ${isDryRun ? "DRY-RUN (sin cambios)" : "REAL"}\n`);

renameDocs(DOCS_PATH);

console.log(`\n✅ ${isDryRun ? "Dry-run" : "Renombrado"} completo.\n`);
