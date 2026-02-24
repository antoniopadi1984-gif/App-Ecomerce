const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Insert newlines between tokens stuck together
    content = content.replace(/([;}]) (export|const|async|class|interface|static|public|private|protected|function|return|let|var|type|import|if|for|while|do|switch|try|at|private|public|protected)/g, '$1\n$2');
    content = content.replace(/(\*\/) (export|const|async|class|interface|static|public|private|protected|function|interface|static|async)/g, '$1\n$2');
    content = content.replace(/([;}]) (\/\*\*)/g, '$1\n$2');
    content = content.replace(/([;}]) (\/\/)/g, '$1\n$2');
    content = content.replace(/\} (catch|finally)/g, '}\n$1');
    content = content.replace(/; (import|const|let|var|function|async|export)/g, ';\n$1');

    // Fix JSDoc lines that got merged
    content = content.replace(/\* /g, '\n * '); // Heuristic but often correct in my corrupted files
    content = content.replace(/\/\*\*[\n ]+\*/g, '/**\n *');
    content = content.replace(/\*[\n ]+\*\//g, '*\n */');

    // Clean up excessive newlines
    content = content.replace(/\n{3,}/g, '\n\n');

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

walk(path.join(__dirname, '..', 'src'));
