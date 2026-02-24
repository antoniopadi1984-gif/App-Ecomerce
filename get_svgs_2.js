const https = require('https');
const fs = require('fs');

https.get('https://dropi.co', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const svgs = data.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi) || [];
        // The logo is the one with width="32", let's dump that one 
        const dropiLogo = svgs.find(s => s.includes('width="32"'));
        console.log("DROPI SVG:\n" + dropiLogo);
    });
});
