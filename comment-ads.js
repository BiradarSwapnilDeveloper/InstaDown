const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let updated = false;

    if (content.includes('<script src="https://pl29008586.profitablecpmratenetwork.com/9d/57/30/9d573053ba8614e3219a8d51108a2959.js"></script>')) {
        content = content.replace(
            /<script src="https:\/\/pl29008586\.profitablecpmratenetwork\.com\/9d\/57\/30\/9d573053ba8614e3219a8d51108a2959\.js"><\/script>/g,
            '<!-- <script src="https://pl29008586.profitablecpmratenetwork.com/9d/57/30/9d573053ba8614e3219a8d51108a2959.js"></script> -->'
        );
        updated = true;
    }

    if (content.includes("<script>(function(s){s.dataset.zone='10802072',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>")) {
        content = content.replace(
            /<script>\(function\(s\)\{s\.dataset\.zone='10802072',s\.src='https:\/\/nap5k\.com\/tag\.min\.js'\}\)\(\[document\.documentElement, document\.body\]\.filter\(Boolean\)\.pop\(\)\.appendChild\(document\.createElement\('script'\)\)\)<\/script>/g,
            '<!-- <script>(function(s){s.dataset.zone=\'10802072\',s.src=\'https://nap5k.com/tag.min.js\'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(\'script\')))</script> -->'
        );
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
