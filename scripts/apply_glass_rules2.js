const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (filePath.endsWith('globals.css') || filePath.endsWith('design-tokens.ts')) {
        return; // Don't mess with design system definitions
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Modals & Overlays: remove any backdrop-blur if it has "fixed inset-0" or "fixed top-0"
    content = content.replace(/(class[A-Za-z]*="[^"]*fixed[^"]*inset-0[^"]*)/g, (match) => {
        return match.replace(/[ \t]*backdrop-blur(-\w+)?[ \t]*/g, ' ');
    });

    // 2. Cards: Replace large backdrop-blurs with glass-card
    content = content.replace(/<(Card|div)[^>]*className=["']([^"']*)["'][^>]*>/g, (match, tag, classNames) => {
        if (/backdrop-blur-(lg|xl|2xl|3xl|4xl)/.test(classNames)) {
            let newClassNames = classNames.replace(/[ \t]*backdrop-blur-(sm|md|lg|xl|2xl|3xl|4xl)?[ \t]*/g, ' ');
            if (tag === 'Card' && !newClassNames.includes('glass-card') && !newClassNames.includes('glass-panel')) {
                newClassNames += ' glass-card';
            } else if (tag === 'div' && !newClassNames.includes('glass-panel') && !newClassNames.includes('glass-card')) {
                newClassNames += ' glass-panel';
            }
            return match.replace(classNames, newClassNames.trim());
        }
        return match;
    });

    // Generic fallback for any remaining backdrop-blur-(lg|xl|2xl|3xl) string
    content = content.replace(/(className=["'][^"']*)(backdrop-blur-(lg|xl|2xl|3xl|4xl))([^"']*["'])/g, (match, prefix, blur, suffix) => {
        let replacement = prefix + suffix;
        if (!replacement.includes('glass-panel') && !replacement.includes('glass-card') && !replacement.includes('glass-header')) {
            replacement = replacement.replace(/["']$/, ' glass-panel"');
        }
        return replacement.replace(/[ \t]{2,}/g, ' ');
    });

    // Optimization: Remove ALL other backdrop-blurs (sm, md) from the codebase as per earlier "Optimize Glass Performance" that was fully replacing them.
    content = content.replace(/[ \t]*backdrop-blur(?:-[a-z0-9]+)?[ \t]*/g, ' ');

    // Clean up extra spaces on the same line
    content = content.replace(/[ \t]{2,}/g, ' ');

    if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Updated: " + filePath);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            processFile(fullPath);
        }
    });
}

walkDir(path.join(__dirname, '..', 'src'));
