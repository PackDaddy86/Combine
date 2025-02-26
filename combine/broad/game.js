class GameEngine {
    constructor() {
        this.sounds = {
            charge: new Howl({ src: ['/sounds/charge.wav'], volume: 0.3 }),
            jump: new Howl({ src: ['/sounds/jump.wav'], volume: 0.5 }),
            landing: new Howl({ src: ['/sounds/landing.wav'], volume: 0.4 })
        };
        
        this.gameState = {
            isCharging: false,
            isAngleSelect: false,
            isJumping: false,
            power: 0,
            angle: 0,
            maxPower: 100,
            powerDirection: 1, // 1 = increasing, -1 = decreasing
            distance: 0,
            attempts: 0,
            maxAttempts: 3,
            attemptResults: ['-', '-', '-']
        };

        this.elements = {
            jumper: document.getElementById('jumper'),
            powerBar: document.querySelector('.power-bar'),
            angleIndicator: document.querySelector('.angle-indicator'),
            jumperIndicator: document.querySelector('.jumper-indicator'),
            distanceDisplay: document.getElementById('distance'),
            jumpButton: document.getElementById('jump-button'),
            attemptDisplays: document.querySelectorAll('.attempt span')
        };
        
        // Speed factors for power bar
        this.baseSpeed = 1.5;
        this.maxSpeedMultiplier = 2.2;
        this.speedFactor = this.baseSpeed;
        
        this.powerAnimationId = null;
        this.angleInterval = null;
        
        this.initControls();
    }

    initControls() {
        // Click or touch jump button
        this.elements.jumpButton.addEventListener('click', () => {
            this.handleJumpButtonPress();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJumpButtonPress();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState.isCharging && !this.gameState.isAngleSelect) {
                    this.startAngleSelection();
                } else if (this.gameState.isAngleSelect) {
                    this.setJumpAngle();
                }
            }
        });
    }

    handleJumpButtonPress() {
        if (this.gameState.attempts >= this.gameState.maxAttempts) {
            // Game is over, show results
            this.showFinalResults();
            return;
        }
        
        if (!this.gameState.isCharging && !this.gameState.isAngleSelect && !this.gameState.isJumping) {
            // Start charging
            this.startCharging();
        }
    }

    startCharging() {
        this.gameState.isCharging = true;
        this.gameState.power = 0;
        this.gameState.powerDirection = 1;
        this.elements.powerBar.style.width = '0%';
        this.elements.jumpButton.textContent = 'CHARGING...';
        this.elements.jumpButton.classList.add('charging');
        
        this.sounds.charge.play();
        
        // Cancel any existing animation frame
        if (this.powerAnimationId) {
            cancelAnimationFrame(this.powerAnimationId);
        }
        
        // Start power animation
        this.updatePower();
    }
    
    updatePower() {
        if (!this.gameState.isCharging) return;
        
        // Calculate dynamic speed based on position (faster near top)
        const normalizedPosition = this.gameState.power / this.gameState.maxPower;
        this.speedFactor = this.baseSpeed;
        
        if (this.gameState.powerDirection > 0) {
            // Going up - get faster near the top
            this.speedFactor = this.baseSpeed + (normalizedPosition * (this.maxSpeedMultiplier - this.baseSpeed));
        } else {
            // Going down - get faster near the bottom
            this.speedFactor = this.maxSpeedMultiplier - (normalizedPosition * (this.maxSpeedMultiplier - this.baseSpeed));
        }
        
        // Update power based on direction and speed
        this.gameState.power += this.gameState.powerDirection * this.speedFactor;
        
        // Check boundaries and reverse direction if needed
        if (this.gameState.power >= this.gameState.maxPower) {
            this.gameState.power = this.gameState.maxPower;
            this.gameState.powerDirection = -1;
        } else if (this.gameState.power <= 0) {
            this.gameState.power = 0;
            this.gameState.powerDirection = 1;
        }
        
        // Update UI
        this.elements.powerBar.style.width = `${this.gameState.power}%`;
        
        // Continue animation
        this.powerAnimationId = requestAnimationFrame(() => this.updatePower());
    }

    startAngleSelection() {
        // Cancel power animation if it's running
        if (this.powerAnimationId) {
            cancelAnimationFrame(this.powerAnimationId);
            this.powerAnimationId = null;
        }
        
        this.gameState.isCharging = false;
        this.gameState.isAngleSelect = true;
        this.gameState.angle = 0;
        
        this.elements.jumpButton.textContent = 'SET ANGLE!';
        
        // Start angle oscillation
        let direction = 1;
        this.angleInterval = setInterval(() => {
            this.gameState.angle += direction * 1.5;
            
            if (this.gameState.angle >= 100) {
                this.gameState.angle = 100;
                direction = -1;
            } else if (this.gameState.angle <= 0) {
                this.gameState.angle = 0;
                direction = 1;
            }
            
            this.elements.angleIndicator.style.left = `${this.gameState.angle}%`;
        }, 20);
    }

    setJumpAngle() {
        if (this.angleInterval) {
            clearInterval(this.angleInterval);
        }
        
        this.gameState.isAngleSelect = false;
        this.executeJump();
    }

    executeJump() {
        this.gameState.isJumping = true;
        this.elements.jumpButton.classList.remove('charging');
        this.elements.jumpButton.textContent = 'JUMPING...';
        
        this.sounds.jump.play();
        
        // Animate jumper
        this.elements.jumper.classList.add('jumping');
        
        // Calculate jump distance based on power and angle
        const powerFactor = this.gameState.power / this.gameState.maxPower;
        
        // Optimal angle is around 45-55% of the bar (middle area)
        const normalizedAngle = this.gameState.angle / 100;
        const optimalAngle = 0.5;
        const angleDiff = Math.abs(normalizedAngle - optimalAngle);
        const angleEfficiency = 1 - (angleDiff * 2); // 0 to 1, with 1 being perfect
        
        // Calculate raw distance (0-12 feet)
        const maxDistance = 12;
        const baseDistance = powerFactor * maxDistance * 0.7;
        const angleBonus = angleEfficiency * maxDistance * 0.3;
        
        // Calculate final distance
        let finalDistance = baseDistance + angleBonus;
        
        // Add a tiny bit of randomness
        finalDistance += (Math.random() * 0.3) - 0.15;
        
        // Ensure it's between 0 and 12
        finalDistance = Math.max(0, Math.min(finalDistance, 12));
        
        // Record distance
        this.gameState.distance = finalDistance;
        
        // Move jumper indicator
        const percentDistance = (finalDistance / 12) * 100;
        this.elements.jumperIndicator.style.left = `${percentDistance}%`;
        
        // Format distance for display (feet and inches)
        const feet = Math.floor(finalDistance);
        const inches = Math.round((finalDistance - feet) * 12);
        const formattedDistance = `${feet}'${inches}"`;
        
        // Update distance display
        setTimeout(() => {
            this.elements.distanceDisplay.textContent = formattedDistance;
            
            // Record this attempt
            this.gameState.attemptResults[this.gameState.attempts] = formattedDistance;
            this.elements.attemptDisplays[this.gameState.attempts].textContent = formattedDistance;
            
            this.gameState.attempts++;
            
            // Play landing sound
            this.sounds.landing.play();
            
            // Reset for next jump
            setTimeout(() => {
                this.resetForNextJump();
            }, 1000);
        }, 800);
    }

    resetForNextJump() {
        this.gameState.isJumping = false;
        this.elements.jumper.classList.remove('jumping');
        
        if (this.gameState.attempts >= this.gameState.maxAttempts) {
            this.elements.jumpButton.textContent = 'SEE RESULTS';
        } else {
            this.elements.jumpButton.textContent = 'READY';
        }
    }

    showFinalResults() {
        // Find best distance
        let bestDistance = 0;
        let bestFormattedDistance = '0\'0"';
        
        for (let i = 0; i < this.gameState.maxAttempts; i++) {
            if (this.gameState.attemptResults[i] !== '-') {
                const distParts = this.gameState.attemptResults[i].split('\'');
                const feet = parseInt(distParts[0], 10);
                const inches = parseInt(distParts[1].replace('"', ''), 10);
                const totalDistance = feet + (inches / 12);
                
                if (totalDistance > bestDistance) {
                    bestDistance = totalDistance;
                    bestFormattedDistance = this.gameState.attemptResults[i];
                }
            }
        }
        
        // Save to localStorage
        localStorage.setItem('broadJump', bestFormattedDistance);
        
        // Show results screen
        const resultsScreen = document.querySelector('.results-screen');
        resultsScreen.classList.remove('hidden');
        
        // Update final distance display
        const finalDistanceElement = document.querySelector('.final-distance');
        finalDistanceElement.textContent = bestFormattedDistance;
        
        // Set rating text based on distance
        const rating = document.querySelector('.rating');
        if (bestDistance >= 10.5) {
            rating.textContent = "ELITE";
            rating.style.color = "#ffd700";
        } else if (bestDistance >= 9.5) {
            rating.textContent = "OUTSTANDING";
            rating.style.color = "#00c6ff";
        } else if (bestDistance >= 8.5) {
            rating.textContent = "EXCELLENT";
            rating.style.color = "#4CAF50";
        } else if (bestDistance >= 7.5) {
            rating.textContent = "VERY GOOD";
            rating.style.color = "#8BC34A";
        } else if (bestDistance >= 6.5) {
            rating.textContent = "GOOD";
            rating.style.color = "#FFC107";
        } else if (bestDistance >= 5) {
            rating.textContent = "AVERAGE";
            rating.style.color = "#FF9800";
        } else {
            rating.textContent = "BELOW AVERAGE";
            rating.style.color = "#F44336";
        }
        
        // Setup button events
        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.onclick = () => {
            this.restartGame();
            resultsScreen.classList.add('hidden');
        };
        
        const returnBtn = document.querySelector('.return-btn');
        returnBtn.onclick = () => {
            window.location.href = '/combine/';
        };
    }

    restartGame() {
        // Reset game state
        this.gameState = {
            isCharging: false,
            isAngleSelect: false,
            isJumping: false,
            power: 0,
            angle: 0,
            maxPower: 100,
            powerDirection: 1, // 1 = increasing, -1 = decreasing
            distance: 0,
            attempts: 0,
            maxAttempts: 3,
            attemptResults: ['-', '-', '-']
        };
        
        // Reset UI
        this.elements.powerBar.style.width = '0%';
        this.elements.angleIndicator.style.left = '0%';
        this.elements.jumperIndicator.style.left = '50px';
        this.elements.distanceDisplay.textContent = '0\'0"';
        this.elements.jumpButton.textContent = 'READY';
        this.elements.jumpButton.classList.remove('charging');
        
        // Reset attempt displays
        for (let i = 0; i < this.gameState.maxAttempts; i++) {
            this.elements.attemptDisplays[i].textContent = '-';
        }
    }
}

// Initialize game when loaded
window.addEventListener('load', () => new GameEngine());
