const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Reduce large shadows & colored shadows to simply shadow-sm
            const shadowRegex = /shadow-(md|lg|xl|2xl|inner|premium)\s+shadow-[a-z]+-[0-9]+(?:\/[0-9]+)?/g;
            if (shadowRegex.test(content)) {
                content = content.replace(shadowRegex, 'shadow-sm');
                modified = true;
            }

            const loneLargeShadowRegex = /shadow-(md|lg|xl|2xl|inner|premium)(?!\s*shadow-)/g;
            if (loneLargeShadowRegex.test(content)) {
                content = content.replace(loneLargeShadowRegex, 'shadow-sm');
                modified = true;
            }

            // Replace colored shadows without size
            const colorShadowRegex = /shadow-[a-z]+-[0-9]+(?:\/[0-9]+)?/g;
            if (colorShadowRegex.test(content)) {
                content = content.replace(colorShadowRegex, 'shadow-sm');
                // Could create duplicate 'shadow-sm shadow-sm', so we clean it up later
                modified = true;
            }

            // Replace all indigo with rose
            if (content.includes('indigo')) {
                content = content.replace(/indigo/g, 'rose');
                modified = true;
            }
            // Replace all emerald with rose (optional? The user wants rose as accent, slate as base, and emerald for OK)
            // Wait, the user said "Los colores: solo 1 primario (rose) + slate + 3 estados (ok/warn/crit)." 
            // So I should keep emerald/amber for ok/warn. I won't replace emerald/amber.

            // Cleanup duplicate shadow-sms that might have been created
            if (content.includes('shadow-sm shadow-sm')) {
                content = content.replace(/shadow-sm\s+shadow-sm/g, 'shadow-sm');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

processDirectory(path.join(__dirname, '..', 'src'));
console.log('✅ Done replacing shadows and indigo -> rose');
