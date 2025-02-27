class BroadJumpGame {
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
            powerDirection: 1,
            distance: 0,
            currentAttempt: 0,
            maxAttempts: 3,
            attemptResults: ['-', '-', '-'],
            bestDistance: 0
        };
        
        this.elements = {
            jumper: document.getElementById('jumper'),
            powerBar: document.querySelector('.power-bar'),
            angleIndicator: document.querySelector('.angle-indicator'),
            jumperIndicator: document.querySelector('.jumper-indicator'),
            distanceDisplay: document.getElementById('distance'),
            jumpButton: document.getElementById('jump-button'),
            attemptDisplays: document.querySelectorAll('.attempt span'),
            gameScreen: document.querySelector('.game-container'),
            resultsScreen: document.querySelector('.results-screen'),
            finalDistance: document.querySelector('.final-distance'),
            rating: document.querySelector('.rating'),
            restartButton: document.querySelector('.restart-btn'),
            returnButton: document.querySelector('.return-btn')
        };
        
        this.baseSpeed = 1.5;
        this.initialize();
    }
    
    initialize() {
        // Set up button click events
        this.elements.jumpButton.addEventListener('click', () => {
            this.handleJumpButtonPress();
        });
        
        this.elements.restartButton.addEventListener('click', () => {
            this.restartGame();
        });
        
        this.elements.returnButton.addEventListener('click', () => {
            window.location.href = "/";
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleJumpButtonPress();
            }
        });
    }
    
    handleJumpButtonPress() {
        if (!this.gameState.isCharging && !this.gameState.isAngleSelect && !this.gameState.isJumping) {
            // Start charging
            this.startCharging();
        } else if (this.gameState.isCharging && !this.gameState.isAngleSelect) {
            // Lock in power and start angle selection
            this.startAngleSelection();
        } else if (this.gameState.isAngleSelect) {
            // Lock in angle and jump
            this.setJumpAngle();
        }
    }
    
    startCharging() {
        console.log("Starting charging");
        this.gameState.isCharging = true;
        this.gameState.power = 0;
        this.gameState.powerDirection = 1;
        
        this.elements.powerBar.style.width = '0%';
        this.elements.jumpButton.textContent = 'CHARGING...';
        this.elements.jumpButton.classList.add('charging');
        
        this.sounds.charge.play();
        
        if (this.powerAnimationId) {
            cancelAnimationFrame(this.powerAnimationId);
        }
        
        this.updatePower();
    }
    
    updatePower() {
        if (!this.gameState.isCharging) return;
        
        // Update power level
        this.gameState.power += this.gameState.powerDirection * this.baseSpeed;
        
        // Check bounds and reverse direction if needed
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
        console.log("Starting angle selection");
        // Cancel power animation
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
        console.log("Setting jump angle");
        if (this.angleInterval) {
            clearInterval(this.angleInterval);
            this.angleInterval = null;
        }
        
        this.gameState.isAngleSelect = false;
        this.executeJump();
    }
    
    executeJump() {
        console.log("Executing jump");
        this.gameState.isJumping = true;
        this.gameState.currentAttempt++;
        
        this.elements.jumpButton.classList.remove('charging');
        this.elements.jumpButton.textContent = 'JUMPING...';
        
        this.sounds.jump.play();
        
        // Animate jumper
        this.elements.jumper.classList.add('jumping');
        
        // Calculate jump distance
        const powerFactor = this.gameState.power / this.gameState.maxPower;
        
        // Optimal angle is around 50% of the bar
        const normalizedAngle = this.gameState.angle / 100;
        const optimalAngle = 0.5;
        const angleDiff = Math.abs(normalizedAngle - optimalAngle);
        const angleEfficiency = 1 - (angleDiff * 2);
        
        // Calculate final distance (0-12 feet)
        const maxDistance = 12;
        const baseDistance = powerFactor * maxDistance * 0.7;
        const angleBonus = angleEfficiency * maxDistance * 0.3;
        
        let finalDistance = baseDistance + angleBonus;
        
        // Add a bit of randomness
        finalDistance += (Math.random() * 0.3) - 0.15;
        
        // Ensure it's between 0 and 12
        finalDistance = Math.max(0, Math.min(finalDistance, 12));
        
        // Store distance
        this.gameState.distance = finalDistance;
        
        // Convert to feet and inches for display
        const feet = Math.floor(finalDistance);
        const inches = Math.round((finalDistance - feet) * 12);
        const formattedDistance = `${feet}'${inches}"`;
        
        // Move jumper indicator
        const percentDistance = (finalDistance / 12) * 100;
        this.elements.jumperIndicator.style.left = `${percentDistance}%`;
        
        // Update display after jump animation
        setTimeout(() => {
            this.sounds.landing.play();
            
            // Update distance display
            this.elements.distanceDisplay.textContent = formattedDistance;
            
            // Update attempt display
            const attemptIndex = this.gameState.currentAttempt - 1;
            this.gameState.attemptResults[attemptIndex] = formattedDistance;
            this.elements.attemptDisplays[attemptIndex].textContent = formattedDistance;
            
            // Track best distance
            if (finalDistance > this.gameState.bestDistance) {
                this.gameState.bestDistance = finalDistance;
            }
            
            // Reset for next jump or show results
            setTimeout(() => {
                this.finishJump();
            }, 1000);
        }, 800);
    }
    
    finishJump() {
        this.gameState.isJumping = false;
        this.elements.jumper.classList.remove('jumping');
        
        // Check if we've completed all attempts
        if (this.gameState.currentAttempt >= this.gameState.maxAttempts) {
            this.showResults();
        } else {
            this.elements.jumpButton.textContent = 'READY';
        }
    }
    
    showResults() {
        console.log("Showing results");
        // Format best distance for display
        const bestDistance = this.gameState.bestDistance;
        const feet = Math.floor(bestDistance);
        const inches = Math.round((bestDistance - feet) * 12);
        const formattedDistance = `${feet}'${inches}"`;
        
        // Update results screen
        this.elements.finalDistance.textContent = formattedDistance;
        
        // Set rating based on distance
        let ratingText, ratingColor;
        if (bestDistance >= 11) {
            ratingText = "ELITE";
            ratingColor = "#ffd700";
        } else if (bestDistance >= 9.5) {
            ratingText = "OUTSTANDING";
            ratingColor = "#00c6ff";
        } else if (bestDistance >= 8.5) {
            ratingText = "EXCELLENT";
            ratingColor = "#4CAF50";
        } else if (bestDistance >= 7.5) {
            ratingText = "AVERAGE";
            ratingColor = "#FF9800";
        } else {
            ratingText = "BELOW AVERAGE";
            ratingColor = "#F44336";
        }
        
        this.elements.rating.textContent = ratingText;
        this.elements.rating.style.color = ratingColor;
        
        // Save result to Firebase
        this.saveResult(this.gameState.bestDistance.toFixed(2));
        
        // Show results screen
        this.elements.gameScreen.classList.add('hidden');
        this.elements.resultsScreen.classList.remove('hidden');
    }
    
    saveResult(distance) {
        console.log(`Broad jump save result called with: ${distance}`);
        
        // Save directly to Firebase
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            const user = firebase.auth().currentUser;
            
            if (user) {
                console.log(`Broad jump: User logged in (${user.uid}), saving to Firestore`);
                
                const db = firebase.firestore();
                
                // Save directly to Firestore as a root property
                db.collection('users').doc(user.uid).update({
                    broadJump: distance,
                    lastUpdate: new Date()
                }).then(() => {
                    console.log(`Broad jump: Successfully saved ${distance} feet to Firestore`);
                }).catch(error => {
                    console.error(`Broad jump: Error during update:`, error);
                    
                    // If document doesn't exist, create it
                    if (error.code === 'not-found') {
                        console.log("Broad jump: Document not found, creating new one");
                        
                        db.collection('users').doc(user.uid).set({
                            email: user.email,
                            broadJump: distance,
                            lastUpdate: new Date()
                        }).then(() => {
                            console.log(`Broad jump: Created new document with ${distance} feet`);
                        }).catch(err => {
                            console.error("Broad jump: Error creating document:", err);
                        });
                    }
                });
            } else {
                console.log("Broad jump: No user logged in, data not saved");
            }
        } else {
            console.log("Broad jump: Firebase not initialized, data not saved");
        }
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
            powerDirection: 1,
            distance: 0,
            currentAttempt: 0,
            maxAttempts: 3,
            attemptResults: ['-', '-', '-'],
            bestDistance: 0
        };
        
        // Reset UI
        this.elements.powerBar.style.width = '0%';
        this.elements.angleIndicator.style.left = '0%';
        this.elements.jumperIndicator.style.left = '0%';
        this.elements.distanceDisplay.textContent = "0'0\"";
        this.elements.jumpButton.textContent = 'READY';
        this.elements.jumpButton.classList.remove('charging');
        
        for (let i = 0; i < this.gameState.maxAttempts; i++) {
            this.elements.attemptDisplays[i].textContent = '-';
        }
        
        // Show game screen, hide results
        this.elements.gameScreen.classList.remove('hidden');
        this.elements.resultsScreen.classList.add('hidden');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new BroadJumpGame();
});
