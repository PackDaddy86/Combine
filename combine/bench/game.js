class GameEngine {
    constructor() {
        this.sounds = {
            press: new Howl({ src: ['/sounds/press.wav'], volume: 0.3 }),
            success: new Howl({ src: ['/sounds/success.wav'], volume: 0.5 }),
            fail: new Howl({ src: ['/sounds/fail.wav'], volume: 0.5 })
        };
        
        this.gameState = {
            isPlaying: false,
            reps: 0,
            maxReps: 51,
            ballPosition: 0,  // 0 to 100 (percent)
            ballDirection: 1, // 1 = right, -1 = left
            centerSize: 30,   // Starting size of green center (pixels)
            minCenterSize: 8, // Minimum center size (pixels)
            baseSpeed: 1.0,   // Starting speed
            maxSpeed: 3.0,    // Max speed
            speedIncrement: 0.05, // Speed increases by this much each rep
            currentSpeed: 1.0,
            targetZoneWidth: 20, // Width percent of the target zone
            hasAttempted: this.checkIfAttempted()
        };

        this.elements = {
            bencher: document.getElementById('bencher'),
            ball: document.querySelector('.ball-container'),
            targetCenter: document.querySelector('.target-center'),
            repCounter: document.getElementById('reps'),
            repIndicator: document.querySelector('.rep-indicator')
        };
        
        this.ballAnimationId = null;
        
        this.initControls();
        
        // If user has already attempted, show their previous result
        if (this.gameState.hasAttempted) {
            this.showPreviousResult();
        }
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameState.isPlaying) {
                    this.startGame();
                } else {
                    this.attemptRep();
                }
            }
        });

        // Auto-start game when loaded
        setTimeout(() => this.startGame(), 1000);
    }

    startGame() {
        // Reset game state
        this.gameState = {
            isPlaying: true,
            reps: 0,
            maxReps: 51,
            ballPosition: 0,
            ballDirection: 1,
            centerSize: 30,
            minCenterSize: 8,
            baseSpeed: 1.0,
            maxSpeed: 3.0,
            speedIncrement: 0.05,
            currentSpeed: 1.0,
            targetZoneWidth: 20,
            hasAttempted: false
        };
        
        // Reset UI
        this.elements.repCounter.textContent = '0';
        this.elements.targetCenter.style.width = `${this.gameState.centerSize}px`;
        this.elements.targetCenter.style.height = `${this.gameState.centerSize}px`;
        
        // Start the ball animation
        this.moveBall();
    }

    moveBall() {
        // Calculate new position
        this.gameState.ballPosition += this.gameState.ballDirection * this.gameState.currentSpeed;
        
        // Bounce at edges
        if (this.gameState.ballPosition >= 100) {
            this.gameState.ballPosition = 100;
            this.gameState.ballDirection = -1;
        } else if (this.gameState.ballPosition <= 0) {
            this.gameState.ballPosition = 0;
            this.gameState.ballDirection = 1;
        }
        
        // Update ball position
        this.elements.ball.style.left = `${this.gameState.ballPosition}%`;
        
        // Update rep indicator position (synced with ball)
        this.elements.repIndicator.style.left = `${this.gameState.ballPosition}%`;
        
        // Continue animation if game is still playing
        if (this.gameState.isPlaying) {
            this.ballAnimationId = requestAnimationFrame(() => this.moveBall());
        }
    }

    attemptRep() {
        if (!this.gameState.isPlaying) return;
        
        // Play press sound for any attempt
        this.sounds.press.play();
        
        // Simpler approach: check if the ball is in the center zone
        // The center is at 50% of the track
        const ballPos = this.gameState.ballPosition; // 0-100
        const centerPos = 50; // center of track
        
        // Calculate distance as percentage (0-100)
        const distanceFromCenter = Math.abs(ballPos - centerPos);
        
        // Convert the center size from pixels to percentage of track
        const trackWidth = document.querySelector('.bar-track').offsetWidth;
        const centerSizeAsPercentage = (this.gameState.centerSize / trackWidth) * 100;
        
        // Half the center size as percentage
        const centerRadiusAsPercentage = centerSizeAsPercentage / 2;
        
        // Ball is in green if distance is less than center radius
        const isInGreenCenter = distanceFromCenter <= centerRadiusAsPercentage;
        
        console.log("Ball position:", ballPos);
        console.log("Center position:", centerPos);
        console.log("Distance from center (%):", distanceFromCenter);
        console.log("Center size (px):", this.gameState.centerSize);
        console.log("Center size (%):", centerSizeAsPercentage);
        console.log("Center radius (%):", centerRadiusAsPercentage);
        console.log("Is in green center:", isInGreenCenter);
        
        if (isInGreenCenter) {
            console.log("SUCCESS - Ball is in green center");
            this.successfulRep();
        } else {
            console.log("FAILED - Ball missed green center");
            this.failedRep();
        }
    }

    successfulRep() {
        // Play success sound
        this.sounds.success.play();
        
        // Flash success feedback
        const targetBall = document.querySelector('.target-ball');
        targetBall.classList.add('success-hit');
        setTimeout(() => targetBall.classList.remove('success-hit'), 300);
        
        // Show press animation
        this.elements.bencher.classList.add('press-up');
        setTimeout(() => this.elements.bencher.classList.remove('press-up'), 300);
        
        // Increment rep counter
        this.gameState.reps++;
        this.elements.repCounter.textContent = this.gameState.reps;
        
        // Make the game harder after each successful rep
        this.increaseDifficulty();
        
        // Check for max reps
        if (this.gameState.reps >= this.gameState.maxReps) {
            // Player has reached the maximum possible reps
            setTimeout(() => this.endGame(), 500);
        }
    }

    failedRep() {
        // Play fail sound
        this.sounds.fail.play();
        
        // Flash failure feedback
        const targetBall = document.querySelector('.target-ball');
        targetBall.classList.add('miss-hit');
        setTimeout(() => targetBall.classList.remove('miss-hit'), 300);
        
        // Show a slight press animation for attempt
        this.elements.bencher.classList.add('failed-press');
        setTimeout(() => this.elements.bencher.classList.remove('failed-press'), 300);
        
        // End the game with failure - directly call endGame (don't wait)
        console.log("Ending game due to missed green");
        this.endGame();
    }

    increaseDifficulty() {
        // Shrink the center target (but not below minimum)
        if (this.gameState.reps > 10) {
            const newSize = Math.max(
                this.gameState.centerSize - 0.5,
                this.gameState.minCenterSize
            );
            this.gameState.centerSize = newSize;
            this.elements.targetCenter.style.width = `${newSize}px`;
            this.elements.targetCenter.style.height = `${newSize}px`;
        }
        
        // Increase speed (but not above maximum)
        this.gameState.currentSpeed = Math.min(
            this.gameState.baseSpeed + (this.gameState.reps * this.gameState.speedIncrement),
            this.gameState.maxSpeed
        );
        
        // Shrink target zone after 20 reps
        if (this.gameState.reps > 20) {
            this.gameState.targetZoneWidth = Math.max(10, 20 - (this.gameState.reps - 20) * 0.25);
            document.querySelector('.target-zone').style.width = `${this.gameState.targetZoneWidth}%`;
            document.querySelector('.target-zone').style.left = `${50 - (this.gameState.targetZoneWidth / 2)}%`;
        }
    }

    endGame() {
        console.log("End game called");
        
        // Stop the animation
        this.stopGame();
        
        this.gameState.isPlaying = false;
        
        // Cancel any pending animation frames
        if (this.ballAnimationId) {
            cancelAnimationFrame(this.ballAnimationId);
            this.ballAnimationId = null;
        }
        
        this.elements.bencher.style.animationPlayState = 'paused';
        
        // Show the results screen
        const resultsScreen = document.querySelector('.results-screen');
        resultsScreen.classList.remove('hidden');
        
        // Update the final score
        const finalReps = document.querySelector('.final-reps');
        finalReps.textContent = `${this.gameState.reps} REPS`;
        
        // Set rating based on reps
        const rating = document.querySelector('.rating');
        if (this.gameState.reps >= 40) {
            rating.textContent = "ELITE";
            rating.style.color = "#00c6ff";
        } else if (this.gameState.reps >= 30) {
            rating.textContent = "EXCELLENT";
            rating.style.color = "#4CAF50";
        } else if (this.gameState.reps >= 25) {
            rating.textContent = "VERY GOOD";
            rating.style.color = "#8BC34A";
        } else if (this.gameState.reps >= 20) {
            rating.textContent = "GOOD";
            rating.style.color = "#FFC107";
        } else if (this.gameState.reps >= 15) {
            rating.textContent = "AVERAGE";
            rating.style.color = "#FF9800";
        } else {
            rating.textContent = "BELOW AVERAGE";
            rating.style.color = "#F44336";
        }
        
        // Save the bench press result
        this.saveResult();
        
        // Mark as attempted
        this.gameState.hasAttempted = true;
        
        // Setup button events
        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.classList.add('disabled');
        restartBtn.textContent = 'COMPLETED';
        restartBtn.onclick = null; // Remove click handler
        
        const returnBtn = document.querySelector('.return-btn');
        returnBtn.onclick = () => {
            window.location.href = '/combine/';
        };
    }

    stopGame() {
        console.log("Stop game called");
        
        // Ensure game is no longer playing
        this.gameState.isPlaying = false;
        
        // Cancel animation frame
        if (this.ballAnimationId) {
            cancelAnimationFrame(this.ballAnimationId);
            this.ballAnimationId = null;
        }
        
        // For debugging: explicitly set the position of the ball to show it's stopped
        this.elements.ball.style.transition = 'none';
        this.elements.ball.style.left = `${this.gameState.ballPosition}%`;
    }

    saveResult() {
        // Store the bench press result
        const formattedReps = this.gameState.reps.toString();
        
        console.log("Bench press save result called with:", formattedReps);
        
        // Skip localStorage entirely and go straight to Firebase
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            const user = firebase.auth().currentUser;
            
            if (user) {
                console.log(`Bench press: User logged in (${user.uid}), saving to Firestore`);
                
                const db = firebase.firestore();
                
                // Save directly to Firestore as a root property
                db.collection('users').doc(user.uid).update({
                    benchPress: formattedReps,
                    lastUpdate: new Date()
                }).then(() => {
                    console.log(`Bench press: Successfully saved ${formattedReps} reps to Firestore`);
                }).catch(error => {
                    console.error(`Bench press: Error during update:`, error);
                    
                    // If document doesn't exist, create it
                    if (error.code === 'not-found') {
                        console.log("Bench press: Document not found, creating new one");
                        
                        db.collection('users').doc(user.uid).set({
                            email: user.email,
                            benchPress: formattedReps,
                            lastUpdate: new Date()
                        }).then(() => {
                            console.log(`Bench press: Created new document with ${formattedReps} reps`);
                        }).catch(err => {
                            console.error("Bench press: Error creating document:", err);
                        });
                    }
                });
            } else {
                console.log("Bench press: No user logged in, data not saved");
            }
        } else {
            console.log("Bench press: Firebase not initialized, data not saved");
        }
    }

    // Check if user has already attempted this event
    checkIfAttempted() {
        const storedReps = localStorage.getItem('benchPress');
        
        if (storedReps) {
            console.log('User has already attempted bench press, reps:', storedReps);
            return true;
        }
        
        return false;
    }
    
    // Show the previous result
    showPreviousResult() {
        console.log('Showing previous bench press result');
        
        // Get the saved reps from localStorage
        const benchReps = localStorage.getItem('benchPress');
        
        // Display the results screen with the saved time
        document.querySelector('.results-screen').classList.remove('hidden');
        document.querySelector('.final-reps').textContent = benchReps + ' REPS';
        
        // Set rating based on reps
        const rating = document.querySelector('.rating');
        if (parseInt(benchReps) >= 40) {
            rating.textContent = "ELITE";
            rating.style.color = "#00c6ff";
        } else if (parseInt(benchReps) >= 30) {
            rating.textContent = "EXCELLENT";
            rating.style.color = "#4CAF50";
        } else if (parseInt(benchReps) >= 25) {
            rating.textContent = "VERY GOOD";
            rating.style.color = "#8BC34A";
        } else if (parseInt(benchReps) >= 20) {
            rating.textContent = "GOOD";
            rating.style.color = "#FFC107";
        } else if (parseInt(benchReps) >= 15) {
            rating.textContent = "AVERAGE";
            rating.style.color = "#FF9800";
        } else {
            rating.textContent = "BELOW AVERAGE";
            rating.style.color = "#F44336";
        }
        
        // Update the restart button to be disabled (one attempt only)
        const restartButton = document.querySelector('.restart-btn');
        restartButton.classList.add('disabled');
        restartButton.textContent = 'COMPLETED';
        restartButton.onclick = null; // Remove the click handler
        
        // Still allow returning to the combine page
        const returnButton = document.querySelector('.return-btn');
        if (returnButton) {
            returnButton.onclick = () => {
                window.location.href = '/combine/';
            };
        }
    }
}

// Initialize the game when loaded
window.addEventListener('load', () => new GameEngine());
