const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix keyword-after-brace
    const keywords = ['export', 'const', 'async', 'class', 'interface', 'static', 'public', 'private', 'protected', 'function', 'return', 'let', 'var', 'type', 'import', 'if', 'for', 'while', 'do', 'switch', 'try', 'at'];
    keywords.forEach(kw => {
        // Look for } keyword or ; keyword
        const regex = new RegExp(`([;}]) (${kw}\\b)`, 'g');
        content = content.replace(regex, '$1\n$2');
    });

    // Fix comments that got stuck after braces or semicolons
    content = content.replace(/([;}]) (\/\*\*)/g, '$1\n$2');
    content = content.replace(/([;}]) (\/\/)/g, '$1\n$2');

    // Fix keywords stuck after closing comments
    keywords.forEach(kw => {
        const regex = new RegExp(`(\\*\\/) (${kw}\\b)`, 'g');
        content = content.replace(regex, '$1\n$2');
    });

    // Fix JSDoc comments that lost newlines: "/** * line1 * line2 */" -> "/**\n * line1\n * line2\n */"
    content = content.replace(/\/\*\* (.*) \*\//g, (match, p1) => {
        if (p1.includes(' * ')) {
            return '/**\n * ' + p1.split(' * ').join('\n * ') + '\n */';
        }
        return match;
    });

    // Fix closing brace followed by catch/finally
    content = content.replace(/\} (catch|finally)/g, '}\n$1');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed: ' + filePath);
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.ts') || p.endsWith('.tsx')) fixFile(p);
    });
}

const srcDir = path.join(__dirname, '..', 'src');
walk(srcDir);
