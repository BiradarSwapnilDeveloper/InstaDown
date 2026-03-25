const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper to format bytes
function formatStorage(bytes) {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate Instagram URLs
function isInstagramUrl(url) {
    return /instagram\.com\/(p|reel|reels|tv|stories)\//i.test(url) ||
           /instagram\.com\/[^/]+\/(reel|p)\//i.test(url);
}

// Normalize instagram URL - strip query params that can cause auth issues
function normalizeInstagramUrl(url) {
    try {
        const u = new URL(url);
        // Keep only the pathname (strip tracking params)
        return `https://www.instagram.com${u.pathname}`;
    } catch {
        return url;
    }
}

// Endpoint to fetch Instagram reel info
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        if (!isInstagramUrl(url)) {
            return res.status(400).json({
                error: 'Only Instagram Reel/Post links are supported. Please paste a valid Instagram URL.'
            });
        }

        const cleanUrl = normalizeInstagramUrl(url);

        const info = await youtubedl(cleanUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language:en-US,en;q=0.9',
            ],
        });

        // Extract video formats (with both video+audio in same stream — Instagram usually provides this)
        let formats = [];

        if (info.formats) {
            // Filter for formats that have a URL and have BOTH video and audio!
            // Instagram high-quality (1080p) is often split into video-only and audio-only streams.
            // Since we proxy the direct URL, we MUST pick a single file that contains both.
            formats = info.formats
                .filter(f => f.url && f.vcodec !== 'none' && f.acodec !== 'none' && f.acodec !== null)
                .map(f => {
                    let q = 'Best Quality';
                    if (f.height) q = `${f.height}p`;
                    else if (f.format_note) q = f.format_note;
                    else if (f.resolution) q = f.resolution;

                    return {
                        itag: f.format_id,
                        qualityLabel: q,
                        container: f.ext || 'mp4',
                        contentLength: formatStorage(f.filesize || f.filesize_approx),
                        height: f.height || 0,
                        width: f.width || 0,
                        vcodec: f.vcodec,
                        acodec: f.acodec,
                        type: 'video'
                    };
                })
                // Sort by height descending
                .sort((a, b) => b.height - a.height);

            // Deduplicate by quality label and keep unique ones
            const seen = new Set();
            const uniqueFormats = [];
            for (const f of formats) {
                if (!seen.has(f.qualityLabel)) {
                    seen.add(f.qualityLabel);
                    uniqueFormats.push(f);
                }
            }
            formats = uniqueFormats.slice(0, 5); // Show up to 5 best options
        }

        // Fallback: use the best single format yt-dlp picks (that has audio)
        if (formats.length === 0) {
            formats.push({
                itag: 'best[vcodec!=none][acodec!=none]/best',
                qualityLabel: 'Best Combined',
                container: 'mp4',
                contentLength: 'Unknown size',
                type: 'video'
            });
        }

        res.json({
            title: info.title || info.fulltitle || 'Instagram Reel',
            thumbnail: info.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(info.thumbnail)}` : null,
            author: info.uploader || info.channel || info.uploader_id || 'Instagram User',
            duration: info.duration,
            formats: formats
        });

    } catch (error) {
        console.error('Error fetching Instagram info:', error.message || error);

        let errorMsg = 'Failed to fetch reel info. Make sure the post is public and the URL is valid.';
        if (error.message && error.message.includes('Private')) {
            errorMsg = 'This Instagram post is private. Please use a public reel or post URL.';
        } else if (error.message && error.message.includes('login')) {
            errorMsg = 'Instagram requires login for this content. Only public reels are supported.';
        }

        res.status(500).json({ error: errorMsg });
    }
});

// Endpoint to stream the download
app.get('/api/download', async (req, res) => {
    try {
        const { url, itag } = req.query;

        if (!url) {
            return res.status(400).send('URL is required');
        }

        if (!isInstagramUrl(url)) {
            return res.status(400).send('Only Instagram URLs are supported');
        }

        const cleanUrl = normalizeInstagramUrl(url);

        // Fetch info to get direct URL
        const info = await youtubedl(cleanUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            // Ensure we pick a combined format if itag is not specific
            format: itag && itag !== 'best' ? itag : 'best[vcodec!=none][acodec!=none]/best',
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ],
        });

        let directUrl = null;
        let extension = 'mp4';
        let filesize = 0;

        if (itag && itag !== 'best' && info.formats) {
            const format = info.formats.find(f => f.format_id === itag);
            if (format && format.url) {
                directUrl = format.url;
                extension = format.ext || 'mp4';
                filesize = format.filesize || format.filesize_approx || 0;
            }
        }

        // Fallback to info.url (best format URL)
        if (!directUrl && info.url) {
            directUrl = info.url;
            extension = info.ext || 'mp4';
            filesize = info.filesize || info.filesize_approx || 0;
        }

        if (!directUrl) {
            return res.status(400).send('Could not find a direct download URL for this reel.');
        }

        // Sanitize filename
        const rawTitle = info.title || info.fulltitle || 'instagram_reel';
        const filename = rawTitle.replace(/[^\w\s\-\.]/gi, '').trim() || 'instagram_reel';

        res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
        res.setHeader('Content-Type', 'video/mp4');
        if (filesize) {
            res.setHeader('Content-Length', filesize);
        }

        // Proxy stream
        const proxyResponse = await axios({
            method: 'GET',
            url: directUrl,
            responseType: 'stream',
            timeout: 0,
            maxRedirects: 10,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.instagram.com/',
                'Accept': '*/*',
            }
        });

        if (!filesize && proxyResponse.headers['content-length']) {
            res.setHeader('Content-Length', proxyResponse.headers['content-length']);
        }

        proxyResponse.data.pipe(res);

        req.on('close', () => {
            if (!proxyResponse.data.destroyed) {
                proxyResponse.data.destroy();
            }
        });

        proxyResponse.data.on('error', (err) => {
            console.error('Stream error:', err.message);
            if (!res.headersSent) res.status(500).send('Stream error');
            res.end();
        });

    } catch (error) {
        console.error('Download error:', error.message || error);
        if (!res.headersSent) {
            res.status(500).send('Failed to download the reel. The post may be private or unavailable.');
        }
        res.end();
    }
});

// Proxy for thumbnails and other images to avoid Referer/CORS issues
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('URL required');

        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        });

        res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Proxy error');
    }
});

app.listen(PORT, () => {
    console.log(`🎬 InstaDown server running on http://localhost:${PORT}`);
});
