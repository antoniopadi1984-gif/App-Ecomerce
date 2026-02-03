const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const iconsDir = path.join(__dirname, 'icons');

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Minimal 1x1 pixel PNG buffer (transparent or black) to satisfy the requirement
// This is a 1x1 pixel red PNG
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

['icon16.png', 'icon48.png', 'icon128.png'].forEach(file => {
    fs.writeFileSync(path.join(iconsDir, file), pngBuffer);
    console.log(`Created ${file}`);
});
