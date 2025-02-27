// Make the saveCombineEventData function globally accessible for reliability
window.saveCombineEventData = saveCombineEventData;

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
        // Store the bound handler to be able to remove it later
        this.keydownHandler = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameState.isPlaying) {
                    // Only start a new game if this isn't the game-over screen
                    if (document.querySelector('.results-screen').classList.contains('hidden')) {
                        this.startGame();
                    }
                } else {
                    this.attemptRep();
                }
            }
        };
        
        document.addEventListener('keydown', this.keydownHandler);
        
        // Auto-start game when loaded
        setTimeout(() => this.startGame(), 1000);
    }

    startGame() {
        console.log("Starting game");
        
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
        
        // Reset any existing animations
        if (this.ballAnimationId) {
            cancelAnimationFrame(this.ballAnimationId);
            this.ballAnimationId = null;
        }
        
        // Hide results screen if visible
        document.querySelector('.results-screen').classList.add('hidden');
        
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
        if (!this.gameState.isPlaying) {
            console.log("Game not playing, ignoring attempt");
            return;
        }
        
        console.log("Attempting rep");
        
        // Play press sound for any attempt
        try {
            this.sounds.press.play();
        } catch (e) {
            console.error("Error playing press sound", e);
        }
        
        // SUPER SIMPLE FIXED APPROACH: Use hardcoded center zone for testing
        
        // Ball position from 0-100
        const ballPosition = this.gameState.ballPosition;
        console.log("Ball position: " + ballPosition);
        
        // If ball is in center 40% of track (30-70), it's a successful hit
        if (ballPosition >= 30 && ballPosition <= 70) {
            console.log("HIT! Ball in center zone");
            this.successfulRep();
        } else {
            console.log("MISS! Ball outside center zone");
            this.failedRep();
        }
    }

    successfulRep() {
        console.log("SUCCESSFUL REP METHOD CALLED");
        
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
        console.log("FAILED REP METHOD CALLED");
        
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
        console.log("ENDING GAME - DETAILED DEBUGGING");
        
        // Ensure we only call this once
        if (!this.gameState.isPlaying) {
            console.log("Game already ended, ignoring endGame call");
            return;
        }
        
        // Stop the game
        this.gameState.isPlaying = false;
        
        // Stop animations
        if (this.ballAnimationId) {
            cancelAnimationFrame(this.ballAnimationId);
            this.ballAnimationId = null;
        }
        
        // Show results
        const resultsScreen = document.querySelector('.results-screen');
        
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
        console.log(`About to save result: ${this.gameState.reps} reps - calling saveResult() now...`);
        this.saveResult();
        console.log("Save result call complete!");
        
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
        
        // Show the results screen
        resultsScreen.classList.remove('hidden');
        console.log("endGame() complete - results screen should be visible");
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
        
        console.log("===== BENCH PRESS SAVE RESULT CALLED =====");
        console.log(`Saving ${formattedReps} reps to localStorage and Firebase`);
        
        // First, save to localStorage for immediate access on the combine page
        try {
            localStorage.setItem('benchPress', formattedReps);
            console.log(`Successfully saved ${formattedReps} to localStorage`);
        } catch (err) {
            console.error(`Error saving to localStorage:`, err);
        }
        
        // Debug localStorage values
        console.log("Current localStorage values:");
        console.log("- benchPress:", localStorage.getItem('benchPress'));
        console.log("- fortyYardDash:", localStorage.getItem('fortyYardDash'));
        console.log("- verticalJump:", localStorage.getItem('verticalJump'));
        
        // Try to use the saveCombineEventData function from user-data.js if available
        if (typeof saveCombineEventData === 'function') {
            try {
                console.log("Using saveCombineEventData function directly");
                saveCombineEventData('benchPress', formattedReps)
                    .then(() => {
                        console.log("✅ Successfully saved via saveCombineEventData function");
                    })
                    .catch(error => {
                        console.error("❌ Error saving via saveCombineEventData:", error);
                    });
            } catch (err) {
                console.error("❌ Error calling saveCombineEventData:", err);
            }
        } else {
            console.log("⚠️ saveCombineEventData function not found, using fallback method");
            
            // Skip localStorage entirely and go straight to Firebase
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
                console.log("Firebase is available, checking user state...");
                const user = firebase.auth().currentUser;
                
                if (user) {
                    console.log(`User logged in as ${user.email} (${user.uid}), saving to Firestore`);
                    
                    const db = firebase.firestore();
                    
                    // Save directly to Firestore as a root property
                    console.log(`Calling Firestore update for user ${user.uid}`);
                    db.collection('users').doc(user.uid).update({
                        benchPress: formattedReps,
                        lastUpdate: new Date()
                    }).then(() => {
                        console.log(`✅ Successfully saved ${formattedReps} reps to Firestore via update`);
                    }).catch(error => {
                        console.error(`❌ Error during update:`, error);
                        
                        // If document doesn't exist, create it
                        if (error.code === 'not-found') {
                            console.log("Document not found, trying to create new one");
                            
                            db.collection('users').doc(user.uid).set({
                                email: user.email,
                                benchPress: formattedReps,
                                lastUpdate: new Date()
                            }, { merge: true }).then(() => {
                                console.log(`✅ Created/merged document with ${formattedReps} reps`);
                            }).catch(err => {
                                console.error("❌ Error creating document:", err);
                            });
                        }
                    });
                } else {
                    console.log("❌ No user logged in, data not saved to Firebase");
                }
            } else {
                console.log("❌ Firebase not initialized, data not saved to Firebase");
                console.log("Firebase object:", typeof firebase);
                console.log("Auth available:", firebase && typeof firebase.auth);
                console.log("Firestore available:", firebase && typeof firebase.firestore);
            }
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
