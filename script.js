// DOM Elements
const videoLinkInput = document.getElementById('video-link');
const playButton = document.getElementById('play-button');
const youtubePlayer = document.getElementById('youtube-player');
const youtubeIframe = document.getElementById('youtube-iframe');
const directVideoPlayer = document.getElementById('direct-video-player');
const videoElement = document.getElementById('video');
const loadingElement = document.getElementById('loading');
const errorMessageElement = document.getElementById('error-message');
const successMessageElement = document.getElementById('success-message');
const pipButton = document.getElementById('pip-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const downloadButton = document.getElementById('download-button');
const resetButton = document.getElementById('reset-button');
const themeToggle = document.getElementById('theme-toggle');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const playPauseBtn = document.getElementById('play-pause-btn');
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');
const muteBtn = document.getElementById('mute-btn');
const volumeSlider = document.getElementById('volume-slider');
const qualitySelector = document.getElementById('quality-selector');
const qualitySelect = document.getElementById('quality-select');

// Variables
let wakeLock = null;
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currentVideoUrl = '';
let isMuted = false;
let lastVolume = 1;

// Initialize theme
function initTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<span class="tooltip">☀️ Theme<span class="tooltiptext">Toggle Theme (T)</span></span>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<span class="tooltip">🌙 Theme<span class="tooltiptext">Toggle Theme (T)</span></span>';
    }
}

// Toggle theme
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    initTheme();
}

// Wake Lock functions
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
            console.log('Wake Lock is active');
        }
    } catch (err) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update time display
function updateTimeDisplay() {
    currentTimeDisplay.textContent = formatTime(videoElement.currentTime);
    if (!isNaN(videoElement.duration)) {
        durationDisplay.textContent = formatTime(videoElement.duration);
    }
}

// Handle video play/pause
function togglePlayPause() {
    if (videoElement.paused) {
        videoElement.play().catch(e => {
            showError("Failed to play video");
            console.error("Play error:", e);
        });
    } else {
        videoElement.pause();
    }
}

// Handle mute/unmute
function toggleMute() {
    if (videoElement.muted) {
        videoElement.muted = false;
        muteBtn.textContent = '🔊';
        if (videoElement.volume === 0) {
            videoElement.volume = lastVolume;
            volumeSlider.value = lastVolume;
        }
    } else {
        lastVolume = videoElement.volume;
        videoElement.muted = true;
        muteBtn.textContent = '🔇';
    }
}

// Handle volume change
function handleVolumeChange() {
    videoElement.volume = volumeSlider.value;
    if (videoElement.volume > 0) {
        videoElement.muted = false;
        muteBtn.textContent = '🔊';
    } else {
        muteBtn.textContent = '🔇';
    }
}

// Seek video by clicking on progress bar
function seekVideo(e) {
    const percent = e.offsetX / this.offsetWidth;
    videoElement.currentTime = percent * videoElement.duration;
}

// Update progress bar
function updateProgressBar() {
    const percent = (videoElement.currentTime / videoElement.duration) * 100;
    progressBar.style.width = `${percent}%`;
    updateTimeDisplay();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    // Initialize volume
    videoElement.volume = volumeSlider.value;
    // Hide native controls immediately
    videoElement.controls = false;
});

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

playButton.addEventListener('click', loadVideo);
videoLinkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadVideo();
});
pipButton.addEventListener('click', togglePiP);
fullscreenButton.addEventListener('click', toggleFullscreen);
downloadButton.addEventListener('click', downloadVideo);
resetButton.addEventListener('click', resetPlayer);
videoElement.addEventListener('error', handleVideoError);
videoElement.addEventListener('timeupdate', updateProgressBar);
videoElement.addEventListener('play', () => {
    requestWakeLock();
    progressContainer.style.display = 'block';
    playPauseBtn.textContent = '⏸';
});
videoElement.addEventListener('pause', () => {
    releaseWakeLock();
    playPauseBtn.textContent = '▶';
});
videoElement.addEventListener('ended', () => {
    releaseWakeLock();
    showSuccess("Video playback completed");
    playPauseBtn.textContent = '▶';
});
videoElement.addEventListener('durationchange', updateTimeDisplay);
youtubeIframe.addEventListener('error', handleVideoError);
document.addEventListener('keydown', handleKeyboardShortcuts);
themeToggle.addEventListener('click', toggleTheme);
playPauseBtn.addEventListener('click', togglePlayPause);
rewindBtn.addEventListener('click', () => {
    videoElement.currentTime -= 10;
});
forwardBtn.addEventListener('click', () => {
    videoElement.currentTime += 10;
});
muteBtn.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', handleVolumeChange);
progressContainer.addEventListener('click', seekVideo);
qualitySelect.addEventListener('change', changeQuality);

// Video loading function
function loadVideo() {
    const videoLink = videoLinkInput.value.trim();
    if (!videoLink) {
        showError("Please enter a video link");
        return;
    }

    if (!isValidVideoLink(videoLink)) {
        showError("Please enter a valid YouTube or direct video link");
        return;
    }

    loadingElement.style.display = 'block';
    errorMessageElement.style.display = 'none';
    successMessageElement.style.display = 'none';
    downloadButton.style.display = 'none';
    currentVideoUrl = videoLink;

    setTimeout(() => {
        loadingElement.style.display = 'none';

        if (isYouTubeLink(videoLink)) {
            const videoId = getYouTubeVideoId(videoLink);
            if (!videoId) {
                showError("Invalid YouTube link. Please check the URL");
                return;
            }
            youtubeIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
            youtubePlayer.style.display = 'block';
            directVideoPlayer.style.display = 'none';
            progressContainer.style.display = 'none';
            showSuccess("YouTube video loaded successfully");
        } else {
            videoElement.src = videoLink;
            youtubePlayer.style.display = 'none';
            directVideoPlayer.style.display = 'block';
            downloadButton.style.display = 'inline-block';
            
            videoElement.play().catch(e => {
                showError("Autoplay was blocked. Please click play manually");
                console.error("Autoplay error:", e);
            });
            
            // Check for available qualities (simulated here)
            simulateQualityOptions();
        }
    }, 500);
}

// Simulate quality options
function simulateQualityOptions() {
    qualitySelect.innerHTML = '<option value="auto">Auto Quality</option>';
    
    // Simulate different quality options
    const qualities = ['1080p', '720p', '480p', '360p'];
    qualities.forEach(quality => {
        const option = document.createElement('option');
        option.value = quality.toLowerCase();
        option.textContent = quality;
        qualitySelect.appendChild(option);
    });
    
    qualitySelector.style.display = 'block';
}

// Change video quality (simulated)
function changeQuality() {
    const quality = qualitySelect.value;
    showSuccess(`Quality changed to ${quality.toUpperCase()}`);
    // In a real implementation, you would switch the video source here
}

// Helper functions
function isValidVideoLink(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const directVideoRegex = /^(https?:\/\/)?.*\.(mp4|webm|ogg|mov|mkv|avi|m3u8)(\?.*)?$/i;
    return youtubeRegex.test(url) || directVideoRegex.test(url);
}

function isYouTubeLink(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeVideoId(url) {
    const regex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Player control functions
function togglePiP() {
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(err => {
            showError("Failed to exit Picture-in-Picture");
            console.error("PiP error:", err);
        });
    } else if (videoElement.requestPictureInPicture) {
        videoElement.requestPictureInPicture().catch(err => {
            showError("Picture-in-Picture not available");
            console.error("PiP error:", err);
        });
    } else {
        showError("Picture-in-Picture is not supported in your browser");
    }
}

function toggleFullscreen() {
    const element = directVideoPlayer.style.display !== 'none' ? videoElement : youtubeIframe;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        element.requestFullscreen().catch(err => {
            showError("Fullscreen mode not available");
            console.error("Fullscreen error:", err);
        });
    }
}

function downloadVideo() {
    if (!currentVideoUrl || isYouTubeLink(currentVideoUrl)) {
        showError("Download is only available for direct video links");
        return;
    }

    const a = document.createElement('a');
    a.href = currentVideoUrl;
    a.download = `video-${new Date().getTime()}.${currentVideoUrl.split('.').pop().split('?')[0]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccess("Download started");
}

document.addEventListener('fullscreenchange', () => {
    const icon = document.fullscreenElement ? '⛶ Exit' : '⛶ Fullscreen';
    fullscreenButton.innerHTML = `<span class="tooltip">${icon}<span class="tooltiptext">Toggle Fullscreen (F)</span></span>`;
});

// Reset function
function resetPlayer() {
    videoLinkInput.value = '';
    youtubeIframe.src = '';
    videoElement.src = '';
    youtubePlayer.style.display = 'block';
    directVideoPlayer.style.display = 'none';
    errorMessageElement.style.display = 'none';
    successMessageElement.style.display = 'none';
    progressContainer.style.display = 'none';
    downloadButton.style.display = 'none';
    qualitySelector.style.display = 'none';
    currentTimeDisplay.textContent = '00:00';
    durationDisplay.textContent = '00:00';
    releaseWakeLock();
    showSuccess("Player has been reset");
}

// Message functions
function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
    setTimeout(() => errorMessageElement.style.display = 'none', 5000);
}

function showSuccess(message) {
    successMessageElement.textContent = message;
    successMessageElement.style.display = 'block';
    setTimeout(() => successMessageElement.style.display = 'none', 3000);
}

function handleVideoError() {
    showError("Failed to load the video. Please check the link and try again");
}

// Auto-load video from query string (?=videoURL)
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const videoUrl = params.get(''); // because query is like ?=link
    if (videoUrl) {
        videoLinkInput.value = videoUrl;
        loadVideo();
    }
});

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.target === videoLinkInput) return;
    
    switch(e.code) {
        case 'Space':
            if (directVideoPlayer.style.display !== 'none') {
                e.preventDefault();
                togglePlayPause();
            }
            break;
        case 'ArrowRight':
            if (directVideoPlayer.style.display !== 'none') {
                e.preventDefault();
                videoElement.currentTime += 5;
            }
            break;
        case 'ArrowLeft':
            if (directVideoPlayer.style.display !== 'none') {
                e.preventDefault();
                videoElement.currentTime -= 5;
            }
            break;
        case 'KeyF':
            e.preventDefault();
            toggleFullscreen();
            break;
        case 'KeyP':
            e.preventDefault();
            if (directVideoPlayer.style.display !== 'none') {
                togglePiP();
            }
            break;
        case 'KeyD':
            e.preventDefault();
            if (directVideoPlayer.style.display !== 'none') {
                downloadVideo();
            }
            break;
        case 'KeyR':
            e.preventDefault();
            resetPlayer();
            break;
        case 'KeyT':
            e.preventDefault();
            toggleTheme();
            break;
        case 'KeyM':
            e.preventDefault();
            if (directVideoPlayer.style.display !== 'none') {
                toggleMute();
            }
            break;
        case 'Enter':
            if (document.activeElement !== videoLinkInput) {
                e.preventDefault();
                loadVideo();
            }
            break;
    }
}

// Initialize matrix background
(function initMatrixBackground() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "♡♡";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
        ctx.fillStyle = 'rgba(15, 15, 15, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00cec9';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = characters.charAt(Math.floor(Math.random() * characters.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(drawMatrix, 33);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
})();

// Initialize particles.js background
(function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 60 },
                size: { value: 2 },
                color: { value: '#00cec9' },
                line_linked: {
                    enable: true,
                    color: '#00cec9',
                    opacity: 0.3
                },
                move: { enable: true, speed: 1 }
            },
            interactivity: {
                events: {
                    onhover: { enable: true, mode: 'repulse' }
                }
            }
        });
    }
})();
