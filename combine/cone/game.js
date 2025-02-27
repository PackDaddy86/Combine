class GameEngine {
    constructor() {
        this.sounds = {
            start: new Howl({ src: ['/sounds/whistle.wav'], volume: 0.5 }),
            turn: new Howl({ src: ['/sounds/step.wav'], volume: 0.3 }),
            checkpoint: new Howl({ src: ['/sounds/checkpoint.wav'], volume: 0.4 }),
            finish: new Howl({ src: ['/sounds/finish.wav'], volume: 0.5 })
        };
        
        this.gameState = {
            isPlaying: false,
            startTime: 0,
            currentTime: 0,
            currentStep: 0,
            playerPos: { x: 60, y: 25 },
            checkpoints: [
                { x: 60, y: 25, reached: false }, // Start position (Cone 1)
                { x: 540, y: 25, reached: false }, // Cone 2
                { x: 60, y: 25, reached: false }, // Back to Cone 1
                { x: 540, y: 375, reached: false }, // Bend around Cone 2 heading to Cone 3
                { x: 540, y: 25, reached: false }, // Back around Cone 2
                { x: 60, y: 25, reached: false } // Back to start (Cone 1)
            ],
            conePositions: [
                { x: 60, y: 20 }, // Cone 1 position
                { x: 540, y: 20 }, // Cone 2 position
                { x: 540, y: 380 }  // Cone 3 position
            ],
            currentTarget: 1 // Index of current checkpoint to reach
        };
        
        // Make cones more visible
        const cones = document.querySelectorAll('.cone');
        cones.forEach(cone => {
            cone.innerText = '';
        });

        this.elements = {
            player: document.getElementById('player'),
            timerDisplay: document.getElementById('timer-display'),
            startButton: document.getElementById('start-button'),
            sequenceSteps: document.querySelectorAll('.sequence-step'),
            directionIndicator: document.querySelector('.direction-indicator'),
            pathLine: document.querySelector('.path-line'),
            field: document.querySelector('.field'),
            currentTarget: document.getElementById('current-target')
        };
        
        this.playerSpeed = 6.5; // Adjusted to a more realistic speed
        this.targetPadding = 25; // Increased checkpoint detection radius for smoother turns
        this.keysPressed = { up: false, down: false, left: false, right: false };
        this.animationFrameId = null;
        this.stepSoundThrottle = false;
        
        this.initControls();
        
        // Remove the confusing path lines
        this.elements.pathLine.innerHTML = '';
        
        // Create arrow indicators for the path
        this.createPathArrows();
    }

    initControls() {
        // Start button
        this.elements.startButton.addEventListener('click', () => {
            if (!this.gameState.isPlaying) {
                this.startGame();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameState.isPlaying) return;
            
            e.preventDefault();
            this.handleKeyDown(e.key);
        });
        
        document.addEventListener('keyup', (e) => {
            if (!this.gameState.isPlaying) return;
            
            e.preventDefault();
            this.handleKeyUp(e.key);
        });
    }

    handleKeyDown(key) {
        const arrows = document.querySelectorAll('.arrow');
        
        switch (key) {
            case 'ArrowUp':
                this.keysPressed.up = true;
                arrows[0].classList.add('pressed');
                break;
            case 'ArrowDown':
                this.keysPressed.down = true;
                arrows[2].classList.add('pressed');
                break;
            case 'ArrowLeft':
                this.keysPressed.left = true;
                arrows[1].classList.add('pressed');
                break;
            case 'ArrowRight':
                this.keysPressed.right = true;
                arrows[3].classList.add('pressed');
                break;
        }
    }

    handleKeyUp(key) {
        const arrows = document.querySelectorAll('.arrow');
        
        switch (key) {
            case 'ArrowUp':
                this.keysPressed.up = false;
                arrows[0].classList.remove('pressed');
                break;
            case 'ArrowDown':
                this.keysPressed.down = false;
                arrows[2].classList.remove('pressed');
                break;
            case 'ArrowLeft':
                this.keysPressed.left = false;
                arrows[1].classList.remove('pressed');
                break;
            case 'ArrowRight':
                this.keysPressed.right = false;
                arrows[3].classList.remove('pressed');
                break;
        }
    }

    startGame() {
        // Reset game state
        this.gameState = {
            isPlaying: true,
            startTime: Date.now(),
            currentTime: 0,
            currentStep: 0,
            playerPos: { x: 60, y: 25 },
            checkpoints: [
                { x: 60, y: 25, reached: true }, // Start position (already there)
                { x: 540, y: 25, reached: false }, // Cone 2
                { x: 60, y: 25, reached: false }, // Back to Cone 1
                { x: 540, y: 375, reached: false }, // Bend around Cone 2 heading to Cone 3
                { x: 540, y: 25, reached: false }, // Back around Cone 2
                { x: 60, y: 25, reached: false } // Back to start (Cone 1)
            ],
            conePositions: [
                { x: 60, y: 20 }, // Cone 1 position
                { x: 540, y: 20 }, // Cone 2 position
                { x: 540, y: 380 }  // Cone 3 position
            ],
            currentTarget: 1 // Start with target 1 (Cone 2)
        };
        
        // Show direction indicator
        this.elements.directionIndicator.style.display = 'none';
        
        // Update instruction text
        this.updateTargetInstructions();
        
        // Remove existing arrows and create new ones
        this.createPathArrows();
        
        // Create debug checkpoint markers (only during development)
        this.showCheckpointMarkers();
        
        // Reset UI
        this.elements.player.style.left = `${this.gameState.playerPos.x}px`;
        this.elements.player.style.bottom = `${this.gameState.playerPos.y}px`;
        
        this.elements.sequenceSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === 0) {
                step.classList.add('completed');
            } else if (index === 1) {
                step.classList.add('active');
            }
        });
        
        // Play start sound
        this.sounds.start.play();
        
        // Change button text
        this.elements.startButton.textContent = 'RUNNING...';
        
        // Start game loop
        this.gameLoop();
    }

    gameLoop() {
        // Calculate elapsed time
        const now = Date.now();
        this.gameState.currentTime = (now - this.gameState.startTime) / 1000;
        this.elements.timerDisplay.textContent = this.gameState.currentTime.toFixed(2);
        
        // Update player position based on key presses
        this.updatePlayerPosition();
        
        // Check for checkpoint completion
        this.checkCheckpoints();
        
        // Continue loop if still playing
        if (this.gameState.isPlaying) {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    updatePlayerPosition() {
        let dx = 0, dy = 0;
        if (this.keysPressed.up) dy += this.playerSpeed;
        if (this.keysPressed.down) dy -= this.playerSpeed;
        if (this.keysPressed.left) dx -= this.playerSpeed;
        if (this.keysPressed.right) dx += this.playerSpeed;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const factor = this.playerSpeed / Math.sqrt(dx * dx + dy * dy);
            dx *= factor;
            dy *= factor;
        }
        
        // Update player position
        this.gameState.playerPos.x += dx;
        this.gameState.playerPos.y += dy;
        
        // Boundary checking to prevent getting stuck on edges
        this.gameState.playerPos.x = Math.max(25, Math.min(this.gameState.playerPos.x, 575));
        this.gameState.playerPos.y = Math.max(25, Math.min(this.gameState.playerPos.y, 375));
        
        // Update player element position (adjust for coordinate system)
        this.elements.player.style.left = `${this.gameState.playerPos.x}px`;
        this.elements.player.style.bottom = `${this.gameState.playerPos.y}px`;
        
        // Update direction indicator if moving
        if (dx !== 0 || dy !== 0) {
            this.elements.directionIndicator.style.display = 'block';
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            this.elements.directionIndicator.style.transform = `rotate(${angle}deg)`;
            
            // Play step sound (throttled)
            if (!this.stepSoundThrottle) {
                this.stepSoundThrottle = true;
                this.sounds.turn.play();
                setTimeout(() => { this.stepSoundThrottle = false; }, 200);
            }
        } else {
            this.elements.directionIndicator.style.display = 'none';
        }
    }

    checkCheckpoints() {
        // If we're on the last step and it's been completed, end the game
        if (this.gameState.currentStep === this.gameState.checkpoints.length - 1 &&
            this.gameState.checkpoints[this.gameState.currentStep].reached) {
            this.endGame();
            return;
        }
        
        // Check if we've reached the current checkpoint
        const currentCheckpoint = this.gameState.checkpoints[this.gameState.currentStep + 1];
        if (!currentCheckpoint.reached) {
            const distance = Math.sqrt(
                Math.pow(this.gameState.playerPos.x - currentCheckpoint.x, 2) +
                Math.pow(this.gameState.playerPos.y - currentCheckpoint.y, 2)
            );
            
            if (distance <= this.targetPadding) {
                currentCheckpoint.reached = true;
                this.gameState.currentStep++;
                this.gameState.currentTarget = this.gameState.currentStep + 1;
                
                // Play checkpoint sound
                this.sounds.checkpoint.play();
                
                // Update sequence steps UI
                this.elements.sequenceSteps.forEach((step, index) => {
                    step.classList.remove('active');
                    if (index <= this.gameState.currentStep) {
                        step.classList.add('completed');
                    } else if (index === this.gameState.currentStep + 1) {
                        step.classList.add('active');
                    }
                });
                
                // Highlight the next cone to touch
                if (this.gameState.currentStep === 0) {
                    this.highlightCone(1); // Highlight cone 2
                } else if (this.gameState.currentStep === 1) {
                    this.highlightCone(0); // Highlight cone 1
                } else if (this.gameState.currentStep === 2) {
                    this.highlightCone(2); // Highlight cone 3
                } else if (this.gameState.currentStep === 3) {
                    this.highlightCone(1); // Highlight cone 2
                } else if (this.gameState.currentStep === 4) {
                    this.highlightCone(0); // Highlight cone 1
                }
                
                // Update the path arrows
                this.createPathArrows();
                
                // Update instructions
                this.updateTargetInstructions();
            }
        }
    }

    highlightCone(coneIndex) {
        const cones = document.querySelectorAll('.cone');
        cones[coneIndex].classList.add('highlight');
        setTimeout(() => {
            cones[coneIndex].classList.remove('highlight');
        }, 1500);
    }

    endGame() {
        // Stop the game
        this.gameState.isPlaying = false;
        cancelAnimationFrame(this.animationFrameId);
        
        // Play finish sound
        this.sounds.finish.play();
        
        // Stop timer
        const finalTime = this.gameState.currentTime;
        
        // Reset direction indicator
        this.elements.directionIndicator.style.display = 'none';
        
        // Update instructions
        this.elements.currentTarget.textContent = "DRILL COMPLETE! See your results...";
        
        // Store the final time
        const formattedTime = finalTime.toFixed(2);
        
        if (typeof saveCombineEventData === 'function') {
            // First, check if user is logged in
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    console.log(`Saving cone drill time to Firestore for user ${user.uid}: ${formattedTime}`);
                    saveCombineEventData('coneDrill', formattedTime);
                } else {
                    console.log('No user logged in, saving to localStorage only');
                    localStorage.setItem('coneDrill', formattedTime);
                }
            } else {
                console.log('Firebase not available, using helper function');
                saveCombineEventData('coneDrill', formattedTime);
            }
        } else {
            // Fallback to localStorage only
            console.log('Helper function not available, saving to localStorage only');
            localStorage.setItem('coneDrill', formattedTime);
        }
        
        // Show results
        this.showResults(finalTime);
    }

    showResults(finalTime) {
        // Format time for display
        const formattedTime = finalTime.toFixed(2);
        
        // Show results screen
        const resultsScreen = document.querySelector('.results-screen');
        resultsScreen.classList.remove('hidden');
        
        // Update final time display
        const finalTimeElement = document.querySelector('.final-time');
        finalTimeElement.textContent = `${formattedTime}s`;
        
        // Set rating text based on time
        const rating = document.querySelector('.rating');
        if (finalTime <= 6.5) {
            rating.textContent = "ELITE";
            rating.style.color = "#ffd700";
        } else if (finalTime <= 6.9) {
            rating.textContent = "OUTSTANDING";
            rating.style.color = "#00c6ff";
        } else if (finalTime <= 7.2) {
            rating.textContent = "EXCELLENT";
            rating.style.color = "#4CAF50";
        } else if (finalTime <= 7.5) {
            rating.textContent = "VERY GOOD";
            rating.style.color = "#8BC34A";
        } else if (finalTime <= 7.8) {
            rating.textContent = "GOOD";
            rating.style.color = "#FFC107";
        } else if (finalTime <= 8.2) {
            rating.textContent = "AVERAGE";
            rating.style.color = "#FF9800";
        } else {
            rating.textContent = "BELOW AVERAGE";
            rating.style.color = "#F44336";
        }
        
        // Setup button events
        const restartBtn = document.querySelector('.restart-btn');
        restartBtn.onclick = () => {
            resultsScreen.classList.add('hidden');
            this.elements.startButton.textContent = 'START DRILL';
            setTimeout(() => this.startGame(), 500);
        };
        
        const returnBtn = document.querySelector('.return-btn');
        returnBtn.onclick = () => {
            window.location.href = '/combine/';
        };
    }

    showCheckpointMarkers() {
        // Remove any existing markers
        const existingMarkers = document.querySelectorAll('.checkpoint-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Add checkpoint markers for debugging
        const field = document.querySelector('.field');
        this.gameState.checkpoints.forEach((checkpoint, index) => {
            if (index === 0) return; // Skip first checkpoint
            
            const marker = document.createElement('div');
            marker.className = 'checkpoint-marker';
            marker.style.position = 'absolute';
            marker.style.width = '20px';
            marker.style.height = '20px';
            marker.style.borderRadius = '50%';
            marker.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            marker.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
            marker.style.zIndex = '1';
            marker.style.left = `${checkpoint.x}px`;
            marker.style.bottom = `${checkpoint.y}px`;
            marker.style.transform = 'translate(-50%, 50%)';
            marker.textContent = index;
            marker.style.display = 'flex';
            marker.style.justifyContent = 'center';
            marker.style.alignItems = 'center';
            marker.style.fontSize = '10px';
            marker.style.color = 'white';
            
            field.appendChild(marker);
        });
    }

    createPathArrows() {
        // Remove existing arrows
        const existingArrows = document.querySelectorAll('.path-arrow');
        existingArrows.forEach(arrow => arrow.remove());
        
        // Define the path segments with directions
        const pathSegments = [
            { from: { x: 60, y: 25 }, to: { x: 540, y: 25 }, step: 1 },  // Cone 1 to Cone 2
            { from: { x: 540, y: 25 }, to: { x: 60, y: 25 }, step: 2 },  // Cone 2 to Cone 1
            { from: { x: 60, y: 25 }, to: { x: 540, y: 375 }, step: 3 },  // Cone 1 around to Cone 3
            { from: { x: 540, y: 375 }, to: { x: 540, y: 25 }, step: 4 },  // Cone 3 to Cone 2
            { from: { x: 540, y: 25 }, to: { x: 60, y: 25 }, step: 5 }   // Cone 2 to Cone 1
        ];
        
        // Get the current step we're on
        const currentStep = this.gameState.currentTarget;
        
        // Only show arrows for the current segment
        pathSegments.forEach((segment, index) => {
            if (index + 1 === currentStep) {
                this.createArrowsForSegment(segment.from, segment.to);
            }
        });
    }
    
    createArrowsForSegment(from, to) {
        // Calculate the number of arrows to place
        const distance = Math.sqrt(
            Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
        );
        
        // Place an arrow every 60 pixels
        const arrowCount = Math.max(1, Math.floor(distance / 60));
        
        for (let i = 1; i <= arrowCount; i++) {
            // Calculate position along the path
            const ratio = i / (arrowCount + 1);
            const x = from.x + (to.x - from.x) * ratio;
            const y = from.y + (to.y - from.y) * ratio;
            
            // Create arrow element
            const arrow = document.createElement('div');
            arrow.className = 'path-arrow';
            
            // Calculate angle for rotation
            const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
            
            // Apply styles
            arrow.style.position = 'absolute';
            arrow.style.left = `${x}px`;
            arrow.style.bottom = `${y}px`;
            arrow.style.width = '15px';
            arrow.style.height = '15px';
            arrow.style.backgroundColor = '#00FF00';
            arrow.style.clipPath = 'polygon(0% 0%, 100% 50%, 0% 100%)';
            arrow.style.transform = `translate(-50%, 50%) rotate(${angle}deg)`;
            arrow.style.setProperty('--angle', `${angle}deg`);
            arrow.style.zIndex = '1';
            arrow.style.opacity = '0.8';
            
            // Add to field
            this.elements.field.appendChild(arrow);
        }
    }

    // Add clear instructions for the current target
    updateTargetInstructions() {
        if (!this.gameState.isPlaying) {
            this.elements.currentTarget.textContent = "Press START to begin drill";
            return;
        }
        
        const currentStep = this.gameState.currentStep;
        let instructionText = "";
        
        switch (currentStep) {
            case 0:
                instructionText = "RUN TO CONE 2 (bottom right) ➡️";
                break;
            case 1:
                instructionText = "RUN BACK TO CONE 1 (bottom left) ⬅️";
                break;
            case 2:
                instructionText = "RUN AROUND AND UP TO CONE 3 (top right) ↗️";
                break;
            case 3:
                instructionText = "RUN DOWN TO CONE 2 (bottom right) ↘️";
                break;
            case 4:
                instructionText = "FINISH BY RUNNING TO CONE 1 (bottom left) ⬅️";
                break;
            case 5:
                instructionText = "CONGRATULATIONS! DRILL COMPLETE! 🎉";
                break;
            default:
                instructionText = "Follow the green arrows!";
        }
        
        this.elements.currentTarget.textContent = instructionText;
    }
}

// Initialize game when loaded
window.addEventListener('load', () => new GameEngine());
