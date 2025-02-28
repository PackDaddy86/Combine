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
    
    // Call our debug function when the page loads
    setTimeout(showDebugScores, 1000); // Delay slightly to ensure all elements are loaded
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
        // Get values from display elements
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
        
        console.log('Calculating RAS scores with these values:');
        console.log('Forty:', fortyValue);
        console.log('Vertical:', verticalValue);
        console.log('Bench:', benchValue);
        console.log('Broad:', broadValue);
        console.log('Cone:', coneValue);
        console.log('Shuttle:', shuttleValue);
        
        // Convert values to numbers
        const fortyTime = fortyValue === "--" || fortyValue === "" ? null : parseFloat(fortyValue);
        const twentyTime = twentyValue === "--" || twentyValue === "" ? null : parseFloat(twentyValue);
        const tenTime = tenValue === "--" || tenValue === "" ? null : parseFloat(tenValue);
        const verticalHeight = verticalValue === "--" || verticalValue === "" ? null : parseFloat(verticalValue);
        const benchReps = benchValue === "--" || benchValue === "" ? null : parseFloat(benchValue);
        const coneTime = coneValue === "--" || coneValue === "" ? null : parseFloat(coneValue);
        const shuttleTime = shuttleValue === "--" || shuttleValue === "" ? null : parseFloat(shuttleValue);
        
        console.log('Parsed values:');
        console.log('Forty Time:', fortyTime); 
        console.log('Vertical Height:', verticalHeight);
        console.log('Bench Reps:', benchReps);
        console.log('Cone Time:', coneTime);
        console.log('Shuttle Time:', shuttleTime);
        
        // Handle broad jump specially as it might be in feet/inches format
        let broadInches = null;
        if (broadValue !== "--" && broadValue !== "") {
            // Check if it's in the format X'Y"
            if (broadValue.includes("'")) {
                const parts = broadValue.split("'");
                const feet = parseInt(parts[0]);
                let inches = 0;
                if (parts[1] && parts[1].includes('"')) {
                    inches = parseInt(parts[1].replace('"', ''));
                }
                broadInches = (feet * 12) + inches;
            } else {
                // Try parsing as a direct inch value
                broadInches = parseFloat(broadValue);
            }
        }
        console.log('Broad Jump (inches):', broadInches);
        
        // Calculate individual scores
        const fortyScore = calculateSpeedScore(fortyTime, 'forty');
        const twentyScore = calculateSpeedScore(twentyTime, 'twenty');
        const tenScore = calculateSpeedScore(tenTime, 'ten');
        const verticalScore = calculateJumpScore(verticalHeight, 'vertical');
        const broadScore = calculateJumpScore(broadInches, 'broad');
        const benchScore = calculateStrengthScore(benchReps);
        const coneScore = calculateAgilityScore(coneTime, 'cone');
        const shuttleScore = calculateAgilityScore(shuttleTime, 'shuttle');
        
        console.log('Calculated scores:');
        console.log('Forty Score:', fortyScore);
        console.log('Vertical Score:', verticalScore);
        console.log('Broad Score:', broadScore);
        console.log('Bench Score:', benchScore);
        console.log('Cone Score:', coneScore);
        console.log('Shuttle Score:', shuttleScore);
        
        // Update score displays
        updateScoreDisplay('forty-score', fortyScore);
        updateScoreDisplay('twenty-score', twentyScore);
        updateScoreDisplay('ten-score', tenScore);
        updateScoreDisplay('vertical-score', verticalScore);
        updateScoreDisplay('broad-score', broadScore);
        updateScoreDisplay('bench-score', benchScore);
        updateScoreDisplay('cone-score', coneScore);
        updateScoreDisplay('shuttle-score', shuttleScore);
        
        // Calculate composite scores
        calculateCompositeScores();
    } catch (error) {
        console.error('Error calculating RAS scores:', error);
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
    if (!element) {
        console.error(`Element not found: ${elementId}`);
        return;
    }
    
    // When the element is found in DOM
    console.log(`Updating score display for ${elementId} with score: ${score}`);
    
    if (score === null || score === undefined) {
        element.textContent = "--";
        element.className = "metric-score";
        // Reset any inline styles
        element.style.backgroundColor = "";
        element.style.color = "";
        console.log(`${elementId} score is null or undefined, setting to "--"`);
        return;
    }
    
    // Convert the score to a number and format it
    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue)) {
        element.textContent = "--";
        // Reset any inline styles
        element.style.backgroundColor = "";
        element.style.color = "";
        console.log(`${elementId} score is NaN, setting to "--"`);
        return;
    }
    
    // Set the score text with 2 decimal places
    element.textContent = scoreValue.toFixed(2);
    
    // Set inline styles directly (more reliable than classes)
    let bgColor, textColor;
    
    if (scoreValue < 4) {
        bgColor = "#ff6b6b";
        textColor = "white";
    } else if (scoreValue < 5) {
        bgColor = "#ffa06b";
        textColor = "white";
    } else if (scoreValue < 7) {
        bgColor = "#ffc56b";
        textColor = "black";
    } else if (scoreValue < 9) {
        bgColor = "#6bd46b";
        textColor = "white";
    } else {
        bgColor = "#53c2f0";
        textColor = "white";
    }
    
    // Apply inline styles
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    element.style.padding = "3px";
    element.style.borderRadius = "3px";
    element.style.fontWeight = "bold";
    
    console.log(`Applied styles to ${elementId}: background-color: ${bgColor}, color: ${textColor}`);
    
    // Also set class (as backup)
    element.className = "metric-score";
    
    // Add appropriate color class based on score
    let colorClass = "";
    if (scoreValue < 4) {
        colorClass = "score-poor";
    } else if (scoreValue < 5) {
        colorClass = "score-below-average";
    } else if (scoreValue < 7) {
        colorClass = "score-average";
    } else if (scoreValue < 9) {
        colorClass = "score-good";
    } else {
        colorClass = "score-excellent";
    }
    
    element.classList.add(colorClass);
    
    // Force a repaint to ensure styles are applied
    void element.offsetWidth;
    
    // Also update any related grade label
    updateRelatedGradeLabel(elementId, scoreValue);
    
    // For debugging, log complete element state
    console.log(`${elementId} final state:`, {
        text: element.textContent,
        classes: element.className,
        backgroundColor: element.style.backgroundColor,
        color: element.style.color,
        padding: element.style.padding,
        borderRadius: element.style.borderRadius
    });
}

// Update related grade label 
function updateRelatedGradeLabel(scoreElementId, score) {
    // Extract the base metric name from the score element ID (e.g., "forty-score" -> "forty")
    const baseName = scoreElementId.replace('-score', '');
    
    // Find or create a label element
    let labelId = `${baseName}-grade-label`;
    let labelElement = document.getElementById(labelId);
    
    if (!labelElement) {
        // Create a new label element if it doesn't exist
        labelElement = document.createElement('div');
        labelElement.id = labelId;
        labelElement.className = 'grade-label';
        
        // Find the score element to insert the label after it
        const scoreElement = document.getElementById(scoreElementId);
        if (scoreElement && scoreElement.parentNode) {
            scoreElement.parentNode.insertBefore(labelElement, scoreElement.nextSibling);
        }
    }
    
    // Set the grade text based on the score
    if (score === null || score === undefined || isNaN(parseFloat(score))) {
        labelElement.textContent = 'N/A';
        return;
    }
    
    const gradeText = getGradeText(score);
    labelElement.textContent = gradeText;
    
    // Update label styling based on the grade
    labelElement.className = 'grade-label'; // Reset classes
    
    // Add appropriate class based on grade
    if (score < 4) {
        labelElement.classList.add('grade-poor');
    } else if (score < 5) {
        labelElement.classList.add('grade-below-average');
    } else if (score < 7) {
        labelElement.classList.add('grade-average');
    } else if (score < 9) {
        labelElement.classList.add('grade-good');
    } else {
        labelElement.classList.add('grade-excellent');
    }
    
    console.log(`Updated grade label for ${baseName}: ${gradeText}`);
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
    const rasElement = document.getElementById('overall-ras');
    if (!rasElement) return;
    
    if (score === null || score === undefined) {
        rasElement.textContent = "5.00";
        return;
    }
    
    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue)) {
        rasElement.textContent = "5.00";
        return;
    }
    
    // Display the score with 2 decimal places
    rasElement.textContent = scoreValue.toFixed(2);
    
    // Update color based on score range
    const container = document.querySelector('.ras-score-container');
    if (container) {
        // Remove existing color classes
        container.classList.remove('ras-poor', 'ras-below-average', 'ras-average', 'ras-good', 'ras-excellent');
        
        // Add appropriate color class
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
    
    // Update grade text if the element exists
    const gradeElement = document.getElementById('overall-ras-grade');
    if (gradeElement) {
        gradeElement.textContent = getGradeText(scoreValue);
    }
}

// Get user data from Firebase
function getUserData() {
    console.log("Trying to get user data from Firebase");
    
    // Check if Firebase is available and user is logged in
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
        console.log("Firebase not available or user not logged in");
        return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("No user is currently logged in");
        return;
    }
    
    console.log("User is logged in:", user.uid);
    
    // Get user data from Firestore
    const db = firebase.firestore();
    db.collection("users").doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                console.log("Document data:", doc.data());
                const userData = doc.data();
                
                // Log all available fields to help debug what's available
                console.log("All available fields in user document:");
                Object.keys(userData).forEach(key => {
                    console.log(`- ${key}: ${userData[key]}`);
                });
                
                // Helper function to check multiple field names and set the value if found
                const setValueFromMultipleFields = (displayElementId, possibleFieldNames) => {
                    for (const fieldName of possibleFieldNames) {
                        if (userData[fieldName] !== undefined) {
                            console.log(`Found ${fieldName}: ${userData[fieldName]}`);
                            document.getElementById(displayElementId).textContent = userData[fieldName];
                            return true;
                        }
                    }
                    console.log(`No matches found for ${displayElementId} among fields: ${possibleFieldNames.join(', ')}`);
                    return false;
                };
                
                // Try to populate each metric with various possible field names
                setValueFromMultipleFields('forty-value', ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40']);
                setValueFromMultipleFields('twenty-value', ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20']);
                setValueFromMultipleFields('ten-value', ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10']);
                setValueFromMultipleFields('vertical-value', ['verticalJump', 'vertical', 'vert']);
                setValueFromMultipleFields('broad-value', ['broadJump', 'broad', 'jump']);
                setValueFromMultipleFields('bench-value', ['benchPress', 'bench']);
                setValueFromMultipleFields('cone-value', ['coneDrill', 'cone', '3cone']);
                setValueFromMultipleFields('shuttle-value', ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle']);
                
                // Set player name from username (priority) or fallback options
                let playerName = '';
                
                // First priority: Use the username field
                if (userData.username) {
                    playerName = userData.username;
                    console.log(`Using username: ${playerName}`);
                }
                // Second priority: Use display name from auth
                else if (user.displayName) {
                    playerName = user.displayName;
                    console.log(`Using displayName from auth: ${playerName}`);
                }
                // Other fallbacks
                else if (userData.name) {
                    playerName = userData.name;
                } 
                else if (userData.displayName) {
                    playerName = userData.displayName;
                }
                else {
                    playerName = "Player";
                    console.log("No name found, using default 'Player'");
                }
                
                // Construct the player display text with position, school, year
                let playerDisplayText = playerName;
                
                const position = userData.position || document.getElementById('position').value || '';
                const school = userData.school || userData.college || document.getElementById('school').value || '';
                const year = userData.year || document.getElementById('year').value || '';
                
                if (position || school || year) {
                    playerDisplayText += ' | ';
                    
                    if (position) playerDisplayText += position + ' | ';
                    if (school) playerDisplayText += school;
                    if (year && school) playerDisplayText += ' | ' + year;
                    else if (year) playerDisplayText += year;
                }
                
                document.getElementById('player-name').textContent = playerDisplayText;
                
                // Handle height and weight which might be in different formats
                if (userData.height) {
                    document.getElementById('height-value').textContent = userData.height;
                    document.getElementById('height').value = userData.height;
                    console.log(`Set height to: ${userData.height}`);
                }
                
                if (userData.weight) {
                    document.getElementById('weight-value').textContent = userData.weight;
                    document.getElementById('weight').value = userData.weight;
                    console.log(`Set weight to: ${userData.weight}`);
                }
                
                // After loading all data, call fixAllScores to update the UI
                fixAllScores();
                calculateRASScores();
                
                console.log("Successfully loaded user data from Firebase");
            } else {
                console.log("No user data found in Firestore");
            }
        })
        .catch((error) => {
            console.error("Error getting user data:", error);
        });
}

// Add a function to fix all scores, not just forty
function fixAllScores() {
    console.log('Fixing all scores...');
    
    try {
        // Get the displayed values
        const fortyValue = document.getElementById('forty-value').textContent;
        const verticalValue = document.getElementById('vertical-value').textContent;
        const broadValue = document.getElementById('broad-value').textContent;
        const benchValue = document.getElementById('bench-value').textContent;
        const coneValue = document.getElementById('cone-value').textContent;
        const shuttleValue = document.getElementById('shuttle-value').textContent;
        
        console.log('Current displayed values:');
        console.log('Forty:', fortyValue);
        console.log('Vertical:', verticalValue);
        console.log('Broad:', broadValue);
        console.log('Bench:', benchValue);
        console.log('Cone:', coneValue);
        console.log('Shuttle:', shuttleValue);
        
        // Fix forty score
        if (fortyValue && fortyValue !== '--') {
            try {
                const parsedForty = parseFloat(fortyValue);
                if (!isNaN(parsedForty)) {
                    const correctScore = calculateSpeedScore(parsedForty, 'forty');
                    updateScoreDisplay('forty-score', correctScore);
                    console.log('Fixed forty score:', correctScore);
                }
            } catch (e) {
                console.error('Error fixing forty score:', e);
            }
        }
        
        // Fix vertical score
        if (verticalValue && verticalValue !== '--') {
            try {
                const parsedVertical = parseFloat(verticalValue);
                if (!isNaN(parsedVertical)) {
                    const correctScore = calculateJumpScore(parsedVertical, 'vertical');
                    updateScoreDisplay('vertical-score', correctScore);
                    console.log('Fixed vertical score:', correctScore);
                }
            } catch (e) {
                console.error('Error fixing vertical score:', e);
            }
        }
        
        // Fix broad score
        if (broadValue && broadValue !== '--') {
            try {
                let broadInches;
                
                // Convert format if needed (e.g., 9'2" -> 110 inches)
                if (broadValue.includes("'")) {
                    const parts = broadValue.split("'");
                    const feet = parseInt(parts[0]);
                    let inches = 0;
                    if (parts[1] && parts[1].includes('"')) {
                        inches = parseInt(parts[1].replace('"', ''));
                    }
                    broadInches = (feet * 12) + inches;
                } else {
                    broadInches = parseFloat(broadValue);
                }
                
                if (!isNaN(broadInches)) {
                    const correctScore = calculateJumpScore(broadInches, 'broad');
                    updateScoreDisplay('broad-score', correctScore);
                    console.log('Fixed broad score:', correctScore, 'from', broadInches, 'inches');
                }
            } catch (e) {
                console.error('Error fixing broad score:', e);
            }
        }
        
        // Fix bench score
        if (benchValue && benchValue !== '--') {
            try {
                const parsedBench = parseFloat(benchValue);
                if (!isNaN(parsedBench)) {
                    const correctScore = calculateStrengthScore(parsedBench);
                    updateScoreDisplay('bench-score', correctScore);
                    console.log('Fixed bench score:', correctScore);
                }
            } catch (e) {
                console.error('Error fixing bench score:', e);
            }
        }
        
        // Fix cone score
        if (coneValue && coneValue !== '--') {
            try {
                const parsedCone = parseFloat(coneValue);
                if (!isNaN(parsedCone)) {
                    const correctScore = calculateAgilityScore(parsedCone, 'cone');
                    updateScoreDisplay('cone-score', correctScore);
                    console.log('Fixed cone score:', correctScore);
                }
            } catch (e) {
                console.error('Error fixing cone score:', e);
            }
        }
        
        // Fix shuttle score
        if (shuttleValue && shuttleValue !== '--') {
            try {
                const parsedShuttle = parseFloat(shuttleValue);
                if (!isNaN(parsedShuttle)) {
                    const correctScore = calculateAgilityScore(parsedShuttle, 'shuttle');
                    updateScoreDisplay('shuttle-score', correctScore);
                    console.log('Fixed shuttle score:', correctScore);
                }
            } catch (e) {
                console.error('Error fixing shuttle score:', e);
            }
        }
        
        // 40-Yard Dash
        const fortyValue = document.getElementById('forty-value').textContent;
        console.log(`Processing 40-yard dash: ${fortyValue}`);
        let parsedForty = parseFloat(fortyValue);
        if (!isNaN(parsedForty)) {
            const correctScore = calculateSpeedScore(parsedForty, 'forty');
            console.log(`Calculated 40-yard dash score: ${correctScore}`);
            updateScoreDisplay('forty-score', correctScore);
        } else {
            console.error(`Failed to parse 40-yard dash value: ${fortyValue}`);
        }
        
        // After fixing individual scores, recalculate composite scores
        calculateCompositeScores();
        
        console.log("All scores have been fixed.");
        
    } catch (error) {
        console.error("Error in fixAllScores:", error);
    }
}

// Helper function to convert broad jump to inches
function convertBroadJumpToInches(broadJump) {
    if (!broadJump) return null;
    
    // If already a number, assume it's inches
    if (!isNaN(parseFloat(broadJump))) {
        return parseFloat(broadJump);
    }
    
    // Try to parse feet and inches format (e.g., 9'2")
    try {
        const feetInchesPattern = /(\d+)'(\d+)"/;
        const match = broadJump.match(feetInchesPattern);
        
        if (match) {
            const feet = parseInt(match[1]);
            const inches = parseInt(match[2]);
            return (feet * 12) + inches;
        }
    } catch (e) {
        console.error('Error converting broad jump:', e);
    }
    
    return null;
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

// Function to execute when the window loads
window.onload = function() {
    // Check if user is logged in
    console.log("Checking if user is logged in...");
    checkUserLoggedIn().then(isLoggedIn => {
        if (isLoggedIn) {
            console.log("User is logged in. Loading user data...");
            getUserData()
                .then(() => {
                    // The player information should now be loaded and displayed
                    console.log("User data loaded successfully.");
                    // Fix scores if needed
                    fixAllScores();
                    // Add a small delay before showing debug info
                    setTimeout(showDebugInfo, 1000);
                })
                .catch(error => {
                    console.error("Error loading user data:", error);
                });
        } else {
            console.log("User is not logged in. Using default values.");
            // Fix scores if needed
            fixAllScores();
            // Add a small delay before showing debug info
            setTimeout(showDebugInfo, 1000);
        }
    }).catch(error => {
        console.error("Error checking login status:", error);
    });
    
    // Set up event listeners
    setupEventListeners();
};

// Function to display debug information about all scores
function showDebugInfo() {
    console.log("=== DEBUG: SCORE STATUS ===");
    
    const metrics = [
        { name: 'forty', id: 'forty-score' },
        { name: 'twenty', id: 'twenty-score' },
        { name: 'ten', id: 'ten-score' },
        { name: 'vertical', id: 'vertical-score' },
        { name: 'broad', id: 'broad-score' },
        { name: 'bench', id: 'bench-score' },
        { name: 'shuttle', id: 'shuttle-score' },
        { name: 'cone', id: 'cone-score' }
    ];
    
    for (const metric of metrics) {
        const valueElement = document.getElementById(`${metric.name}-value`);
        const scoreElement = document.getElementById(metric.id);
        
        if (valueElement && scoreElement) {
            console.log(`${metric.name.toUpperCase()}: Value = ${valueElement.textContent}, Score = ${scoreElement.textContent}`);
            console.log(`  Score Element Classes: ${scoreElement.className}`);
            console.log(`  Score Element Style: background-color: ${scoreElement.style.backgroundColor}, color: ${scoreElement.style.color}`);
        } else {
            console.log(`${metric.name.toUpperCase()}: Missing element(s)`);
        }
    }
    
    console.log("=== END DEBUG INFO ===");
    
    // Force a recalculation to ensure all scores are properly displayed
    fixAllScores();
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

// Update all grades when data changes
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
    // Log the grade instead of creating DOM elements
    console.log(`Grade for ${inputId}: ${getGradeText(score)}`);
    
    // We will rely on color coding of the scores themselves
    // instead of adding extra DOM elements that disrupt the layout
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

// Calculate composite scores and overall RAS
function calculateCompositeScores() {
    try {
        // Get individual scores
        const fortyScore = document.getElementById('forty-score').textContent;
        const twentyScore = document.getElementById('twenty-score').textContent;
        const tenScore = document.getElementById('ten-score').textContent;
        const verticalScore = document.getElementById('vertical-score').textContent;
        const broadScore = document.getElementById('broad-score').textContent;
        const benchScore = document.getElementById('bench-score').textContent;
        const coneScore = document.getElementById('cone-score').textContent;
        const shuttleScore = document.getElementById('shuttle-score').textContent;
        const heightScore = document.getElementById('height-score').textContent;
        const weightScore = document.getElementById('weight-score').textContent;
        
        // Parse scores as numbers (or null if not a valid score)
        const parseScore = (scoreText) => {
            if (scoreText === '--' || scoreText === "") return null;
            const value = parseFloat(scoreText);
            return isNaN(value) ? null : value;
        };
        
        const parsedScores = {
            forty: parseScore(fortyScore),
            twenty: parseScore(twentyScore),
            ten: parseScore(tenScore),
            vertical: parseScore(verticalScore),
            broad: parseScore(broadScore),
            bench: parseScore(benchScore),
            cone: parseScore(coneScore),
            shuttle: parseScore(shuttleScore),
            height: parseScore(heightScore),
            weight: parseScore(weightScore)
        };
        
        console.log('Parsed scores for composite calculation:', parsedScores);
        
        // Calculate composite grades
        const sizeGrade = calculateCompositeGrade([parsedScores.height, parsedScores.weight]);
        const speedGrade = calculateCompositeGrade([parsedScores.forty, parsedScores.twenty, parsedScores.ten]);
        const explosionGrade = calculateCompositeGrade([parsedScores.vertical, parsedScores.broad, parsedScores.bench]);
        const agilityGrade = calculateCompositeGrade([parsedScores.cone, parsedScores.shuttle]);
        
        console.log('Composite grades:');
        console.log('Size Grade:', sizeGrade);
        console.log('Speed Grade:', speedGrade);
        console.log('Explosion Grade:', explosionGrade);
        console.log('Agility Grade:', agilityGrade);
        
        // Update composite grade displays
        updateGradeDisplay('size-grade', sizeGrade, 'COMPOSITE SIZE GRADE');
        updateGradeDisplay('speed-grade', speedGrade, 'COMPOSITE SPEED GRADE');
        updateGradeDisplay('explosion-grade', explosionGrade, 'COMPOSITE EXPLOSION GRADE');
        updateGradeDisplay('agility-grade', agilityGrade, 'COMPOSITE AGILITY GRADE');
        
        // Calculate overall RAS
        const compositeGrades = [sizeGrade, speedGrade, explosionGrade, agilityGrade].filter(grade => grade !== null);
        
        let overallRAS = 5.00; // Default value
        
        if (compositeGrades.length > 0) {
            const totalGrade = compositeGrades.reduce((sum, grade) => sum + parseFloat(grade), 0);
            overallRAS = (totalGrade / compositeGrades.length).toFixed(2);
        } else {
            // Fallback to individual scores
            const validScores = Object.values(parsedScores).filter(score => score !== null);
            
            if (validScores.length > 0) {
                const totalScore = validScores.reduce((sum, score) => sum + score, 0);
                overallRAS = (totalScore / validScores.length).toFixed(2);
            }
        }
        
        console.log('Overall RAS:', overallRAS);
        
        // Update overall RAS display
        updateOverallRAS(overallRAS);
        
        // Save the results
        saveRASResults(overallRAS, parsedScores, {
            size: sizeGrade,
            speed: speedGrade,
            explosion: explosionGrade,
            agility: agilityGrade
        });
        
    } catch (error) {
        console.error('Error calculating composite scores:', error);
    }
}

function saveRASResults(overallRAS, individualScores, compositeScores) {
    try {
        // Get existing results or initialize new object
        const savedResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
        
        // Add this result with timestamp
        const timestamp = new Date().toISOString();
        const playerName = document.getElementById('player-name').textContent;
        
        savedResults[timestamp] = {
            playerName: playerName,
            position: document.getElementById('position-display').textContent,
            college: document.getElementById('school-display').textContent,
            height: document.getElementById('height-value').textContent,
            weight: document.getElementById('weight-value').textContent,
            bench: document.getElementById('bench-value').textContent,
            vertical: document.getElementById('vertical-value').textContent,
            broad: document.getElementById('broad-value').textContent,
            shuttle: document.getElementById('shuttle-value').textContent,
            cone: document.getElementById('cone-value').textContent,
            dash: document.getElementById('forty-value').textContent,
            overallRAS: parseFloat(overallRAS),
            // Add individual grades
            grades: {
                forty: individualScores.forty !== null ? getGradeText(individualScores.forty) : 'N/A',
                vertical: individualScores.vertical !== null ? getGradeText(individualScores.vertical) : 'N/A',
                bench: individualScores.bench !== null ? getGradeText(individualScores.bench) : 'N/A',
                broad: individualScores.broad !== null ? getGradeText(individualScores.broad) : 'N/A',
                cone: individualScores.cone !== null ? getGradeText(individualScores.cone) : 'N/A',
                shuttle: individualScores.shuttle !== null ? getGradeText(individualScores.shuttle) : 'N/A',
                size: compositeScores.size !== null ? getGradeText(compositeScores.size) : 'N/A',
                speed: compositeScores.speed !== null ? getGradeText(compositeScores.speed) : 'N/A',
                explosion: compositeScores.explosion !== null ? getGradeText(compositeScores.explosion) : 'N/A',
                agility: compositeScores.agility !== null ? getGradeText(compositeScores.agility) : 'N/A',
                overall: getGradeText(overallRAS)
            }
        };
        
        // Save to localStorage
        localStorage.setItem('rasResults', JSON.stringify(savedResults));
        
        // Save to Firebase if user is logged in
        saveRASScorestoFirestore();
        
        // Update the saved results list
        updateSavedResultsList();
        
    } catch (error) {
        console.error('Error saving RAS results:', error);
    }
}

function getDisplayedValue(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return null;
    
    const value = element.textContent;
    if (value === "--" || value === "") return null;
    
    return parseFloat(value);
}

function calculateRASScores() {
    try {
        // Get values from display elements
        const fortyValue = getDisplayedValue('forty-value');
        const twentyValue = getDisplayedValue('twenty-value');
        const tenValue = getDisplayedValue('ten-value');
        const verticalValue = getDisplayedValue('vertical-value');
        const broadValue = getDisplayedValue('broad-value');
        const benchValue = getDisplayedValue('bench-value');
        const coneValue = getDisplayedValue('cone-value');
        const shuttleValue = getDisplayedValue('shuttle-value');
        const heightValue = getDisplayedValue('height-value');
        const weightValue = getDisplayedValue('weight-value');
        
        console.log('Calculating RAS scores with these values:');
        console.log('Forty:', fortyValue);
        console.log('Vertical:', verticalValue);
        console.log('Bench:', benchValue);
        console.log('Broad:', broadValue);
        console.log('Cone:', coneValue);
        console.log('Shuttle:', shuttleValue);
        
        // Convert values to numbers
        const fortyTime = fortyValue;
        const twentyTime = twentyValue;
        const tenTime = tenValue;
        const verticalHeight = verticalValue;
        const benchReps = benchValue;
        const coneTime = coneValue;
        const shuttleTime = shuttleValue;
        
        console.log('Parsed values:');
        console.log('Forty Time:', fortyTime); 
        console.log('Vertical Height:', verticalHeight);
        console.log('Bench Reps:', benchReps);
        console.log('Cone Time:', coneTime);
        console.log('Shuttle Time:', shuttleTime);
        
        // Handle broad jump specially as it might be in feet/inches format
        let broadInches = null;
        if (broadValue !== null) {
            // Check if it's in the format X'Y"
            if (broadValue.toString().includes("'")) {
                const parts = broadValue.toString().split("'");
                const feet = parseInt(parts[0]);
                let inches = 0;
                if (parts[1] && parts[1].includes('"')) {
                    inches = parseInt(parts[1].replace('"', ''));
                }
                broadInches = (feet * 12) + inches;
            } else {
                broadInches = broadValue;
            }
        }
        console.log('Broad Jump (inches):', broadInches);
        
        // Calculate individual scores
        const fortyScore = calculateSpeedScore(fortyTime, 'forty');
        const twentyScore = calculateSpeedScore(twentyTime, 'twenty');
        const tenScore = calculateSpeedScore(tenTime, 'ten');
        const verticalScore = calculateJumpScore(verticalHeight, 'vertical');
        const broadScore = calculateJumpScore(broadInches, 'broad');
        const benchScore = calculateStrengthScore(benchReps);
        const coneScore = calculateAgilityScore(coneTime, 'cone');
        const shuttleScore = calculateAgilityScore(shuttleTime, 'shuttle');
        
        console.log('Calculated scores:');
        console.log('Forty Score:', fortyScore);
        console.log('Vertical Score:', verticalScore);
        console.log('Broad Score:', broadScore);
        console.log('Bench Score:', benchScore);
        console.log('Cone Score:', coneScore);
        console.log('Shuttle Score:', shuttleScore);
        
        // Update score displays
        updateScoreDisplay('forty-score', fortyScore);
        updateScoreDisplay('twenty-score', twentyScore);
        updateScoreDisplay('ten-score', tenScore);
        updateScoreDisplay('vertical-score', verticalScore);
        updateScoreDisplay('broad-score', broadScore);
        updateScoreDisplay('bench-score', benchScore);
        updateScoreDisplay('cone-score', coneScore);
        updateScoreDisplay('shuttle-score', shuttleScore);
        
        // Calculate composite scores
        calculateCompositeScores();
    } catch (error) {
        console.error('Error calculating RAS scores:', error);
    }
}

function fixAllScores() {
    console.log('Fixing all scores...');
    
    try {
        // Vertical Jump
        const verticalValue = document.getElementById('vertical-value').textContent;
        console.log(`Processing vertical jump: ${verticalValue}`);
        let parsedVertical = parseFloat(verticalValue);
        if (!isNaN(parsedVertical)) {
            const correctScore = calculateJumpScore(parsedVertical, 'vertical');
            console.log(`Calculated vertical jump score: ${correctScore}`);
            updateScoreDisplay('vertical-score', correctScore);
        } else {
            console.error(`Failed to parse vertical jump value: ${verticalValue}`);
        }
        
        // Bench Press
        const benchValue = document.getElementById('bench-value').textContent;
        console.log(`Processing bench press: ${benchValue}`);
        let parsedBench = parseFloat(benchValue);
        if (!isNaN(parsedBench)) {
            const correctScore = calculateStrengthScore(parsedBench);
            console.log(`Calculated bench press score: ${correctScore}`);
            updateScoreDisplay('bench-score', correctScore);
        } else {
            console.error(`Failed to parse bench press value: ${benchValue}`);
        }
        
        // Broad Jump
        const broadValue = document.getElementById('broad-value').textContent;
        console.log(`Processing broad jump: ${broadValue}`);
        // Broad jump might be in feet/inches format or just inches
        let parsedBroad;
        if (broadValue.includes("'")) {
            // Format: 9'2" - convert to total inches
            const parts = broadValue.split("'");
            const feet = parseInt(parts[0]);
            let inches = 0;
            if (parts[1] && parts[1].includes('"')) {
                inches = parseInt(parts[1].replace('"', ''));
            }
            parsedBroad = (feet * 12) + inches;
            console.log(`Converted broad jump from ${broadValue} to ${parsedBroad} inches`);
        } else {
            parsedBroad = parseFloat(broadValue);
        }
        
        if (!isNaN(parsedBroad)) {
            const correctScore = calculateJumpScore(parsedBroad, 'broad');
            console.log(`Calculated broad jump score: ${correctScore}`);
            updateScoreDisplay('broad-score', correctScore);
        } else {
            console.error(`Failed to parse broad jump value: ${broadValue}`);
        }
        
        // Shuttle
        const shuttleValue = document.getElementById('shuttle-value').textContent;
        console.log(`Processing shuttle run: ${shuttleValue}`);
        let parsedShuttle = parseFloat(shuttleValue);
        if (!isNaN(parsedShuttle)) {
            const correctScore = calculateAgilityScore(parsedShuttle, 'shuttle');
            console.log(`Calculated shuttle run score: ${correctScore}`);
            updateScoreDisplay('shuttle-score', correctScore);
        } else {
            console.error(`Failed to parse shuttle run value: ${shuttleValue}`);
        }
        
        // 3-Cone
        const coneValue = document.getElementById('cone-value').textContent;
        console.log(`Processing 3-cone drill: ${coneValue}`);
        let parsedCone = parseFloat(coneValue);
        if (!isNaN(parsedCone)) {
            const correctScore = calculateAgilityScore(parsedCone, 'cone');
            console.log(`Calculated 3-cone drill score: ${correctScore}`);
            updateScoreDisplay('cone-score', correctScore);
        } else {
            console.error(`Failed to parse 3-cone drill value: ${coneValue}`);
        }
        
        // 40-Yard Dash
        const fortyValue = document.getElementById('forty-value').textContent;
        console.log(`Processing 40-yard dash: ${fortyValue}`);
        let parsedForty = parseFloat(fortyValue);
        if (!isNaN(parsedForty)) {
            const correctScore = calculateSpeedScore(parsedForty, 'forty');
            console.log(`Calculated 40-yard dash score: ${correctScore}`);
            updateScoreDisplay('forty-score', correctScore);
        } else {
            console.error(`Failed to parse 40-yard dash value: ${fortyValue}`);
        }
        
        // After fixing individual scores, recalculate composite scores
        calculateCompositeScores();
        
        console.log("All scores have been fixed.");
        
    } catch (error) {
        console.error("Error in fixAllScores:", error);
    }
}

// Score calculation functions for different metric types
function calculateSpeedScore(time, type) {
    if (time === null || time === undefined || isNaN(parseFloat(time))) {
        console.log(`${type} time is invalid: ${time}`);
        return null;
    }
    
    time = parseFloat(time);
    console.log(`Calculating ${type} score for time: ${time}`);
    
    let score;
    switch (type) {
        case 'forty':
            if (time <= 4.2) score = 10;
            else if (time <= 4.3) score = 9;
            else if (time <= 4.4) score = 8;
            else if (time <= 4.5) score = 7;
            else if (time <= 4.6) score = 6;
            else if (time <= 4.7) score = 5;
            else if (time <= 4.8) score = 3;
            else if (time <= 4.9) score = 1;
            else score = 0;
            break;
        case 'twenty':
            if (time <= 2.5) score = 10;
            else if (time <= 2.6) score = 9;
            else if (time <= 2.7) score = 8;
            else if (time <= 2.8) score = 7;
            else if (time <= 2.9) score = 6;
            else if (time <= 3.0) score = 5;
            else if (time <= 3.1) score = 3;
            else if (time <= 3.2) score = 1;
            else score = 0;
            break;
        case 'ten':
            if (time <= 1.4) score = 10;
            else if (time <= 1.5) score = 9;
            else if (time <= 1.6) score = 8;
            else if (time <= 1.7) score = 7;
            else if (time <= 1.8) score = 6;
            else if (time <= 1.9) score = 5;
            else if (time <= 2.0) score = 3;
            else if (time <= 2.1) score = 1;
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    console.log(`Calculated ${type} score: ${score}`);
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateJumpScore(measurement, type) {
    if (measurement === null || measurement === undefined || isNaN(parseFloat(measurement))) {
        console.log(`${type} measurement is invalid: ${measurement}`);
        return null;
    }
    
    measurement = parseFloat(measurement);
    console.log(`Calculating ${type} score for measurement: ${measurement}`);
    
    let score;
    switch (type) {
        case 'vertical':
            if (measurement >= 42) score = 10;
            else if (measurement >= 40) score = 9;
            else if (measurement >= 38) score = 8;
            else if (measurement >= 36) score = 7;
            else if (measurement >= 34) score = 6;
            else if (measurement >= 32) score = 5;
            else if (measurement >= 30) score = 4;
            else if (measurement >= 28) score = 3;
            else if (measurement >= 26) score = 2;
            else if (measurement >= 24) score = 1;
            else score = 0;
            break;
        case 'broad':
            // Convert to inches if needed
            if (measurement >= 132) score = 10; // 11'0"
            else if (measurement >= 126) score = 9; // 10'6"
            else if (measurement >= 120) score = 8; // 10'0"
            else if (measurement >= 114) score = 7; // 9'6"
            else if (measurement >= 108) score = 6; // 9'0"
            else if (measurement >= 102) score = 5; // 8'6"
            else if (measurement >= 96) score = 4;  // 8'0"
            else if (measurement >= 90) score = 3;  // 7'6"
            else if (measurement >= 84) score = 2;  // 7'0"
            else if (measurement >= 78) score = 1;  // 6'6"
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    console.log(`Calculated ${type} score: ${score}`);
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateStrengthScore(reps) {
    if (reps === null || reps === undefined || isNaN(parseFloat(reps))) {
        console.log(`Bench press reps is invalid: ${reps}`);
        return null;
    }
    
    reps = parseFloat(reps);
    console.log(`Calculating bench press score for reps: ${reps}`);
    
    let score;
    if (reps >= 36) score = 10;
    else if (reps >= 33) score = 9;
    else if (reps >= 30) score = 8;
    else if (reps >= 27) score = 7;
    else if (reps >= 24) score = 6;
    else if (reps >= 21) score = 5;
    else if (reps >= 18) score = 4;
    else if (reps >= 15) score = 3;
    else if (reps >= 12) score = 2;
    else if (reps >= 9) score = 1;
    else score = 0;
    
    console.log(`Calculated bench press score: ${score}`);
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateAgilityScore(time, type) {
    if (time === null || time === undefined || isNaN(parseFloat(time))) {
        console.log(`${type} time is invalid: ${time}`);
        return null;
    }
    
    time = parseFloat(time);
    console.log(`Calculating ${type} score for time: ${time}`);
    
    let score;
    switch (type) {
        case 'shuttle':
            if (time <= 3.9) score = 10;
            else if (time <= 4.0) score = 9;
            else if (time <= 4.1) score = 8;
            else if (time <= 4.2) score = 7;
            else if (time <= 4.3) score = 6;
            else if (time <= 4.4) score = 5;
            else if (time <= 4.5) score = 4;
            else if (time <= 4.6) score = 3;
            else if (time <= 4.7) score = 2;
            else if (time <= 4.8) score = 1;
            else score = 0;
            break;
        case 'cone':
            if (time <= 6.5) score = 10;
            else if (time <= 6.7) score = 9;
            else if (time <= 6.9) score = 8;
            else if (time <= 7.1) score = 7;
            else if (time <= 7.3) score = 6;
            else if (time <= 7.5) score = 5;
            else if (time <= 7.7) score = 4;
            else if (time <= 7.9) score = 3;
            else if (time <= 8.1) score = 2;
            else if (time <= 8.3) score = 1;
            else score = 0;
            break;
        default:
            score = 5;
    }
    
    console.log(`Calculated ${type} score: ${score}`);
    return Math.max(0, Math.min(10, score)).toFixed(2);
}
