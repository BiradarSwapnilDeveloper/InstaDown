const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const popunderScript = '\n    <!-- Propeller Ads Popunder -->\n    <script>(function(s){s.dataset.zone=\'10801966\',s.src=\'https://al5sm.com/tag.min.js\'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(\'script\')))</script>';

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add popunder script after <head>
    if (!content.includes('10801966')) {
        content = content.replace('<head>', '<head>' + popunderScript);
    }

    fs.writeFileSync(path.join(dir, file), content);
});
console.log('Popunder Ads successfully added to all pages!');
