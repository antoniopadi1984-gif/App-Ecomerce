const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Fix keywords stuck to braces or semicolons
    const keywords = ['export', 'const', 'async', 'class', 'interface', 'static', 'public', 'private', 'protected', 'function', 'return', 'let', 'var', 'type', 'import', 'if', 'for', 'while', 'do', 'switch', 'try', 'at', 'await'];
    keywords.forEach(kw => {
        content = content.replace(new RegExp(`([;}]) (${kw}\\b)`, 'g'), '$1\n$2');
        content = content.replace(new RegExp(`(\\*\\/) (${kw}\\b)`, 'g'), '$1\n$2');
    });

    // 2. Fix comments stuck to code (and vice versa)
    content = content.replace(/([;}]) (\/\*\*)/g, '$1\n$2');
    content = content.replace(/([;}]) (\/\/)/g, '$1\n$2');

    // 3. Fix try/catch/finally and other block transitions
    content = content.replace(/\} (catch|finally|else)/g, '}\n$1');
    content = content.replace(/\} (return|const|let|if|for|while|await)/g, '}\n$1');

    // 4. Fix JSDoc specifically 
    content = content.replace(/\/\*\* (.*?) \*\//g, (match, p1) => {
        if (p1.includes(' * ')) {
            return '/**\n * ' + p1.split(' * ').join('\n * ') + '\n */';
        }
        return match;
    });

    // 5. Fix multiple items on same line separated by spaces that should be newlines
    content = content.replace(/(\}) (export|const|class|interface|async|function)/g, '$1\n$2');

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
// ONLY FIXED IGNORED FOLDERS
const targets = [
    path.join(srcDir, 'app', 'api', 'finances', 'export'),
    path.join(srcDir, 'app', 'api', 'video'),
    path.join(srcDir, 'app', 'api', 'video-lab', 'assets'),
    path.join(srcDir, 'lib', 'media'),
    path.join(srcDir, 'lib', 'video')
];

targets.forEach(t => walk(t));
console.log('Safe ignored files repair complete.');
