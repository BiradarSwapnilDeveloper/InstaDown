// fix-gaps-and-ads.js
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const popunderCode = '<script src="https://pl29008586.profitablecpmratenetwork.com/9d/57/30/9d573053ba8614e3219a8d51108a2959.js"></script>';
const bodyScript = '<script src="https://pl29034448.profitablecpmratenetwork.com/fb/5a/11/fb5a114b455ce3114ab845d4f5209dda.js"></script>';
const nativeBannerCode = `
            <!-- Native Banner Ad -->
            <div style="margin: 20px 0; text-align: center;">
                <script async="async" data-cfasync="false" src="https://pl29034446.profitablecpmratenetwork.com/78ccc9ae1e46b562fde4a9bdd7d13a45/invoke.js"></script>
                <div id="container-78ccc9ae1e46b562fde4a9bdd7d13a45"></div>
            </div>`;
const directLinkCode = `
            <!-- Premium Direct Link -->
            <div style="text-align: center; margin: 15px 0;">
                <a href="https://www.profitablecpmratenetwork.com/yrdy1cx74u?key=19eebdd748520f6c5785c77fa37b7dc0" target="_blank" rel="noopener" style="display:inline-block; padding:12px 24px; background:linear-gradient(45deg, #FF512F, #DD2476); color:#fff; border-radius:30px; font-weight:bold; text-decoration:none; box-shadow:0 4px 15px rgba(221,36,118,0.4);">
                    <i class="fa-solid fa-play"></i> Watch Unlimited Premium Videos
                </a>
            </div>`;

for (const file of files) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // First, remove old instances to start fresh and avoid duplicates
    content = content.replace(/<script src="https:\/\/pl29008586\.profitablecpmratenetwork\.com\/9d\/57\/30\/9d573053ba8614e3219a8d51108a2959\.js"><\/script>/gi, '');
    content = content.replace(/<script src="https:\/\/pl29034448\.profitablecpmratenetwork\.com\/fb\/5a\/11\/fb5a114b455ce3114ab845d4f5209dda\.js"><\/script>/gi, '');
    
    // Matches existing Native banner and direct link to avoid duplicating
    content = content.replace(/<!-- Native Banner Ad -->[\s\S]*?<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<!-- Direct Link Ad -->[\s\S]*?<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<!-- Premium Direct Link -->[\s\S]*?<\/div>\s*<\/div>/gi, '');
    content = content.replace(/<!-- Direct Link Ad -->[\s\S]*?<\/a>\s*<\/div>/gi, '');
    content = content.replace(/<!-- Premium Direct Link -->[\s\S]*?<\/a>\s*<\/div>/gi, '');
    
    // Clean up empty gaps or Google adsense fragments
    content = content.replace(/<meta name="google-adsense-account".*?>/gi, '');
    content = content.replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com.*?<\/script>/gi, '');
    content = content.replace(/<div class="ad-banner-top"[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="ad-middle"[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="ad-result"[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="ad-inline"[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="ad-sticky-bottom"[\s\S]*?<\/div>/gi, '');
    content = content.replace(/<div class="ad-native-banner"[\s\S]*?<\/div>\s*<\/div>/gi, ''); // extra cleanup
    content = content.replace(/<!--.*?AD:.*?-->/g, ''); // Clear comments related to old ads
    
    // Remove "after result" ad logic in bottom script
    content = content.replace(/<!-- GA4 Event: Show ad after result loads -->[\s\S]*?<\/script>/gi, '');
    
    // 1. Inject before </head>
    content = content.replace('</head>', `    ${popunderCode}\n</head>`);
    
    // 2. Inject before </body>
    content = content.replace('</body>', `    ${bodyScript}\n</body>`);
    
    // 3. Inject Native Banner and Direct Link inside index.html specifically
    if (file === 'index.html') {
        // Find a good spot, like inside the <main> block after <div class="supported-hint">
        const anchor = /<div class="supported-hint" role="note">\s*<i class="fa-solid fa-circle-check" aria-hidden="true"><\/i>\s*<span>.*?<\/span>\s*<\/div>/vi;
        if (content.match(anchor)) {
            content = content.replace(anchor, match => match + '\n' + directLinkCode + '\n' + nativeBannerCode);
        } else {
            content = content.replace('</main>', '\n' + directLinkCode + '\n' + nativeBannerCode + '\n</main>');
        }
    } else {
        // for other pages
        const anchor = /<main.*?>/i;
        if (content.match(anchor)) {
             content = content.replace(anchor, match => match + '\n' + directLinkCode + '\n' + nativeBannerCode);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
}

// Clean up CSS
const cssPath = path.join(publicDir, 'style.css');
if(fs.existsSync(cssPath)) {
    let cssContent = fs.readFileSync(cssPath, 'utf8');
    cssContent = cssContent.replace(/\/\* ════════════════════════════════════════════════\s*AD UNIT STYLES\s*════════════════════════════════════════════════ \*\/[\s\S]*?\/\* ════════════════════════════════════════════════/g, '/* ════════════════════════════════════════════════');
    
    // In case the above block comment regex wasn't exact:
    cssContent = cssContent.replace(/\.ad-banner-top\s*\{[\s\S]*?\}/gi, '');
    cssContent = cssContent.replace(/\.ad-middle\s*\{[\s\S]*?\}/gi, '');
    cssContent = cssContent.replace(/\.ad-result\s*\{[\s\S]*?\}/gi, '');
    cssContent = cssContent.replace(/\.ad-inline\s*\{[\s\S]*?\}/gi, '');
    cssContent = cssContent.replace(/\.ad-sticky-bottom\s*\{[\s\S]*?\}/gi, '');
    cssContent = cssContent.replace(/\.ad-close-btn.*?\s*\{[\s\S]*?\}/gi, '');
    
    fs.writeFileSync(cssPath, cssContent);
}

console.log("Ad gaps removed and Adsterra snippets added correctly.");
