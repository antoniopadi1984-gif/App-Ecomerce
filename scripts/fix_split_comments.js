const fs = require('fs');
const path = require('path');

function refineLogistics(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. First, join ALL split comments (this is what I did before)
    // We already did this, but let's make it robust
    const joinKeywords = ['for', 'if', 'await', 'try', 'const', 'let', 'var', 'return', 'else', 'catch', 'finally'];
    joinKeywords.forEach(kw => {
        const regex = new RegExp(`(\\/\\/.*)\\s*\\n\\s*(${kw}\\b)`, 'g');
        content = content.replace(regex, '$1 $2');
    });

    // 2. Now, CRITICALLY, split the ones that are definitely code but got swallowed
    // Look for // ... [code keywords]
    // keywords that are almost certainly code when followed by certain chars
    const codeBreakers = [
        { kw: 'const', next: '\\s+\\w+' },
        { kw: 'let', next: '\\s+\\w+' },
        { kw: 'if', next: '\\s*\\(' },
        { kw: 'for', next: '\\s*\\(' },
        { kw: 'await', next: '\\s+' },
        { kw: 'return', next: '\\s+' },
        { kw: 'try', next: '\\s*\\{' },
        { kw: 'function', next: '\\s+\\w+' }
    ];

    codeBreakers.forEach(cb => {
        // match: // sequence [space] keyword [next]
        // replace with: // sequence \n keyword [next]
        const regex = new RegExp(`(\\/\\/.*?)\\s+(${cb.kw}\\b${cb.next})`, 'g');
        content = content.replace(regex, '$1\n$2');
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refined logistics file.');
}

const target = '/Users/padi/APPs Propias/App Ecomerce/src/app/logistics/orders/actions.ts';
if (fs.existsSync(target)) {
    refineLogistics(target);
}
