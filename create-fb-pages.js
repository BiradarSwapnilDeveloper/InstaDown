const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// 1. Create facebook.html based on index.html
let indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');

// Add fb-theme body class
let fbHtml = indexHtml.replace('<body>', '<body class="fb-theme">');

// Switch active state on the platform buttons
fbHtml = fbHtml.replace('<a href="/" class="platform-btn active"><i class="fa-brands fa-instagram"></i> Instagram</a>', '<a href="/" class="platform-btn"><i class="fa-brands fa-instagram"></i> Instagram</a>');
fbHtml = fbHtml.replace('<a href="/facebook.html" class="platform-btn"><i class="fa-brands fa-facebook"></i> Facebook</a>', '<a href="/facebook.html" class="platform-btn active"><i class="fa-brands fa-facebook"></i> Facebook</a>');

// Meta tags and titles
fbHtml = fbHtml.replace('<title>Instagram Reels Downloader Free – HD Video &amp; Story Saver | InstaDown</title>', '<title>Facebook Video Downloader Free – HD Video &amp; Reels Saver | InstaDown</title>');
fbHtml = fbHtml.replace('content="Download Instagram Reels, videos, stories, and IGTV in 1080p HD', 'content="Download Facebook Videos, Reels, and Watch in 1080p HD');
fbHtml = fbHtml.replace(/Instagram Reels Downloader/g, 'Facebook Video Downloader');
fbHtml = fbHtml.replace('content="instagram reels downloader', 'content="facebook video downloader, facebook reel download');

// Hero section
fbHtml = fbHtml.replace('<h1>Download Instagram <span class="gradient-text">Reels</span></h1>', '<h1>Download Facebook <span class="gradient-text">Videos</span></h1>');
fbHtml = fbHtml.replace('Paste any public Instagram Reel or Post link below', 'Paste any public Facebook Video or Reel link below');

// Icons - modify only the hero/input icons, keep footer InstaDown logo maybe.
// Wait, to be safe I will selectively replace icons.
fbHtml = fbHtml.replace('<i class="fa-brands fa-instagram input-icon"></i>', '<i class="fa-brands fa-facebook input-icon"></i>');
fbHtml = fbHtml.replace('placeholder="Paste Instagram Reel link here..."', 'placeholder="Paste Facebook Video or Reel link..."');
fbHtml = fbHtml.replace('aria-label="Instagram Reel URL"', 'aria-label="Facebook Video URL"');
fbHtml = fbHtml.replace('<span>Fetch Reel</span>', '<span>Fetch Video</span>');
fbHtml = fbHtml.replace('<span>Supports: instagram.com/reel/ &nbsp;•&nbsp; instagram.com/p/ &nbsp;•&nbsp; instagram.com/tv/</span>', '<span>Supports: facebook.com/video/ &nbsp;•&nbsp; fb.watch/ &nbsp;•&nbsp; facebook.com/reels/</span>');
fbHtml = fbHtml.replace('alt="Instagram Reel Thumbnail"', 'alt="Facebook Video Thumbnail"');
fbHtml = fbHtml.replace('<p id="video-author" class="author">@Author</p>\n                            <p class="platform-label"><i class="fa-brands fa-instagram" aria-hidden="true"></i> Instagram</p>', '<p id="video-author" class="author">Facebook Page</p>\n                            <p class="platform-label"><i class="fa-brands fa-facebook" aria-hidden="true"></i> Facebook</p>');
fbHtml = fbHtml.replace('How to Download Instagram Reels – Step by Step', 'How to Download Facebook Videos – Step by Step');
fbHtml = fbHtml.replace('Open Instagram, find the Reel you want to download', 'Open Facebook, find the Video or Reel you want to download');
fbHtml = fbHtml.replace('<p>Come back to <strong>InstaDown</strong>, paste the copied link into the input box above and click <strong>Fetch Reel</strong>.</p>', '<p>Come back to <strong>InstaDown</strong>, paste the copied link into the input box above and click <strong>Fetch Video</strong>.</p>');

// SEO FAQ
fbHtml = fbHtml.replace('Can I download Instagram Reels without watermark?', 'Can I download Facebook Videos without watermark?');
fbHtml = fbHtml.replace('InstaDown downloads Reels in original quality — exactly as Instagram hosts them', 'InstaDown downloads Facebook videos in original quality — exactly as Facebook hosts them');
fbHtml = fbHtml.replace('Only public Instagram posts are supported', 'Only public Facebook posts and videos are supported');
fbHtml = fbHtml.replace('we download the highest quality available from Instagram', 'we download the highest quality available from Facebook');
fbHtml = fbHtml.replace('download as many Instagram Reels as you want', 'download as many Facebook Videos as you want');
fbHtml = fbHtml.replace('How to save Instagram Reels to my phone?', 'How to save Facebook Videos to my phone?');

// Update footer links on Facebook to link to FB specific pages
fbHtml = fbHtml.replace('<a href="/privacy.html">Privacy Policy</a>', '<a href="/fb-privacy.html">Privacy Policy</a>');
fbHtml = fbHtml.replace('<a href="/terms.html">Terms of Service</a>', '<a href="/fb-terms.html">Terms of Service</a>');
fbHtml = fbHtml.replace('<a href="/disclaimer.html">Disclaimer</a>', '<a href="/fb-disclaimer.html">Disclaimer</a>');
fbHtml = fbHtml.replace('<a href="/cookies.html">Cookies Policy</a>', '<a href="/fb-cookies.html">Cookies Policy</a>');

fs.writeFileSync(path.join(publicDir, 'facebook.html'), fbHtml);
console.log('Created facebook.html');

// 2. Create Facebook versions of Legal & Info Pages
const pagesToCopy = ['privacy.html', 'terms.html', 'disclaimer.html', 'cookies.html', 'about.html'];

pagesToCopy.forEach(page => {
    let content = fs.readFileSync(path.join(publicDir, page), 'utf8');
    
    // Replace "Instagram" with "Facebook"
    let fbContent = content.replace(/Instagram/g, 'Facebook');
    
    // Re-orient titles
    fbContent = fbContent.replace(/InstaDown/g, 'InstaDown (Facebook Tool)');
    
    // Add Platform switcher if we want, but these pages might not have the switcher.
    // If they have standard footer links, maybe we leave them targeting the FB versions so they can navigate back.
    fbContent = fbContent.replace(/href="\/privacy.html"/g, 'href="/fb-privacy.html"');
    fbContent = fbContent.replace(/href="\/terms.html"/g, 'href="/fb-terms.html"');
    fbContent = fbContent.replace(/href="\/disclaimer.html"/g, 'href="/fb-disclaimer.html"');
    fbContent = fbContent.replace(/href="\/cookies.html"/g, 'href="/fb-cookies.html"');
    fbContent = fbContent.replace(/href="\/about.html"/g, 'href="/fb-about.html"');
    fbContent = fbContent.replace(/href="\/"/g, 'href="/facebook.html"');

    const newFileName = `fb-${page}`;
    fs.writeFileSync(path.join(publicDir, newFileName), fbContent);
    console.log(`Created ${newFileName}`);
});

console.log('Done creating Facebook integration pages.');
