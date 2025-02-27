class GameEngine {
    constructor() {
        this.sounds = {
            charge: new Howl({ src: ['/sounds/charge.wav'], volume: 0.3 }),
            jump: new Howl({ src: ['/sounds/jump.wav'], volume: 0.5 }),
            landing: new Howl({ src: ['/sounds/landing.wav'], volume: 0.4 })
        };
        
        this.gameState = {
            isCharging: false,
            power: 0,
            maxPower: 100,
            direction: 1, // 1 = up, -1 = down
            jumpHeight: 0,
            isJumping: false,
            canJump: true
        };

        this.elements = {
            jumper: document.getElementById('jumper'),
            powerIndicator: document.querySelector('.power-indicator'),
            heightDisplay: document.getElementById('height')
        };
        
        // Fixed speed values for consistent behavior 
        this.upSpeed = 1.2;
        this.downSpeed = 0.7;
        this.speedFactor = this.upSpeed; // Initial speed (going up)
        
        this.initControls();
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.startCharging();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.releaseJump();
            }
        });
    }

    startCharging() {
        if (this.gameState.isJumping || !this.gameState.canJump) return;
        
        this.gameState.isCharging = true;
        this.sounds.charge.play();
        
        // Start the power charging animation
        requestAnimationFrame(this.updatePower.bind(this));
    }

    updatePower() {
        if (!this.gameState.isCharging) return;
        
        // Set speed based on direction - always fast up, slow down
        this.speedFactor = this.gameState.direction > 0 ? this.upSpeed : this.downSpeed;
        
        // Calculate power change with fixed speeds depending on direction
        let powerChange = this.gameState.direction * this.speedFactor;
        
        // Update power
        this.gameState.power += powerChange;
        
        // Reflect at boundaries
        if (this.gameState.power >= this.gameState.maxPower) {
            this.gameState.power = this.gameState.maxPower;
            this.gameState.direction = -1;
            this.speedFactor = this.downSpeed; // Switch to down speed
        } else if (this.gameState.power <= 0) {
            this.gameState.power = 0;
            this.gameState.direction = 1;
            this.speedFactor = this.upSpeed; // Switch to up speed
        }
        
        // Update UI
        this.elements.powerIndicator.style.height = `${this.gameState.power}%`;
        
        // Continue animation with a small delay for smoother movement
        setTimeout(() => {
            requestAnimationFrame(this.updatePower.bind(this));
        }, 10); // Fixed delay for consistent timing
    }

    releaseJump() {
        if (!this.gameState.isCharging || this.gameState.isJumping) return;
        
        this.gameState.isCharging = false;
        this.gameState.isJumping = true;
        
        // Calculate jump height (inches) based on power
        // Max height is 46 inches at perfect power
        const normalizedPosition = this.gameState.power / this.gameState.maxPower;
        const maxJumpHeight = 46;
        
        // Apply a curve to the jump height calculation to make it harder to get the max height
        // The closer to the top, the more precise you need to be
        let jumpPercentage;
        if (normalizedPosition > 0.95) {
            // Super close to perfect gets max or near max
            jumpPercentage = 1 - Math.pow(1 - normalizedPosition, 2) * 5;
        } else {
            // Otherwise, scaled based on how close to the top you were
            jumpPercentage = Math.pow(normalizedPosition, 1.5);
        }
        
        this.gameState.jumpHeight = Math.round(jumpPercentage * maxJumpHeight);
        
        // Update height display
        this.elements.heightDisplay.textContent = this.gameState.jumpHeight;
        
        // Execute the jump animation
        this.performJump();
    }

    performJump() {
        this.sounds.jump.play();
        
        // Calculate pixel height for animation (scaled for visual appeal)
        const jumpPixels = (this.gameState.jumpHeight / 46) * 300;
        
        // Set jumper image to jump pose
        this.elements.jumper.style.backgroundImage = "url('/sprites/jumper-jump.png')";
        
        // Apply jump animation
        this.elements.jumper.style.setProperty('--jump-height', `${jumpPixels}px`);
        this.elements.jumper.classList.add('jumping');
        
        // Wait for animation to finish
        setTimeout(() => {
            this.sounds.landing.play();
            this.elements.jumper.classList.remove('jumping');
            this.elements.jumper.style.backgroundImage = "url('/sprites/jumper-ready.png')";
            
            setTimeout(() => {
                this.showResults();
            }, 500);
        }, 1500);
    }

    showResults() {
        const resultsScreen = document.querySelector('.results-screen');
        resultsScreen.classList.remove('hidden');
        
        const finalHeight = document.querySelector('.final-height');
        finalHeight.textContent = `${this.gameState.jumpHeight}"`;
        
        // Set rating text based on jump height
        const rating = document.querySelector('.rating');
        if (this.gameState.jumpHeight >= 44) {
            rating.textContent = "ELITE";
            rating.style.color = "#ffd700";
        } else if (this.gameState.jumpHeight >= 40) {
            rating.textContent = "OUTSTANDING";
            rating.style.color = "#00c6ff";
        } else if (this.gameState.jumpHeight >= 36) {
            rating.textContent = "EXCELLENT";
            rating.style.color = "#4CAF50";
        } else if (this.gameState.jumpHeight >= 32) {
            rating.textContent = "VERY GOOD";
            rating.style.color = "#8BC34A";
        } else if (this.gameState.jumpHeight >= 28) {
            rating.textContent = "GOOD";
            rating.style.color = "#FFC107";
        } else if (this.gameState.jumpHeight >= 24) {
            rating.textContent = "AVERAGE";
            rating.style.color = "#FF9800";
        } else {
            rating.textContent = "BELOW AVERAGE";
            rating.style.color = "#F44336";
        }
        
        // Store the vertical jump result
        const jumpHeight = this.gameState.jumpHeight.toString();
        
        if (typeof saveCombineEventData === 'function') {
            // First, check if user is logged in
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    console.log(`Saving vertical jump height to Firestore for user ${user.uid}: ${jumpHeight}`);
                    saveCombineEventData('verticalJump', jumpHeight);
                } else {
                    console.log('No user logged in, saving to localStorage only');
                    localStorage.setItem('verticalJump', jumpHeight);
                }
            } else {
                console.log('Firebase not available, using helper function');
                saveCombineEventData('verticalJump', jumpHeight);
            }
        } else {
            // Fallback to localStorage only
            console.log('Helper function not available, saving to localStorage only');
            localStorage.setItem('verticalJump', jumpHeight);
        }
        
        // Setup button events
        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.onclick = () => {
            resultsScreen.classList.add('hidden');
            this.resetGame();
        };
        
        const returnBtn = document.querySelector('.return-btn');
        returnBtn.onclick = () => {
            window.location.href = '/combine/';
        };
    }

    resetGame() {
        this.gameState = {
            isCharging: false,
            power: 0,
            maxPower: 100,
            direction: 1,
            jumpHeight: 0,
            isJumping: false,
            canJump: true
        };
        
        // Reset UI
        this.elements.powerIndicator.style.height = '0%';
        this.elements.heightDisplay.textContent = '0';
    }
}

// Initialize game when loaded
window.addEventListener('load', () => new GameEngine());
