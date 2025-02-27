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
            targetZoneWidth: 20 // Width percent of the target zone
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
            targetZoneWidth: 20
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
        
        // Check if ball position is within target zone
        const targetZoneStart = 50 - (this.gameState.targetZoneWidth / 2);
        const targetZoneEnd = 50 + (this.gameState.targetZoneWidth / 2);
        const isInTargetZone = (
            this.gameState.ballPosition >= targetZoneStart && 
            this.gameState.ballPosition <= targetZoneEnd
        );
        
        // Check if center of ball is aligned with center of green
        const ballCenterPos = this.gameState.ballPosition;
        const trackCenter = 50;
        const centerRadius = this.gameState.centerSize / 2;
        const trackWidth = 100;
        const pixelDistance = Math.abs(ballCenterPos - trackCenter) * trackWidth / 100;
        const pixelThreshold = centerRadius;
        
        // Combined check - is the ball in the target zone AND is the center aligned?
        const isSuccessful = isInTargetZone && (pixelDistance <= pixelThreshold);
        
        if (isSuccessful) {
            // Successful rep
            this.successfulRep();
        } else {
            // Failed rep
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
            setTimeout(() => this.endGame(true), 500);
        }
    }

    failedRep() {
        // Play fail sound
        this.sounds.fail.play();
        
        // Flash failure feedback
        const targetBall = document.querySelector('.target-ball');
        targetBall.classList.add('miss-hit');
        setTimeout(() => targetBall.classList.remove('miss-hit'), 300);
        
        // End the game with failure
        this.endGame(false);
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

    endGame(isVictory) {
        // Stop the game
        this.gameState.isPlaying = false;
        cancelAnimationFrame(this.ballAnimationId);
        
        // Show results screen
        const resultsScreen = document.querySelector('.results-screen');
        resultsScreen.classList.remove('hidden');
        
        // Display final rep count
        const finalReps = document.querySelector('.final-reps');
        finalReps.textContent = `${this.gameState.reps} REPS`;
        
        // Set rating text based on rep count
        const rating = document.querySelector('.rating');
        if (this.gameState.reps >= 50) {
            rating.textContent = "ELITE";
            rating.style.color = "#ffd700";
        } else if (this.gameState.reps >= 40) {
            rating.textContent = "OUTSTANDING";
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
        
        // Store the bench press result
        const formattedReps = this.gameState.reps.toString();
        
        if (typeof saveCombineEventData === 'function') {
            // First, check if user is logged in
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    console.log(`Saving bench press reps to Firestore for user ${user.uid}: ${formattedReps}`);
                    
                    // Try the direct save function first
                    if (typeof saveEventDirectly === 'function') {
                        console.log('Using direct save function for bench press');
                        saveEventDirectly('benchPress', formattedReps);
                    } else {
                        console.log('Using helper function for bench press');
                        saveCombineEventData('benchPress', formattedReps);
                    }
                } else {
                    console.log('No user logged in, saving to localStorage only');
                    localStorage.setItem('benchPress', formattedReps);
                }
            } else {
                console.log('Firebase not available, using helper function');
                saveCombineEventData('benchPress', formattedReps);
            }
        } else {
            // Fallback to localStorage only
            console.log('Helper function not available, saving to localStorage only');
            localStorage.setItem('benchPress', formattedReps);
        }
        
        // Setup button events
        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.onclick = () => {
            resultsScreen.classList.add('hidden');
            this.startGame();
        };
        
        const returnBtn = document.querySelector('.return-btn');
        returnBtn.onclick = () => {
            window.location.href = '/combine/';
        };
    }
}

// Initialize the game when loaded
window.addEventListener('load', () => {
    const game = new GameEngine();
    
    // Check if Firebase is available and user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Bench press: User logged in, using user-specific data');
            } else {
                console.log('Bench press: No user logged in, using local data only');
            }
        });
    }
});
