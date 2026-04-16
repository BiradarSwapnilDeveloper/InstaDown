const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

const adsenseCode = `
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6696712816082259"
     crossorigin="anonymous"></script>`;

const indianInstaSEO = 'instagram reels downloader, insta reel save kaise kare, instagram video download 1080p, ig reel download, reel kaise download kare, bina watermark reel download, instagram se video download, insta story saver, fast ig downloader, download instagram reels without watermark online, save insta offline, reel saver gallery me, instagram audio downloader mp3, best app to download insta reels';

const indianFbSEO = 'facebook video downloader, fb video kaise download kare, facebook reel saver, fb video download 1080p, facebook se video download, bina login facebook video save, fb watch video offline, facebook story saver, free facebook downloader without login, fb link se video download, fast fb video downloader';

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Insert AdSense if not present
    if (!content.includes('client=ca-pub-6696712816082259')) {
        content = content.replace('<head>', '<head>\n' + adsenseCode);
    }

    // Update SEO keywords for Indian Audience
    if (file === 'index.html' || file === 'guide.html') {
        content = content.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${indianInstaSEO}">`);
    } else if (file === 'facebook.html') {
        content = content.replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${indianFbSEO}">`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
