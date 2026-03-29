const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const propScript = '\n    <!-- Propeller Ads Network -->\n    <script src="https://quge5.com/88/tag.min.js" data-zone="224480" async data-cfasync="false"></script>\n</head>';

const seoTagsIndex = `    <!-- ════════════════════════════════════════════════
         ULTRA PRO LEGEND SEO & META TAGS (10K+ Daily Traffic Setup)
    ════════════════════════════════════════════════ -->
    <title>Instagram Reels Downloader Free – HD Video & Story Saver | InstaDown</title>
    <meta name="description" content="Download Instagram Reels, videos, stories, and IGTV in 1080p HD for free. No watermark, anonymous, and no login required. Best IG downloader for Mobile & PC.">
    <meta name="keywords" content="instagram reels downloader, download instagram reels without watermark online free, instagram video download 1080p, how to save instagram videos to camera roll, instagram reel download link copy paste, instagram downloader for pc and mobile, download instagram stories anonymously, best instagram reels downloader free, fast instagram video saver, ig reel download, save insta post offline, free website to download instagram videos, best app to download insta reels, download reels from instagram link, instagram audio downloader mp3, insta story saver tool hd, instagram downloader 2026 ultimate, instagram reels download app, igtv video downloader hd">`;

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Add propeller script before </head>
    if (!content.includes('quge5.com')) {
        content = content.replace('</head>', propScript);
    }

    // Enhance SEO
    if (file === 'index.html') {
        const titleRegex = /<title>[\s\S]*?<\/title>/;
        const descRegex = /<meta name="description"[\s\S]*?>/;
        const keyRegex = /<meta name="keywords"[\s\S]*?>/;
        
        // Remove the existing primary SEO header comment
        content = content.replace(/<!-- ════════════════════════════════════════════════\s+PRIMARY SEO META TAGS\s+════════════════════════════════════════════════ -->/, '');
        content = content.replace(titleRegex, '');
        content = content.replace(descRegex, '');
        // Replace existing keywords with our new mega SEO block
        content = content.replace(keyRegex, seoTagsIndex);
    } else {
        // Basic SEO injection for subpages
        const baseTitle = file.replace('.html', '');
        const capitalizedTitle = baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1);
        if (!content.includes('meta name="description"')) {
            const extraSeo = `    <meta name="description" content="Review the ${capitalizedTitle} for InstaDown. The best free Instagram Reels, Stories, and Video Downloader without watermark.">\n    <meta name="keywords" content="${baseTitle} instadown, instagram downloader ${baseTitle}, free ig reels saver, privacy instadown, terms instadown">`;
            content = content.replace(/<title>/, extraSeo + '\n    <title>');
        }
    }
    
    fs.writeFileSync(path.join(dir, file), content);
});
console.log('SEO and Propeller Ads successfully added to all pages!');
