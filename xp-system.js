// xp-system.js
// XP Rewards System for INFINITY YouTube Player

class XPSystem {
    constructor() {
        this.currentXP = 0;
        this.totalXP = 0;
        this.isWatching = false;
        this.watchTimer = null;
        this.lastVideoId = null;
        this.minutesWatched = 0;
        this.withdrawalHistory = [];
        this.pendingWithdrawals = [];
        
        // XP Configuration
        this.XP_PER_MINUTE = 1; // 1 XP per minute
        this.MIN_WITHDRAW_XP = 300; // Minimum 300 XP = ₹30
        this.XP_TO_RUPEE_RATE = 10; // 10 XP = ₹1
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.createNotificationContainer();
        this.createXPDisplayInMenu();
        console.log("🎮 XP System Initialized");
        console.log(`Current XP: ${this.currentXP} (₹${this.getRupeeValue()})`);
    }
    
    loadFromStorage() {
        try {
            // Load XP data
            const xpData = localStorage.getItem('infinity_xp_data');
            if (xpData) {
                const data = JSON.parse(xpData);
                this.currentXP = data.currentXP || 0;
                this.totalXP = data.totalXP || 0;
                this.withdrawalHistory = data.withdrawalHistory || [];
                this.pendingWithdrawals = data.pendingWithdrawals || [];
                console.log("✅ XP data loaded from storage");
            }
            
            // Load watch progress for current video
            const watchProgress = localStorage.getItem('current_video_progress');
            if (watchProgress) {
                const progress = JSON.parse(watchProgress);
                this.minutesWatched = progress.minutes || 0;
                this.lastVideoId = progress.videoId;
                
                // Check if it's been less than 1 hour since last watch
                const lastUpdate = new Date(progress.timestamp);
                const now = new Date();
                const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
                
                if (hoursDiff < 1 && progress.isWatching) {
                    // Continue watching from where we left off
                    this.isWatching = true;
                    console.log("⏯️ Resuming previous watch session");
                    this.startWatchingTimer();
                }
            }
        } catch (error) {
            console.error("Error loading XP data:", error);
            this.resetXPData();
        }
    }
    
    saveToStorage() {
        try {
            const xpData = {
                currentXP: this.currentXP,
                totalXP: this.totalXP,
                withdrawalHistory: this.withdrawalHistory,
                pendingWithdrawals: this.pendingWithdrawals,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('infinity_xp_data', JSON.stringify(xpData));
        } catch (error) {
            console.error("Error saving XP data:", error);
        }
    }
    
    saveWatchProgress(videoId, minutes, isWatching) {
        try {
            const progress = {
                videoId: videoId,
                minutes: minutes,
                timestamp: new Date().toISOString(),
                isWatching: isWatching
            };
            localStorage.setItem('current_video_progress', JSON.stringify(progress));
        } catch (error) {
            console.error("Error saving watch progress:", error);
        }
    }
    
    createNotificationContainer() {
        if (!document.getElementById('xp-notifications')) {
            const container = document.createElement('div');
            container.id = 'xp-notifications';
            document.body.appendChild(container);
        }
    }
    
    createXPDisplayInMenu() {
        // Create XP section in sidebar
        const menuSection = document.createElement('div');
        menuSection.className = 'menu-section';
        menuSection.innerHTML = `
            <h4><i class="fas fa-trophy"></i> XP Rewards System</h4>
            <div id="xp-display"></div>
            <div class="xp-progress-container">
                <div class="xp-progress-bar">
                    <div class="xp-progress-fill"></div>
                </div>
                <div class="xp-progress-text">
                    <span>Next Withdrawal: <span id="xp-needed">${Math.max(0, this.MIN_WITHDRAW_XP - this.currentXP)}</span> XP needed</span>
                </div>
            </div>
            <div class="xp-actions">
                <button class="menu-option" id="withdraw-xp">
                    <i class="fas fa-wallet"></i>
                    <span>Withdraw Earnings</span>
                </button>
                <button class="menu-option" id="xp-history">
                    <i class="fas fa-history"></i>
                    <span>Transaction History</span>
                </button>
                <button class="menu-option" id="xp-info">
                    <i class="fas fa-question-circle"></i>
                    <span>How to Earn XP</span>
                </button>
            </div>
        `;
        
        // Insert after owner profile section
        const ownerSection = document.querySelector('.menu-section:nth-child(1)');
        if (ownerSection) {
            ownerSection.parentNode.insertBefore(menuSection, ownerSection.nextSibling);
        }
        
        // Update XP display
        this.updateXPDisplay();
        
        // Add event listeners
        setTimeout(() => {
            const withdrawBtn = document.getElementById('withdraw-xp');
            const historyBtn = document.getElementById('xp-history');
            const infoBtn = document.getElementById('xp-info');
            
            if (withdrawBtn) {
                withdrawBtn.addEventListener('click', () => this.showWithdrawalModal());
            }
            
            if (historyBtn) {
                historyBtn.addEventListener('click', () => this.showTransactionHistory());
            }
            
            if (infoBtn) {
                infoBtn.addEventListener('click', () => this.showXPInfo());
            }
            
            // Update progress bar
            this.updateProgressBar();
        }, 100);
    }
    
    startWatching(videoId) {
        // Reset if it's a new video
        if (this.lastVideoId !== videoId) {
            this.minutesWatched = 0;
            this.lastVideoId = videoId;
        }
        
        if (!this.isWatching) {
            this.isWatching = true;
            console.log(`🎬 Started watching video: ${videoId}`);
            
            // Show XP earning notification
            this.showNotification("XP Earning Started!", "You're now earning 1 XP per minute!", "info");
            
            // Save initial progress
            this.saveWatchProgress(videoId, this.minutesWatched, true);
            
            // Start timer for XP earning
            this.startWatchingTimer();
        }
    }
    
    startWatchingTimer() {
        // Clear any existing timer
        if (this.watchTimer) {
            clearInterval(this.watchTimer);
        }
        
        // Add XP every minute
        this.watchTimer = setInterval(() => {
            if (this.isWatching && this.lastVideoId) {
                this.addXP(1); // Add 1 XP per minute
                this.minutesWatched += 1;
                this.saveWatchProgress(this.lastVideoId, this.minutesWatched, true);
                this.updateXPDisplay();
                this.updateProgressBar();
                
                // Update watch time display if element exists
                const xpWatchTime = document.getElementById('xp-watch-time');
                if (xpWatchTime) {
                    xpWatchTime.textContent = Math.floor(this.minutesWatched);
                }
            }
        }, 60000); // 1 minute
    }
    
    pauseWatching() {
        if (this.isWatching) {
            console.log("⏸️ Video paused, XP earning paused");
            this.isWatching = false;
            this.saveWatchProgress(this.lastVideoId, this.minutesWatched, false);
            
            if (this.watchTimer) {
                clearInterval(this.watchTimer);
                this.watchTimer = null;
            }
        }
    }
    
    stopWatching() {
        if (this.isWatching) {
            console.log("⏹️ Video ended, XP earning stopped");
            this.isWatching = false;
            
            // Award final XP (round down to nearest minute)
            const xpEarned = Math.floor(this.minutesWatched);
            if (xpEarned > 0) {
                this.addXP(xpEarned);
                this.showNotification(
                    "Watch Session Complete!",
                    `You earned ${xpEarned} XP from this video!`,
                    "success"
                );
            }
            
            // Clear timer
            if (this.watchTimer) {
                clearInterval(this.watchTimer);
                this.watchTimer = null;
            }
            
            // Reset for next video
            this.minutesWatched = 0;
            this.saveWatchProgress(this.lastVideoId, 0, false);
        }
    }
    
    addXP(amount) {
        const xpToAdd = Math.floor(amount);
        this.currentXP += xpToAdd;
        this.totalXP += xpToAdd;
        this.saveToStorage();
        
        // Show XP notification for significant gains
        if (xpToAdd >= 1) {
            this.showXPEarnedNotification(xpToAdd);
        }
        
        return xpToAdd;
    }
    
    deductXP(amount) {
        if (this.currentXP >= amount) {
            this.currentXP -= amount;
            this.saveToStorage();
            this.updateXPDisplay();
            this.updateProgressBar();
            return true;
        }
        return false;
    }
    
    getRupeeValue() {
        return (this.currentXP / this.XP_TO_RUPEE_RATE).toFixed(2);
    }
    
    getPendingRupeeValue() {
        const totalPending = this.pendingWithdrawals.reduce((sum, w) => sum + w.xpAmount, 0);
        return (totalPending / this.XP_TO_RUPEE_RATE).toFixed(2);
    }
    
    updateXPDisplay() {
        // Update XP display in menu
        const xpDisplay = document.getElementById('xp-display');
        if (xpDisplay) {
            xpDisplay.innerHTML = `
                <div class="xp-stats">
                    <div class="xp-stat">
                        <i class="fas fa-coins"></i>
                        <span class="xp-value">${this.currentXP} XP</span>
                    </div>
                    <div class="xp-rupee">
                        <i class="fas fa-rupee-sign"></i>
                        <span>₹${this.getRupeeValue()}</span>
                    </div>
                </div>
            `;
        }
        
        // Update withdrawal button state
        const withdrawBtn = document.getElementById('withdraw-xp');
        if (withdrawBtn) {
            const canWithdraw = this.currentXP >= this.MIN_WITHDRAW_XP;
            withdrawBtn.disabled = !canWithdraw;
            if (!canWithdraw) {
                withdrawBtn.style.opacity = '0.6';
                withdrawBtn.style.cursor = 'not-allowed';
            } else {
                withdrawBtn.style.opacity = '1';
                withdrawBtn.style.cursor = 'pointer';
            }
        }
    }
    
    updateProgressBar() {
        const progressFill = document.querySelector('.xp-progress-fill');
        const xpNeeded = document.getElementById('xp-needed');
        
        if (progressFill && xpNeeded) {
            const percentage = Math.min(100, (this.currentXP / this.MIN_WITHDRAW_XP) * 100);
            progressFill.style.width = `${percentage}%`;
            xpNeeded.textContent = Math.max(0, this.MIN_WITHDRAW_XP - this.currentXP);
        }
    }
    
    showNotification(title, message, type = "info") {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `xp-notification ${type}`;
        notification.innerHTML = `
            <div class="xp-notification-header">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <h4>${title}</h4>
                <button class="close-notification"><i class="fas fa-times"></i></button>
            </div>
            <div class="xp-notification-body">
                <p>${message}</p>
            </div>
        `;
        
        // Add to notification container
        const container = document.getElementById('xp-notifications');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 5000);
            
            // Close button
            notification.querySelector('.close-notification').addEventListener('click', () => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            });
        }
    }
    
    showXPEarnedNotification(xpEarned) {
        const rupeeValue = (xpEarned / this.XP_TO_RUPEE_RATE).toFixed(2);
        this.showNotification(
            `${xpEarned} XP Earned!`,
            `You earned ${xpEarned} XP (₹${rupeeValue})`,
            "success"
        );
    }
    
    showWithdrawalModal() {
        if (this.currentXP < this.MIN_WITHDRAW_XP) {
            this.showNotification(
                "Not Enough XP",
                `You need at least ${this.MIN_WITHDRAW_XP} XP (₹${this.MIN_WITHDRAW_XP/this.XP_TO_RUPEE_RATE}) to withdraw`,
                "error"
            );
            return;
        }
        
        const maxWithdrawXP = this.currentXP;
        const maxWithdrawRupees = (maxWithdrawXP / this.XP_TO_RUPEE_RATE).toFixed(2);
        
        const modalContent = `
            <div class="withdrawal-modal">
                <div class="modal-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Important Notice</h4>
                    <div class="warning-box">
                        <p><strong>⚠️ Warning:</strong> Clearing browser data will delete all your XP points!</p>
                        <p>Your XP is stored locally in your browser. If you clear cookies/cache, you will lose all accumulated XP.</p>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h4><i class="fas fa-wallet"></i> Withdrawal Details</h4>
                    <div class="xp-balance-display">
                        <div class="balance-item">
                            <span>Available XP:</span>
                            <strong>${this.currentXP} XP</strong>
                        </div>
                        <div class="balance-item">
                            <span>Equivalent Value:</span>
                            <strong>₹${this.getRupeeValue()}</strong>
                        </div>
                        <div class="balance-item">
                            <span>Minimum Withdrawal:</span>
                            <strong>${this.MIN_WITHDRAW_XP} XP (₹${this.MIN_WITHDRAW_XP/this.XP_TO_RUPEE_RATE})</strong>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h4><i class="fas fa-money-check-alt"></i> Withdrawal Form</h4>
                    <form id="withdrawal-form">
                        <div class="form-group">
                            <label for="withdraw-xp-amount">
                                <i class="fas fa-coins"></i> XP Amount to Withdraw
                                <span class="hint">(Max: ${maxWithdrawXP} XP = ₹${maxWithdrawRupees})</span>
                            </label>
                            <div class="input-with-button">
                                <input type="number" 
                                       id="withdraw-xp-amount" 
                                       min="${this.MIN_WITHDRAW_XP}" 
                                       max="${maxWithdrawXP}"
                                       step="10"
                                       value="${this.MIN_WITHDRAW_XP}"
                                       required>
                                <button type="button" id="max-xp-btn" class="small-btn">MAX</button>
                            </div>
                            <div class="rupee-equivalent">
                                <span id="rupee-equivalent">₹${(this.MIN_WITHDRAW_XP/this.XP_TO_RUPEE_RATE).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="withdraw-name"><i class="fas fa-user"></i> Full Name</label>
                            <input type="text" id="withdraw-name" placeholder="Enter your full name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="withdraw-upi"><i class="fas fa-university"></i> UPI ID / Bank Details</label>
                            <input type="text" id="withdraw-upi" placeholder="Enter UPI ID or Bank Account" required>
                            <small class="form-hint">e.g., name@upi or Account Number + IFSC</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="withdraw-email"><i class="fas fa-envelope"></i> Email (Optional)</label>
                            <input type="email" id="withdraw-email" placeholder="Enter email for updates">
                            <small class="form-hint">Optional - for payment confirmation</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="withdraw-phone"><i class="fas fa-phone"></i> WhatsApp Number (Optional)</label>
                            <input type="tel" id="withdraw-phone" placeholder="Enter WhatsApp number">
                        </div>
                        
                        <div class="terms-agreement">
                            <input type="checkbox" id="terms-agree" required>
                            <label for="terms-agree">
                                I understand that withdrawal requests take 15-20 working days to process.
                                I will not clear browser data until payment is received.
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="submit-withdrawal">
                                <i class="fas fa-paper-plane"></i> Submit Withdrawal Request
                            </button>
                            <button type="button" class="cancel-withdrawal">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'xp-modal';
        modal.innerHTML = `
            <div class="xp-modal-content">
                <div class="xp-modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> Withdraw Earnings</h3>
                    <button class="close-xp-modal">&times;</button>
                </div>
                <div class="xp-modal-body">
                    ${modalContent}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Add event listeners
        modal.querySelector('.close-xp-modal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('.cancel-withdrawal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        // Max XP button
        modal.querySelector('#max-xp-btn').addEventListener('click', () => {
            const input = modal.querySelector('#withdraw-xp-amount');
            input.value = maxWithdrawXP;
            this.updateRupeeEquivalent(input.value);
        });
        
        // XP amount input change
        modal.querySelector('#withdraw-xp-amount').addEventListener('input', (e) => {
            this.updateRupeeEquivalent(e.target.value);
        });
        
        // Form submission
        modal.querySelector('#withdrawal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitWithdrawal(modal);
        });
        
        // Update initial rupee equivalent
        this.updateRupeeEquivalent(this.MIN_WITHDRAW_XP);
    }
    
    updateRupeeEquivalent(xpAmount) {
        const rupeeElement = document.getElementById('rupee-equivalent');
        if (rupeeElement) {
            const rupees = (xpAmount / this.XP_TO_RUPEE_RATE).toFixed(2);
            rupeeElement.textContent = `₹${rupees}`;
        }
    }
    
    submitWithdrawal(modal) {
        const form = modal.querySelector('#withdrawal-form');
        const xpAmount = parseInt(form.querySelector('#withdraw-xp-amount').value);
        const name = form.querySelector('#withdraw-name').value.trim();
        const upi = form.querySelector('#withdraw-upi').value.trim();
        const email = form.querySelector('#withdraw-email').value.trim();
        const phone = form.querySelector('#withdraw-phone').value.trim();
        
        // Validate XP amount
        if (xpAmount < this.MIN_WITHDRAW_XP) {
            this.showNotification(
                "Invalid Amount",
                `Minimum withdrawal is ${this.MIN_WITHDRAW_XP} XP`,
                "error"
            );
            return;
        }
        
        if (xpAmount > this.currentXP) {
            this.showNotification(
                "Insufficient XP",
                `You only have ${this.currentXP} XP available`,
                "error"
            );
            return;
        }
        
        // Create withdrawal record
        const withdrawal = {
            id: 'W' + Date.now(),
            xpAmount: xpAmount,
            rupeeAmount: (xpAmount / this.XP_TO_RUPEE_RATE).toFixed(2),
            name: name,
            upi: upi,
            email: email,
            phone: phone,
            status: 'pending',
            date: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days
        };
        
        // Deduct XP
        if (this.deductXP(xpAmount)) {
            this.pendingWithdrawals.push(withdrawal);
            this.saveToStorage();
            this.updateXPDisplay();
            this.updateProgressBar();
            
            // Send email via FormSubmit
            this.sendWithdrawalEmail(withdrawal);
            
            // Show success message
            modal.querySelector('.xp-modal-body').innerHTML = `
                <div class="withdrawal-success">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Withdrawal Request Submitted!</h3>
                    <div class="success-details">
                        <p><strong>XP Deducted:</strong> ${xpAmount} XP</p>
                        <p><strong>Amount to Receive:</strong> ₹${withdrawal.rupeeAmount}</p>
                        <p><strong>Request ID:</strong> ${withdrawal.id}</p>
                        <p><strong>Estimated Payment Date:</strong> ${new Date(withdrawal.estimatedCompletion).toLocaleDateString()}</p>
                    </div>
                    <div class="success-instructions">
                        <h4><i class="fas fa-info-circle"></i> Next Steps:</h4>
                        <ul>
                            <li>Your request has been sent to our team</li>
                            <li>Payment will be processed in 15-20 working days</li>
                            <li>Do NOT clear browser data until payment is received</li>
                            <li>You will receive payment confirmation</li>
                        </ul>
                    </div>
                    <button class="close-success-modal">Close</button>
                </div>
            `;
            
            modal.querySelector('.close-success-modal').addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            });
        }
    }
    
    async sendWithdrawalEmail(withdrawal) {
        const formData = new FormData();
        formData.append('XP Amount', `${withdrawal.xpAmount} XP`);
        formData.append('Rupee Amount', `₹${withdrawal.rupeeAmount}`);
        formData.append('Name', withdrawal.name);
        formData.append('UPI/Bank Details', withdrawal.upi);
        formData.append('Email', withdrawal.email || 'Not provided');
        formData.append('Phone', withdrawal.phone || 'Not provided');
        formData.append('Request ID', withdrawal.id);
        formData.append('Date', new Date(withdrawal.date).toLocaleString());
        formData.append('Estimated Completion', new Date(withdrawal.estimatedCompletion).toLocaleDateString());
        formData.append('Current User XP', `${this.currentXP} XP`);
        formData.append('Total Earned XP', `${this.totalXP} XP`);
        formData.append('_subject', `[INFINITY XP] Withdrawal Request - ${withdrawal.id}`);
        formData.append('_captcha', 'false');
        formData.append('_template', 'table');
        
        try {
            const response = await fetch('https://formsubmit.co/ajax/shubhamPC7084@gmail.com', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('Withdrawal email sent:', result);
            
            // Also send a copy to user if email provided
            if (withdrawal.email) {
                this.sendUserConfirmationEmail(withdrawal);
            }
            
        } catch (error) {
            console.error('Error sending withdrawal email:', error);
            // Still show success to user even if email fails
        }
    }
    
    async sendUserConfirmationEmail(withdrawal) {
        const formData = new FormData();
        formData.append('Request ID', withdrawal.id);
        formData.append('XP Amount', `${withdrawal.xpAmount} XP`);
        formData.append('Amount to Receive', `₹${withdrawal.rupeeAmount}`);
        formData.append('Status', 'Pending - Processing');
        formData.append('Estimated Payment Date', new Date(withdrawal.estimatedCompletion).toLocaleDateString());
        formData.append('_subject', `[INFINITY XP] Your Withdrawal Request #${withdrawal.id}`);
        formData.append('_to', withdrawal.email);
        formData.append('_captcha', 'false');
        
        try {
            await fetch('https://formsubmit.co/ajax/shubhamPC7084@gmail.com', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            console.error('Error sending user confirmation:', error);
        }
    }
    
    showTransactionHistory() {
        const allTransactions = [...this.withdrawalHistory, ...this.pendingWithdrawals].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        let historyHTML = '';
        
        if (allTransactions.length === 0) {
            historyHTML = `
                <div class="empty-history">
                    <i class="fas fa-history"></i>
                    <p>No transactions yet</p>
                    <p class="small">Start earning XP by watching videos!</p>
                </div>
            `;
        } else {
            historyHTML = `
                <div class="transaction-history">
                    <div class="transaction-summary">
                        <div class="summary-item">
                            <span>Total Earned:</span>
                            <strong>${this.totalXP} XP</strong>
                        </div>
                        <div class="summary-item">
                            <span>Available:</span>
                            <strong>${this.currentXP} XP</strong>
                        </div>
                        <div class="summary-item">
                            <span>Pending Withdrawals:</span>
                            <strong>${this.pendingWithdrawals.length}</strong>
                        </div>
                    </div>
                    
                    <div class="transactions-list">
                        ${allTransactions.map(transaction => `
                            <div class="transaction-item ${transaction.status}">
                                <div class="transaction-header">
                                    <span class="transaction-id">${transaction.id}</span>
                                    <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
                                </div>
                                <div class="transaction-details">
                                    <div class="transaction-amount">
                                        <span class="xp-amount">${transaction.xpAmount} XP</span>
                                        <span class="rupee-amount">₹${transaction.rupeeAmount}</span>
                                    </div>
                                    <div class="transaction-status">
                                        <span class="status-badge ${transaction.status}">
                                            ${transaction.status === 'pending' ? '⏳ Processing' : '✅ Completed'}
                                        </span>
                                        ${transaction.status === 'pending' ? 
                                            `<small>Est: ${new Date(transaction.estimatedCompletion).toLocaleDateString()}</small>` : 
                                            ''
                                        }
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'xp-modal';
        modal.innerHTML = `
            <div class="xp-modal-content">
                <div class="xp-modal-header">
                    <h3><i class="fas fa-file-invoice-dollar"></i> Transaction History</h3>
                    <button class="close-xp-modal">&times;</button>
                </div>
                <div class="xp-modal-body">
                    ${historyHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        modal.querySelector('.close-xp-modal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }
    
    showXPInfo() {
        const infoContent = `
            <div class="xp-info-modal">
                <div class="modal-section">
                    <h4><i class="fas fa-coins"></i> How to Earn XP</h4>
                    <div class="info-cards">
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-play-circle"></i>
                            </div>
                            <h5>Watch Videos</h5>
                            <p>Earn <strong>1 XP for every minute</strong> of video watched</p>
                        </div>
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-tachometer-alt"></i>
                            </div>
                            <h5>Continuous Watching</h5>
                            <p>XP is calculated automatically while videos play</p>
                        </div>
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-money-bill-wave"></i>
                            </div>
                            <h5>Convert to Cash</h5>
                            <p><strong>10 XP = ₹1</strong><br>Minimum withdrawal: 300 XP (₹30)</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h4><i class="fas fa-chart-line"></i> XP Calculation</h4>
                    <div class="calculation-table">
                        <table>
                            <tr>
                                <th>Video Watch Time</th>
                                <th>XP Earned</th>
                                <th>Cash Value</th>
                            </tr>
                            <tr>
                                <td>1 minute</td>
                                <td>1 XP</td>
                                <td>₹0.10</td>
                            </tr>
                            <tr>
                                <td>10 minutes</td>
                                <td>10 XP</td>
                                <td>₹1.00</td>
                            </tr>
                            <tr>
                                <td>1 hour</td>
                                <td>60 XP</td>
                                <td>₹6.00</td>
                            </tr>
                            <tr>
                                <td>5 hours</td>
                                <td>300 XP</td>
                                <td>₹30.00</td>
                            </tr>
                            <tr>
                                <td>10 hours</td>
                                <td>600 XP</td>
                                <td>₹60.00</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="modal-section">
                    <h4><i class="fas fa-shield-alt"></i> Important Notes</h4>
                    <div class="important-notes">
                        <div class="note-item warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p><strong>XP is stored locally</strong> - Clearing browser data will delete all your XP!</p>
                        </div>
                        <div class="note-item info">
                            <i class="fas fa-info-circle"></i>
                            <p>Withdrawal requests take <strong>15-20 working days</strong> to process</p>
                        </div>
                        <div class="note-item success">
                            <i class="fas fa-check-circle"></i>
                            <p>Payment confirmation will be sent via email if provided</p>
                        </div>
                        <div class="note-item">
                            <i class="fas fa-history"></i>
                            <p>Your watch progress is saved hourly - you can continue later</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'xp-modal';
        modal.innerHTML = `
            <div class="xp-modal-content">
                <div class="xp-modal-header">
                    <h3><i class="fas fa-question-circle"></i> XP Rewards Guide</h3>
                    <button class="close-xp-modal">&times;</button>
                </div>
                <div class="xp-modal-body">
                    ${infoContent}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        modal.querySelector('.close-xp-modal').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }
    
    resetXPData() {
        this.currentXP = 0;
        this.totalXP = 0;
        this.isWatching = false;
        this.minutesWatched = 0;
        this.withdrawalHistory = [];
        this.pendingWithdrawals = [];
        this.saveToStorage();
        this.updateXPDisplay();
        this.updateProgressBar();
    }
}

// Initialize XP System when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xpSystem = new XPSystem();
    console.log("🎮 XP System loaded and ready!");
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XPSystem;
}
