document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('video-url');
    const fetchBtn = document.getElementById('fetch-btn');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const resultContainer = document.getElementById('result-container');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoAuthor = document.getElementById('video-author');
    const durationBadge = document.getElementById('duration-badge');
    const formatList = document.getElementById('format-list');
    const tcModal = document.getElementById('tc-modal');
    const acceptBtn = document.getElementById('accept-tc');

    const API_BASE = '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        if (!url) return;

        // Basic client-side Instagram URL check
        if (!url.includes('instagram.com')) {
            showError('Please paste a valid Instagram URL (e.g. instagram.com/reel/...)');
            return;
        }

        resetUI();
        loader.classList.remove('hidden');
        fetchBtn.disabled = true;
        fetchBtn.style.opacity = '0.65';

        try {
            const response = await fetch(`${API_BASE}/api/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch reel details.');
            }

            renderResult(data, url);

        } catch (err) {
            if (err.message === 'Failed to fetch') {
                showError('Cannot connect to server. Make sure the backend (server.js) is running on port 5000.');
            } else {
                showError(err.message);
            }
        } finally {
            loader.classList.add('hidden');
            fetchBtn.disabled = false;
            fetchBtn.style.opacity = '1';
        }
    });
});

// ── Reset UI ─────────────────────────────────────────────────────────
function resetUI() {
    errorMsg.classList.add('hidden');
    resultContainer.classList.add('hidden');
    formatList.innerHTML = '';
}

// ── Show Error ────────────────────────────────────────────────────────
function showError(message) {
    errorText.textContent = message;
    errorMsg.classList.remove('hidden');
    errorMsg.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(0)' }
    ], { duration: 400, easing: 'ease-in-out' });
}

// ── Format Duration ───────────────────────────────────────────────────
function formatDuration(seconds) {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Render Result ─────────────────────────────────────────────────────
function renderResult(data, url) {
    // Thumbnail
    let thumbUrl = data.thumbnail || 'https://via.placeholder.com/400x700/1a1a2e/e1306c?text=No+Preview';
    // Prefix with API_BASE if it's a relative API route
    if (thumbUrl.startsWith('/')) {
        thumbUrl = `${API_BASE}${thumbUrl}`;
    }

    videoThumbnail.src = thumbUrl;
    videoThumbnail.onerror = () => {
        videoThumbnail.src = 'https://via.placeholder.com/400x700/1a1a2e/e1306c?text=No+Preview';
    };

    // Title
    videoTitle.textContent = data.title || 'Instagram Reel';

    // Author
    const authorName = data.author || 'Instagram User';
    videoAuthor.textContent = authorName.startsWith('@') ? authorName : `@${authorName}`;

    // Duration badge
    const dur = formatDuration(data.duration);
    if (dur) {
        durationBadge.textContent = dur;
        durationBadge.style.display = 'block';
    } else {
        durationBadge.style.display = 'none';
    }

    // Formats
    formatList.innerHTML = '';

    if (data.formats && data.formats.length > 0) {
        data.formats.forEach(format => {
            formatList.appendChild(createFormatItem(format, url));
        });
    } else {
        // Always show at least a "Best Quality" button
        const fallback = {
            itag: 'best',
            qualityLabel: 'Best Quality',
            container: 'mp4',
            contentLength: 'Auto',
            type: 'video'
        };
        formatList.appendChild(createFormatItem(fallback, url));
    }

    resultContainer.classList.remove('hidden');
    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// ── Create Format Item ────────────────────────────────────────────────
function createFormatItem(format, url) {
    const item = document.createElement('div');
    item.className = 'format-item';

    // Info section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'format-info';

    const badge = document.createElement('span');
    badge.className = 'quality-badge';
    badge.innerHTML = `<i class="fa-solid fa-film"></i> ${format.qualityLabel || 'Best Quality'}`;

    const meta = document.createElement('div');
    meta.className = 'format-meta';
    meta.innerHTML = `
            <span>${(format.container || 'mp4').toUpperCase()}</span>
            <span class="sep">•</span>
            <span>${format.contentLength || 'Auto'}</span>
        `;

    infoDiv.appendChild(badge);
    infoDiv.appendChild(meta);

    // Download button
    const dlBtn = document.createElement('a');
    dlBtn.className = 'download-btn';
    dlBtn.href = `${API_BASE}/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}`;
    dlBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download';
    dlBtn.setAttribute('data-downloading', 'false');

    // Progress bar
    const progressWrap = document.createElement('div');
    progressWrap.className = 'progress-wrap hidden';
    progressWrap.innerHTML = `
            <div class="progress-track"><div class="progress-fill"></div></div>
            <span class="progress-label">Starting...</span>
        `;

    // Download click handler
    dlBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (dlBtn.getAttribute('data-downloading') === 'true') return;

        dlBtn.setAttribute('data-downloading', 'true');
        const originalHTML = dlBtn.innerHTML;
        dlBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';
        dlBtn.style.opacity = '0.7';
        dlBtn.style.pointerEvents = 'none';

        progressWrap.classList.remove('hidden');
        const fill = progressWrap.querySelector('.progress-fill');
        const label = progressWrap.querySelector('.progress-label');
        fill.style.width = '0%';
        label.textContent = 'Connecting...';

        try {
            const resp = await fetch(dlBtn.href.replace(dlBtn.innerHTML, '') || `${API_BASE}/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}`);

            if (!resp.ok) {
                throw new Error(`Server error: ${resp.status}`);
            }

            // Try to extract filename from Content-Disposition header
            let filename = 'instagram_reel.mp4';
            const disposition = resp.headers.get('Content-Disposition');
            if (disposition && disposition.includes('filename="')) {
                const match = disposition.match(/filename="(.+?)"/);
                if (match && match[1]) filename = match[1];
            }

            const contentLength = resp.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            const reader = resp.body.getReader();
            const chunks = [];
            let received = 0;

            label.textContent = 'Downloading...';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;

                if (total) {
                    const pct = ((received / total) * 100).toFixed(0);
                    fill.style.width = `${pct}%`;
                    label.textContent = `${pct}%`;
                } else {
                    const mb = (received / (1024 * 1024)).toFixed(1);
                    label.textContent = `${mb} MB downloaded`;
                    // Animate indeterminate
                    fill.style.width = '80%';
                }
            }

            label.textContent = 'Saving file...';
            fill.style.width = '100%';

            // Concatenate chunks
            const total_bytes = chunks.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(total_bytes);
            let offset = 0;
            for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }

            // Trigger browser download
            const blob = new Blob([merged], { type: 'video/mp4' });
            const blobUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.style.display = 'none';
            anchor.href = blobUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            setTimeout(() => {
                document.body.removeChild(anchor);
                URL.revokeObjectURL(blobUrl);
            }, 1500);

            // Success state
            dlBtn.innerHTML = '<i class="fa-solid fa-check"></i> Done!';
            dlBtn.style.opacity = '1';
            label.textContent = 'Download complete!';

        } catch (err) {
            console.error('Download failed:', err);
            showError('Download failed. The reel may be private or unavailable.');
            progressWrap.classList.add('hidden');
            dlBtn.innerHTML = originalHTML;
            dlBtn.style.opacity = '1';
            dlBtn.style.pointerEvents = 'auto';
        } finally {
            dlBtn.setAttribute('data-downloading', 'false');
            dlBtn.style.pointerEvents = 'auto';
            setTimeout(() => {
                if (dlBtn.innerHTML.includes('fa-check')) {
                    dlBtn.innerHTML = originalHTML;
                }
                dlBtn.style.opacity = '1';
                setTimeout(() => progressWrap.classList.add('hidden'), 2500);
            }, 3500);
        }
    });

    // Fix the href issue (it was using innerHTML by mistake inside the handler)
    dlBtn.href = `${API_BASE}/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}`;

    // Assemble
    item.appendChild(infoDiv);
    item.appendChild(dlBtn);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:0;';
    wrapper.appendChild(item);
    wrapper.appendChild(progressWrap);

    return wrapper;
}

// ── T&C Modal Logic ──
function initTCModal() {
    if (!tcModal) return;

    const currentPath = window.location.pathname;
    const policyPages = ['/privacy.html', '/terms.html', '/disclaimer.html', '/about.html', '/contact.html', '/cookies.html'];
    const isPolicyPage = policyPages.some(page => currentPath.endsWith(page));

    // Get current user email (Mock function - replace with real auth if available)
    const getCurrentUserEmail = () => {
        // In a real app, this would come from your auth provider (Google, Firebase, etc.)
        return localStorage.getItem('user_email') || 'guest@instadown.app';
    };

    const userEmail = getCurrentUserEmail();
    const lastAcceptedEmail = localStorage.getItem('tc_accepted_email');
    const isAccepted = localStorage.getItem('tc_accepted') === 'true';

    // 1. If we are on a policy page, don't show the popup (as requested)
    if (isPolicyPage) {
        tcModal.classList.remove('active');
        return;
    }

    // 2. Logic: Show if not accepted in CURRENT session
    // Session storage survives reloads and back buttons but clears when the tab/window is closed.
    // This solves "footer links pe back karne pe popup dikhne" issue.
    const isAcceptedInSession = sessionStorage.getItem('tc_accepted_session') === 'true';

    // Show if not accepted in this session, OR if user email changed from last time
    if (!isAcceptedInSession || (userEmail && userEmail !== lastAcceptedEmail)) {
        setTimeout(() => {
            tcModal.classList.add('active');
        }, 1000);
    }

    acceptBtn.addEventListener('click', () => {
        // Save to session and local storage
        sessionStorage.setItem('tc_accepted_session', 'true');
        localStorage.setItem('tc_accepted', 'true');
        localStorage.setItem('tc_accepted_email', userEmail);
        tcModal.classList.remove('active');

        if (window.trackEvent) {
            trackEvent('accept_terms', { user_email: userEmail });
        }
    });

    // Detect potential email changes/login (calls from auth logic)
    window.onUserLogin = (newEmail) => {
        localStorage.setItem('user_email', newEmail);
        // On login, we FORCE re-acceptance by clearing the session flag
        sessionStorage.removeItem('tc_accepted_session');
        if (newEmail !== lastAcceptedEmail || !lastAcceptedEmail) {
            tcModal.classList.add('active');
        } else {
            // Even if same email, if user explicitly asked to show on "same gmail login"
            tcModal.classList.add('active');
        }
    };
}

initTCModal();
});
