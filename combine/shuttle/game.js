class ShuttleGameEngine {
    constructor() {
        this.sounds = {
            start: new Howl({ src: ['/sounds/whistle.wav'], volume: 0.5 }),
            turn: new Howl({ src: ['/sounds/step.wav'], volume: 0.3 }),
            checkpoint: new Howl({ src: ['/sounds/checkpoint.wav'], volume: 0.4 }),
            finish: new Howl({ src: ['/sounds/finish.wav'], volume: 0.5 })
        };
        
        // Create field elements
        this.createFieldElements();
        
        this.gameState = {
            isPlaying: false,
            startTime: 0,
            currentTime: 0,
            currentStep: 0,
            playerPos: { x: 300, y: 200 }, // Center of the field
            checkpoints: [
                { x: 300, y: 200, reached: false }, // Start position (Center)
                { x: 500, y: 200, reached: false }, // Right marker (5 yards)
                { x: 100, y: 200, reached: false }, // Left marker (10 yards from right)
                { x: 300, y: 200, reached: false } // Back to center
            ],
            currentTarget: 1 // Index of current checkpoint to reach
        };

        this.elements = {
            player: document.getElementById('player'),
            timerDisplay: document.getElementById('timer-display'),
            startButton: document.getElementById('start-button'),
            sequenceSteps: document.querySelectorAll('.sequence-step'),
            directionIndicator: document.querySelector('.direction-indicator'),
            pathLine: document.querySelector('.path-line'),
            field: document.querySelector('.field'),
            currentTarget: document.getElementById('current-target'),
            resultTime: document.getElementById('result-time'),
            resultRating: document.getElementById('result-rating'),
            resultFeedback: document.getElementById('result-feedback'),
            resultsScreen: document.getElementById('results-screen'),
            tryAgainButton: document.getElementById('try-again-button')
        };
        
        this.playerSpeed = 5.5; // Reduced speed for more challenge
        this.targetPadding = 15; // Smaller target area for more precision
        this.keysPressed = { up: false, down: false, left: false, right: false };
        this.animationFrameId = null;
        this.stepSoundThrottle = false;
        this.turnPenalty = 0; // Penalty for turning too early/late
        this.perfectTurnBonus = 0; // Bonus for perfect turn timing
        this.lastDirection = { x: 0, y: 0 }; // Track last movement direction
        
        // Physics parameters
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 0.4;
        this.maxSpeed = 7;
        this.friction = 0.95; // Higher value = less friction (more sliding)
        this.inertiaFactor = 0.9; // Higher value = more momentum preserved when changing direction
        this.turningDifficulty = 1.5; // Factor to make turns more difficult
        
        // Initial setup
        this.initControls();
        this.createPathArrows();
        this.resetPlayerPosition();
    }

    createFieldElements() {
        // Create center line
        const centerLine = document.createElement('div');
        centerLine.className = 'field-center-line';
        document.querySelector('.field').appendChild(centerLine);
        
        // Create yard lines (5 yard markers)
        const leftLine = document.createElement('div');
        leftLine.className = 'yard-line left';
        document.querySelector('.field').appendChild(leftLine);
        
        const rightLine = document.createElement('div');
        rightLine.className = 'yard-line right';
        document.querySelector('.field').appendChild(rightLine);
    }

    initControls() {
        // Set up keyboard event listeners
        window.addEventListener('keydown', (e) => {
            if (!this.gameState.isPlaying) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.keysPressed.up = true;
                    break;
                case 'ArrowDown':
                    this.keysPressed.down = true;
                    break;
                case 'ArrowLeft':
                    this.keysPressed.left = true;
                    break;
                case 'ArrowRight':
                    this.keysPressed.right = true;
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.keysPressed.up = false;
                    break;
                case 'ArrowDown':
                    this.keysPressed.down = false;
                    break;
                case 'ArrowLeft':
                    this.keysPressed.left = false;
                    break;
                case 'ArrowRight':
                    this.keysPressed.right = false;
                    break;
            }
        });
        
        // Set up button click event listeners
        this.elements.startButton.addEventListener('click', () => {
            if (!this.gameState.isPlaying) {
                this.startGame();
            }
        });
        
        this.elements.tryAgainButton.addEventListener('click', () => {
            // Check if all events are completed before allowing retry
            if (this.areAllEventsCompleted()) {
                this.elements.resultsScreen.style.display = 'none';
                this.resetGame();
            } else {
                // Add a shake animation to the button to indicate it can't be clicked
                this.elements.tryAgainButton.classList.add('shake');
                setTimeout(() => {
                    this.elements.tryAgainButton.classList.remove('shake');
                }, 500);
            }
        });
    }

    startGame() {
        // Reset game state
        this.gameState = {
            isPlaying: true,
            startTime: Date.now(),
            currentTime: 0,
            currentStep: 0,
            playerPos: { x: 300, y: 200 }, // Center of the field
            checkpoints: [
                { x: 300, y: 200, reached: true }, // Start position (Center)
                { x: 500, y: 200, reached: false }, // Right marker (5 yards)
                { x: 100, y: 200, reached: false }, // Left marker (10 yards from right)
                { x: 300, y: 200, reached: false } // Back to center
            ],
            currentTarget: 1 // Start with the right marker (5 yards)
        };
        
        // Reset physics values
        this.velocity = { x: 0, y: 0 };
        
        // Reset display elements
        this.resetPlayerPosition();
        this.updateSequenceSteps();
        
        // Show direction indicator
        this.elements.directionIndicator.style.display = 'none';
        
        // Update instruction text
        this.updateTargetInstructions();
        
        // Remove existing arrows and create new ones
        this.createPathArrows();
        
        // Create debug checkpoint markers (for development)
        this.showCheckpointMarkers();
        
        // Play start sound
        this.sounds.start.play();
        
        // Start game loop
        this.gameLoop();
    }

    resetPlayerPosition() {
        // Position player at center
        const fieldRect = this.elements.field.getBoundingClientRect();
        const centerX = fieldRect.width / 2;
        const centerY = fieldRect.height / 2;
        
        this.gameState.playerPos = { 
            x: centerX, 
            y: centerY 
        };
        
        // Update checkpoints based on actual field dimensions
        this.gameState.checkpoints = [
            { x: centerX, y: centerY, reached: false }, // Center
            { x: fieldRect.width - 100, y: centerY, reached: false }, // Right
            { x: 100, y: centerY, reached: false }, // Left
            { x: centerX, y: centerY, reached: false } // Back to center
        ];
        
        // Update player element position
        this.elements.player.style.left = `${this.gameState.playerPos.x}px`;
        this.elements.player.style.top = `${this.gameState.playerPos.y}px`;
    }

    gameLoop() {
        if (!this.gameState.isPlaying) return;
        
        // Update timer
        this.gameState.currentTime = (Date.now() - this.gameState.startTime) / 1000;
        this.elements.timerDisplay.textContent = this.gameState.currentTime.toFixed(2);
        
        // Move player
        this.updatePlayerPosition();
        
        // Check checkpoints
        this.checkCheckpoints();
        
        // Continue the game loop
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    updatePlayerPosition() {
        // Calculate acceleration based on key input
        let accelX = 0, accelY = 0;
        if (this.keysPressed.up) accelY -= this.acceleration;
        if (this.keysPressed.down) accelY += this.acceleration;
        if (this.keysPressed.left) accelX -= this.acceleration;
        if (this.keysPressed.right) accelX += this.acceleration;
        
        // Detect direction changes
        const isChangingDirection = {
            x: (this.velocity.x > 0 && accelX < 0) || (this.velocity.x < 0 && accelX > 0),
            y: (this.velocity.y > 0 && accelY < 0) || (this.velocity.y < 0 && accelY > 0)
        };
        
        // Apply inertia on direction change (makes it harder to change direction)
        if (isChangingDirection.x || isChangingDirection.y) {
            // Play turn sound
            if (!this.stepSoundThrottle) {
                this.stepSoundThrottle = true;
                this.sounds.turn.play();
                setTimeout(() => { this.stepSoundThrottle = false; }, 200);
            }
            
            // Instead of immediately responding to the new input, maintain some of the old momentum
            this.velocity.x *= this.inertiaFactor; // Preserve momentum in the old direction
            this.velocity.y *= this.inertiaFactor;
            
            // Reduce the effectiveness of the new input during direction change (harder to turn)
            accelX /= this.turningDifficulty;
            accelY /= this.turningDifficulty;
        }
        
        // Apply acceleration
        this.velocity.x += accelX;
        this.velocity.y += accelY;
        
        // Apply friction to gradually slow down
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Limit maximum speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
        
        // Update position based on velocity
        this.gameState.playerPos.x += this.velocity.x;
        this.gameState.playerPos.y += this.velocity.y;
        
        // Boundary checking to prevent getting stuck on edges
        const fieldRect = this.elements.field.getBoundingClientRect();
        
        // When hitting boundaries, bounce back slightly to simulate collision
        if (this.gameState.playerPos.x < 25) {
            this.gameState.playerPos.x = 25;
            this.velocity.x = -this.velocity.x * 0.3; // Bounce with reduced energy
        } else if (this.gameState.playerPos.x > 575) {
            this.gameState.playerPos.x = 575;
            this.velocity.x = -this.velocity.x * 0.3; // Bounce with reduced energy
        }
        
        if (this.gameState.playerPos.y < 25) {
            this.gameState.playerPos.y = 25;
            this.velocity.y = -this.velocity.y * 0.3; // Bounce with reduced energy
        } else if (this.gameState.playerPos.y > 375) {
            this.gameState.playerPos.y = 375;
            this.velocity.y = -this.velocity.y * 0.3; // Bounce with reduced energy
        }
        
        // Update player element position
        this.elements.player.style.left = `${this.gameState.playerPos.x}px`;
        this.elements.player.style.top = `${this.gameState.playerPos.y}px`;
        
        // Update direction indicator if moving
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            // Store last non-zero direction for approach angle checking
            if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
                this.lastDirection = { 
                    x: Math.abs(this.velocity.x) > 0.1 ? Math.sign(this.velocity.x) : 0, 
                    y: Math.abs(this.velocity.y) > 0.1 ? Math.sign(this.velocity.y) : 0 
                };
            }
            
            this.elements.directionIndicator.style.display = 'block';
            const angle = Math.atan2(this.velocity.y, this.velocity.x) * (180 / Math.PI) + 90;
            this.elements.directionIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
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
        const currentCheckpoint = this.gameState.checkpoints[this.gameState.currentTarget];
        if (!currentCheckpoint.reached) {
            const distance = Math.sqrt(
                Math.pow(this.gameState.playerPos.x - currentCheckpoint.x, 2) +
                Math.pow(this.gameState.playerPos.y - currentCheckpoint.y, 2)
            );
            
            if (distance <= this.targetPadding) {
                // Check if the approach angle is correct (adds skill requirement)
                const isApproachingCorrectly = this.checkApproachAngle(this.gameState.currentTarget);
                
                if (isApproachingCorrectly) {
                    currentCheckpoint.reached = true;
                    this.gameState.currentStep++;
                    this.gameState.currentTarget = (this.gameState.currentTarget + 1) % this.gameState.checkpoints.length;
                    
                    // Play checkpoint sound
                    this.sounds.checkpoint.play();
                    
                    // Update sequence steps UI
                    this.updateSequenceSteps();
                    
                    // Update the path arrows
                    this.createPathArrows();
                    
                    // Update instructions
                    this.updateTargetInstructions();
                }
            }
        }
    }
    
    checkApproachAngle(checkpointIndex) {
        // This adds skill requirement - player must approach from the right direction
        const checkpoint = this.gameState.checkpoints[checkpointIndex];
        
        // For the right marker (checkpoint 1), approach from the left
        if (checkpointIndex === 1) {
            return this.lastDirection.x > 0; // Moving right
        }
        // For the left marker (checkpoint 2), approach from the right
        else if (checkpointIndex === 2) {
            return this.lastDirection.x < 0; // Moving left
        }
        // For the center return (checkpoint 3), approach from the left
        else if (checkpointIndex === 3) {
            return this.lastDirection.x > 0; // Moving right
        }
        
        return true; // Default to true for other cases
    }

    updateSequenceSteps() {
        this.elements.sequenceSteps.forEach((step, index) => {
            step.classList.remove('active');
            if (index < this.gameState.currentStep) {
                step.classList.add('completed');
            } else if (index === this.gameState.currentStep) {
                step.classList.add('active');
            }
        });
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
        
        // Show results
        this.showResults(finalTime);
    }

    showResults(time) {
        // Save the result to localStorage
        this.saveResult(time);
        
        // Update results screen
        this.elements.resultTime.textContent = time.toFixed(2);
        
        // Calculate rating
        const rating = this.calculateRating(time);
        this.elements.resultRating.textContent = rating;
        
        // Generate feedback message
        const feedback = this.generateFeedback(time);
        this.elements.resultFeedback.textContent = feedback;
        
        // Check if all events are completed
        const canRetry = this.areAllEventsCompleted();
        
        // Update try again button based on completion status
        if (canRetry) {
            this.elements.tryAgainButton.textContent = 'TRY AGAIN';
            this.elements.tryAgainButton.classList.remove('disabled-button');
        } else {
            this.elements.tryAgainButton.textContent = 'COMPLETE ALL EVENTS FIRST';
            this.elements.tryAgainButton.classList.add('disabled-button');
        }
        
        // Show the results screen
        this.elements.resultsScreen.style.display = 'flex';
    }
    
    areAllEventsCompleted() {
        // Check if all events have been completed at least once
        const combineResults = JSON.parse(localStorage.getItem('combineResults')) || {};
        const fortyYardDash = localStorage.getItem('fortyYardDash');
        const verticalJump = localStorage.getItem('verticalJump');
        const benchPress = localStorage.getItem('benchPress');
        const broadJump = localStorage.getItem('broadJump');
        const coneDrill = localStorage.getItem('coneDrill');
        const shuttleCompleted = combineResults.shuttle && combineResults.shuttle.time;
        
        // Each event must have a result recorded
        return fortyYardDash && verticalJump && benchPress && 
               broadJump && coneDrill && shuttleCompleted;
    }

    calculateRating(time) {
        // Rating thresholds based on NFL Combine performances
        if (time <= 3.81) return "WORLD CLASS"; // NFL record
        if (time <= 3.9) return "ELITE";
        if (time <= 4.1) return "EXCELLENT";
        if (time <= 4.3) return "VERY GOOD";
        if (time <= 4.5) return "GOOD";
        if (time <= 4.7) return "AVERAGE";
        if (time <= 4.9) return "BELOW AVERAGE";
        return "NEEDS IMPROVEMENT";
    }

    generateFeedback(time) {
        // Generate feedback based on performance
        if (time <= 3.81) {
            return "Incredible! You've just broken the NFL Combine record!";
        } else if (time <= 3.9) {
            return "Amazing! You'd be a top performer at the NFL Combine with this time!";
        } else if (time <= 4.1) {
            return "Excellent! This is within the range of NFL-caliber athletes.";
        } else if (time <= 4.6) {
            return "Good job! With more practice, you could reach elite levels.";
        } else {
            return "Keep practicing! Focus on quick turns and explosive movements.";
        }
    }

    saveResult(time) {
        // Get existing results from localStorage
        let results = JSON.parse(localStorage.getItem('combineResults')) || {};
        
        // Update with new result
        results.shuttle = {
            time: time.toFixed(2),
            date: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('combineResults', JSON.stringify(results));
    }

    resetGame() {
        // Reset player position
        this.resetPlayerPosition();
        
        // Reset UI elements
        this.elements.timerDisplay.textContent = "0.00";
        this.elements.sequenceSteps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // Update instruction
        this.elements.currentTarget.textContent = "Press START to begin drill";
        
        // Remove path arrows
        const existingArrows = document.querySelectorAll('.path-arrow');
        existingArrows.forEach(arrow => arrow.remove());
        
        // Remove checkpoint markers
        const checkpointMarkers = document.querySelectorAll('.checkpoint-marker');
        checkpointMarkers.forEach(marker => marker.remove());
    }

    showCheckpointMarkers() {
        // Remove existing markers
        const existingMarkers = document.querySelectorAll('.checkpoint-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Create new markers for each checkpoint
        this.gameState.checkpoints.forEach((checkpoint, index) => {
            const marker = document.createElement('div');
            marker.className = 'checkpoint-marker';
            marker.style.position = 'absolute';
            marker.style.left = `${checkpoint.x}px`;
            marker.style.top = `${checkpoint.y}px`;
            marker.style.width = '20px';
            marker.style.height = '20px';
            marker.style.backgroundColor = index === 0 ? 'blue' : 'red';
            marker.style.borderRadius = '50%';
            marker.style.opacity = '0.5';
            marker.style.zIndex = '5';
            marker.style.transform = 'translate(-50%, -50%)';
            marker.textContent = index;
            marker.style.display = 'flex';
            marker.style.justifyContent = 'center';
            marker.style.alignItems = 'center';
            marker.style.color = 'white';
            marker.style.fontSize = '12px';
            marker.style.fontWeight = 'bold';
            
            this.elements.field.appendChild(marker);
        });
    }

    createPathArrows() {
        // Clear existing path
        this.elements.pathLine.innerHTML = '';
        
        // Create arrows based on current game state
        let arrows = [];
        
        if (this.gameState.currentTarget === 1) {
            // Arrow pointing to the right marker (straight right)
            arrows.push({ x: 300, y: 200, angle: 0 });
        } else if (this.gameState.currentTarget === 2) {
            // Arrow pointing to the left marker (straight left)
            arrows.push({ x: 500, y: 200, angle: 180 });
        } else if (this.gameState.currentTarget === 3) {
            // Arrow pointing back to center (straight right)
            arrows.push({ x: 100, y: 200, angle: 0 });
        }
        
        // Create the arrows
        arrows.forEach(arrow => {
            const arrowElement = document.createElement('div');
            arrowElement.className = 'direction-arrow';
            arrowElement.style.left = `${arrow.x}px`;
            arrowElement.style.top = `${arrow.y}px`;
            arrowElement.style.transform = `translate(-50%, -50%) rotate(${arrow.angle}deg)`;
            this.elements.pathLine.appendChild(arrowElement);
        });
    }

    updateTargetInstructions() {
        if (!this.gameState.isPlaying) {
            this.elements.currentTarget.textContent = "Press START to begin drill";
            return;
        }
        
        const currentStep = this.gameState.currentStep;
        let instructionText = "";
        
        switch (currentStep) {
            case 0:
                instructionText = "RUN TO THE RIGHT MARKER (5 yards) ➡️";
                break;
            case 1:
                instructionText = "RUN TO THE LEFT MARKER (10 yards) ⬅️";
                break;
            case 2:
                instructionText = "FINISH BY RUNNING TO THE CENTER! ↔️";
                break;
            case 3:
                instructionText = "CONGRATULATIONS! DRILL COMPLETE! 🎉";
                break;
            default:
                instructionText = "Follow the green arrows!";
        }
        
        this.elements.currentTarget.textContent = instructionText;
    }
}

// Initialize game when loaded
window.addEventListener('load', () => new ShuttleGameEngine());
