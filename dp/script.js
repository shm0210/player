// ===== DOM Elements =====
const videoLinkInput = document.getElementById('video-link');
const playButton = document.getElementById('play-button');
const videoPlayer = document.getElementById('video-player');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const successMessageElement = document.getElementById('success-message');
const fullscreenButton = document.getElementById('fullscreen-button');
const resetButton = document.getElementById('reset-button');
const themeToggle = document.getElementById('theme-toggle');
const progressBar = document.getElementById('progress-bar');
const backwardBtn = document.getElementById('backward-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const forwardBtn = document.getElementById('forward-btn');
const timeDisplay = document.getElementById('time-display');
const shareBtn = document.getElementById('share-btn');
const aboutToggle = document.getElementById('about-toggle');
const aboutContent = document.getElementById('about-content');

let isDarkMode = localStorage.getItem('darkMode') === 'true';
let hls = null;

// ===== Theme Handling =====
function initTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Theme';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙 Theme';
    }
}
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    initTheme();
}
document.addEventListener('DOMContentLoaded', initTheme);
themeToggle.addEventListener('click', toggleTheme);

// ===== Messages =====
function showError(msg) {
    errorMessageElement.textContent = msg;
    errorMessageElement.style.display = 'block';
    setTimeout(() => errorMessageElement.style.display = 'none', 4000);
}
function showSuccess(msg) {
    successMessageElement.textContent = msg;
    successMessageElement.style.display = 'block';
    setTimeout(() => successMessageElement.style.display = 'none', 2500);
}

// ===== Format Time =====
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
  ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  : `${m}:${s.toString().padStart(2, '0')}`;
}

// ===== Load Video =====
function loadVideo(url) {
    const link = url || videoLinkInput.value.trim();
    if (!link) return showError("Please enter a video URL");

    loadingElement.style.display = 'block';
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    if (hls) { hls.destroy(); hls = null; }

    setTimeout(() => {
        if (link.endsWith('.m3u8') && Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(link);
            hls.attachMedia(videoPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoPlayer.play();
                loadingElement.style.display = 'none';
                showSuccess("HLS stream loaded successfully");
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                loadingElement.style.display = 'none';
                showError("Failed to load HLS stream");
                console.error(data);
            });
        } else {
            videoPlayer.src = link;
            videoPlayer.load();
            videoPlayer.play().then(() => {
                loadingElement.style.display = 'none';
                showSuccess("Video loaded successfully");
            }).catch(() => {
                loadingElement.style.display = 'none';
                showError("Cannot play this video. Check URL or format");
            });
        }
    }, 500);
}

playButton.addEventListener('click', () => loadVideo());
videoLinkInput.addEventListener('keypress', e => { if (e.key==='Enter') loadVideo(); });

// ===== Fullscreen =====
fullscreenButton.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else videoPlayer.requestFullscreen().catch(() => showError("Fullscreen not supported"));
});

// ===== Reset =====
resetButton.addEventListener('click', () => {
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoLinkInput.value = '';
    if(hls) { hls.destroy(); hls=null; }
    showSuccess("Player reset");
});

// ===== Seek Function =====
function seek(seconds) {
    if (videoPlayer.duration) {
        videoPlayer.currentTime = Math.max(0, Math.min(videoPlayer.currentTime + seconds, videoPlayer.duration));
    }
}

// ===== Toggle Mute Function =====
function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    showSuccess(videoPlayer.muted ? "Muted" : "Unmuted");
}

// ===== Play/Pause Function =====
function togglePlayPause() {
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

// ===== Player Controls Event Listeners =====
playPauseBtn.addEventListener('click', togglePlayPause);
backwardBtn.addEventListener('click', () => seek(-10));
forwardBtn.addEventListener('click', () => seek(10));

// ===== Video Loaded Metadata =====
videoPlayer.addEventListener('loadedmetadata', () => {
    progressBar.value = 0;
    timeDisplay.textContent = `00:00 / ${formatTime(videoPlayer.duration)}`;
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', e => {
    // Prevent default behavior for these keys
    if (['Space', 'ArrowLeft', 'ArrowRight', 'KeyM'].includes(e.code)) {
        e.preventDefault();
    }
    
    switch(e.code){
        case 'Enter': 
            if (document.activeElement !== videoLinkInput) {
                loadVideo(); 
            }
            break;
        case 'KeyF': fullscreenButton.click(); break;
        case 'KeyR': resetButton.click(); break;
        case 'KeyT': toggleTheme(); break;
        case 'Space': togglePlayPause(); break;
        case 'ArrowLeft': seek(-10); break;
        case 'ArrowRight': seek(10); break;
        case 'KeyM': toggleMute(); break;
    }
});

// ===== Auto-Load from URL Parameter =====
function autoLoadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('video');
    if (videoParam) {
        videoLinkInput.value = decodeURIComponent(videoParam);
        loadVideo(videoParam);
    }
}
document.addEventListener('DOMContentLoaded', autoLoadFromURL);

// ===== Enhanced Progress and Time Update =====
const progressBuffer = document.getElementById('progress-buffer');

videoPlayer.addEventListener('timeupdate', () => {
  if (!videoPlayer.duration) return;
  const current = videoPlayer.currentTime;
  const total = videoPlayer.duration;

  // update progress value
  progressBar.value = (current / total) * 100;

  // update time display
  timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;

  // update play/pause button icon
  playPauseBtn.textContent = videoPlayer.paused ? '▶️' : '⏸️';
});

// update buffered range visually
videoPlayer.addEventListener('progress', () => {
  if (videoPlayer.buffered.length > 0 && videoPlayer.duration > 0) {
    const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
    const bufferPercent = (bufferedEnd / videoPlayer.duration) * 100;
    progressBuffer.style.width = `${bufferPercent}%`;
  }
});

// seek by clicking or dragging slider
progressBar.addEventListener('input', () => {
  if (videoPlayer.duration) {
    const seekTime = (progressBar.value / 100) * videoPlayer.duration;
    videoPlayer.currentTime = seekTime;
  }
});

// ===== Share Link =====
shareBtn.addEventListener('click', () => {
    const url = `${window.location.href.split('?')[0]}?video=${encodeURIComponent(videoPlayer.src)}`;
    navigator.clipboard.writeText(url)
        .then(() => showSuccess("Link copied to clipboard!"))
        .catch(() => showError("Failed to copy link"));
});

// ===== Wake Lock Handling =====
let wakeLock = null;
async function requestWakeLock() {
    try {
        if('wakeLock' in navigator && !wakeLock) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => console.log('Wake Lock released ⚡'));
        }
    } catch(err){ console.error(err); }
}
function releaseWakeLock() { if(wakeLock){ wakeLock.release(); wakeLock=null; } }

videoPlayer.addEventListener('play', requestWakeLock);
videoPlayer.addEventListener('pause', releaseWakeLock);
videoPlayer.addEventListener('ended', releaseWakeLock);
document.addEventListener('visibilitychange', async () => {
    if(wakeLock && document.visibilityState==='visible') await requestWakeLock();
});

// ===== About Section Toggle =====
aboutToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    aboutContent.style.display = aboutContent.style.display === 'block' ? 'none' : 'block';
});

// Close about when clicking outside
document.addEventListener('click', (e) => {
    if (!aboutToggle.contains(e.target) && !aboutContent.contains(e.target)) {
        aboutContent.style.display = 'none';
    }
});

// ===== Initialize Player State =====
function initPlayer() {
    playPauseBtn.textContent = '▶️';
    timeDisplay.textContent = '00:00 / 00:00';
    progressBar.value = 0;
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    autoLoadFromURL();
    initPlayer();
});

// --- MATRIX BACKGROUND ---
(function initMatrix() {
    const canvas = document.getElementById('matrix');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "♡♡";
    const fontSize = 14;
    const cols = canvas.width / fontSize;
    const drops = Array(Math.floor(cols)).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(15,15,15,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00e0ff';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 33);
})();

// --- PARTICLES BACKGROUND ---
(function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60 },
                size: { value: 2 },
                color: { value: '#00e0ff' },
                line_linked: { enable: true, color: '#00e0ff', opacity: 0.3 },
                move: { enable: true, speed: 1 }
            },
            interactivity: {
                events: { onhover: { enable: true, mode: 'repulse' } }
            }
        });
    }
})();
