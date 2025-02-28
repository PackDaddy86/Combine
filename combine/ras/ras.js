// Initialize RAS calculator
document.addEventListener('DOMContentLoaded', function() {
    console.log('RAS calculator loaded');
    
    // Set up event listeners
    setupEventListeners();
    
    // Update the player info display from localStorage
    updatePlayerInfoDisplay();
    
    // Check if user is logged in and load their data
    checkUserStatusAndLoadData();
    
    // Initialize grades
    calculateRASScores();
    
    // Update saved results list
    updateSavedResultsList();
});

// Check user status and load data
function checkUserStatusAndLoadData() {
    console.log('Checking user status and loading data...');
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User logged in:', user.uid);
                // Load user-specific RAS data
                getUserData(user.uid);
            } else {
                console.log('No user logged in, using local storage only');
                loadFromLocalStorage();
            }
        });
    } else {
        console.log('Firebase not available, using local storage only');
        loadFromLocalStorage();
    }
}

// Load data from localStorage
function loadFromLocalStorage() {
    // Get player info from localStorage
    const playerInfoStr = localStorage.getItem('playerInfo');
    
    if (playerInfoStr) {
        const playerInfo = JSON.parse(playerInfoStr);
        updatePlayerName(playerInfo.name, playerInfo.position, playerInfo.school, playerInfo.year);
    }
    
    // Load combine data if available
    const combineResults = loadCombineResults();
    
    if (combineResults) {
        console.log('Loading combine results from localStorage:', combineResults);
        
        // Update form fields with combine results
        if (combineResults.fortyYardDash) {
            document.getElementById('forty-value').textContent = combineResults.fortyYardDash;
        }
        
        if (combineResults.verticalJump) {
            document.getElementById('vertical-value').textContent = combineResults.verticalJump;
        }
        
        if (combineResults.benchPress) {
            document.getElementById('bench-value').textContent = combineResults.benchPress;
        }
        
        if (combineResults.broadJump) {
            document.getElementById('broad-value').textContent = combineResults.broadJump;
        }
        
        if (combineResults.coneDrill) {
            document.getElementById('cone-value').textContent = combineResults.coneDrill;
        }
        
        if (combineResults.shuttleRun) {
            document.getElementById('shuttle-value').textContent = combineResults.shuttleRun;
        }
        
        // Calculate RAS scores based on the loaded data
        calculateRASScores();
    }
}

// Check if user is logged in
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in
        getUserData(user.uid);
    } else {
        // No user is signed in, display message or redirect
        setDefaultValues();
        document.getElementById('player-name').innerText = "LOGIN TO VIEW YOUR RAS CARD";
    }
});

// RAS calculation constants
const scoreRanges = {
    poor: { min: 0, max: 3.99 },
    belowAverage: { min: 4, max: 4.99 },
    average: { min: 5, max: 6.99 },
    good: { min: 7, max: 8.99 },
    excellent: { min: 9, max: 10 }
};

// Set initial default values (to avoid NaN on first load)
//setDefaultValues();
    
// Load player data from localStorage
//loadPlayerData();
    
// Event listeners for buttons
document.getElementById('update-info').addEventListener('click', updatePlayerInfo);
document.getElementById('save-card').addEventListener('click', saveAsImage);
document.getElementById('share-card').addEventListener('click', shareResults);
    
// Calculate and display RAS scores
//calculateRASScores();
    
// Add event listeners to update grades when input values change
setupGradeListeners();

// Set default values to avoid NaN issues
function setDefaultValues() {
    // Add default RAS class for initial display
    const container = document.querySelector('.ras-score-container');
    container.classList.add('ras-good');
    
    document.getElementById('overall-ras').textContent = "7.16";
    
    // Default values for metrics if nothing is in localStorage
    const defaults = {
        'forty-value': '4.77',
        'twenty-value': '2.81',
        'ten-value': '1.70',
        'vertical-value': '34.5',
        'broad-value': '9\'2"',
        'bench-value': '22',
        'cone-value': '7.39',
        'shuttle-value': '4.32',
        'height-value': '6\'2"',
        'weight-value': '225'
    };
    
    // Set default values for all metrics
    Object.keys(defaults).forEach(id => {
        document.getElementById(id).textContent = defaults[id];
    });
    
    // Set default scores
    const defaultScore = '7.00';
    const scoreElements = [
        'forty-score', 'twenty-score', 'ten-score',
        'vertical-score', 'broad-score', 'bench-score',
        'cone-score', 'shuttle-score',
        'height-score', 'weight-score'
    ];
    
    scoreElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = defaultScore;
            element.className = 'metric-score score-good';
        }
    });
}

function loadPlayerData() {
    // Get combine results from localStorage
    const fortyYardDash = localStorage.getItem('fortyYardDash') || '';
    const verticalJump = localStorage.getItem('verticalJump') || '';
    const benchPress = localStorage.getItem('benchPress') || '';
    const broadJump = localStorage.getItem('broadJump') || '';
    const coneDrill = localStorage.getItem('coneDrill') || '';
    
    // Get shuttle results from JSON storage
    const combineResults = JSON.parse(localStorage.getItem('combineResults')) || {};
    const shuttleTime = combineResults.shuttle ? combineResults.shuttle.time : '';
    
    // Calculate split times (estimated)
    const tenYardSplit = estimateSplitTime(fortyYardDash, 10);
    const twentyYardSplit = estimateSplitTime(fortyYardDash, 20);
    
    // Set form values if they exist in localStorage
    const playerInfo = JSON.parse(localStorage.getItem('playerInfo')) || {};
    if (playerInfo.name) document.getElementById('name').value = playerInfo.name;
    if (playerInfo.position) document.getElementById('position').value = playerInfo.position;
    if (playerInfo.school) document.getElementById('school').value = playerInfo.school;
    if (playerInfo.year) document.getElementById('year').value = playerInfo.year;
    
    // Set height and weight in form
    const defaultHeight = "6'2\"";
    const defaultWeight = "225";
    document.getElementById('height').value = playerInfo.height || defaultHeight;
    document.getElementById('weight').value = playerInfo.weight || defaultWeight;
    
    // Update player name banner
    updatePlayerInfoDisplay();
    
    // Set values in the RAS card
    const height = playerInfo.height || defaultHeight;
    const weight = playerInfo.weight || defaultWeight;
    
    // Set values
    document.getElementById('forty-value').textContent = fortyYardDash || "4.77";
    document.getElementById('twenty-value').textContent = twentyYardSplit || "2.81";
    document.getElementById('ten-value').textContent = tenYardSplit || "1.70";
    document.getElementById('vertical-value').textContent = verticalJump || "34.5";
    document.getElementById('broad-value').textContent = formatBroadJump(broadJump) || "9'2\"";
    document.getElementById('bench-value').textContent = benchPress || "22";
    document.getElementById('cone-value').textContent = coneDrill || "7.39";
    document.getElementById('shuttle-value').textContent = shuttleTime || "4.32";
    document.getElementById('height-value').textContent = height;
    document.getElementById('weight-value').textContent = weight;
}

function formatBroadJump(broadJump) {
    if (!broadJump) return "--";
    
    // If it's already in the right format, return it
    if (broadJump.includes("'")) return broadJump;
    
    // Try to convert to feet and inches
    try {
        const inches = parseInt(broadJump);
        if (isNaN(inches)) return broadJump;
        
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}'${remainingInches}"`;
    } catch (e) {
        return broadJump;
    }
}

function estimateSplitTime(fortyTime, yards) {
    if (!fortyTime) return "";
    
    // Simple estimation of split times
    const fortySeconds = parseFloat(fortyTime);
    if (isNaN(fortySeconds)) return "";
    
    if (yards === 10) {
        return (fortySeconds * 0.35).toFixed(2); // Rough estimate: 10-yard is about 35% of 40 time
    } else if (yards === 20) {
        return (fortySeconds * 0.60).toFixed(2); // Rough estimate: 20-yard is about 60% of 40 time
    }
    
    return "";
}

function updatePlayerInfo() {
    const name = document.getElementById('name').value.toUpperCase();
    const position = document.getElementById('position').value.toUpperCase();
    const school = document.getElementById('school').value.toUpperCase();
    const year = document.getElementById('year').value;
    const height = document.getElementById('height').value;
    const weight = document.getElementById('weight').value;
    
    // Save to localStorage
    const playerInfo = {
        name,
        position,
        school,
        year,
        height,
        weight
    };
    
    localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
    
    // Update the display
    updatePlayerInfoDisplay();
    
    // Update height and weight values on the card
    document.getElementById('height-value').textContent = height;
    document.getElementById('weight-value').textContent = weight;
    
    // Recalculate RAS scores
    calculateRASScores();
}

function updatePlayerInfoDisplay() {
    const playerInfo = JSON.parse(localStorage.getItem('playerInfo')) || {};
    const name = playerInfo.name || "YOUR NAME";
    const position = playerInfo.position || "POS";
    const school = playerInfo.school || "SCHOOL";
    const year = playerInfo.year || "YEAR";
    
    document.getElementById('player-name').textContent = `${name} | ${position} | ${school} | ${year}`;
}

function calculateRASScores() {
    try {
        // Get values from display
        const fortyValue = document.getElementById('forty-value').textContent;
        const twentyValue = document.getElementById('twenty-value').textContent;
        const tenValue = document.getElementById('ten-value').textContent;
        const verticalValue = document.getElementById('vertical-value').textContent;
        const broadValue = document.getElementById('broad-value').textContent;
        const benchValue = document.getElementById('bench-value').textContent;
        const coneValue = document.getElementById('cone-value').textContent;
        const shuttleValue = document.getElementById('shuttle-value').textContent;
        const heightValue = document.getElementById('height-value').textContent;
        const weightValue = document.getElementById('weight-value').textContent;
        
        // Parse values (only use defaults if the field is empty or "--")
        const fortyTime = fortyValue === "--" || fortyValue === "" ? null : parseFloat(fortyValue);
        const twentyTime = twentyValue === "--" || twentyValue === "" ? null : parseFloat(twentyValue);
        const tenTime = tenValue === "--" || tenValue === "" ? null : parseFloat(tenValue);
        const verticalHeight = verticalValue === "--" || verticalValue === "" ? null : parseFloat(verticalValue);
        const benchReps = benchValue === "--" || benchValue === "" ? null : parseFloat(benchValue);
        const coneTime = coneValue === "--" || coneValue === "" ? null : parseFloat(coneValue);
        const shuttleTime = shuttleValue === "--" || shuttleValue === "" ? null : parseFloat(shuttleTime);
        
        // Parse broad jump (special handling for feet/inches format)
        let broadInches = null;
        if (broadValue !== "--" && broadValue !== "") {
            broadInches = getBroadJumpInches();
        }
        
        // Height calculations
        let heightInches = null;
        if (heightValue !== "--" && heightValue !== "") {
            if (heightValue.includes("'")) {
                const parts = heightValue.split("'");
                const feet = parseInt(parts[0]) || 0;
                const inches = parseInt(parts[1]) || 0;
                heightInches = (feet * 12) + inches;
            } else {
                heightInches = parseInt(heightValue);
            }
        }
        
        // Weight calculation
        const weight = weightValue === "--" || weightValue === "" ? null : parseInt(weightValue);
        
        // Calculate individual RAS scores (scaled 0-10)
        // DO NOT replace null values with defaults - keep them null
        const fortyScore = fortyTime !== null ? calculateSpeedScore(fortyTime, 'forty') : null;
        const twentyScore = twentyTime !== null ? calculateSpeedScore(twentyTime, 'twenty') : null;
        const tenScore = tenTime !== null ? calculateSpeedScore(tenTime, 'ten') : null;
        const verticalScore = verticalHeight !== null ? calculateJumpScore(verticalHeight, 'vertical') : null;
        const broadScore = broadInches !== null ? calculateJumpScore(broadInches, 'broad') : null;
        const benchScore = benchReps !== null ? calculateStrengthScore(benchReps) : null;
        const coneScore = coneTime !== null ? calculateAgilityScore(coneTime, 'cone') : null;
        const shuttleScore = shuttleTime !== null ? calculateAgilityScore(shuttleTime, 'shuttle') : null;
        const heightScore = heightInches !== null ? calculateSizeScore(heightInches, 'height') : null;
        const weightScore = weight !== null ? calculateSizeScore(weight, 'weight') : null;
        
        // Update score displays with color coding - respect null values
        updateScoreDisplay('forty-score', fortyScore);
        updateScoreDisplay('twenty-score', twentyScore);
        updateScoreDisplay('ten-score', tenScore);
        updateScoreDisplay('vertical-score', verticalScore);
        updateScoreDisplay('broad-score', broadScore);
        updateScoreDisplay('bench-score', benchScore);
        updateScoreDisplay('cone-score', coneScore);
        updateScoreDisplay('shuttle-score', shuttleScore);
        updateScoreDisplay('height-score', heightScore);
        updateScoreDisplay('weight-score', weightScore);
        
        // Add grade labels for each individual event
        addGradeLabel('forty-score', fortyScore);
        addGradeLabel('vertical-score', verticalScore);
        addGradeLabel('bench-score', benchScore);
        addGradeLabel('broad-score', broadScore);
        addGradeLabel('cone-score', coneScore);
        addGradeLabel('shuttle-score', shuttleScore);
        
        // Calculate composite scores - respect null values
        const sizeGrade = calculateCompositeGrade([heightScore, weightScore]);
        const speedGrade = calculateCompositeGrade([fortyScore, twentyScore, tenScore]);
        const explosionGrade = calculateCompositeGrade([verticalScore, broadScore, benchScore]);
        const agilityGrade = calculateCompositeGrade([coneScore, shuttleScore]);
        
        // Update composite grades with color coding
        updateGradeDisplay('size-grade', sizeGrade, 'COMPOSITE SIZE GRADE');
        updateGradeDisplay('speed-grade', speedGrade, 'COMPOSITE SPEED GRADE');
        updateGradeDisplay('explosion-grade', explosionGrade, 'COMPOSITE EXPLOSION GRADE');
        updateGradeDisplay('agility-grade', agilityGrade, 'COMPOSITE AGILITY GRADE');
        
        // Calculate overall RAS score based on the composite grades
        const compositeGrades = [sizeGrade, speedGrade, explosionGrade, agilityGrade];
        const validComposites = compositeGrades.filter(grade => grade !== null);
        
        // Only use the individual scores as a fallback if no composites are available
        let overallRAS = "7.16"; // Default if nothing is available
        
        if (validComposites.length > 0) {
            // Use composite grades for overall RAS
            const totalCompositeScore = validComposites.reduce((sum, grade) => sum + parseFloat(grade), 0);
            overallRAS = (totalCompositeScore / validComposites.length).toFixed(2);
        } else {
            // Fallback to individual scores if no composites
            const allScores = [
                fortyScore, twentyScore, tenScore, 
                verticalScore, broadScore, benchScore,
                coneScore, shuttleScore,
                heightScore, weightScore
            ];
            
            // Sum all the valid scores
            let totalScore = 0;
            let validCount = 0;
            
            for (let i = 0; i < allScores.length; i++) {
                // Only count scores that are not null
                if (allScores[i] !== null) {
                    totalScore += parseFloat(allScores[i]);
                    validCount++;
                }
            }
            
            if (validCount > 0) {
                overallRAS = (totalScore / validCount).toFixed(2);
            }
        }
        
        // Update overall RAS display with color coding
        updateOverallRAS(overallRAS);
        
        // Display the grade text for the overall RAS
        const overallRasElement = document.getElementById('overall-ras-grade');
        if (overallRasElement) {
            overallRasElement.textContent = getGradeText(overallRAS);
        }
        
        // Store the results in localStorage with a meaningful key name
        try {
            // Get existing results or initialize a new object
            const savedResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
            
            // Add this result with a timestamp as the key
            const timestamp = new Date().toISOString();
            const playerName = document.getElementById('player-name').textContent;
            savedResults[timestamp] = {
                playerName: playerName,
                position: document.getElementById('position').textContent,
                college: document.getElementById('school').textContent,
                height: document.getElementById('height').value,
                weight: document.getElementById('weight').value,
                bench: document.getElementById('bench-value').textContent,
                vertical: document.getElementById('vertical-value').textContent,
                broad: document.getElementById('broad-value').textContent,
                shuttle: document.getElementById('shuttle-value').textContent,
                cone: document.getElementById('cone-value').textContent,
                dash: document.getElementById('forty-value').textContent,
                overallRAS: parseFloat(overallRAS),
                // Add individual grades
                grades: {
                    forty: fortyScore !== null ? getGradeText(fortyScore) : 'N/A',
                    vertical: verticalScore !== null ? getGradeText(verticalScore) : 'N/A',
                    bench: benchScore !== null ? getGradeText(benchScore) : 'N/A',
                    broad: broadScore !== null ? getGradeText(broadScore) : 'N/A',
                    cone: coneScore !== null ? getGradeText(coneScore) : 'N/A',
                    shuttle: shuttleScore !== null ? getGradeText(shuttleScore) : 'N/A',
                    size: sizeGrade !== null ? getGradeText(sizeGrade) : 'N/A',
                    speed: speedGrade !== null ? getGradeText(speedGrade) : 'N/A',
                    explosion: explosionGrade !== null ? getGradeText(explosionGrade) : 'N/A',
                    agility: agilityGrade !== null ? getGradeText(agilityGrade) : 'N/A',
                    overall: getGradeText(overallRAS)
                }
            };
            
            // Save back to localStorage
            localStorage.setItem('rasResults', JSON.stringify(savedResults));
            
            // Save to Firebase if the user is logged in
            if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
                const user = firebase.auth().currentUser;
                if (user) {
                    saveUserData('rasResults', savedResults);
                }
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    } catch (error) {
        console.error("Error calculating RAS scores:", error);
        // Fallback to default value if calculation fails
        updateOverallRAS("7.16");
    }
}

function getBroadJumpInches() {
    const broadJumpText = document.getElementById('broad-value').textContent;
    if (broadJumpText === "--") return NaN;
    
    // If it's in feet-inches format, convert to inches
    if (broadJumpText.includes("'")) {
        const parts = broadJumpText.split("'");
        const feet = parseInt(parts[0]);
        const inches = parseInt(parts[1]);
        return (feet * 12) + inches;
    }
    
    // Otherwise, assume it's already in inches
    return parseInt(broadJumpText);
}

function calculateSpeedScore(time, type) {
    if (time === null || time === undefined || isNaN(parseFloat(time))) return null;
    
    // Convert to float to ensure proper comparison
    time = parseFloat(time);
    
    // Lower times are better for speed drills
    let score;
    
    switch(type) {
        case 'forty':
            // NFL standards: Elite (4.3s or less), Excellent (4.31-4.4s), Good (4.41-4.6s), Average (4.61-4.8s), Below Average (4.81-5.0s), Poor (5.01+)
            if (time <= 4.3) score = 10;
            else if (time <= 4.4) score = 9;
            else if (time <= 4.5) score = 8;
            else if (time <= 4.6) score = 7;
            else if (time <= 4.7) score = 6;
            else if (time <= 4.8) score = 5;
            else if (time <= 4.9) score = 4;
            else if (time <= 5.0) score = 3;
            else if (time <= 5.1) score = 2;
            else if (time <= 5.2) score = 1;
            else score = 0;
            break;
        case 'twenty':
            // Scaled 20-yard dash standards based on 40 time
            if (time <= 2.55) score = 10;
            else if (time <= 2.6) score = 9;
            else if (time <= 2.65) score = 8;
            else if (time <= 2.7) score = 7;
            else if (time <= 2.8) score = 6;
            else if (time <= 2.9) score = 5;
            else if (time <= 3.0) score = 4;
            else if (time <= 3.1) score = 3;
            else if (time <= 3.2) score = 2;
            else if (time <= 3.3) score = 1;
            else score = 0;
            break;
        case 'ten':
            // Scaled 10-yard dash standards based on 40 time
            if (time <= 1.45) score = 10;
            else if (time <= 1.5) score = 9;
            else if (time <= 1.55) score = 8;
            else if (time <= 1.6) score = 7;
            else if (time <= 1.65) score = 6;
            else if (time <= 1.7) score = 5;
            else if (time <= 1.75) score = 4;
            else if (time <= 1.8) score = 3;
            else if (time <= 1.85) score = 2;
            else if (time <= 1.9) score = 1;
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateJumpScore(measurement, type) {
    if (measurement === null || measurement === undefined || isNaN(parseFloat(measurement))) return null;
    
    // Convert to float to ensure proper comparison
    measurement = parseFloat(measurement);
    
    // Higher measurements are better for jumps
    let score;
    
    switch(type) {
        case 'vertical':
            // NFL standards: Elite (40+ inches), Excellent (37-39), Good (34-36), Average (30-33), Below Average (26-29), Poor (25 or less)
            if (measurement >= 40) score = 10;
            else if (measurement >= 38) score = 9;
            else if (measurement >= 36) score = 8;
            else if (measurement >= 34) score = 7;
            else if (measurement >= 32) score = 6;
            else if (measurement >= 30) score = 5;
            else if (measurement >= 28) score = 4;
            else if (measurement >= 26) score = 3;
            else if (measurement >= 24) score = 2;
            else if (measurement >= 22) score = 1;
            else score = 0;
            break;
        case 'broad':
            // NFL standards (in inches): Elite (128+), Excellent (124-127), Good (120-123), Average (116-119), Below Average (110-115), Poor (< 110)
            if (measurement >= 128) score = 10;
            else if (measurement >= 124) score = 9;
            else if (measurement >= 120) score = 8;
            else if (measurement >= 116) score = 7;
            else if (measurement >= 112) score = 6;
            else if (measurement >= 108) score = 5;
            else if (measurement >= 104) score = 4;
            else if (measurement >= 100) score = 3;
            else if (measurement >= 96) score = 2;
            else if (measurement >= 92) score = 1;
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateStrengthScore(reps) {
    if (reps === null || reps === undefined || isNaN(parseFloat(reps))) return null;
    
    // Convert to float to ensure proper comparison
    reps = parseFloat(reps);
    
    // Higher reps are better
    let score;
    
    // NFL standards: Elite (36+ reps), Excellent (30-35), Good (24-29), Average (18-23), Below Average (12-17), Poor (< 12)
    if (reps >= 36) score = 10;
    else if (reps >= 30) score = 9;
    else if (reps >= 25) score = 8;
    else if (reps >= 20) score = 7;
    else if (reps >= 18) score = 6;
    else if (reps >= 15) score = 5;
    else if (reps >= 12) score = 4;
    else if (reps >= 10) score = 3;
    else if (reps >= 8) score = 2;
    else if (reps >= 6) score = 1;
    else score = 0;
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateAgilityScore(time, type) {
    if (time === null || time === undefined || isNaN(parseFloat(time))) return null;
    
    // Convert to float to ensure proper comparison
    time = parseFloat(time);
    
    // Lower times are better for agility drills
    let score;
    
    switch(type) {
        case 'cone':
            // NFL standards: Elite (6.5s or less), Excellent (6.51-6.8s), Good (6.81-7.1s), Average (7.11-7.4s), Below Average (7.41-7.7s), Poor (7.71+)
            if (time <= 6.5) score = 10;
            else if (time <= 6.65) score = 9;
            else if (time <= 6.8) score = 8;
            else if (time <= 6.95) score = 7;
            else if (time <= 7.1) score = 6;
            else if (time <= 7.25) score = 5;
            else if (time <= 7.4) score = 4;
            else if (time <= 7.55) score = 3;
            else if (time <= 7.7) score = 2;
            else if (time <= 7.85) score = 1;
            else score = 0;
            break;
        case 'shuttle':
            // NFL standards: Elite (4.0s or less), Excellent (4.01-4.2s), Good (4.21-4.4s), Average (4.41-4.6s), Below Average (4.61-4.8s), Poor (4.81+)
            if (time <= 4.0) score = 10;
            else if (time <= 4.1) score = 9;
            else if (time <= 4.2) score = 8;
            else if (time <= 4.3) score = 7;
            else if (time <= 4.4) score = 6;
            else if (time <= 4.5) score = 5;
            else if (time <= 4.6) score = 4;
            else if (time <= 4.7) score = 3;
            else if (time <= 4.8) score = 2;
            else if (time <= 4.9) score = 1;
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function updateScoreDisplay(elementId, score) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (score === null || score === undefined) {
        element.textContent = "--";
        element.className = "metric-score";
        return;
    }
    
    element.textContent = score;
    
    // Remove any existing color classes
    element.className = "metric-score";
    
    // Add appropriate color class based on score
    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue)) {
        element.textContent = "--";
        return;
    }
    
    if (scoreValue < 4) {
        element.classList.add("score-poor");
    } else if (scoreValue < 5) {
        element.classList.add("score-below-average");
    } else if (scoreValue < 7) {
        element.classList.add("score-average");
    } else if (scoreValue < 9) {
        element.classList.add("score-good");
    } else {
        element.classList.add("score-excellent");
    }
}

function updateAllDisplayedValues() {
    const fortyScore = document.getElementById('forty-score').value;
    const verticalScore = document.getElementById('vertical-score').value;
    const benchScore = document.getElementById('bench-score').value;
    const broadScore = document.getElementById('broad-score').value;
    const coneScore = document.getElementById('cone-score').value;
    const shuttleScore = document.getElementById('shuttle-score').value;
    
    // Update displayed values
    if (fortyScore) {
        document.getElementById('forty-value').textContent = fortyScore;
        document.getElementById('twenty-value').textContent = estimateSplitTime(fortyScore, 20);
        document.getElementById('ten-value').textContent = estimateSplitTime(fortyScore, 10);
    }
    
    if (verticalScore) document.getElementById('vertical-value').textContent = verticalScore;
    if (benchScore) document.getElementById('bench-value').textContent = benchScore;
    if (broadScore) document.getElementById('broad-value').textContent = formatBroadJump(broadScore);
    if (coneScore) document.getElementById('cone-value').textContent = coneScore;
    if (shuttleScore) document.getElementById('shuttle-value').textContent = shuttleScore;
}

// Calculate a composite grade from the given scores
function calculateCompositeGrade(scores) {
    // Filter out null/undefined/NaN values
    const validScores = scores.filter(score => score !== null && score !== undefined && !isNaN(parseFloat(score)));
    
    // If no valid scores, return null
    if (validScores.length === 0) {
        return null;
    }
    
    // Calculate average score
    const totalScore = validScores.reduce((sum, score) => sum + parseFloat(score), 0);
    const averageScore = totalScore / validScores.length;
    
    // Return the average score rounded to 2 decimal places
    return averageScore.toFixed(2);
}

// Get a text grade based on a numeric score
function getGradeText(score) {
    if (score === null || score === undefined || isNaN(parseFloat(score))) {
        return 'N/A';
    }
    
    // Convert to numeric value
    const numericScore = parseFloat(score);
    
    if (numericScore >= 9) return 'Elite';
    else if (numericScore >= 8) return 'Excellent';
    else if (numericScore >= 7) return 'Good+';
    else if (numericScore >= 6) return 'Good';
    else if (numericScore >= 5) return 'Average+';
    else if (numericScore >= 4) return 'Average';
    else if (numericScore >= 3) return 'Below Avg';
    else if (numericScore >= 2) return 'Poor+';
    else if (numericScore >= 1) return 'Poor';
    else return 'Very Poor';
}

function saveAsImage() {
    // Use html2canvas to capture the card as an image
    html2canvas(document.querySelector('.ras-card')).then(canvas => {
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.download = 'nfl-combine-ras-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function shareResults() {
    // Get player info
    const playerInfo = JSON.parse(localStorage.getItem('playerInfo')) || {};
    const name = playerInfo.name || "Athlete";
    
    // Get overall RAS
    const overallRAS = document.getElementById('overall-ras').textContent;
    
    // Prepare share text
    const shareText = `Check out my NFL Combine RAS (Relative Athletic Score)! ${name} scored ${overallRAS}/10 overall.`;
    
    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'My NFL Combine RAS Card',
            text: shareText,
            // URL would ideally be the URL to view this specific card
            url: window.location.href,
        })
        .catch(error => {
            console.error('Error sharing:', error);
            alert('Could not share results. You can save the image instead!');
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        prompt('Copy this text to share your results:', shareText);
    }
}

function updateOverallRAS(score) {
    // Update the score text
    const rasValue = document.getElementById('overall-ras');
    rasValue.textContent = score;
    
    // Update container color based on score
    const scoreValue = parseFloat(score);
    const container = document.querySelector('.ras-score-container');
    
    // Remove existing classes
    container.classList.remove('ras-poor', 'ras-below-average', 'ras-average', 'ras-good', 'ras-excellent');
    
    // Add appropriate class based on score
    if (scoreValue < 4) {
        container.classList.add('ras-poor');
    } else if (scoreValue < 5) {
        container.classList.add('ras-below-average');
    } else if (scoreValue < 7) {
        container.classList.add('ras-average');
    } else if (scoreValue < 9) {
        container.classList.add('ras-good');
    } else {
        container.classList.add('ras-excellent');
    }
}

// Get user data from Firebase
function getUserData(userId) {
    console.log('Getting user data for userId:', userId);
    const db = firebase.firestore();
    
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('User data retrieved:', userData);
                
                // Set player name
                const displayName = userData.displayName || firebase.auth().currentUser.email || 'Athlete';
                
                // Set player info
                const playerInfo = {
                    name: displayName,
                    position: 'NFL PROSPECT',
                    school: userData.school || 'NFL',
                    year: new Date().getFullYear()
                };
                
                // Save to localStorage
                localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
                
                // Update the display
                updatePlayerInfoDisplay();
                
                // First check if we have games.combine data
                if (userData.games && userData.games.combine) {
                    console.log('Found games.combine data:', userData.games.combine);
                    const combineData = userData.games.combine;
                    
                    // Map combine data to RAS inputs
                    if (combineData.fortyYardDash) document.getElementById('forty-value').textContent = combineData.fortyYardDash;
                    if (combineData.verticalJump) document.getElementById('vertical-value').textContent = combineData.verticalJump;
                    if (combineData.benchPress) document.getElementById('bench-value').textContent = combineData.benchPress;
                    if (combineData.broadJump) document.getElementById('broad-value').textContent = combineData.broadJump;
                    if (combineData.coneDrill) document.getElementById('cone-value').textContent = combineData.coneDrill;
                    if (combineData.shuttleRun) document.getElementById('shuttle-value').textContent = combineData.shuttleRun;
                }
                // Next check if we have individual event data
                else {
                    console.log('Checking individual event data');
                    
                    // Map individual event data to RAS inputs
                    if (userData.fortyYardDash) document.getElementById('forty-value').textContent = userData.fortyYardDash;
                    if (userData.verticalJump) document.getElementById('vertical-value').textContent = userData.verticalJump;
                    if (userData.benchPress) document.getElementById('bench-value').textContent = userData.benchPress;
                    if (userData.broadJump) document.getElementById('broad-value').textContent = userData.broadJump;
                    if (userData.coneDrill) document.getElementById('cone-value').textContent = userData.coneDrill;
                    if (userData.shuttleRun) document.getElementById('shuttle-value').textContent = userData.shuttleRun;
                }
                
                // Finally, calculate the RAS scores
                calculateRASScores();
                
                // Also load any saved RAS results
                if (userData.games && userData.games.rasResults) {
                    console.log('Loading saved RAS results from Firestore:', userData.games.rasResults);
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                    updateSavedResultsList();
                }
            } else {
                // User exists but has no data yet
                console.log('User document exists but has no data');
                setDefaultValues();
                document.getElementById('player-name').innerText = "COMPLETE COMBINE EVENTS TO SEE YOUR RAS";
            }
        })
        .catch((error) => {
            console.error("Error getting user data:", error);
            setDefaultValues();
        });
}

// Update all displayed values from form inputs
function updateAllDisplayedValues() {
    const fortyScore = document.getElementById('forty-score').value;
    const verticalScore = document.getElementById('vertical-score').value;
    const benchScore = document.getElementById('bench-score').value;
    const broadScore = document.getElementById('broad-score').value;
    const coneScore = document.getElementById('cone-score').value;
    const shuttleScore = document.getElementById('shuttle-score').value;
    
    // Update displayed values
    if (fortyScore) {
        document.getElementById('forty-value').textContent = fortyScore;
        document.getElementById('twenty-value').textContent = estimateSplitTime(fortyScore, 20);
        document.getElementById('ten-value').textContent = estimateSplitTime(fortyScore, 10);
    }
    
    if (verticalScore) document.getElementById('vertical-value').textContent = verticalScore;
    if (benchScore) document.getElementById('bench-value').textContent = benchScore;
    if (broadScore) document.getElementById('broad-value').textContent = formatBroadJump(broadScore);
    if (coneScore) document.getElementById('cone-value').textContent = coneScore;
    if (shuttleScore) document.getElementById('shuttle-value').textContent = shuttleScore;
}

// Save scores to Firebase
function saveScoresToFirebase() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('You must be logged in to save your RAS card');
        return;
    }
    
    const db = firebase.firestore();
    
    // Get values from display
    const fortyValue = document.getElementById('forty-value').textContent;
    const verticalValue = document.getElementById('vertical-value').textContent;
    const benchValue = document.getElementById('bench-value').textContent;
    const broadValue = document.getElementById('broad-value').textContent;
    const coneValue = document.getElementById('cone-value').textContent;
    const shuttleValue = document.getElementById('shuttle-value').textContent;
    
    // Prepare scores object
    const scores = {
        forty: fortyValue !== "--" ? fortyValue : null,
        vertical: verticalValue !== "--" ? verticalValue : null,
        bench: benchValue !== "--" ? benchValue : null,
        broad: broadValue !== "--" ? broadValue : null,
        cone: coneValue !== "--" ? coneValue : null,
        shuttle: shuttleValue !== "--" ? shuttleValue : null
    };
    
    // Get the overall RAS score
    const overallRAS = document.getElementById('overall-ras').textContent;
    scores.overallRAS = overallRAS;
    
    // Also save data in the standard combine format
    if (typeof saveUserData === 'function') {
        const combineData = {
            fortyYardDash: fortyValue !== "--" ? fortyValue : null,
            verticalJump: verticalValue !== "--" ? verticalValue : null,
            benchPress: benchValue !== "--" ? benchValue : null,
            broadJump: broadValue !== "--" ? broadValue : null,
            coneDrill: coneValue !== "--" ? coneValue : null,
            shuttleRun: shuttleValue !== "--" ? shuttleValue : null
        };
        
        saveUserData('combine', combineData);
        console.log('Saved combine data using the global saveUserData function');
    }
    
    // Update the user document with scores
    db.collection('users').doc(user.uid).update({
        scores: scores
    })
    .then(() => {
        alert('Your RAS card has been saved to your account!');
    })
    .catch((error) => {
        console.error("Error saving scores:", error);
        alert('Error saving your RAS card. Please try again.');
    });
}

// Override the original updatePlayerInfo function to also save to Firebase
const originalUpdatePlayerInfo = updatePlayerInfo;
updatePlayerInfo = function() {
    originalUpdatePlayerInfo();
    saveScoresToFirebase();
};

// Function to update all the grades when data changes
function updateAllGrades() {
    // Get all input values
    const fortyValue = parseFloat(document.getElementById('forty-score').value);
    const verticalValue = parseFloat(document.getElementById('vertical-score').value);
    const benchValue = parseFloat(document.getElementById('bench-score').value);
    const broadValue = parseFloat(document.getElementById('broad-score').value);
    const coneValue = parseFloat(document.getElementById('cone-score').value);
    const shuttleValue = parseFloat(document.getElementById('shuttle-score').value);
    
    // Calculate individual scores
    const fortyScore = calculateSpeedScore(fortyValue, 'forty');
    const verticalScore = calculateJumpScore(verticalValue, 'vertical');
    const benchScore = calculateStrengthScore(benchValue);
    const broadScore = calculateJumpScore(broadValue, 'broad');
    const coneScore = calculateAgilityScore(coneValue, 'cone');
    const shuttleScore = calculateAgilityScore(shuttleValue, 'shuttle');
    
    // Add grade next to each input
    addGradeLabel('forty-score', fortyScore);
    addGradeLabel('vertical-score', verticalScore);
    addGradeLabel('bench-score', benchScore);
    addGradeLabel('broad-score', broadScore);
    addGradeLabel('cone-score', coneScore);
    addGradeLabel('shuttle-score', shuttleScore);

    // Update composite scores based on the calculations
    calculateAndUpdateCompositeScores();
}

// Add a grade label next to an input field
function addGradeLabel(inputId, score) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Check if a grade label already exists
    let label = input.nextElementSibling;
    if (!label || !label.classList.contains('grade-label')) {
        // Create a new label if it doesn't exist
        label = document.createElement('span');
        label.classList.add('grade-label');
        input.parentNode.insertBefore(label, input.nextSibling);
    }
    
    // Set the grade text and class
    if (score === null || score === undefined || isNaN(parseFloat(score))) {
        label.textContent = 'N/A';
        label.className = 'grade-label';
    } else {
        const scoreValue = parseFloat(score);
        const gradeText = getGradeText(scoreValue);
        label.textContent = gradeText;
        label.className = 'grade-label';
        
        // Add appropriate color class
        if (scoreValue < 4) {
            label.classList.add('grade-poor');
        } else if (scoreValue < 5) {
            label.classList.add('grade-below-average');
        } else if (scoreValue < 7) {
            label.classList.add('grade-average');
        } else if (scoreValue < 9) {
            label.classList.add('grade-good');
        } else {
            label.classList.add('grade-excellent');
        }
    }
}

// Add event listeners to update grades when input values change
function setupGradeListeners() {
    const inputs = [
        'forty-score', 
        'vertical-score', 
        'bench-score', 
        'broad-score', 
        'cone-score', 
        'shuttle-score'
    ];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updateAllGrades);
            input.addEventListener('change', updateAllGrades);
        }
    });
}

// Calculate and update composite scores
function calculateAndUpdateCompositeScores() {
    // Calculate composite scores
    const sizeGrade = calculateCompositeGrade([calculateSizeScore(parseFloat(document.getElementById('height-value').textContent), 'height'), calculateSizeScore(parseFloat(document.getElementById('weight-value').textContent), 'weight')]);
    const speedGrade = calculateCompositeGrade([calculateSpeedScore(parseFloat(document.getElementById('forty-value').textContent), 'forty'), calculateSpeedScore(parseFloat(document.getElementById('twenty-value').textContent), 'twenty'), calculateSpeedScore(parseFloat(document.getElementById('ten-value').textContent), 'ten')]);
    const explosionGrade = calculateCompositeGrade([calculateJumpScore(parseFloat(document.getElementById('vertical-value').textContent), 'vertical'), calculateJumpScore(parseFloat(document.getElementById('broad-value').textContent), 'broad'), calculateStrengthScore(parseFloat(document.getElementById('bench-value').textContent))]);
    const agilityGrade = calculateCompositeGrade([calculateAgilityScore(parseFloat(document.getElementById('cone-value').textContent), 'cone'), calculateAgilityScore(parseFloat(document.getElementById('shuttle-value').textContent), 'shuttle')]);
    
    // Update composite grades with color coding
    updateGradeDisplay('size-grade', sizeGrade, 'COMPOSITE SIZE GRADE');
    updateGradeDisplay('speed-grade', speedGrade, 'COMPOSITE SPEED GRADE');
    updateGradeDisplay('explosion-grade', explosionGrade, 'COMPOSITE EXPLOSION GRADE');
    updateGradeDisplay('agility-grade', agilityGrade, 'COMPOSITE AGILITY GRADE');
}

function updateGradeDisplay(elementId, score, prefix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (score === null || score === undefined || isNaN(parseFloat(score))) {
        element.textContent = `${prefix} : N/A`;
        element.className = "composite-grade";
        element.classList.add(elementId);
        return;
    }
    
    const scoreValue = parseFloat(score);
    const gradeText = getGradeText(scoreValue);
    element.textContent = `${prefix} : ${gradeText} (${scoreValue})`;
    
    // Remove any existing color classes
    element.className = "composite-grade";
    element.classList.add(elementId); // Add back the position class
    
    // Add appropriate color class based on grade
    if (scoreValue < 4) {
        element.classList.add("grade-poor");
    } else if (scoreValue < 5) {
        element.classList.add("grade-below-average");
    } else if (scoreValue < 7) {
        element.classList.add("grade-average");
    } else if (scoreValue < 9) {
        element.classList.add("grade-good");
    } else {
        element.classList.add("grade-excellent");
    }
}

function calculateSizeScore(measurement, type) {
    if (isNaN(measurement)) return 5.0; // Default to average if NaN
    
    let score;
    
    switch(type) {
        case 'height':
            // NFL height standards (in inches)
            if (measurement >= 78) score = 10;      // 6'6" or taller
            else if (measurement >= 76) score = 9;  // 6'4"
            else if (measurement >= 74) score = 8;  // 6'2"
            else if (measurement >= 72) score = 7;  // 6'0"
            else if (measurement >= 70) score = 6;  // 5'10"
            else if (measurement >= 69) score = 5;  // 5'9"
            else if (measurement >= 68) score = 4;  // 5'8"
            else if (measurement >= 67) score = 3;  // 5'7"
            else if (measurement >= 66) score = 2;  // 5'6"
            else if (measurement >= 65) score = 1;  // 5'5"
            else score = 0;                        // Less than 5'5"
            break;
        case 'weight':
            // NFL weight standards (in lbs)
            if (measurement >= 300) score = 10;     // 300+ lbs
            else if (measurement >= 280) score = 9;
            else if (measurement >= 260) score = 8;
            else if (measurement >= 240) score = 7;
            else if (measurement >= 225) score = 6;
            else if (measurement >= 210) score = 5;
            else if (measurement >= 195) score = 4;
            else if (measurement >= 180) score = 3;
            else if (measurement >= 170) score = 2;
            else if (measurement >= 160) score = 1;
            else score = 0;                        // Less than 160 lbs
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

// Save RAS scores to Firestore
function saveRASScorestoFirestore() {
    console.log('Saving RAS scores to Firestore');
    // Get existing results from localStorage
    const rasResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
    
    // Only proceed if we have results to save
    if (Object.keys(rasResults).length === 0) {
        console.log('No RAS results to save');
        return;
    }
    
    // Check if user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log('User logged in, saving RAS results to Firestore');
            const db = firebase.firestore();
            
            // Use set with merge to update only the rasResults field
            db.collection('users').doc(user.uid).set({
                games: {
                    rasResults: rasResults
                }
            }, { merge: true })
            .then(() => {
                console.log('RAS results saved to Firestore successfully');
            })
            .catch((error) => {
                console.error('Error saving RAS results to Firestore:', error);
            });
        } else {
            console.log('No user logged in, RAS results saved to localStorage only');
        }
    } else {
        console.log('Firebase not available, RAS results saved to localStorage only');
    }
}

// This function should be called after calculating RAS scores
function updateSavedResultsList() {
    console.log('Updating saved results list');
    const resultsContainer = document.getElementById('saved-results');
    
    // Clear existing results
    resultsContainer.innerHTML = '';
    
    // Get saved results from localStorage
    const rasResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
    
    // Check if we have any results
    if (Object.keys(rasResults).length === 0) {
        resultsContainer.innerHTML = '<p>No saved results yet.</p>';
        return;
    }
    
    // Sort results by timestamp (most recent first)
    const sortedTimestamps = Object.keys(rasResults).sort((a, b) => new Date(b) - new Date(a));
    
    // Create a list of results
    const resultsList = document.createElement('ul');
    resultsList.className = 'results-list';
    
    // Add each result to the list
    sortedTimestamps.forEach(timestamp => {
        const result = rasResults[timestamp];
        const listItem = document.createElement('li');
        
        // Format date for display
        const date = new Date(timestamp);
        const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        // Create result display
        listItem.innerHTML = `
            <div class="result-header">
                <span class="result-name">${result.playerName || 'Unnamed Player'}</span>
                <span class="result-date">${dateString}</span>
            </div>
            <div class="result-details">
                <span class="result-position">${result.position || 'Unknown Position'}</span>
                <span class="result-score">RAS: ${result.overallRAS.toFixed(2)}</span>
                <span class="result-grade">${result.grades?.overall || 'N/A'}</span>
            </div>
            <div class="result-actions">
                <button class="load-result" data-timestamp="${timestamp}">Load</button>
                <button class="delete-result" data-timestamp="${timestamp}">Delete</button>
            </div>
        `;
        
        resultsList.appendChild(listItem);
    });
    
    // Add the list to the container
    resultsContainer.appendChild(resultsList);
    
    // Add event listeners for load and delete buttons
    const loadButtons = document.querySelectorAll('.load-result');
    loadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const timestamp = this.getAttribute('data-timestamp');
            loadSavedResult(timestamp);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-result');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const timestamp = this.getAttribute('data-timestamp');
            deleteSavedResult(timestamp);
        });
    });
}

// Load a saved result
function loadSavedResult(timestamp) {
    console.log('Loading result from timestamp:', timestamp);
    
    // Get saved results from localStorage
    const rasResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
    
    // Check if the timestamp exists
    if (!rasResults[timestamp]) {
        console.error('Result not found for timestamp:', timestamp);
        return;
    }
    
    // Get the result
    const result = rasResults[timestamp];
    
    // Update all input fields with the saved values
    document.getElementById('forty-value').textContent = result.dash || '';
    document.getElementById('vertical-value').textContent = result.vertical || '';
    document.getElementById('bench-value').textContent = result.bench || '';
    document.getElementById('broad-value').textContent = result.broad || '';
    document.getElementById('cone-value').textContent = result.cone || '';
    document.getElementById('shuttle-value').textContent = result.shuttle || '';
    
    // Update player info
    if (result.playerName) {
        const playerInfo = {
            name: result.playerName,
            position: result.position || 'NFL PROSPECT',
            school: result.college || 'NFL',
            year: new Date().getFullYear()
        };
        
        // Save to localStorage
        localStorage.setItem('playerInfo', JSON.stringify(playerInfo));
        
        // Update the display
        updatePlayerInfoDisplay();
    }
    
    // Calculate RAS scores based on the loaded values
    calculateRASScores();
}

// Delete a saved result
function deleteSavedResult(timestamp) {
    console.log('Deleting result from timestamp:', timestamp);
    
    // Get saved results from localStorage
    const rasResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
    
    // Check if the timestamp exists
    if (!rasResults[timestamp]) {
        console.error('Result not found for timestamp:', timestamp);
        return;
    }
    
    // Delete the result
    delete rasResults[timestamp];
    
    // Save back to localStorage
    localStorage.setItem('rasResults', JSON.stringify(rasResults));
    
    // Save to Firestore as well
    saveRASScorestoFirestore();
    
    // Update the UI
    updateSavedResultsList();
}

// Setup event listeners for the RAS calculator
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Event listeners for buttons
    document.getElementById('update-info').addEventListener('click', updatePlayerInfo);
    document.getElementById('save-card').addEventListener('click', saveAsImage);
    document.getElementById('share-card').addEventListener('click', shareResults);
    
    // Add event listener for save button
    document.getElementById('save-result').addEventListener('click', function() {
        // Calculate RAS scores first to ensure we have the latest data
        calculateRASScores();
        
        // Then save to Firestore
        saveRASScorestoFirestore();
        
        // Update the UI
        updateSavedResultsList();
        
        // Show confirmation
        alert('RAS scores saved successfully!');
    });
}
