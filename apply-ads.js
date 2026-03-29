const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const vignetteScript = '\n    <!-- Vignette Banner Ad -->\n    <script>(function(s){s.dataset.zone=\'10802071\',s.src=\'https://izcle.com/vignette.min.js\'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(\'script\')))</script>';

const inPagePushScript = '\n    <!-- In-Page Push Ad -->\n    <script>(function(s){s.dataset.zone=\'10802072\',s.src=\'https://nap5k.com/tag.min.js\'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(\'script\')))</script>';

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add Vignette banner before </body>
    if (!content.includes('10802071')) {
        content = content.replace('</body>', vignetteScript + '\n</body>');
    }
    
    // Add In-Page push before </body>
    if (!content.includes('10802072')) {
        content = content.replace('</body>', inPagePushScript + '\n</body>');
    }

    fs.writeFileSync(path.join(dir, file), content);
});
console.log('Vignette and In-Page Push Ads correctly added to all pages!');
