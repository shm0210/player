// ============================
// INFINITY YouTube Player JS
// Fixed Version - No Auto-Show Issues
// ============================

// --- Element References ---
const videoLinkInput = document.getElementById('video-link');
const playButton = document.getElementById('play-button');
const youtubeIframe = document.getElementById('youtube-iframe');
const loadingElement = document.getElementById('loading');
const apiLoadingElement = document.getElementById('api-loading');
const errorMessageElement = document.getElementById('error-message');
const successMessageElement = document.getElementById('success-message');
const fullscreenButton = document.getElementById('fullscreen-button');
const resetButton = document.getElementById('reset-button');
const copyLinkButton = document.getElementById('copy-link');
const videoTitle = document.getElementById('video-title');
const videoChannel = document.getElementById('video-channel');
const videoDuration = document.getElementById('video-duration');
const videoViews = document.getElementById('video-views');
const videoThumbnail = document.getElementById('video-thumbnail');

// Menu Elements
const menuToggle = document.getElementById('menu-toggle');
const closeMenuButton = document.getElementById('close-menu');
const sidebar = document.getElementById('sidebar');
const menuOverlay = document.getElementById('menu-overlay');
const themeMenuToggle = document.getElementById('theme-menu-toggle');
const themeStatus = document.getElementById('theme-status');
const clearHistoryButton = document.getElementById('clear-history');
const shortcutsHelpButton = document.getElementById('shortcuts-help');
const aboutMenuButton = document.getElementById('about-menu');
const privacyMenuButton = document.getElementById('privacy-menu');
const termsMenuButton = document.getElementById('terms-menu');
const contactMenuButton = document.getElementById('contact-menu');
const menuHistory = document.getElementById('menu-history');

// Modal Elements
const infoModal = document.getElementById('info-modal');
const shortcutsModal = document.getElementById('shortcuts-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const closeModalButtons = document.querySelectorAll('.close-modal');

// --- State Variables ---
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentVideoId = null;
let currentVideoData = null;
let wakeLock = null;
let isMenuOpen = false;

// --- YouTube API Integration ---
let ytAPILoaded = false;

// Check if YouTube API is already loaded
if (window.YT && window.YT.loaded) {
    ytAPILoaded = true;
    console.log("✅ YouTube API already loaded");
} else {
    // Create callback for when API loads
    window.onYouTubeIframeAPIReady = function() {
        ytAPILoaded = true;
        console.log("✅ YouTube API Ready");
    };
}

// --- Theme Management ---
function initTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeStatus.textContent = isDarkMode ? "Dark" : "Light";
    
    // Update theme toggle icon
    const icon = themeMenuToggle.querySelector('i');
    icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    initTheme();
    showSuccess(isDarkMode ? "🌙 Dark theme enabled" : "☀️ Light theme enabled");
}

// --- Menu System (FIXED) ---
function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    
    if (isMenuOpen) {
        // Show menu
        sidebar.style.display = 'flex';
        menuOverlay.style.display = 'block';
        
        // Trigger animation
        setTimeout(() => {
            sidebar.classList.add('show');
            menuOverlay.classList.add('show');
            menuToggle.classList.add('open');
        }, 10);
        
        updateMenuHistory();
        menuToggle.innerHTML = '<i class="fas fa-times"></i>';
        menuToggle.setAttribute('aria-label', 'Close Menu');
        menuToggle.style.transform = 'rotate(90deg)';
        
        checkNewVideosInHistory();
    } else {
        // Hide menu
        sidebar.classList.remove('show');
        menuOverlay.classList.remove('show');
        menuToggle.classList.remove('open');
        
        setTimeout(() => {
            sidebar.style.display = 'none';
            menuOverlay.style.display = 'none';
        }, 300);
        
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Open Menu');
        menuToggle.style.transform = 'rotate(0deg)';
    }
    
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
}

function closeMenu() {
    if (isMenuOpen) {
        isMenuOpen = false;
        sidebar.classList.remove('show');
        menuOverlay.classList.remove('show');
        menuToggle.classList.remove('open');
        
        setTimeout(() => {
            sidebar.style.display = 'none';
            menuOverlay.style.display = 'none';
        }, 300);
        
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Open Menu');
        menuToggle.style.transform = 'rotate(0deg)';
        document.body.style.overflow = '';
    }
}

function checkNewVideosInHistory() {
    const lastOpenTime = localStorage.getItem('lastMenuOpen');
    const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
    
    if (!lastOpenTime) {
        localStorage.setItem('lastMenuOpen', new Date().toISOString());
        return;
    }
    
    const newVideos = history.filter(video => 
        new Date(video.timestamp) > new Date(lastOpenTime)
    ).length;
    
    if (newVideos > 0) {
        showSuccess(`📹 ${newVideos} new video${newVideos > 1 ? 's' : ''} in history`);
    }
    
    localStorage.setItem('lastMenuOpen', new Date().toISOString());
}

// --- Video Metadata Fetching ---
async function fetchVideoMetadata(videoId) {
    if (!videoId) return;
    
    try {
        apiLoadingElement.style.display = 'flex';
        
        // Try to get from cache first
        const cachedData = getCachedVideoData(videoId);
        if (cachedData) {
            updateVideoInfoUI(cachedData);
            apiLoadingElement.style.display = 'none';
            return;
        }
        
        // Fetch from YouTube oEmbed API (no API key needed)
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch video info');
        }
        
        const data = await response.json();
        
        // Create video data object
        const videoData = {
            id: videoId,
            title: data.title,
            author: data.author_name,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            thumbnail_small: `https://img.youtube.com/vi/${videoId}/default.jpg`,
            duration: null,
            views: null
        };
        
        // Cache the data
        cacheVideoData(videoId, videoData);
        
        // Update UI
        updateVideoInfoUI(videoData);
        
        // Try to fetch duration using alternative method
        await fetchVideoDuration(videoId);
        
    } catch (error) {
        console.error("Error fetching video metadata:", error);
        updateVideoInfoUI({
            title: "Video loaded",
            author: "YouTube",
            thumbnail: "",
            duration: "N/A",
            views: "N/A"
        });
    } finally {
        apiLoadingElement.style.display = 'none';
    }
}

async function fetchVideoDuration(videoId) {
    try {
        // Fallback method using noembed
        const response = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.duration) {
                // Update cached data
                updateCachedVideoDuration(videoId, data.duration);
                
                // Update UI
                videoDuration.textContent = formatDuration(data.duration);
            }
        }
    } catch (error) {
        console.log("Could not fetch duration:", error);
    }
}

function updateVideoInfoUI(videoData) {
    currentVideoData = videoData;
    
    // Update title
    videoTitle.textContent = videoData.title || "Video loaded";
    
    // Update channel
    videoChannel.textContent = videoData.author || "YouTube";
    
    // Update thumbnail
    if (videoData.thumbnail) {
        videoThumbnail.innerHTML = `<img src="${videoData.thumbnail}" alt="${videoData.title}" loading="lazy">`;
    } else {
        videoThumbnail.innerHTML = '<i class="fas fa-play"></i>';
    }
    
    // Update duration if available
    if (videoData.duration) {
        videoDuration.textContent = formatDuration(videoData.duration);
    } else {
        videoDuration.textContent = "Loading...";
    }
    
    // Update views if available
    if (videoData.views) {
        videoViews.textContent = formatViews(videoData.views);
    } else {
        videoViews.textContent = "Loading views...";
    }
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (!views) return "0 views";
    
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M views';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K views';
    }
    return views.toLocaleString() + ' views';
}

// --- Cache Management ---
function cacheVideoData(videoId, data) {
    try {
        const cache = JSON.parse(localStorage.getItem('videoCache') || '{}');
        cache[videoId] = {
            ...data,
            cachedAt: new Date().toISOString()
        };
        
        // Keep only last 50 cached items
        const keys = Object.keys(cache);
        if (keys.length > 50) {
            delete cache[keys[0]];
        }
        
        localStorage.setItem('videoCache', JSON.stringify(cache));
    } catch (error) {
        console.error("Error caching video data:", error);
    }
}

function getCachedVideoData(videoId) {
    try {
        const cache = JSON.parse(localStorage.getItem('videoCache') || '{}');
        const cached = cache[videoId];
        
        // Check if cache is less than 24 hours old
        if (cached && new Date(cached.cachedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return cached;
        }
    } catch (error) {
        console.error("Error reading cache:", error);
    }
    return null;
}

function updateCachedVideoDuration(videoId, duration) {
    try {
        const cache = JSON.parse(localStorage.getItem('videoCache') || '{}');
        if (cache[videoId]) {
            cache[videoId].duration = duration;
            localStorage.setItem('videoCache', JSON.stringify(cache));
        }
    } catch (error) {
        console.error("Error updating cache:", error);
    }
}

// --- Menu History Management ---
function updateMenuHistory() {
    const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
    menuHistory.innerHTML = '';
    
    if (history.length === 0) {
        menuHistory.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent videos yet</p>
            </div>
        `;
        return;
    }
    
    // Show only last 10 videos
    history.slice(0, 10).forEach((item) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item-menu';
        historyItem.innerHTML = `
            <div class="history-thumb">
                ${item.thumbnail ? 
                    `<img src="${item.thumbnail}" alt="${item.title}" loading="lazy">` :
                    `<div style="background: linear-gradient(45deg, #00e0ff, #00c4ff); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-play" style="color: #000;"></i>
                    </div>`
                }
            </div>
            <div class="history-details">
                <div class="history-title">${item.title || 'Unknown Video'}</div>
                <div class="history-time">${formatTimeAgo(item.timestamp)}</div>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            videoLinkInput.value = item.url;
            loadVideo();
            closeMenu();
        });
        
        menuHistory.appendChild(historyItem);
    });
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
}

// --- Status Handlers ---
function showError(message) {
    errorMessageElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorMessageElement.style.display = 'block';
    setTimeout(() => (errorMessageElement.style.display = 'none'), 5000);
}

function showSuccess(message) {
    successMessageElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    successMessageElement.style.display = 'block';
    setTimeout(() => (successMessageElement.style.display = 'none'), 3000);
}

// --- Video Handling ---
function getYouTubeVideoId(url) {
    const patterns = [
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^&\n?#]+)/,
        /youtube\.com\/playlist\?list=([^&\n?#]+)/,
        /youtube\.com\/watch\?v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function isYouTubeLink(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

async function loadVideo() {
    const link = videoLinkInput.value.trim();
    if (!link) {
        showError("Please enter a YouTube link");
        return;
    }
    
    if (!isYouTubeLink(link)) {
        showError("Only YouTube links are supported");
        return;
    }

    const videoId = getYouTubeVideoId(link);
    if (!videoId) {
        showError("Invalid YouTube URL");
        return;
    }

    currentVideoId = videoId;
    loadingElement.style.display = 'flex';
    
    // Reset video info while loading
    videoTitle.textContent = "Loading...";
    videoChannel.textContent = "YouTube";
    videoDuration.textContent = "0:00";
    videoViews.textContent = "0 views";
    videoThumbnail.innerHTML = '<div class="loading-spinner" style="width: 30px; height: 30px;"></div>';
    
    try {
        // Save to history first
        await saveToHistory(videoId, link);
        
        // Update menu history in real-time
        updateMenuHistory();
        
        // Fetch video metadata
        await fetchVideoMetadata(videoId);
        
        // Load the video using nocookie domain
        const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;
        youtubeIframe.src = embedUrl;
        
        showSuccess("🎬 Video loaded successfully");
        requestWakeLock();
        
        // Add notification animation to menu toggle
        menuToggle.classList.add('has-notification');
        setTimeout(() => {
            menuToggle.classList.remove('has-notification');
        }, 3000);
        
    } catch (error) {
        showError("Failed to load video");
        console.error(error);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// --- History Management ---
async function saveToHistory(videoId, url) {
    try {
        const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
        
        // Check if already exists
        const existingIndex = history.findIndex(item => item.id === videoId);
        if (existingIndex > -1) {
            // Move to top if exists
            const existingItem = history.splice(existingIndex, 1)[0];
            existingItem.timestamp = new Date().toISOString();
            history.unshift(existingItem);
        } else {
            // Add new with thumbnail
            history.unshift({
                id: videoId,
                url: url,
                title: "Loading...",
                thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Keep only last 20 items
        if (history.length > 20) {
            history.length = 20;
        }
        
        localStorage.setItem('videoHistory', JSON.stringify(history));
        
        // Update title in history after metadata fetch
        if (currentVideoData) {
            setTimeout(() => {
                updateHistoryItemTitle(videoId, currentVideoData.title);
            }, 1000);
        }
        
    } catch (error) {
        console.error("Failed to save history:", error);
    }
}

function updateHistoryItemTitle(videoId, title) {
    try {
        const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
        const itemIndex = history.findIndex(item => item.id === videoId);
        
        if (itemIndex > -1) {
            history[itemIndex].title = title;
            localStorage.setItem('videoHistory', JSON.stringify(history));
            
            // Update menu if open
            if (isMenuOpen) {
                updateMenuHistory();
            }
        }
    } catch (error) {
        console.error("Failed to update history title:", error);
    }
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all video history?")) {
        localStorage.removeItem('videoHistory');
        updateMenuHistory();
        showSuccess("🗑️ History cleared successfully");
    }
}

// --- Copy Link Function ---
async function copyVideoLink() {
    if (!currentVideoId) {
        showError("No video loaded");
        return;
    }
    
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;
        await navigator.clipboard.writeText(videoUrl);
        showSuccess("🔗 Video link copied to clipboard");
    } catch (error) {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess("🔗 Link copied!");
    }
}

// --- Wake Lock ---
async function requestWakeLock() {
    if ('wakeLock' in navigator && !wakeLock) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("✅ Wake Lock activated");
            
            wakeLock.addEventListener('release', () => {
                console.log("⚠️ Wake Lock released");
                wakeLock = null;
            });
            
        } catch (err) {
            console.warn(`Wake Lock failed: ${err.message}`);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// --- Keyboard Shortcuts ---
function handleKeyboardShortcuts(event) {
    // Don't trigger shortcuts when typing in input
    if (event.target.tagName === 'INPUT' || event.target.isContentEditable) {
        return;
    }
    
    switch (event.key.toLowerCase()) {
        case 'm': // M for Menu
            event.preventDefault();
            toggleMenu();
            break;
        case 'f': // F for Fullscreen
            event.preventDefault();
            toggleFullscreen();
            break;
        case 'r': // R for Reset
            event.preventDefault();
            resetPlayer();
            break;
        case 't': // T for Theme
            event.preventDefault();
            toggleTheme();
            break;
        case 'c': // C for Copy
            event.preventDefault();
            copyVideoLink();
            break;
        case 'enter': // Enter to play
            if (document.activeElement !== videoLinkInput) {
                event.preventDefault();
                loadVideo();
            }
            break;
        case '/': // / to focus search
            event.preventDefault();
            if (!isMenuOpen) {
                videoLinkInput.focus();
                videoLinkInput.select();
            }
            break;
        case 'h': // H for History
            event.preventDefault();
            if (!isMenuOpen) {
                toggleMenu();
            }
            break;
        case 'escape': // ESC to close
            event.preventDefault();
            if (isMenuOpen) {
                closeMenu();
            } else if (infoModal.classList.contains('show') || shortcutsModal.classList.contains('show')) {
                closeModals();
            } else if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            break;
    }
}

// --- Fullscreen ---
function toggleFullscreen() {
    if (!currentVideoId) {
        showError("Load a video first");
        return;
    }
    
    if (!document.fullscreenElement) {
        const elem = youtubeIframe;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

// --- Reset Player ---
function resetPlayer() {
    youtubeIframe.src = '';
    videoLinkInput.value = '';
    currentVideoId = null;
    currentVideoData = null;
    
    // Reset video info
    videoTitle.textContent = "No video loaded";
    videoChannel.textContent = "YouTube";
    videoDuration.textContent = "0:00";
    videoViews.textContent = "0 views";
    videoThumbnail.innerHTML = '<i class="fas fa-play"></i>';
    
    releaseWakeLock();
    showSuccess("🔄 Player reset");
}

// --- Modal System ---
function showModal(title, content) {
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    infoModal.classList.add('show');
}

function closeModals() {
    infoModal.classList.remove('show');
    shortcutsModal.classList.remove('show');
}

// --- Modal Content ---
const modalContents = {
    about: `
        <div class="modal-section">
            <h4><i class="fas fa-infinity"></i> About INFINITY Player</h4>
            <p>A privacy-focused YouTube player designed for distraction-free viewing experience.</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-star"></i> Features</h4>
            <ul>
                <li><strong>Privacy First:</strong> Uses YouTube's nocookie domain</li>
                <li><strong>Clean Interface:</strong> Minimal design, no distractions</li>
                <li><strong>Video History:</strong> Track your recent videos</li>
                <li><strong>Smart Menu:</strong> Quick access to all features</li>
                <li><strong>Keyboard Shortcuts:</strong> Faster navigation</li>
                <li><strong>Themes:</strong> Dark/Light mode support</li>
                <li><strong>Video Info:</strong> Real-time metadata display</li>
                <li><strong>Wake Lock:</strong> Screen stays on during playback</li>
            </ul>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-code"></i> Technology</h4>
            <p>Built with modern web technologies:</p>
            <div class="tech-tags">
                <span>HTML5</span>
                <span>CSS3</span>
                <span>JavaScript</span>
                <span>YouTube API</span>
                <span>LocalStorage</span>
                <span>Wake Lock API</span>
            </div>
        </div>
        
        <div class="modal-signature">
            <p>Crafted with ❤️ by Shubham</p>
            <p class="version">v2.0 • Enhanced Edition</p>
        </div>
    `,
    
    privacy: `
        <div class="modal-section">
            <h4><i class="fas fa-shield-alt"></i> Privacy Information</h4>
            <p>Your privacy is our priority. Here's how we handle your data:</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-ban"></i> What We DON'T Collect</h4>
            <ul>
                <li><strong>No Personal Data:</strong> We don't collect names, emails, or personal info</li>
                <li><strong>No Tracking:</strong> No cookies, analytics, or tracking scripts</li>
                <li><strong>No History Sharing:</strong> Your watch history stays on your device</li>
                <li><strong>No IP Logging:</strong> We don't store IP addresses or location data</li>
            </ul>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-database"></i> What We Store Locally</h4>
            <ul>
                <li><strong>Video History:</strong> Last 20 videos (browser storage only)</li>
                <li><strong>Theme Preference:</strong> Your dark/light mode choice</li>
                <li><strong>Video Cache:</strong> Temporary video metadata (24 hours)</li>
            </ul>
            <p class="note">All data is stored locally in your browser and never sent to any server.</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fab fa-youtube"></i> YouTube Integration</h4>
            <p>Videos load from <code>youtube-nocookie.com</code> which:</p>
            <ul>
                <li>Doesn't set tracking cookies until you interact</li>
                <li>Respects YouTube's privacy settings</li>
                <li>Follows Google's privacy guidelines</li>
            </ul>
        </div>
    `,
    
    terms: `
        <div class="modal-section">
            <h4><i class="fas fa-file-contract"></i> Terms of Use</h4>
            <p>By using INFINITY YouTube Player, you agree to these terms:</p>
        </div>
        
        <div class="modal-section">
            <h4><i class="fab fa-youtube"></i> YouTube Compliance</h4>
            <ul>
                <li>This is a third-party YouTube viewer using official embeds</li>
                <li>All videos are served directly from YouTube's servers</li>
                <li>You must comply with <a href="https://www.youtube.com/t/terms" target="_blank">YouTube's Terms of Service</a></li>
                <li>Some videos may be restricted by uploaders from embedding</li>
            </ul>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-exclamation-triangle"></i> Usage Restrictions</h4>
            <ul>
                <li><strong>Personal Use Only:</strong> For individual, non-commercial use</li>
                <li><strong>No Bypassing:</strong> Do not use to bypass age or region restrictions</li>
                <li><strong>Legal Content Only:</strong> Only watch legally available content</li>
                <li><strong>No Abuse:</strong> Do not overload or abuse the service</li>
            </ul>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-balance-scale"></i> Legal Disclaimer</h4>
            <p>INFINITY Player is an independent project and is not affiliated with YouTube, Google, or Alphabet Inc.</p>
            <p>The service is provided "as is" without warranties. We are not responsible for:</p>
            <ul>
                <li>Content availability or restrictions</li>
                <li>YouTube policy changes</li>
                <li>Video takedowns or copyright issues</li>
                <li>Browser compatibility issues</li>
            </ul>
        </div>
    `,
    
    contact: `
        <div class="modal-section">
            <h4><i class="fas fa-address-card"></i> Contact Information</h4>
        </div>
        
        <div class="contact-cards">
            <div class="contact-card">
                <div class="contact-icon">
                    <i class="fas fa-user"></i>
                </div>
                <h5>Developer</h5>
                <p>Shubham</p>
            </div>
            
            <div class="contact-card">
                <div class="contact-icon">
                    <i class="fab fa-instagram"></i>
                </div>
                <h5>Instagram</h5>
                <a href="https://www.instagram.com/i.shubham0210/" target="_blank">
                    @i.shubham0210
                </a>
            </div>
            
            <div class="contact-card">
                <div class="contact-icon">
                    <i class="fas fa-code"></i>
                </div>
                <h5>GitHub</h5>
                <a href="https://github.com/" target="_blank">
                    View Projects
                </a>
            </div>
        </div>
        
        <div class="modal-section">
            <h4><i class="fas fa-life-ring"></i> Support & Feedback</h4>
            <ul>
                <li><strong>Bug Reports:</strong> DM on Instagram with details</li>
                <li><strong>Feature Requests:</strong> We welcome suggestions</li>
                <li><strong>Questions:</strong> Feel free to reach out</li>
                <li><strong>Feedback:</strong> Helps improve the player</li>
            </ul>
        </div>
        
        <div class="modal-section">
            <p class="thank-you">Thank you for using INFINITY Player! 🙏</p>
        </div>
    `
};

// --- Event Listeners ---
function initializeEventListeners() {
    // Initialize theme
    initTheme();
    
    // Theme toggle
    themeMenuToggle.addEventListener('click', toggleTheme);
    
    // Video loading
    playButton.addEventListener('click', loadVideo);
    videoLinkInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') loadVideo();
    });
    
    // Menu system
    menuToggle.addEventListener('click', toggleMenu);
    closeMenuButton.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
    
    // Menu buttons
    clearHistoryButton.addEventListener('click', clearHistory);
    shortcutsHelpButton.addEventListener('click', () => {
        shortcutsModal.classList.add('show');
        closeMenu();
    });
    
    // Info menu buttons
    aboutMenuButton.addEventListener('click', () => {
        showModal('About INFINITY Player', modalContents.about);
        closeMenu();
    });
    
    privacyMenuButton.addEventListener('click', () => {
        showModal('Privacy Information', modalContents.privacy);
        closeMenu();
    });
    
    termsMenuButton.addEventListener('click', () => {
        showModal('Terms of Use', modalContents.terms);
        closeMenu();
    });
    
    contactMenuButton.addEventListener('click', () => {
        showModal('Contact & Support', modalContents.contact);
        closeMenu();
    });
    
    // Main controls
    fullscreenButton.addEventListener('click', toggleFullscreen);
    resetButton.addEventListener('click', resetPlayer);
    copyLinkButton.addEventListener('click', copyVideoLink);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Modal controls
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    [infoModal, shortcutsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
    
    // Wake lock release
    window.addEventListener('beforeunload', releaseWakeLock);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            releaseWakeLock();
        }
    });
    
    // Auto-focus input on page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            videoLinkInput.focus();
        }, 500);
    });
}

// --- Particles Background ---
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { 
                    value: window.innerWidth < 768 ? 25 : 40,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: '#00e0ff' },
                opacity: { value: 0.2, random: true },
                size: { value: 2, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#00e0ff',
                    opacity: 0.1,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 0.5,
                    direction: 'none',
                    random: true
                }
            },
            interactivity: {
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
}

// --- Auto-load from URL ---
function autoLoadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('v') || params.get('video') || params.get('url');
    if (videoParam && isYouTubeLink(videoParam)) {
        const decodedUrl = decodeURIComponent(videoParam);
        videoLinkInput.value = decodedUrl;
        
        // Small delay to ensure everything is loaded
        setTimeout(() => {
            loadVideo();
        }, 1000);
    }
}

// --- Initialization ---
function init() {
    initializeEventListeners();
    initParticles();
    updateMenuHistory();
    
    // Make sure menu starts closed
    closeMenu();
    
    autoLoadFromURL();
    
    console.log("🎬 INFINITY Player v2.0 initialized");
    console.log("📹 Features: YouTube API, Video Metadata, Enhanced Menu, Real-time Info");
    console.log("🎨 Theme: " + (isDarkMode ? "Dark" : "Light"));
    console.log("💾 History Items: " + (JSON.parse(localStorage.getItem('videoHistory') || '[]').length));
    console.log("✅ Menu: Closed by default");
}

// Start the application
init();
