const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const popunderCommentRegex = /<!--\s*<script src="https:\/\/pl29008586\.profitablecpmratenetwork\.com\/9d\/57\/30\/9d573053ba8614e3219a8d51108a2959\.js"><\/script>\s*-->/g;
const popunderActive = '<script src="https://pl29008586.profitablecpmratenetwork.com/9d/57/30/9d573053ba8614e3219a8d51108a2959.js"></script>';

const inPagePushCommentRegex = /<!--\s*<script>\(function\(s\).*?<\/script>\s*-->/g;

const bodyRegex = /<\/body>/i;
const bodyScript = `<script src="https://pl29034448.profitablecpmratenetwork.com/fb/5a/11/fb5a114b455ce3114ab845d4f5209dda.js"></script>\n</body>`;

const nativeBannerCode = `
            <!-- Native Banner Ad -->
            <div class="ad-native-banner" style="margin: 20px 0; text-align: center;">
                <script async="async" data-cfasync="false" src="https://pl29034446.profitablecpmratenetwork.com/78ccc9ae1e46b562fde4a9bdd7d13a45/invoke.js"></script>
                <div id="container-78ccc9ae1e46b562fde4a9bdd7d13a45"></div>
            </div>
`;

const directLinkCode = `
            <!-- Direct Link Ad -->
            <div style="text-align: center; margin: 15px 0;">
                <a href="https://www.profitablecpmratenetwork.com/yrdy1cx74u?key=19eebdd748520f6c5785c77fa37b7dc0" target="_blank" rel="noopener" style="display:inline-block; padding:12px 24px; background:linear-gradient(45deg, #FF512F, #DD2476); color:#fff; border-radius:30px; font-weight:bold; text-decoration:none; box-shadow:0 4px 15px rgba(221,36,118,0.4);">
                    <i class="fa-solid fa-play"></i> Watch Unlimited Premium Videos
                </a>
            </div>
`;


for (const file of files) {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Remove AdSense Auto Ad Script
    content = content.replace(/<!-- ════════════════════════════════════════════════\s*GOOGLE ADSENSE AUTO ADS[\s\S]*?<\/script>/gi, '');
    
    // 2. Remove AdSense Gap DIVs (banner-top, result, inline, sticky-bottom)
    // We will leave ad-middle specifically for index.html to inject native banner there
    content = content.replace(/<!--.*?AD: TOP BANNER.*?-->\s*<div class="ad-banner-top">[\s\S]*?<\/div>/gi, '');
    
    content = content.replace(/<!--.*?AD: AFTER RESULT.*?-->\s*<div class="ad-result"[\s\S]*?<\/div>/gi, '');
    
    content = content.replace(/<!--.*?AD: INSIDE SEO SECTION.*?-->\s*<div class="ad-inline">[\s\S]*?<\/div>/gi, '');
    
    content = content.replace(/<!--.*?AD: STICKY MOBILE.*?-->\s*<div class="ad-sticky-bottom"[\s\S]*?<\/div>/gi, '');

    // 3. Uncomment Popunder 
    if (content.match(popunderCommentRegex)) {
        content = content.replace(popunderCommentRegex, popunderActive);
    } else if (!content.includes(popunderActive)) {
        // If not found and not already active, add it before </head>
        content = content.replace('</head>', `    ${popunderActive}\n</head>`);
    }

    // Also remove the commented In-Page Push snippet to clean up
    content = content.replace(inPagePushCommentRegex, '');

    // 4. Inject script before </body> if not present
    if (!content.includes('fb5a114b455ce3114ab845d4f5209dda.js')) {
        content = content.replace(bodyRegex, bodyScript);
    }

    // 5. Specifically for index.html, inject Native Banner and Direct Link
    if (file === 'index.html') {
        const adMiddleRegex = /<!--.*?AD: MIDDLE RESPONSIVE UNIT.*?-->\s*<div class="ad-middle">[\s\S]*?<\/div>/i;
        
        if (content.match(adMiddleRegex)) {
            // Replace ad-middle with our new Native Banner + Direct Link
            content = content.replace(adMiddleRegex, directLinkCode + nativeBannerCode);
        } else {
            // If ad-middle was somehow not found, inject below supported hint manually (fallback)
            const hintRegex = /<div class="supported-hint".*?<\/div>/ms;
            content = content.replace(hintRegex, match => match + directLinkCode + nativeBannerCode);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully processed ${file}`);
}
