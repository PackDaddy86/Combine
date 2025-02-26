document.addEventListener('DOMContentLoaded', function() {
    // RAS calculation constants
    const scoreRanges = {
        poor: { min: 0, max: 3.99 },
        belowAverage: { min: 4, max: 4.99 },
        average: { min: 5, max: 6.99 },
        good: { min: 7, max: 8.99 },
        excellent: { min: 9, max: 10 }
    };

    // Set initial default values (to avoid NaN on first load)
    setDefaultValues();
    
    // Load player data from localStorage
    loadPlayerData();
    
    // Event listeners for buttons
    document.getElementById('update-info').addEventListener('click', updatePlayerInfo);
    document.getElementById('save-card').addEventListener('click', saveAsImage);
    document.getElementById('share-card').addEventListener('click', shareResults);
    
    // Calculate and display RAS scores
    calculateRASScores();
});

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
        
        // Calculate overall RAS score (average of all metrics)
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
        
        // Calculate the overall RAS (only default to 7.16 if absolutely no scores are available)
        let overallRAS = "7.16"; // Default if nothing is available
        if (validCount > 0) {
            overallRAS = (totalScore / validCount).toFixed(2);
        }
        
        // Update overall RAS display with color coding
        updateOverallRAS(overallRAS);
        
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
                overallRAS: parseFloat(overallRAS)
            };
            
            // Save back to localStorage
            localStorage.setItem('rasResults', JSON.stringify(savedResults));
            
            // If Firebase saveUserData function exists, use it to save to the user's account
            if (typeof saveUserData === 'function') {
                saveUserData('rasResults', savedResults);
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
    if (isNaN(time)) return NaN;
    
    // Lower times are better for speed drills
    let score;
    
    switch(type) {
        case 'forty':
            // Scale: 4.2s = 10, 5.2s = 0
            score = 10 - ((time - 4.2) * 10);
            break;
        case 'twenty':
            // Scale: 2.5s = 10, 3.5s = 0
            score = 10 - ((time - 2.5) * 10);
            break;
        case 'ten':
            // Scale: 1.4s = 10, 2.0s = 0
            score = 10 - ((time - 1.4) * (10 / 0.6));
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateJumpScore(measurement, type) {
    if (isNaN(measurement)) return NaN;
    
    // Higher measurements are better for jumps
    let score;
    
    switch(type) {
        case 'vertical':
            // Scale: 44" = 10, 24" = 0
            score = ((measurement - 24) * (10 / 20));
            break;
        case 'broad':
            // Scale: 140" = 10, 90" = 0
            score = ((measurement - 90) * (10 / 50));
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateStrengthScore(reps) {
    if (isNaN(reps)) return NaN;
    
    // Scale: 36 reps = 10, 0 reps = 0
    const score = (reps * (10 / 36));
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function calculateAgilityScore(time, type) {
    if (isNaN(time)) return NaN;
    
    // Lower times are better for agility drills
    let score;
    
    switch(type) {
        case 'cone':
            // Scale: 6.4s = 10, 8.4s = 0
            score = 10 - ((time - 6.4) * 5);
            break;
        case 'shuttle':
            // Scale: 3.8s = 10, 5.0s = 0
            score = 10 - ((time - 3.8) * (10 / 1.2));
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
}

function updateScoreDisplay(elementId, score) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (score === null) {
        element.textContent = "--";
        element.className = "metric-score";
        return;
    }
    
    element.textContent = score;
    
    // Remove any existing color classes
    element.className = "metric-score";
    
    // Add appropriate color class based on score
    const scoreValue = parseFloat(score);
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

function calculateCompositeGrade(scores) {
    // Filter out null values
    const validScores = scores.filter(score => score !== null);
    if (validScores.length === 0) return null;
    
    // Calculate average of valid scores
    const sum = validScores.reduce((total, score) => total + parseFloat(score), 0);
    return sum / validScores.length;
}

function updateGradeDisplay(elementId, score, prefix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (score === null) {
        element.textContent = `${prefix} : N/A`;
        element.className = "composite-grade";
        element.classList.add(elementId);
        return;
    }
    
    const gradeText = getGradeText(score);
    element.textContent = `${prefix} : ${gradeText}`;
    
    // Remove any existing color classes
    element.className = "composite-grade";
    element.classList.add(elementId); // Add back the position class
    
    // Add appropriate color class based on grade
    if (score < 4) {
        element.classList.add("grade-poor");
    } else if (score < 5) {
        element.classList.add("grade-below-average");
    } else if (score < 7) {
        element.classList.add("grade-average");
    } else if (score < 9) {
        element.classList.add("grade-good");
    } else {
        element.classList.add("grade-excellent");
    }
}

function getGradeText(score) {
    if (score < 4) return "POOR";
    if (score < 5) return "BELOW AVERAGE";
    if (score < 7) return "OKAY";
    if (score < 9) return "GOOD";
    return "EXCELLENT";
}

function calculateSizeScore(measurement, type) {
    if (isNaN(measurement)) return 5.0; // Default to average if NaN
    
    let score;
    
    switch(type) {
        case 'height':
            // Scale for QB: 75" (6'3") = 8, 69" (5'9") = 2
            // Adjust as needed for position
            score = ((measurement - 69) * (6 / 6)) + 2;
            break;
        case 'weight':
            // Scale for QB: 230 = 8, 190 = 2
            // Adjust as needed for position
            score = ((measurement - 190) * (6 / 40)) + 2;
            break;
        default:
            score = 5;
    }
    
    return Math.max(0, Math.min(10, score)).toFixed(2);
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
