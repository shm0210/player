// ============================
// INFINITY Player - Ad Management
// ============================

class AdManager {
    constructor() {
        this.adSlots = {};
        this.adPreferences = {
            personalized: true,
            enabled: true,
            frequency: 'normal'
        };
        this.adBlockDetected = false;
        this.adLoadAttempts = {};
        this.MAX_AD_ATTEMPTS = 3;
        
        this.initialize();
    }
    
    initialize() {
        this.loadPreferences();
        this.setupAdSlots();
        this.detectAdBlock();
        this.bindEvents();
        
        // Load AdSense script if not already loaded
        this.loadAdSense();
        
        console.log('Ad Manager initialized');
    }
    
    loadAdSense() {
        // Check if AdSense is already loaded
        if (typeof adsbygoogle !== 'undefined') {
            console.log('AdSense already loaded');
            this.initializeAds();
            return;
        }
        
        // Load AdSense script
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            console.log('AdSense script loaded');
            this.initializeAds();
        };
        script.onerror = (error) => {
            console.error('Failed to load AdSense:', error);
            this.showAdFallback();
        };
        
        document.head.appendChild(script);
    }
    
    setupAdSlots() {
        // Define ad slots
        this.adSlots = {
            'leaderboard': {
                element: '.ad-top-banner .adsbygoogle',
                type: 'leaderboard',
                size: '728x90',
                attempts: 0,
                loaded: false
            },
            'sidebar': {
                element: '.ad-sidebar .adsbygoogle',
                type: 'square',
                size: '300x250',
                attempts: 0,
                loaded: false
            },
            'mid-content': {
                element: '.ad-mid-content .adsbygoogle',
                type: 'responsive',
                size: 'auto',
                attempts: 0,
                loaded: false
            },
            'bottom': {
                element: '.ad-bottom .adsbygoogle',
                type: 'banner',
                size: '468x60',
                attempts: 0,
                loaded: false
            }
        };
    }
    
    initializeAds() {
        if (!this.adPreferences.enabled) {
            this.hideAllAds();
            return;
        }
        
        // Initialize each ad slot
        Object.keys(this.adSlots).forEach(slotId => {
            this.loadAd(slotId);
        });
        
        // Set up ad refresh on certain events
        this.setupAdRefresh();
    }
    
    loadAd(slotId) {
        const slot = this.adSlots[slotId];
        if (!slot || slot.loaded || slot.attempts >= this.MAX_AD_ATTEMPTS) {
            return;
        }
        
        const adElement = document.querySelector(slot.element);
        if (!adElement) {
            console.warn(`Ad element not found for slot: ${slotId}`);
            return;
        }
        
        // Check if this is a valid AdSense element
        if (!adElement.classList.contains('adsbygoogle')) {
            console.warn(`Not an AdSense element: ${slotId}`);
            return;
        }
        
        slot.attempts++;
        
        try {
            // Push ad request
            (adsbygoogle = window.adsbygoogle || []).push({});
            slot.loaded = true;
            
            console.log(`Ad loaded for slot: ${slotId}`);
            
            // Track successful load
            this.trackAdLoad(slotId, true);
            
        } catch (error) {
            console.error(`Failed to load ad for slot ${slotId}:`, error);
            this.trackAdLoad(slotId, false);
            
            // Show fallback content after max attempts
            if (slot.attempts >= this.MAX_AD_ATTEMPTS) {
                this.showSlotFallback(slotId);
            }
        }
    }
    
    showSlotFallback(slotId) {
        const container = document.querySelector(`.ad-container[class*="${slotId}"]`);
        if (!container) return;
        
        const fallback = container.querySelector('.ad-fallback, .support-options');
        if (fallback) {
            fallback.style.display = 'block';
        }
        
        // Hide the ad element
        const adElement = container.querySelector('.adsbygoogle');
        if (adElement) {
            adElement.style.display = 'none';
        }
    }
    
    showAdFallback() {
        // Show all fallback content
        document.querySelectorAll('.ad-fallback, .support-options').forEach(element => {
            element.style.display = 'block';
        });
        
        // Hide all ad elements
        document.querySelectorAll('.adsbygoogle').forEach(element => {
            element.style.display = 'none';
        });
    }
    
    hideAllAds() {
        document.querySelectorAll('.ad-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Show premium message
        this.showPremiumMessage();
    }
    
    showPremiumMessage() {
        const message = document.createElement('div');
        message.className = 'premium-message';
        message.innerHTML = `
            <div class="premium-content">
                <i class="fas fa-gem"></i>
                <h4>Ad-Free Experience</h4>
                <p>Thank you for supporting INFINITY Player!</p>
                <small>Ads are disabled for premium users</small>
            </div>
        `;
        
        // Replace ad containers with premium message
        document.querySelectorAll('.ad-container').forEach(container => {
            container.innerHTML = '';
            container.appendChild(message.cloneNode(true));
            container.style.display = 'block';
        });
    }
    
    detectAdBlock() {
        // Simple ad block detection
        const testAd = document.createElement('div');
        testAd.className = 'adsbox';
        testAd.style.cssText = 'height: 1px; width: 1px; position: absolute; left: -1000px;';
        document.body.appendChild(testAd);
        
        setTimeout(() => {
            const isBlocked = testAd.offsetHeight === 0 || 
                              testAd.offsetWidth === 0 || 
                              window.getComputedStyle(testAd).display === 'none';
            
            this.adBlockDetected = isBlocked;
            
            if (isBlocked) {
                console.log('Ad blocker detected');
                this.handleAdBlockDetection();
            }
            
            document.body.removeChild(testAd);
        }, 100);
    }
    
    handleAdBlockDetection() {
        // Show message about ad blocking
        if (this.adBlockDetected && this.adPreferences.enabled) {
            const message = document.createElement('div');
            message.className = 'adblock-message';
            message.innerHTML = `
                <div class="adblock-content">
                    <i class="fas fa-ad"></i>
                    <p>Ad blocker detected. Please consider disabling it or <a href="#" id="support-link">supporting us directly</a>.</p>
                    <button class="close-adblock-message">&times;</button>
                </div>
            `;
            
            document.body.appendChild(message);
            
            // Add event listeners
            message.querySelector('.close-adblock-message').addEventListener('click', () => {
                message.remove();
            });
            
            message.querySelector('#support-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.showSupportOptions();
            });
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 10000);
        }
    }
    
    showSupportOptions() {
        // Trigger the support modal
        const event = new CustomEvent('showSupportModal');
        document.dispatchEvent(event);
    }
    
    setupAdRefresh() {
        // Refresh ads on certain events
        window.addEventListener('focus', () => {
            if (document.visibilityState === 'visible') {
                this.refreshStaleAds();
            }
        });
        
        // Refresh ads when menu is opened/closed
        document.addEventListener('menuStateChange', (e) => {
            if (e.detail.isOpen) {
                setTimeout(() => this.refreshAd('sidebar'), 500);
            }
        });
        
        // Refresh ads on video play
        document.addEventListener('videoPlay', () => {
            setTimeout(() => this.refreshAd('mid-content'), 1000);
        });
    }
    
    refreshStaleAds() {
        // Refresh ads that haven't been refreshed in a while
        const now = Date.now();
        Object.keys(this.adSlots).forEach(slotId => {
            const slot = this.adSlots[slotId];
            if (slot.lastRefresh && now - slot.lastRefresh > 30 * 60 * 1000) { // 30 minutes
                this.refreshAd(slotId);
            }
        });
    }
    
    refreshAd(slotId) {
        if (!this.adPreferences.enabled) return;
        
        const slot = this.adSlots[slotId];
        if (!slot || !slot.loaded) return;
        
        // Reset slot
        slot.loaded = false;
        slot.attempts = 0;
        
        // Get ad element
        const adElement = document.querySelector(slot.element);
        if (adElement) {
            // Clear existing ad
            adElement.innerHTML = '';
            adElement.style.display = 'none';
            
            // Re-initialize after a short delay
            setTimeout(() => {
                adElement.style.display = 'block';
                this.loadAd(slotId);
            }, 100);
        }
        
        slot.lastRefresh = Date.now();
    }
    
    refreshAllAds() {
        Object.keys(this.adSlots).forEach(slotId => {
            this.refreshAd(slotId);
        });
        
        // Show success message
        this.showMessage('Ads refreshed successfully', 'success');
    }
    
    loadPreferences() {
        const saved = localStorage.getItem('adPreferences');
        if (saved) {
            try {
                this.adPreferences = { ...this.adPreferences, ...JSON.parse(saved) };
            } catch (error) {
                console.error('Error loading ad preferences:', error);
            }
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('adPreferences', JSON.stringify(this.adPreferences));
        } catch (error) {
            console.error('Error saving ad preferences:', error);
        }
    }
    
    updatePreferences(newPreferences) {
        this.adPreferences = { ...this.adPreferences, ...newPreferences };
        this.savePreferences();
        
        // Apply changes
        if (!newPreferences.enabled) {
            this.hideAllAds();
        } else {
            this.initializeAds();
        }
        
        // Show confirmation
        this.showMessage('Ad preferences updated', 'success');
    }
    
    trackAdLoad(slotId, success) {
        // You can implement analytics here
        console.log(`Ad ${success ? 'loaded' : 'failed'} for slot: ${slotId}`);
        
        // Example: Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'ad_load', {
                'event_category': 'ads',
                'event_label': slotId,
                'value': success ? 1 : 0
            });
        }
    }
    
    showMessage(text, type = 'info') {
        // Create and show a temporary message
        const message = document.createElement('div');
        message.className = `ad-message ${type}-message`;
        message.textContent = text;
        
        document.body.appendChild(message);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }
    
    bindEvents() {
        // Bind to UI elements
        document.getElementById('refresh-ads')?.addEventListener('click', () => {
            this.refreshAllAds();
        });
        
        document.getElementById('report-ad')?.addEventListener('click', () => {
            this.reportAd();
        });
        
        // Ad preference checkboxes
        const personalizationCheckbox = document.getElementById('ad-personalization');
        const frequencyCheckbox = document.getElementById('ad-frequency');
        
        if (personalizationCheckbox) {
            personalizationCheckbox.checked = this.adPreferences.personalized;
            personalizationCheckbox.addEventListener('change', (e) => {
                this.updatePreferences({ personalized: e.target.checked });
            });
        }
        
        if (frequencyCheckbox) {
            frequencyCheckbox.checked = this.adPreferences.enabled;
            frequencyCheckbox.addEventListener('change', (e) => {
                this.updatePreferences({ enabled: e.target.checked });
            });
        }
        
        // Custom events from main script
        document.addEventListener('videoLoaded', () => {
            this.refreshAd('mid-content');
            this.refreshAd('bottom');
        });
        
        document.addEventListener('themeChanged', () => {
            // Ads might need refreshing on theme change
            setTimeout(() => this.refreshAllAds(), 1000);
        });
    }
    
    reportAd() {
        // Open Google's ad feedback page
        window.open('https://support.google.com/adsense/troubleshooter/1631343', '_blank');
        
        // Show message
        this.showMessage('Opening Google AdSense feedback page...', 'info');
    }
    
    // Public methods
    disableAds() {
        this.updatePreferences({ enabled: false });
    }
    
    enableAds() {
        this.updatePreferences({ enabled: true });
    }
    
    toggleAds() {
        this.updatePreferences({ enabled: !this.adPreferences.enabled });
    }
    
    getAdStats() {
        return {
            totalSlots: Object.keys(this.adSlots).length,
            loadedSlots: Object.values(this.adSlots).filter(slot => slot.loaded).length,
            adBlockDetected: this.adBlockDetected,
            preferences: { ...this.adPreferences }
        };
    }
}

// Initialize Ad Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adManager = new AdManager();
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdManager;
}
