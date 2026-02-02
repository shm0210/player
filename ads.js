// ads.js - AdSense Management for INFINITY YouTube Player

class AdManager {
    constructor() {
        this.adUnits = [];
        this.adInitialized = false;
        this.adFrequency = 3; // Show ads every 3 videos
        this.videoCounter = 0;
        this.isAdBlocked = false;
    }

    // Initialize all ad units
    initializeAds() {
        if (typeof adsbygoogle === 'undefined') {
            console.warn('AdSense not loaded');
            this.isAdBlocked = true;
            return;
        }

        // Find all ad containers
        const adContainers = document.querySelectorAll('.adsbygoogle');
        
        if (adContainers.length === 0) {
            console.log('No ad containers found');
            return;
        }

        // Initialize each ad
        adContainers.forEach((container, index) => {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
                this.adUnits.push({
                    container: container,
                    id: container.dataset.adSlot,
                    loaded: false
                });
                console.log(`Ad unit ${index + 1} initialized`);
            } catch (error) {
                console.error(`Error initializing ad ${index + 1}:`, error);
            }
        });

        this.adInitialized = true;
        
        // Refresh ads periodically
        this.setupAutoRefresh();
        
        // Check for ad blockers
        this.checkAdBlock();
    }

    // Check if ad blocker is active
    checkAdBlock() {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.position = 'absolute';
        testAd.style.left = '-9999px';
        testAd.style.top = '-9999px';
        document.body.appendChild(testAd);
        
        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0 || 
                             testAd.style.display === 'none' || 
                             testAd.style.visibility === 'hidden';
            
            this.isAdBlocked = isBlocked;
            
            if (isBlocked) {
                console.log('Ad blocker detected');
                this.showAdBlockMessage();
            }
            
            document.body.removeChild(testAd);
        }, 100);
    }

    // Show message if ad blocker is detected
    showAdBlockMessage() {
        const message = document.createElement('div');
        message.className = 'ad-block-message';
        message.innerHTML = `
            <div style="
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 12px 15px;
                margin: 10px 0;
                text-align: center;
                font-size: 0.85rem;
                color: #ffc107;
            ">
                <i class="fas fa-info-circle"></i>
                <strong>Ad Blocker Detected:</strong> Please consider disabling your ad blocker to support this free service.
            </div>
        `;
        
        // Insert at top of video container
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.insertBefore(message, videoContainer.firstChild);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 10000);
        }
    }

    // Refresh specific ad
    refreshAd(adUnitId) {
        if (!this.adInitialized || this.isAdBlocked) return;
        
        const adUnit = this.adUnits.find(ad => ad.id === adUnitId);
        if (adUnit && typeof adsbygoogle !== 'undefined') {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
                console.log(`Refreshed ad: ${adUnitId}`);
            } catch (error) {
                console.error(`Error refreshing ad ${adUnitId}:`, error);
            }
        }
    }

    // Refresh all ads
    refreshAllAds() {
        if (!this.adInitialized || this.isAdBlocked) return;
        
        this.adUnits.forEach(adUnit => {
            this.refreshAd(adUnit.id);
        });
        
        console.log('All ads refreshed');
    }

    // Setup auto-refresh every 60 seconds
    setupAutoRefresh() {
        setInterval(() => {
            this.refreshAllAds();
        }, 60000); // 60 seconds
    }

    // Track video plays and show ads at frequency
    trackVideoPlay() {
        this.videoCounter++;
        
        // Show ads every N videos
        if (this.videoCounter >= this.adFrequency) {
            this.refreshAllAds();
            this.videoCounter = 0;
            
            // Also show interstitial-like behavior
            this.showAdNotification();
        }
    }

    // Show notification about ads
    showAdNotification() {
        const notification = document.createElement('div');
        notification.className = 'ad-notification';
        notification.innerHTML = `
            <div style="
                background: rgba(0, 224, 255, 0.1);
                border: 1px solid #00e0ff;
                border-radius: 8px;
                padding: 10px 15px;
                margin: 10px 0;
                text-align: center;
                font-size: 0.8rem;
                color: #00e0ff;
                animation: fadeInOut 3s ease-in-out;
            ">
                <i class="fas fa-ad"></i>
                Ads help keep this service free. Thank you for your support!
            </div>
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-10px); }
                20% { opacity: 1; transform: translateY(0); }
                80% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        // Insert before video player
        const youtubePlayer = document.getElementById('youtube-player');
        if (youtubePlayer && youtubePlayer.parentNode) {
            youtubePlayer.parentNode.insertBefore(notification, youtubePlayer);
            
            // Auto-remove after animation
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 3000);
        }
    }

    // Handle responsive ad sizes
    handleResponsiveAds() {
        const adContainers = document.querySelectorAll('.ad-container');
        
        adContainers.forEach(container => {
            const width = container.offsetWidth;
            
            // Adjust ad format based on container width
            if (width < 300) {
                container.classList.add('ad-small');
            } else if (width < 500) {
                container.classList.add('ad-medium');
            } else {
                container.classList.add('ad-large');
            }
        });
    }

    // Initialize when DOM is ready
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeAds();
                this.handleResponsiveAds();
            });
        } else {
            this.initializeAds();
            this.handleResponsiveAds();
        }
        
        // Handle window resize for responsive ads
        window.addEventListener('resize', () => {
            this.handleResponsiveAds();
        });
    }
}

// Initialize ad manager
const adManager = new AdManager();
adManager.init();

// Export for use in main script
window.adManager = adManager;
