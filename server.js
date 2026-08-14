const express = require('express');
const cors = require('cors');
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
    try {
        const u = new URL(url);
        return u.hostname.includes('instagram.com');
    } catch {
        return false;
    }
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

        if (!isInstagramUrl(url)) {
            return res.status(400).json({
                error: 'Only Instagram Reel/Post links are supported. Please paste a valid Instagram URL.'
            });
        }

        const cleanUrl = normalizeInstagramUrl(url);
        
        const rapidApiInfo = await fetchInstagramWithRapidAPI(cleanUrl);
        
        if (rapidApiInfo) {
            return res.json({
                title: rapidApiInfo.title,
                thumbnail: rapidApiInfo.thumbnail ? `/api/proxy-image?url=${encodeURIComponent(rapidApiInfo.thumbnail)}` : null,
                author: 'Instagram User',
                duration: 0,
                formats: rapidApiInfo.formats
            });
        } else {
            return res.status(500).json({ error: 'Failed to fetch video info. Please make sure your RapidAPI key is configured correctly.' });
        }

    } catch (error) {
        console.error('Error fetching info:', error.message || error);
        res.status(500).json({ error: 'Failed to fetch video info. Make sure the post is public and the URL is valid.' });
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
            
        const rapidApiInfo = await fetchInstagramWithRapidAPI(cleanUrl);
        
        if (!rapidApiInfo || !rapidApiInfo.directUrl) {
            return res.status(400).send('Could not find a direct download URL for this reel. Ensure RapidAPI key is set.');
        }

        const directUrl = rapidApiInfo.directUrl;
        const rawTitle = rapidApiInfo.title || 'video_download';
        const extension = 'mp4';

        // Sanitize filename
        const filename = rawTitle.replace(/[^\w\s\-\.]/gi, '').trim() || 'video_download';

        res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
        res.setHeader('Content-Type', 'video/mp4');

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

        if (proxyResponse.headers['content-length']) {
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
