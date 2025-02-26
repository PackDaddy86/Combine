class GameEngine {
    constructor() {
        this.sounds = {
            step: new Howl({ src: ['/sounds/step.wav'], volume: 0.3 }),
            finish: new Howl({ src: ['/sounds/finish.wav'], volume: 0.5 })
        };
        
        this.gameState = {
            isRunning: false,
            startTime: 0,
            spaceCount: 0,
            progress: 0,
            lastPressTime: 0
        };

        this.elements = {
            runner: document.getElementById('runner'),
            progressFill: document.querySelector('.progress-fill'),
            timeDisplay: document.getElementById('time')
        };

        this.animationPaused = false;

        this.initControls();
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameState.isRunning) {
                    this.startGame();
                }
                this.handleSpacePress();
            }
        });
    }

    startGame() {
        this.gameState = {
            isRunning: true,
            startTime: Date.now(),
            spaceCount: 0,
            progress: 0,
            lastPressTime: 0
        };
        this.startSpriteAnimation();
        requestAnimationFrame(this.update.bind(this));
    }

    handleSpacePress() {
        if (!this.gameState.isRunning) return;
        
        const now = Date.now();
        const timeSinceLastPress = this.gameState.lastPressTime 
            ? now - this.gameState.lastPressTime
            : 1000;
        this.gameState.lastPressTime = now;

        // Calculate press rate (clamped 6-9 presses/sec)
        const pressRate = Math.min(Math.max(1000 / timeSinceLastPress, 6), 9);
        
        // Adjusted progress increment to achieve more realistic times
        // Increased base increment to make 4.5-4.7s more achievable with average tapping
        const progressIncrement = ((pressRate - 6) / 3) * 1.7 + 1.3;
        this.gameState.progress = Math.min(
            this.gameState.progress + progressIncrement,
            100
        );

        // Add a minimum time factor to prevent unrealistic times
        const currentTime = (now - this.gameState.startTime) / 1000;
        // Adjust display time if it's unrealistically fast based on progress
        const minTimeForProgress = (this.gameState.progress / 100) * 4.2;
        const displayTime = Math.max(currentTime, minTimeForProgress);
        this.elements.timeDisplay.textContent = displayTime.toFixed(2) + 's';

        this.sounds.step.play();
        this.applySpeedEffect(pressRate);
    }

    applySpeedEffect(pressRate) {
        const intensity = (pressRate - 6) / 3;
        this.elements.runner.style.transform = `scale(${1 + intensity * 0.15})`;
        this.elements.progressFill.style.width = `${this.gameState.progress}%`;
    }

    update() {
        if (!this.gameState.isRunning) return;

        // Calculate elapsed time
        const currentTime = Date.now();
        const elapsed = (currentTime - this.gameState.startTime) / 1000;
        this.elements.timeDisplay.textContent = elapsed.toFixed(2) + 's';

        // Update progress bar
        this.elements.progressFill.style.width = `${this.gameState.progress}%`;

        // Check finish condition
        if (this.gameState.progress >= 100) {
            this.endGame();
            return;
        }

        requestAnimationFrame(this.update.bind(this));
    }

    endGame() {
        // Calculate final time with the realistic minimum
        const rawTime = (Date.now() - this.gameState.startTime) / 1000;
        // Ensure minimum time of 4.2 seconds for a perfect run
        const finalTime = Math.max(rawTime, 4.2);
        this.gameState.isRunning = false;
        
        // Store the time using our helper function for user-specific data
        const formattedTime = finalTime.toFixed(2);
        if (typeof saveCombineEventData === 'function') {
            // First, check if user is logged in
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    console.log(`Saving 40-yard dash time to Firestore for user ${user.uid}: ${formattedTime}`);
                    saveCombineEventData('fortyYardDash', formattedTime);
                } else {
                    console.log('No user logged in, saving to localStorage only');
                    localStorage.setItem('fortyYardDash', formattedTime);
                }
            } else {
                console.log('Firebase not available, using helper function');
                saveCombineEventData('fortyYardDash', formattedTime);
            }
        } else {
            // Fallback to localStorage only
            console.log('Helper function not available, saving to localStorage only');
            localStorage.setItem('fortyYardDash', formattedTime);
        }
        
        document.querySelector('.results-screen').classList.remove('hidden');
        document.querySelector('.final-time').textContent = formattedTime + 's';
        
        this.stopSpriteAnimation();
        this.elements.progressFill.style.width = '0%';
        this.elements.runner.style.left = '0%';
        
        // Update the restart button functionality
        document.querySelector('.restart-btn').onclick = () => {
            document.querySelector('.results-screen').classList.add('hidden');
            this.startGame();
        };

        // Add a button to return to the combine page
        const returnButton = document.querySelector('.return-btn');
        if (returnButton) {
            returnButton.onclick = () => {
                window.location.href = '/combine/';
            };
        }
    }

    startSpriteAnimation() {
        this.elements.runner.style.animationPlayState = 'running';
    }

    stopSpriteAnimation() {
        this.elements.runner.style.animationPlayState = 'paused';
    }
}

// Initialize game when loaded
window.addEventListener('load', () => {
    // Initialize the game
    const game = new GameEngine();
    
    // Check if Firebase is available and user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('40-yard dash: User logged in, using user-specific data');
            } else {
                console.log('40-yard dash: No user logged in, using local data only');
            }
        });
    }
});
