// Leaderboard.js - Fetch and display all user scores from Firebase

document.addEventListener('DOMContentLoaded', function() {
    console.log('Leaderboard page loaded');
    
    // Only fetch data when Firebase is available
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        console.log('Firebase available, fetching leaderboard data');
        fetchLeaderboardData();
    } else {
        console.log('Firebase not available, waiting for it to initialize');
        // Wait for Firebase to initialize
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                console.log('Firebase initialized, fetching leaderboard data');
                clearInterval(checkFirebase);
                fetchLeaderboardData();
            }
        }, 500);
    }
});

/**
 * Fetch all user data from Firestore to build leaderboards
 */
function fetchLeaderboardData() {
    const db = firebase.firestore();
    
    db.collection('users').get()
        .then(snapshot => {
            console.log(`Found ${snapshot.size} users for leaderboard`);
            
            // Arrays to store all user data for each event
            const userData = {
                fortyYardDash: [],
                verticalJump: [],
                benchPress: [],
                broadJump: [],
                coneDrill: [],
                shuttleRun: [],
                rasScores: []
            };
            
            // Process each user document
            snapshot.forEach(doc => {
                const user = doc.data();
                const userDisplayName = user.displayName || user.email || 'Anonymous Athlete';
                
                // Process combine data if it exists
                if (user.games && user.games.combine) {
                    const combine = user.games.combine;
                    
                    // 40-yard dash (lower is better)
                    if (combine.fortyYardDash) {
                        userData.fortyYardDash.push({
                            name: userDisplayName,
                            value: parseFloat(combine.fortyYardDash),
                            unit: 's'
                        });
                    }
                    
                    // Vertical jump (higher is better)
                    if (combine.verticalJump) {
                        userData.verticalJump.push({
                            name: userDisplayName,
                            value: parseFloat(combine.verticalJump),
                            unit: '"'
                        });
                    }
                    
                    // Bench press (higher is better)
                    if (combine.benchPress) {
                        userData.benchPress.push({
                            name: userDisplayName,
                            value: parseInt(combine.benchPress),
                            unit: ' reps'
                        });
                    }
                    
                    // Broad jump (higher is better)
                    if (combine.broadJump) {
                        userData.broadJump.push({
                            name: userDisplayName,
                            value: parseFloat(combine.broadJump),
                            unit: '"'
                        });
                    }
                    
                    // 3-cone drill (lower is better)
                    if (combine.coneDrill) {
                        userData.coneDrill.push({
                            name: userDisplayName,
                            value: parseFloat(combine.coneDrill),
                            unit: 's'
                        });
                    }
                    
                    // Shuttle run (lower is better)
                    if (combine.shuttleRun) {
                        userData.shuttleRun.push({
                            name: userDisplayName,
                            value: parseFloat(combine.shuttleRun),
                            unit: 's'
                        });
                    }
                }
                
                // Process RAS data if it exists
                if (user.games && user.games.rasResults) {
                    const rasResults = user.games.rasResults;
                    
                    // Find the highest RAS score for this user
                    let highestRas = 0;
                    let highestRasData = null;
                    
                    for (const key in rasResults) {
                        const rasData = rasResults[key];
                        if (rasData.score > highestRas) {
                            highestRas = rasData.score;
                            highestRasData = rasData;
                        }
                    }
                    
                    if (highestRasData) {
                        userData.rasScores.push({
                            name: userDisplayName,
                            value: highestRas,
                            position: highestRasData.position || 'Unknown',
                            unit: ''
                        });
                    }
                }
            });
            
            // Sort and display each leaderboard
            displayLeaderboard('fortyYardDash', userData.fortyYardDash, true); // lower is better
            displayLeaderboard('verticalJump', userData.verticalJump, false); // higher is better
            displayLeaderboard('benchPress', userData.benchPress, false); // higher is better
            displayLeaderboard('broadJump', userData.broadJump, false); // higher is better
            displayLeaderboard('coneDrill', userData.coneDrill, true); // lower is better
            displayLeaderboard('shuttleRun', userData.shuttleRun, true); // lower is better
            displayRasLeaderboard(userData.rasScores); // higher is better
        })
        .catch(error => {
            console.error('Error fetching leaderboard data:', error);
            const leaderboardElements = document.querySelectorAll('[id$="-leaderboard"]');
            leaderboardElements.forEach(element => {
                element.innerHTML = `<p>Error loading leaderboard data. Please try again later.</p>`;
            });
        });
}

/**
 * Display a leaderboard for a specific event
 * @param {string} eventId - The HTML ID of the container
 * @param {Array} data - The sorted data for this event
 * @param {boolean} lowerIsBetter - Whether lower values are better (e.g., time)
 */
function displayLeaderboard(eventId, data, lowerIsBetter) {
    const container = document.getElementById(`${eventId}-leaderboard`);
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No data available yet.</p>';
        return;
    }
    
    // Sort the data (lower or higher is better)
    data.sort((a, b) => {
        return lowerIsBetter ? a.value - b.value : b.value - a.value;
    });
    
    // Create table
    let html = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Athlete</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add top 10 or fewer
    const displayCount = Math.min(data.length, 10);
    for (let i = 0; i < displayCount; i++) {
        const entry = data[i];
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        
        html += `
            <tr>
                <td class="rank ${rankClass}">${i + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.value}${entry.unit}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

/**
 * Display the RAS leaderboard with position information
 * @param {Array} data - The RAS score data
 */
function displayRasLeaderboard(data) {
    const container = document.getElementById('ras-leaderboard');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p>No RAS data available yet.</p>';
        return;
    }
    
    // Sort by highest RAS
    data.sort((a, b) => b.value - a.value);
    
    // Create table
    let html = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Athlete</th>
                    <th>Position</th>
                    <th>RAS Score</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add top 10 or fewer
    const displayCount = Math.min(data.length, 10);
    for (let i = 0; i < displayCount; i++) {
        const entry = data[i];
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        
        html += `
            <tr>
                <td class="rank ${rankClass}">${i + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.position}</td>
                <td>${entry.value.toFixed(2)}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}
