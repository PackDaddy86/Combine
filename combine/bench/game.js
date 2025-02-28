// Make the saveCombineEventData function globally accessible for reliability
window.saveCombineEventData = saveCombineEventData;

class GameEngine {
    constructor() {
        this.sounds = {
            press: new Howl({ src: ['../../sounds/press.wav'], volume: 0.3 }),
            success: new Howl({ src: ['../../sounds/success.wav'], volume: 0.5 }),
            fail: new Howl({ src: ['../../sounds/fail.wav'], volume: 0.5 })
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
            hasAttempted: this.checkIfAttempted(),
            clickCooldown: false
        };

        this.elements = {
            bencher: document.getElementById('bencher'),
            ball: document.querySelector('.ball-container'),
            targetCenter: document.querySelector('.target-center'),
            repCounter: document.getElementById('reps'),
            repIndicator: document.querySelector('.rep-indicator')
        };
        
        this.ballAnimationId = null;
        this.gameStartTime = null;
        
        this.initControls();
        this.initEventListeners();
        
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

    initEventListeners() {
        console.log("Initializing event listeners");
        
        // Attempt a rep when spacebar is pressed
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                this.attemptRep();
            }
        });
        
        // Also attempt a rep when the whole bar track is clicked
        document.querySelector('.bar-track').addEventListener('click', () => {
            this.attemptRep();
        });
        
        // Return to combine page
        document.querySelector('.return-btn').addEventListener('click', () => {
            window.location.href = '/combine/index.html';
        });
        
        // Restart game
        document.querySelector('.restart-btn').addEventListener('click', () => {
            if (!document.querySelector('.restart-btn').classList.contains('disabled')) {
                this.resetGame();
                this.startGame();
            }
        });
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
            hasAttempted: false,
            clickCooldown: false
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
        this.gameStartTime = Date.now();
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
        if (!this.gameState.isPlaying || this.gameState.clickCooldown) {
            return;
        }
        
        console.log("Rep attempted");
        
        // Play press sound
        this.sounds.press.play();
        
        // Show press animation immediately on click
        this.elements.bencher.classList.add('press-up');
        
        // Get ball position
        const ballPosition = this.gameState.ballPosition;
        console.log("Ball position:", ballPosition);
        
        // Set clickCooldown to prevent rapid clicking
        this.gameState.clickCooldown = true;
        setTimeout(() => {
            this.gameState.clickCooldown = false;
            
            // Reset to rest position after a short delay
            this.elements.bencher.classList.remove('press-up');
        }, 300);
        
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
        
        // Add a failure indicator with opacity
        this.elements.bencher.classList.add('failed-rep-indicator');
        setTimeout(() => this.elements.bencher.classList.remove('failed-rep-indicator'), 300);
        
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
        const reps = this.gameState.reps;
        console.log('Saving bench press result:', reps);
        
        // Save to localStorage
        localStorage.setItem('benchPress', reps);
        
        // Save to Firebase via the global function if available
        if (typeof window.saveCombineEventData === 'function') {
            window.saveCombineEventData('benchPress', reps);
            console.log('Saved bench press result to Firebase');
        }
        
        // Log the event to Firebase Analytics if available
        if (window.firebaseAnalytics) {
            window.firebaseAnalytics.logGameCompletion('bench_press', reps);
            console.log('Logged bench press completion to Firebase Analytics');
            
            // Also track as a custom event with more detailed data
            if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
                firebase.analytics().logEvent('bench_press_completed', {
                    score: reps,
                    difficulty_level: this.gameState.currentSpeed.toFixed(2),
                    time_spent: (Date.now() - this.gameStartTime) / 1000 // seconds
                });
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

    resetGame() {
        console.log("Resetting game");
        
        // Reset game state
        this.gameState = {
            isPlaying: false,
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
            hasAttempted: false,
            clickCooldown: false
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
        
        // Reset restart button
        const restartButton = document.querySelector('.restart-btn');
        restartButton.classList.remove('disabled');
        restartButton.textContent = 'RESTART';
    }
}

// Initialize the game when loaded
window.addEventListener('load', () => new GameEngine());
