const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // RULE: Overlays (fondos de modales): sin blur (solo opacidad)
    // Overlays generally have "fixed inset-0" or "fixed top-0 left-0 w-full h-full"
    // Also "z-50", "bg-black/50", etc.
    // If a line has both "fixed" and ("inset-0" or "top-0...") and "backdrop-blur", remove the backdrop-blur
    const lines = content.split('\n');
    let newLines = lines.map(line => {
        if (line.includes('fixed') && (line.includes('inset-0') || line.includes('backdrop-blur'))) {
            if (line.match(/(bg-black\/\d+|bg-slate-\d+\/\d+|bg-white\/\d+)/)) {
                if (line.match(/backdrop-blur(-\w+)?/)) {
                    // Wait, components like header might be fixed, but overlays are typical z-50 fixed inset-0
                    // Let's just catch typical overlay elements.
                    if (line.includes('inset-0')) {
                        return line.replace(/\s*backdrop-blur(-\w+)?/g, '');
                    }
                }
            }
        }
        return line;
    });
    const contentWithoutOverlayBlurs = newLines.join('\n');
    if (content !== contentWithoutOverlayBlurs) {
        content = contentWithoutOverlayBlurs;
        modified = true;
    }

    // RULE: Reemplazar backdrop-blur-xl, 2xl, 3xl, lg por glass-panel o glass-card
    // Replace big blurs in Card elements with glass-card
    // Replace big blurs in other generic large panels with glass-panel (or header arrays)

    // Replace all backdrop-blur-(lg|xl|2xl|3xl) with nothing, and add glass-panel or glass-card
    const cardRegex = /<Card[^>]*className=["']([^"']*)["'][^>]*>/g;
    content = content.replace(cardRegex, (match, classNames) => {
        if (classNames.includes('backdrop-blur')) {
            let newClassNames = classNames.replace(/\s*backdrop-blur-(sm|md|lg|xl|2xl|3xl|4xl)?/g, '');
            if (!newClassNames.includes('glass-card') && !newClassNames.includes('glass-panel')) {
                newClassNames += ' glass-card';
            }
            // Remove glass artifacts like 'bg-white/50' if we have glass-card? glass-card in globals.css provides backgrounds?
            // "glass-card" has standard styles.
            return match.replace(classNames, newClassNames.trim());
        }
        return match;
    });

    // Now for non-cards (headers, big panels) containing backdrop-blur-(lg|xl|2xl|3xl)
    const bigBlurRegex = /(className=["'][^"']*)(backdrop-blur-(lg|xl|2xl|3xl))([^"']*["'])/g;
    content = content.replace(bigBlurRegex, (match, prefix, blur, suffix) => {
        let replacement = prefix + suffix;
        if (!replacement.includes('glass-panel') && !replacement.includes('glass-card') && !replacement.includes('glass-header')) {
            // Append glass-panel to className
            // Extract the class list and add glass-panel
            replacement = replacement.replace(/["']$/, ' glass-panel"');
        }
        // Also remove any remaining double spaces
        replacement = replacement.replace(/\s{2,}/g, ' ');
        return replacement;
    });

    // We can also replace the base "backdrop-blur" applied to large div containers with glass-panel, assuming they are large panels
    const mediumBlurRegex = /(className=["'][^"']*)(backdrop-blur-(md))([^"']*["'])/g;
    content = content.replace(mediumBlurRegex, (match, prefix, blur, suffix) => {
        // Just remove backdrop-blur-md, wait, the user said ONLY replace xl, 2xl, 3xl, lg with glass-panel!
        // so maybe keep backdrop-blur-md? Or remove it?
        // Let's replace md with glass-panel as well, since normally we want panels to use glass-panel!
        // Wait, "Norma Antigravity: Reemplazar backdrop-blur-xl, 2xl, 3xl, lg por: glass-panel / glass-card"
        let replacement = prefix + suffix;
        // Optionally convert md to glass-panel? Or leave it?
        // Let's leave md alone, or replace depending on size.
        // Actually earlier optimization removed ALL backdrop blurs, so perhaps we should strip small blurs to speed up things.
        return match;
    });

    if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Applied rules to ${filePath}`);
    }
}

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    });
}

walkDir(path.join(__dirname, '..', 'src'));
console.log('✅ Applied Antigravity glass rules');
