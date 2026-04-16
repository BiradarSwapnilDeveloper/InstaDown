const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const googleDisplayAd = `
            <!-- Google AdSense Display Ad -->
            <div style="margin: 20px 0; text-align: center; width: 100%; overflow: hidden;">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-6696712816082259"
                     data-ad-slot="1906674306"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>
                     (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            </div>
`;

const oldAdsterraAd = `<!-- Adsterra Native Banner Ad -->
            <div style="margin: 12px 0; text-align: center;">
                <script async="async" data-cfasync="false" src="https://pl29034446.profitablecpmratenetwork.com/78ccc9ae1e46b562fde4a9bdd7d13a45/invoke.js"></script>
                <div id="container-78ccc9ae1e46b562fde4a9bdd7d13a45"></div>
            </div>`;

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove legacy Adsterra Native Banner and insert Google Display Ad there (applies to index.html and facebook.html)
    if (content.includes('Adsterra Native Banner Ad')) {
        content = content.replace(oldAdsterraAd, googleDisplayAd);
    } 
    // For other templates that do not have the adsterra placeholder, insert at the end of the <main> block
    else if (content.includes('</main>') && !content.includes('data-ad-slot="1906674306"')) {
        content = content.replace('</main>', googleDisplayAd + '\n        </main>');
    } 
    // Fallback if no <main> block
    else if (!content.includes('data-ad-slot="1906674306"')) {
        content = content.replace('</body>', googleDisplayAd + '\n</body>');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Injected display ad into ${file}`);
});
