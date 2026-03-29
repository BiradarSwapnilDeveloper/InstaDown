const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const tagScript = '\n    <!-- Extra Ad Tag -->\n    <script src="https://5gvci.com/act/files/tag.min.js?z=10802045" data-cfasync="false" async></script>';

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add tag script before </head>
    if (!content.includes('10802045')) {
        content = content.replace('</head>', tagScript + '\n</head>');
    }

    fs.writeFileSync(path.join(dir, file), content);
});
console.log('Extra Ad Tag successfully added to all pages!');
