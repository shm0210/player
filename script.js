// ============================
// INFINITY YouTube Player JS
// ============================

// --- Element References ---
const videoLinkInput = document.getElementById('video-link');
const playButton = document.getElementById('play-button');
const youtubeIframe = document.getElementById('youtube-iframe');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const successMessageElement = document.getElementById('success-message');
const fullscreenButton = document.getElementById('fullscreen-button');
const resetButton = document.getElementById('reset-button');
const themeToggle = document.getElementById('theme-toggle');
const aboutToggle = document.getElementById('about-toggle');
const aboutContent = document.getElementById('about-content');

// --- THEME MANAGEMENT ---
let isDarkMode = localStorage.getItem('darkMode') === 'true';

function initTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.innerHTML = isDarkMode
        ? `<span class="tooltip">☀️ Theme<span class="tooltiptext">Toggle Theme (T)</span></span>`
        : `<span class="tooltip">🌙 Theme<span class="tooltiptext">Toggle Theme (T)</span></span>`;
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    initTheme();
}

document.addEventListener('DOMContentLoaded', initTheme);

// --- STATUS HANDLERS ---
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
    setTimeout(() => (errorMessageElement.style.display = 'none'), 4000);
}

function showSuccess(message) {
    successMessageElement.textContent = message;
    successMessageElement.style.display = 'block';
    setTimeout(() => (successMessageElement.style.display = 'none'), 2500);
}

// --- LINK HANDLERS ---
function getYouTubeVideoId(url) {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function isYouTubeLink(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// --- LOAD VIDEO ---
function loadVideo() {
    const link = videoLinkInput.value.trim();
    if (!link) return showError("Please enter a YouTube link");
    if (!isYouTubeLink(link)) return showError("Only YouTube links are supported");

    const videoId = getYouTubeVideoId(link);
    if (!videoId) return showError("Invalid YouTube URL");

    loadingElement.style.display = 'block';
    setTimeout(() => {
        youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1`;
        loadingElement.style.display = 'none';
        showSuccess("Video loaded successfully");
    }, 600);
}

// --- BUTTON EVENTS ---
playButton.addEventListener('click', loadVideo);
videoLinkInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') loadVideo();
});

fullscreenButton.addEventListener('click', () => {
    if (!youtubeIframe) return;
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        youtubeIframe.requestFullscreen?.().catch(() => showError("Fullscreen not supported"));
    }
});

resetButton.addEventListener('click', () => {
    youtubeIframe.src = '';
    videoLinkInput.value = '';
    showSuccess("Player reset");
});

themeToggle.addEventListener('click', toggleTheme);

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', e => {
    switch (e.code) {
        case 'Enter': loadVideo(); break;
        case 'KeyF': fullscreenButton.click(); break;
        case 'KeyR': resetButton.click(); break;
        case 'KeyT': toggleTheme(); break;
    }
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

// --- ABOUT SECTION ---
if (aboutToggle && aboutContent) {
    aboutToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = aboutContent.style.display === 'block';
        aboutContent.style.display = isVisible ? 'none' : 'block';
        aboutToggle.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    document.addEventListener('click', (e) => {
        if (!aboutContent.contains(e.target) && !aboutToggle.contains(e.target)) {
            aboutContent.style.display = 'none';
            aboutToggle.style.transform = 'rotate(0deg)';
        }
    });
}// ===== Wake Lock Feature =====
let wakeLock = null;

// Request wake lock
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("✅ Wake Lock activated (screen will stay awake)");
            wakeLock.addEventListener('release', () => {
                console.log("⚠️ Wake Lock released");
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

// Release wake lock
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log("🔓 Wake Lock released manually");
    }
}

// Auto-manage wake lock when video starts or stops
youtubeIframe.addEventListener('load', () => {
    // Wait a bit to ensure video iframe is ready
    setTimeout(() => requestWakeLock(), 800);
});

// If user resets or leaves
resetButton.addEventListener('click', releaseWakeLock);
window.addEventListener('beforeunload', releaseWakeLock);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && youtubeIframe.src) requestWakeLock();
    else releaseWakeLock();
});

// ===== Auto-load video from URL parameter =====
(function autoLoadFromURL() {
    const params = new URLSearchParams(window.location.search);
    // Detect ?= or ?v= or ?link= formats
    const rawParam = params.get('') || params.get('v') || params.get('link');
    if (!rawParam) return;

    const link = decodeURIComponent(rawParam);
    if (isYouTubeLink(link)) {
        videoLinkInput.value = link;
        loadVideo();
        console.log("🎬 Auto-loaded video from URL:", link);
    }
})();
