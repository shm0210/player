// ads.js - AdSense Management for INFINITY YouTube Player

class AdManager {
    constructor() {
        this.adUnits = {
            banner: null,
            sidebar: null,
            videoBottom: null
        };
        this.isAdBlocked = false;
        this.adEnabled = true;
        this.init();
    }

    init() {
        // Check if AdSense is loaded
        this.checkAdBlock();
        this.setupAutoAds();
        this.createAdContainers();
        
        // Load ads after page is ready
        window.addEventListener('load', () => {
            setTimeout(() => this.loadAds(), 2000);
        });
    }

    checkAdBlock() {
        // Simple ad block detection
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox';
        testAd.style.cssText = 'height:1px;width:1px;position:absolute;left:-100px;top:-100px;visibility:hidden;';
        document.body.appendChild(testAd);
        
        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0 || 
                              testAd.offsetWidth === 0 ||
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

    showAdBlockMessage() {
        // Optional: Show message to disable ad blocker
        if (!this.adEnabled) return;
        
        const message = document.createElement('div');
        message.className = 'adblock-message';
        message.innerHTML = `
            <div class="adblock-warning">
                <i class="fas fa-ad"></i>
                <div>
                    <h4>Please consider disabling ad blocker</h4>
                    <p>Ads help keep this free service running. Whitelist us to support development.</p>
                </div>
                <button class="close-adblock-message">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        const closeBtn = message.querySelector('.close-adblock-message');
        closeBtn.addEventListener('click', () => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 300);
            }
        }, 10000);
    }

    createAdContainers() {
        // Create ad container in sidebar
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            const adContainer = document.createElement('div');
            adContainer.className = 'sidebar-ad-container';
            adContainer.innerHTML = `
                <div class="ad-label">
                    <i class="fas fa-ad"></i> Advertisement
                </div>
                <div class="sidebar-ad" id="sidebar-ad">
                    <!-- AdSense will fill this -->
                </div>
            `;
            
            // Insert after owner profile section
            const profileSection = sidebar.querySelector('.owner-profile-menu');
            if (profileSection) {
                profileSection.parentNode.insertBefore(adContainer, profileSection.nextSibling);
            }
        }

        // Create banner ad at top
        const bannerAd = document.createElement('div');
        bannerAd.id = 'banner-ad';
        bannerAd.className = 'banner-ad-container';
        bannerAd.innerHTML = `
            <div class="ad-label">
                <i class="fas fa-ad"></i> Advertisement
            </div>
            <div class="banner-ad-content">
                <!-- AdSense will fill this -->
            </div>
        `;
        
        // Insert after legal disclaimer
        const disclaimer = document.querySelector('.legal-disclaimer');
        if (disclaimer) {
            disclaimer.parentNode.insertBefore(bannerAd, disclaimer.nextSibling);
        }

        // Create ad below video info
        const videoBottomAd = document.createElement('div');
        videoBottomAd.id = 'video-bottom-ad';
        videoBottomAd.className = 'video-bottom-ad-container';
        videoBottomAd.innerHTML = `
            <div class="ad-label">
                <i class="fas fa-ad"></i> Advertisement
            </div>
            <div class="video-bottom-ad-content">
                <!-- AdSense will fill this -->
            </div>
        `;
        
        // Insert after video info
        const videoInfo = document.getElementById('video-info');
        if (videoInfo) {
            videoInfo.parentNode.insertBefore(videoBottomAd, videoInfo.nextSibling);
        }
    }

    setupAutoAds() {
        // Enable Auto ads if needed
        try {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-YOUR_PUBLISHER_ID",
                enable_page_level_ads: true,
                overlays: { bottom: true }
            });
        } catch (e) {
            console.error('AdSense auto ads error:', e);
        }
    }

    loadAds() {
        if (!this.adEnabled || this.isAdBlocked) return;
        
        // Load sidebar ad
        this.loadSidebarAd();
        
        // Load banner ad
        this.loadBannerAd();
        
        // Load video bottom ad
        this.loadVideoBottomAd();
    }

    loadSidebarAd() {
        if (!this.adEnabled) return;
        
        const adSlot = document.getElementById('sidebar-ad');
        if (!adSlot) return;
        
        try {
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-YOUR_PUBLISHER_ID",
                enable_page_level_ads: false,
                overlays: { bottom: false }
            });
            
            adSlot.innerHTML = `
                <ins class="adsbygoogle"
                    style="display:block"
                    data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
                    data-ad-slot="YOUR_SIDEBAR_AD_SLOT_ID"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
                <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            `;
            
            // Reload the ad
            if (window.adsbygoogle) {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('Error loading sidebar ad:', e);
        }
    }

    loadBannerAd() {
        if (!this.adEnabled) return;
        
        const bannerContent = document.querySelector('.banner-ad-content');
        if (!bannerContent) return;
        
        try {
            bannerContent.innerHTML = `
                <ins class="adsbygoogle"
                    style="display:block"
                    data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
                    data-ad-slot="YOUR_BANNER_AD_SLOT_ID"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
                <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            `;
            
            if (window.adsbygoogle) {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('Error loading banner ad:', e);
        }
    }

    loadVideoBottomAd() {
        if (!this.adEnabled) return;
        
        const bottomContent = document.querySelector('.video-bottom-ad-content');
        if (!bottomContent) return;
        
        try {
            bottomContent.innerHTML = `
                <ins class="adsbygoogle"
                    style="display:block"
                    data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
                    data-ad-slot="YOUR_VIDEO_BOTTOM_AD_SLOT_ID"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
                <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            `;
            
            if (window.adsbygoogle) {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('Error loading video bottom ad:', e);
        }
    }

    refreshAds() {
        if (!this.adEnabled) return;
        
        try {
            if (window.adsbygoogle) {
                // Refresh all ads
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('Error refreshing ads:', e);
        }
    }

    toggleAds(enable) {
        this.adEnabled = enable;
        
        const adContainers = document.querySelectorAll('.ad-label, .sidebar-ad-container, .banner-ad-container, .video-bottom-ad-container');
        
        if (enable) {
            adContainers.forEach(container => {
                container.style.display = 'block';
            });
            this.loadAds();
        } else {
            adContainers.forEach(container => {
                container.style.display = 'none';
            });
        }
    }

    // Call this when video starts playing
    onVideoPlay() {
        // Refresh ads when video plays
        setTimeout(() => this.refreshAds(), 1000);
    }

    // Call this when menu opens
    onMenuOpen() {
        // Refresh sidebar ad when menu opens
        setTimeout(() => this.loadSidebarAd(), 500);
    }
}

// Initialize Ad Manager
let adManager;

function initAds() {
    adManager = new AdManager();
    
    // Add ad toggle to menu
    addAdToggleToMenu();
}

function addAdToggleToMenu() {
    const menuSection = document.querySelector('.menu-section:nth-child(3)');
    if (!menuSection) return;
    
    const adToggle = document.createElement('button');
    adToggle.className = 'menu-option';
    adToggle.id = 'ad-toggle';
    adToggle.innerHTML = `
        <i class="fas fa-ad"></i>
        <span>Ads: <span id="ad-status">Enabled</span></span>
    `;
    
    const menuOptions = menuSection.querySelector('.menu-options');
    if (menuOptions) {
        menuOptions.appendChild(adToggle);
        
        adToggle.addEventListener('click', () => {
            if (adManager) {
                const currentlyEnabled = adManager.adEnabled;
                adManager.toggleAds(!currentlyEnabled);
                
                const adStatus = document.getElementById('ad-status');
                adStatus.textContent = !currentlyEnabled ? "Enabled" : "Disabled";
                
                // Save preference
                localStorage.setItem('adsEnabled', !currentlyEnabled);
            }
        });
        
        // Load saved preference
        const adsEnabled = localStorage.getItem('adsEnabled');
        if (adsEnabled === 'false' && adManager) {
            adManager.toggleAds(false);
            const adStatus = document.getElementById('ad-status');
            adStatus.textContent = "Disabled";
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAds);

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdManager, initAds };
}
