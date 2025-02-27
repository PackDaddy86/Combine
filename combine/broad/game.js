/**
 * NFL Combine Broad Jump Game
 * A simplified version with one attempt
 */

class BroadJumpGame {
    constructor() {
        this.initializeSounds();
        this.initializeElements();
        this.initializeState();
        this.setupEventListeners();
    }

    initializeSounds() {
        this.sounds = {
            charge: new Howl({ src: ['/assets/sounds/charge.mp3'], volume: 0.7 }),
            jump: new Howl({ src: ['/assets/sounds/jump.mp3'], volume: 0.7 }),
            success: new Howl({ src: ['/assets/sounds/success.mp3'], volume: 0.7 }),
            fail: new Howl({ src: ['/assets/sounds/fail.mp3'], volume: 0.5 })
        };
    }

    initializeElements() {
        this.elements = {
            jumper: document.getElementById('jumper'),
            powerBar: document.querySelector('.power-bar'),
            angleIndicator: document.querySelector('.angle-indicator'),
            jumpButton: document.getElementById('jump-button'),
            distanceDisplay: document.getElementById('distance'),
            jumperIndicator: document.querySelector('.jumper-indicator'),
            resultsScreen: document.querySelector('.results-screen'),
            finalDistance: document.querySelector('.final-distance'),
            rating: document.querySelector('.rating'),
            retryButton: document.querySelector('.retry-button')
        };
    }

    initializeState() {
        this.state = {
            gamePhase: 'ready', // ready, charging, angleSelection, jumping, results
            power: 0,
            angle: 0,
            distance: 0,
            isOptimalAngle: false,
            chargeInterval: null,
            angleInterval: null
        };
    }

    setupEventListeners() {
        // Button event
        this.elements.jumpButton.addEventListener('click', () => this.handleButtonPress());
        
        // Keyboard event
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleButtonPress();
            }
        });
        
        // Results screen buttons
        this.elements.retryButton.addEventListener('click', () => this.resetGame());
        
        // Direct DOM attachment for the return button (matches other games)
        const returnButton = document.querySelector('.return-button');
        returnButton.onclick = () => {
            window.location.href = '/combine/';
        };
    }

    handleButtonPress() {
        switch (this.state.gamePhase) {
            case 'ready':
                this.startCharging();
                break;
            case 'charging':
                this.stopCharging();
                this.startAngleSelection();
                break;
            case 'angleSelection':
                this.stopAngleSelection();
                this.executeJump();
                break;
        }
    }

    startCharging() {
        console.log('Starting to charge power');
        this.state.gamePhase = 'charging';
        this.elements.jumpButton.textContent = 'CHARGING...';
        this.elements.jumpButton.classList.add('charging');
        
        this.sounds.charge.play();
        
        let powerDirection = 1;
        this.state.chargeInterval = setInterval(() => {
            // Update power value (oscillate between 0 and 100)
            this.state.power += powerDirection * 2;
            
            if (this.state.power >= 100) {
                this.state.power = 100;
                powerDirection = -1;
            } else if (this.state.power <= 0) {
                this.state.power = 0;
                powerDirection = 1;
            }
            
            // Update power bar
            this.elements.powerBar.style.width = `${this.state.power}%`;
        }, 30);
    }

    stopCharging() {
        console.log('Stopping power charge at:', this.state.power);
        clearInterval(this.state.chargeInterval);
        this.elements.jumpButton.classList.remove('charging');
    }

    startAngleSelection() {
        console.log('Starting angle selection');
        this.state.gamePhase = 'angleSelection';
        this.elements.jumpButton.textContent = 'SET ANGLE';
        
        let angleDirection = 1;
        this.state.angleInterval = setInterval(() => {
            // Update angle value (oscillate between 0 and 100)
            this.state.angle += angleDirection * 3;
            
            if (this.state.angle >= 100) {
                this.state.angle = 100;
                angleDirection = -1;
            } else if (this.state.angle <= 0) {
                this.state.angle = 0;
                angleDirection = 1;
            }
            
            // Check if in optimal zone (40%-60%)
            this.state.isOptimalAngle = (this.state.angle >= 40 && this.state.angle <= 60);
            
            // Update angle indicator
            this.elements.angleIndicator.style.left = `${this.state.angle}%`;
        }, 30);
    }

    stopAngleSelection() {
        console.log('Stopping angle selection at:', this.state.angle);
        clearInterval(this.state.angleInterval);
    }

    executeJump() {
        console.log('Executing jump');
        this.state.gamePhase = 'jumping';
        this.elements.jumpButton.textContent = 'JUMPING...';
        this.elements.jumpButton.disabled = true;
        
        this.sounds.jump.play();
        
        // Add jumping animation to jumper
        this.elements.jumper.classList.add('jumping');
        
        // Calculate jump distance based on power and angle
        setTimeout(() => {
            this.calculateDistance();
            this.animateJump();
            
            // Show results after animation completes
            setTimeout(() => {
                this.showResults();
                
                // Also save to localStorage for immediate display on the combine page
                localStorage.setItem('broadJump', this.state.distance.toFixed(2));
            }, 1500);
        }, 300);
    }

    calculateDistance() {
        // Base distance based on power (0-10 feet)
        let baseDistance = (this.state.power / 100) * 10;
        
        // Angle multiplier (optimal angle gives bonus)
        let angleMultiplier = 1.0;
        
        if (this.state.isOptimalAngle) {
            angleMultiplier = 1.2; // 20% bonus for optimal angle
        } else {
            // Penalty for angles far from optimal
            const optimalCenter = 50;
            const deviation = Math.abs(this.state.angle - optimalCenter);
            // Reduces multiplier the further from optimal (down to 0.7 at extremes)
            angleMultiplier = 1.0 - (deviation / 100) * 0.3;
        }
        
        // Calculate final distance (in feet and inches)
        this.state.distance = baseDistance * angleMultiplier;
        console.log('Jump distance:', this.state.distance);
        
        // Format the distance (e.g. 8'6")
        const feet = Math.floor(this.state.distance);
        const inches = Math.round((this.state.distance - feet) * 12);
        
        // Handle case where inches equals 12 (should roll over to next foot)
        let formattedFeet = feet;
        let formattedInches = inches;
        
        if (inches === 12) {
            formattedFeet++;
            formattedInches = 0;
        }
        
        this.formattedDistance = `${formattedFeet}'${formattedInches}"`;
        
        // Update distance display
        this.elements.distanceDisplay.textContent = this.formattedDistance;
    }

    animateJump() {
        // Calculate position on track (0 to 100%)
        const jumpPercent = Math.min((this.state.distance / 12) * 100, 100);
        this.elements.jumperIndicator.style.left = `${jumpPercent}%`;
    }

    showResults() {
        console.log('Showing results');
        this.state.gamePhase = 'results';
        
        // Update final distance in results screen
        this.elements.finalDistance.textContent = this.formattedDistance;
        
        // Set rating based on distance
        let rating;
        if (this.state.distance >= 10) {
            rating = "EXCELLENT";
            this.elements.rating.style.color = "#4CAF50"; // Green
            this.sounds.success.play();
        } else if (this.state.distance >= 8) {
            rating = "GOOD";
            this.elements.rating.style.color = "#2196F3"; // Blue
            this.sounds.success.play();
        } else if (this.state.distance >= 6) {
            rating = "AVERAGE";
            this.elements.rating.style.color = "#FF9800"; // Orange
        } else {
            rating = "POOR";
            this.elements.rating.style.color = "#F44336"; // Red
            this.sounds.fail.play();
        }
        
        this.elements.rating.textContent = rating;
        
        // Save the result to Firestore
        this.saveResult();
        
        // Show results screen
        this.elements.resultsScreen.classList.remove('hidden');
    }

    saveResult() {
        console.log('Saving broad jump result to Firebase');
        console.log('Game state at save:', this.state);
        
        // Always save to localStorage first
        const distanceValue = this.state.distance.toFixed(2);
        localStorage.setItem('broadJump', distanceValue);
        console.log(`Saved broadJump = ${distanceValue} to localStorage`);
        
        // Try using the helper function from user-data.js if available
        if (typeof saveCombineEventData === 'function') {
            console.log('Using saveCombineEventData helper function');
            // Call it with a callback to log when done
            saveCombineEventData('broadJump', distanceValue)
                .then(() => {
                    console.log('Successfully saved to Firebase via helper');
                    // Check the document structure to verify
                    if (typeof checkFirebaseUserDocument === 'function') {
                        checkFirebaseUserDocument();
                    }
                })
                .catch(error => {
                    console.error('Error saving to Firebase via helper:', error);
                });
            return; // Exit early since the helper will handle all the Firebase logic
        }
        
        // Fallback: Skip localStorage entirely and go straight to Firebase
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            console.log('Firebase initialized correctly');
            const user = firebase.auth().currentUser;
            
            if (user) {
                console.log(`Broad jump: User logged in (${user.uid}), saving distance: ${this.state.distance}`);
                
                const db = firebase.firestore();
                
                console.log(`About to save broadJump = ${distanceValue} to users/${user.uid}`);
                
                // Save directly to Firestore as a root property
                db.collection('users').doc(user.uid).update({
                    broadJump: distanceValue,
                    lastUpdate: new Date()
                }).then(() => {
                    console.log(`Broad jump: Successfully saved ${distanceValue} feet to Firestore`);
                }).catch(error => {
                    console.error(`Broad jump: Error during update:`, error);
                    console.error(`Error code: ${error.code}, message: ${error.message}`);
                    
                    // If document doesn't exist, create it
                    if (error.code === 'not-found') {
                        console.log("Broad jump: Document not found, creating new one");
                        
                        db.collection('users').doc(user.uid).set({
                            email: user.email,
                            broadJump: distanceValue,
                            lastUpdate: new Date()
                        }).then(() => {
                            console.log(`Broad jump: Created new document with ${distanceValue} feet`);
                        }).catch(err => {
                            console.error("Broad jump: Error creating document:", err);
                            console.error(`Error code: ${err.code}, message: ${err.message}`);
                        });
                    }
                });
            } else {
                console.log("Broad jump: No user logged in, data saved to localStorage only");
            }
        } else {
            console.log("Broad jump: Firebase not initialized, data saved to localStorage only");
            console.log("Firebase availability:", {
                firebaseExists: typeof firebase !== 'undefined',
                authExists: typeof firebase !== 'undefined' && !!firebase.auth,
                firestoreExists: typeof firebase !== 'undefined' && !!firebase.firestore
            });
        }
    }

    resetGame() {
        console.log('Resetting game');
        // Reset UI
        this.elements.jumper.classList.remove('jumping');
        this.elements.powerBar.style.width = '0%';
        this.elements.angleIndicator.style.left = '0%';
        this.elements.jumperIndicator.style.left = '0%';
        this.elements.distanceDisplay.textContent = "0'0\"";
        this.elements.jumpButton.textContent = 'START JUMP';
        this.elements.jumpButton.disabled = false;
        this.elements.resultsScreen.classList.add('hidden');
        
        // Reset state
        this.initializeState();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for the include.js to load header
    setTimeout(() => {
        new BroadJumpGame();
    }, 100);
});
