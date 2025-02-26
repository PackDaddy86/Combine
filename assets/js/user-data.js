// Helper functions for saving user-specific combine data

/**
 * Saves specific combine event data for the current user
 * @param {string} eventType - The type of event ('fortyYardDash', 'verticalJump', etc.)
 * @param {string|number} value - The value to store for this event
 */
function saveCombineEventData(eventType, value) {
    // First save to localStorage for immediate access
    localStorage.setItem(eventType, value);
    
    // Update the combined results object
    const results = JSON.parse(localStorage.getItem('combineResults') || '{}');
    results[eventType] = value;
    results.lastUpdated = new Date().toISOString();
    localStorage.setItem('combineResults', JSON.stringify(results));
    
    // If Firebase is available and user is logged in, save to their account
    if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log(`Saving ${eventType} data to user ${user.uid}`);
            saveUserData('combine', results);
        } else {
            console.log('User not logged in, data saved to localStorage only');
        }
    } else {
        console.log('Firebase not available, data saved to localStorage only');
    }
}

/**
 * Load user-specific combine data
 * @param {string} eventType - The type of event to load
 * @returns {string|null} - The value or null if not found
 */
function loadCombineEventData(eventType) {
    // First check localStorage
    return localStorage.getItem(eventType);
}

// Initialize Firebase auth listener if not already listening
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User logged in with user-data.js listener, syncing data');
                syncUserData(user.uid);
            }
        });
    }
});

// Sync user data between Firestore and localStorage
function syncUserData(userId) {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.log('Firebase not available for syncing');
        return;
    }
    
    const db = firebase.firestore();
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                console.log('Syncing user data from Firestore to localStorage');
                const userData = doc.data();
                
                if (userData.games && userData.games.combine) {
                    console.log('Syncing combine data');
                    localStorage.setItem('combineResults', JSON.stringify(userData.games.combine));
                    
                    // Set individual values
                    const combineData = userData.games.combine;
                    if (combineData.fortyYardDash) localStorage.setItem('fortyYardDash', combineData.fortyYardDash);
                    if (combineData.verticalJump) localStorage.setItem('verticalJump', combineData.verticalJump);
                    if (combineData.benchPress) localStorage.setItem('benchPress', combineData.benchPress);
                    if (combineData.broadJump) localStorage.setItem('broadJump', combineData.broadJump);
                    if (combineData.coneDrill) localStorage.setItem('coneDrill', combineData.coneDrill);
                    if (combineData.shuttleRun) localStorage.setItem('shuttleRun', combineData.shuttleRun);
                }
                
                if (userData.games && userData.games.rasResults) {
                    console.log('Syncing RAS data');
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                }
            }
        })
        .catch(error => {
            console.error('Error syncing user data:', error);
        });
}
