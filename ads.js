// ads.js - AdSense Management for INFINITY Player
// ================================================

let adsEnabled = true;
const adSlots = {
    header: null,
    sidebar: null,
    videoBottom: null
};

// Initialize AdSense
function initAdSense() {
    // Check if AdSense script is loaded
    if (typeof (adsbygoogle = window.adsbygoogle || []).push !== 'function') {
        console.warn('AdSense script not loaded');
        adsEnabled = false;
        return;
    }
    
    // Enable ads only if not in development/localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('AdSense disabled on localhost');
        adsEnabled = false;
        return;
    }
    
    // Create ad containers
    createAdContainers();
    
    // Load ads after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (adsEnabled) loadAllAds();
        }, 2000); // Wait for page to fully load
    });
    
    // Load ads when menu is opened
    document.addEventListener('menuOpened', () => {
        if (adsEnabled && !adSlots.sidebar) {
            loadSidebarAd();
        }
    });
    
    // Refresh ads periodically (every 30 seconds for testing, use longer in production)
    setInterval(() => {
        if (adsEnabled && document.visibilityState === 'visible') {
            refreshAds();
        }
    }, 30000);
}

// Create ad containers
function createAdContainers() {
    // Header ad (top of page)
    const headerAd = document.createElement('div');
    headerAd.className = 'ad-container header-ad';
    headerAd.innerHTML = `
        <div class="ad-label">Advertisement</div>
        <ins class="adsbygoogle"
            style="display:block"
            data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
            data-ad-slot="1234567890"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    `;
    document.body.insertBefore(headerAd, document.body.firstChild);
    
    // Video bottom ad (after video container)
    const videoBottomAd = document.createElement('div');
    videoBottomAd.className = 'ad-container video-bottom-ad';
    videoBottomAd.innerHTML = `
        <div class="ad-label">Advertisement</div>
        <ins class="adsbygoogle"
            style="display:block"
            data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
            data-ad-slot="0987654321"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    `;
    
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.parentNode.insertBefore(videoBottomAd, videoContainer.nextSibling);
    }
    
    // Sidebar ad (inside menu)
    const sidebarAdHTML = `
        <div class="ad-container sidebar-ad">
            <div class="ad-label">Advertisement</div>
            <ins class="adsbygoogle"
                style="display:block"
                data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
                data-ad-slot="5678901234"
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>
        </div>
    `;
    
    // Store for later injection when menu opens
    window.sidebarAdHTML = sidebarAdHTML;
}

// Load all ads
function loadAllAds() {
    try {
        // Load header ad
        const headerAd = document.querySelector('.header-ad ins');
        if (headerAd) {
            (adsbygoogle = window.adsbygoogle || []).push({});
            adSlots.header = headerAd;
        }
        
        // Load video bottom ad
        const videoBottomAd = document.querySelector('.video-bottom-ad ins');
        if (videoBottomAd) {
            (adsbygoogle = window.adsbygoogle || []).push({});
            adSlots.videoBottom = videoBottomAd;
        }
        
        console.log('AdSense ads loaded');
    } catch (error) {
        console.error('Error loading ads:', error);
    }
}

// Load sidebar ad when menu opens
function loadSidebarAd() {
    try {
        const menuSection = document.querySelector('.menu-section:nth-child(2)');
        if (menuSection && window.sidebarAdHTML) {
            const adContainer = document.createElement('div');
            adContainer.innerHTML = window.sidebarAdHTML;
            menuSection.parentNode.insertBefore(adContainer, menuSection.nextSibling);
            
            const sidebarAd = adContainer.querySelector('ins');
            if (sidebarAd) {
                (adsbygoogle = window.adsbygoogle || []).push({});
                adSlots.sidebar = sidebarAd;
            }
        }
    } catch (error) {
        console.error('Error loading sidebar ad:', error);
    }
}

// Refresh ads
function refreshAds() {
    if (!adsEnabled) return;
    
    // Only refresh ads that are visible
    Object.keys(adSlots).forEach(slot => {
        if (adSlots[slot] && isElementInViewport(adSlots[slot])) {
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
                console.log(`Refreshed ${slot} ad`);
            } catch (error) {
                console.error(`Error refreshing ${slot} ad:`, error);
            }
        }
    });
}

// Check if element is in viewport
function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Toggle ads (for user preference)
function toggleAds(enable) {
    adsEnabled = enable;
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
        container.style.display = enable ? 'block' : 'none';
    });
    
    localStorage.setItem('adsEnabled', enable);
    console.log(`Ads ${enable ? 'enabled' : 'disabled'}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdSense);