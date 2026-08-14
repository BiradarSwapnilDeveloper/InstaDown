const express = require('express');
const cors = require('cors');
const youtubedl = require('yt-dlp-exec');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
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

// Validate Platform URLs
function isInstagramUrl(url) {
    return /instagram\.com\/(p|reel|reels|tv|stories)\//i.test(url) ||
           /instagram\.com\/[^/]+\/(reel|p)\//i.test(url);
}

function isFacebookUrl(url) {
    return /facebook\.com\//i.test(url) || 
           /fb\.watch\//i.test(url) || 
           /fb\.gg\//i.test(url) ||
           /fb\.com\//i.test(url);
}

function isSupportedUrl(url) {
    return isInstagramUrl(url) || isFacebookUrl(url);
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

// RapidAPI Helper for Instagram
async function fetchInstagramWithRapidAPI(url) {
    if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapid_api_key_here') {
        return null;
    }
    
    try {
        const response = await axios.request({
            method: 'GET',
            url: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index',
            params: { url: url },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
            }
        });
        
        if (response.data && response.data.media) {
            return {
                title: response.data.title || 'Instagram Reel',
                thumbnail: response.data.thumbnail || null,
                directUrl: response.data.media,
                formats: [{
                    itag: 'rapidapi_best',
                    qualityLabel: 'Best Quality',
                    container: 'mp4',
                    contentLength: 'Unknown size',
                    type: 'video',
                    url: response.data.media
                }]
            };
        }
    } catch (e) {
        console.error('RapidAPI Fetch Error:', e.message);
    }
    return null;
}

// Endpoint to fetch Instagram reel info
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required.' });
        }

        if (!isSupportedUrl(url)) {
            return res.status(400).json({
                error: 'Only Instagram and Facebook links are supported. Please paste a valid URL.'
            });
        }

        let cleanUrl = url;
        if (isInstagramUrl(url)) {
            cleanUrl = normalizeInstagramUrl(url);
            
            // Try RapidAPI first for Instagram
            const rapidApiInfo = await fetchInstagramWithRapidAPI(cleanUrl);
            if (rapidApiInfo) {
                return res.json({
                    title: rapidApiInfo.title,
                    thumbnail: rapidApiInfo.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(rapidApiInfo.thumbnail)}` : null,
                    author: 'Instagram User',
                    duration: 0,
                    formats: rapidApiInfo.formats
                });
            }
        }

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

        // Extract video formats (with both video+audio in same stream if possible)
        let formats = [];

        if (info.formats) {
            // Filter for formats that have a URL and have BOTH video and audio!
            // Instagram high-quality (1080p) is often split. Facebook has varying formats.
            // Since we proxy the direct URL, we MUST pick a single file that contains both unless yt-dlp merges them (which we aren't doing natively on the fly).
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
        console.error('Error fetching info:', error.message || error);

        let errorMsg = 'Failed to fetch video info. Make sure the post is public and the URL is valid.';
        if (error.message && error.message.includes('Private')) {
            errorMsg = 'This post is private. Please use a public reel or post URL.';
        } else if (error.message && error.message.includes('login')) {
            errorMsg = 'This platform requires login for this content. Only public posts are supported.';
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

        if (!isSupportedUrl(url)) {
            return res.status(400).send('Only Instagram and Facebook URLs are supported');
        }

        let cleanUrl = url;
        let directUrl = null;
        let extension = 'mp4';
        let filesize = 0;
        let rawTitle = 'video_download';

        if (isInstagramUrl(url)) {
            cleanUrl = normalizeInstagramUrl(url);
            
            // Try RapidAPI first for Instagram
            const rapidApiInfo = await fetchInstagramWithRapidAPI(cleanUrl);
            if (rapidApiInfo && rapidApiInfo.directUrl) {
                directUrl = rapidApiInfo.directUrl;
                rawTitle = rapidApiInfo.title;
            }
        }

        if (!directUrl) {
            // Fetch info to get direct URL from yt-dlp
            const info = await youtubedl(cleanUrl, {
                dumpSingleJson: true,
                noWarnings: true,
                noCheckCertificate: true,
                format: itag && itag !== 'best' ? itag : 'best[vcodec!=none][acodec!=none]/best',
                addHeader: [
                    'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ],
            });

            if (itag && itag !== 'best' && info.formats) {
                const format = info.formats.find(f => f.format_id === itag);
                if (format && format.url) {
                    directUrl = format.url;
                    extension = format.ext || 'mp4';
                    filesize = format.filesize || format.filesize_approx || 0;
                }
            }

            if (!directUrl && info.url) {
                directUrl = info.url;
                extension = info.ext || 'mp4';
                filesize = info.filesize || info.filesize_approx || 0;
            }

            if (!directUrl) {
                return res.status(400).send('Could not find a direct download URL for this reel.');
            }
            
            rawTitle = info.title || info.fulltitle || 'video_download';
        }

        // Sanitize filename
        const filename = rawTitle.replace(/[^\w\s\-\.]/gi, '').trim() || 'video_download';

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
                'Referer': isFacebookUrl(url) ? 'https://www.facebook.com/' : 'https://www.instagram.com/',
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
            res.status(500).send('Failed to download the video. The post may be private or unavailable.');
        }
        res.end();
    }
});

// Proxy for thumbnails and other images to avoid Referer/CORS issues
app.get('/api/proxy-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send('URL required');

        const isFb = url.includes('fbcdn.net');

        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': isFb ? 'https://www.facebook.com/' : 'https://www.instagram.com/'
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
