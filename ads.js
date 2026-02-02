// ads.js - Google AdSense Integration for INFINITY YouTube Player
// ================================================================

class AdManager {
    constructor() {
        this.adUnits = {
            top: null,      // Top of video player
            bottom: null,   // Bottom of controls
            menu: null      // Bottom of menu
        };
        
        this.isAdBlocked = false;
        this.adEnabled = false;
        this.init();
    }

    init() {
        // Check if AdSense script is already loaded
        if (typeof adsbygoogle !== 'undefined') {
            this.setupAds();
        } else {
            // Listen for AdSense script load
            document.addEventListener('adsbygoogle.loaded', () => {
                this.setupAds();
            });
        }

        // Check for ad blockers
        this.detectAdBlock();
    }

    detectAdBlock() {
        // Simple ad blocker detection
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'ad adsbox doubleclick ad-placement carbon-ads';
        testAd.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
        document.body.appendChild(testAd);

        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0 || 
                             testAd.offsetWidth === 0 || 
                             testAd.style.display === 'none' ||
                             testAd.style.visibility === 'hidden';
            
            this.isAdBlocked = isBlocked;
            
            if (isBlocked) {
                console.warn("Ad blocker detected. Ads will not be displayed.");
                this.showAdBlockMessage();
            } else {
                console.log("No ad blocker detected. Ads will load normally.");
            }
            
            document.body.removeChild(testAd);
        }, 100);
    }

    showAdBlockMessage() {
        const message = document.createElement('div');
        message.className = 'adblock-message';
        message.style.cssText = `
            background: linear-gradient(135deg, #ff9800, #ff5722);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            margin: 10px auto;
            max-width: 800px;
            text-align: center;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            backdrop-filter: blur(10px);
            border-left: 4px solid #ff5722;
        `;
        
        message.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Please consider disabling your ad blocker to support the developer. Ads are minimal and non-intrusive.</span>
        `;
        
        // Insert after video container
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer && videoContainer.parentNode) {
            videoContainer.parentNode.insertBefore(message, videoContainer.nextSibling);
        }
    }

    setupAds() {
        if (this.isAdBlocked) {
            console.log("Skipping ad setup due to ad blocker");
            return;
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createAdUnits());
        } else {
            this.createAdUnits();
        }
    }

    createAdUnits() {
        // Create ad containers
        this.createTopAd();
        this.createBottomAd();
        this.createMenuAd();
        
        // Enable ads
        this.adEnabled = true;
        
        // Load ads after a short delay
        setTimeout(() => {
            this.loadAds();
        }, 1000);
    }

    createTopAd() {
        // Create container for top ad
        const adContainer = document.createElement('div');
        adContainer.className = 'ad-container top-ad';
        adContainer.style.cssText = `
            margin-bottom: 20px;
            text-align: center;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
        `;

        // Create the ad unit
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // Replace with your AdSense ID
        adUnit.setAttribute('data-ad-slot', 'XXXXXXXXXX'); // Replace with your ad slot
        adUnit.setAttribute('data-ad-format', 'auto');
        adUnit.setAttribute('data-full-width-responsive', 'true');
        adUnit.setAttribute('data-adtest', 'on'); // Remove in production

        adContainer.appendChild(adUnit);
        
        // Insert before the video player
        const youtubePlayer = document.getElementById('youtube-player');
        if (youtubePlayer && youtubePlayer.parentNode) {
            youtubePlayer.parentNode.insertBefore(adContainer, youtubePlayer);
            this.adUnits.top = adContainer;
        }
    }

    createBottomAd() {
        // Create container for bottom ad
        const adContainer = document.createElement('div');
        adContainer.className = 'ad-container bottom-ad';
        adContainer.style.cssText = `
            margin-top: 20px;
            text-align: center;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
        `;

        // Create the ad unit
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // Replace with your AdSense ID
        adUnit.setAttribute('data-ad-slot', 'XXXXXXXXXX'); // Replace with your ad slot
        adUnit.setAttribute('data-ad-format', 'auto');
        adUnit.setAttribute('data-full-width-responsive', 'true');
        adUnit.setAttribute('data-adtest', 'on'); // Remove in production

        adContainer.appendChild(adUnit);
        
        // Insert after the controls
        const controls = document.querySelector('.controls');
        if (controls && controls.parentNode) {
            controls.parentNode.insertBefore(adContainer, controls.nextSibling);
            this.adUnits.bottom = adContainer;
        }
    }

    createMenuAd() {
        // Create container for menu ad
        const adContainer = document.createElement('div');
        adContainer.className = 'ad-container menu-ad';
        adContainer.style.cssText = `
            margin-top: auto;
            text-align: center;
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
        `;

        // Create the ad unit
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // Replace with your AdSense ID
        adUnit.setAttribute('data-ad-slot', 'XXXXXXXXXX'); // Replace with your ad slot
        adUnit.setAttribute('data-ad-format', 'auto');
        adUnit.setAttribute('data-full-width-responsive', 'true');
        adUnit.setAttribute('data-adtest', 'on'); // Remove in production

        adContainer.appendChild(adUnit);
        
        // Insert in menu before footer
        const menuFooter = document.querySelector('.menu-footer');
        if (menuFooter && menuFooter.parentNode) {
            menuFooter.parentNode.insertBefore(adContainer, menuFooter);
            this.adUnits.menu = adContainer;
        }
    }

    loadAds() {
        if (!this.adEnabled || this.isAdBlocked) return;

        // Wait a bit for ads to be properly inserted
        setTimeout(() => {
            try {
                // Load ads
                if (typeof (adsbygoogle = window.adsbygoogle || []).push === 'function') {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    console.log("AdSense ads loaded successfully");
                }
            } catch (error) {
                console.error("Error loading AdSense ads:", error);
            }
        }, 500);
    }

    refreshAds() {
        if (!this.adEnabled || this.isAdBlocked) return;

        try {
            // Destroy existing ads
            Object.values(this.adUnits).forEach(container => {
                if (container) {
                    const ad = container.querySelector('.adsbygoogle');
                    if (ad && ad.removeAttribute) {
                        ad.removeAttribute('data-ad-status');
                        ad.innerHTML = '';
                    }
                }
            });

            // Reload ads after a delay
            setTimeout(() => {
                this.loadAds();
            }, 1000);
        } catch (error) {
            console.error("Error refreshing ads:", error);
        }
    }

    showAdPlaceholder(container) {
        if (container && !container.querySelector('.ad-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'ad-placeholder';
            placeholder.style.cssText = `
                padding: 20px;
                text-align: center;
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.9rem;
            `;
            placeholder.innerHTML = `
                <i class="fas fa-ad" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>Advertisement</p>
                <small>Ads help support this free service</small>
            `;
            container.appendChild(placeholder);
        }
    }

    destroy() {
        // Remove all ad containers
        Object.values(this.adUnits).forEach(container => {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
        
        this.adUnits = {
            top: null,
            bottom: null,
            menu: null
        };
        
        this.adEnabled = false;
    }
}

// Initialize Ad Manager when DOM is ready
let adManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        adManager = new AdManager();
    });
} else {
    adManager = new AdManager();
}

// Export for global access
window.adManager = adManager;
