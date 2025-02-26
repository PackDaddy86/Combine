// Helper functions for saving user-specific combine data

/**
 * Saves specific combine event data for the current user
 * @param {string} eventType - The type of event ('fortyYardDash', 'verticalJump', etc.)
 * @param {string|number} value - The value to store for this event
 */
function saveCombineEventData(eventType, value) {
    console.log(`Saving ${eventType} value: ${value}`);
    
    // If Firebase is available and user is logged in, save to their account
    if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log(`User logged in: ${user.uid}, saving ${eventType} to Firestore`);
            
            // Get existing combine results if any
            const combineResults = JSON.parse(localStorage.getItem('combineResults') || '{}');
            combineResults[eventType] = value;
            combineResults.lastUpdated = new Date().toISOString();
            
            // Save to localStorage for immediate access
            localStorage.setItem(eventType, value);
            localStorage.setItem('combineResults', JSON.stringify(combineResults));
            
            // Save to Firestore
            saveUserData('combine', combineResults);
        } else {
            console.log('No user logged in, using localStorage only');
            // Save to localStorage as fallback
            localStorage.setItem(eventType, value);
            
            // Update the combined results object
            const results = JSON.parse(localStorage.getItem('combineResults') || '{}');
            results[eventType] = value;
            results.lastUpdated = new Date().toISOString();
            localStorage.setItem('combineResults', JSON.stringify(results));
        }
    } else {
        console.log('Firebase not available, using localStorage only');
        // Save to localStorage as fallback
        localStorage.setItem(eventType, value);
        
        // Update the combined results object
        const results = JSON.parse(localStorage.getItem('combineResults') || '{}');
        results[eventType] = value;
        results.lastUpdated = new Date().toISOString();
        localStorage.setItem('combineResults', JSON.stringify(results));
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
    console.log('user-data.js loaded, initializing Firebase auth listener');
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User logged in with user-data.js listener, syncing data');
                syncUserData(user.uid);
            } else {
                console.log('User logged out, clearing localStorage');
                clearLocalStorageData();
            }
        });
    }
});

// Clear localStorage data
function clearLocalStorageData() {
    // List of keys to clear (game-specific data)
    const keysToRemove = [
        'combineResults',
        'rasResults',
        'fortyYardDash',
        'verticalJump',
        'benchPress',
        'broadJump',
        'coneDrill',
        'shuttleRun'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('Cleared localStorage data');
}

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
                    console.log('Syncing combine data from Firestore');
                    const combineData = userData.games.combine;
                    localStorage.setItem('combineResults', JSON.stringify(combineData));
                    
                    // Set individual values
                    if (combineData.fortyYardDash) localStorage.setItem('fortyYardDash', combineData.fortyYardDash);
                    if (combineData.verticalJump) localStorage.setItem('verticalJump', combineData.verticalJump);
                    if (combineData.benchPress) localStorage.setItem('benchPress', combineData.benchPress);
                    if (combineData.broadJump) localStorage.setItem('broadJump', combineData.broadJump);
                    if (combineData.coneDrill) localStorage.setItem('coneDrill', combineData.coneDrill);
                    if (combineData.shuttleRun) localStorage.setItem('shuttleRun', combineData.shuttleRun);
                    
                    // Update UI if we're on the combine page
                    if (typeof updateResultsAndButtons === 'function') {
                        try {
                            console.log('Updating combine UI');
                            updateResultsAndButtons();
                        } catch (e) {
                            console.log('Error updating combine UI:', e);
                        }
                    }
                } else {
                    console.log('No combine data found in Firestore');
                }
                
                if (userData.games && userData.games.rasResults) {
                    console.log('Syncing RAS data from Firestore');
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                    
                    // Update RAS UI if we're on the RAS page
                    if (window.location.href.includes('/ras/')) {
                        if (typeof updateSavedResultsList === 'function') {
                            try {
                                console.log('Updating RAS UI');
                                updateSavedResultsList();
                            } catch (e) {
                                console.log('Error updating RAS UI:', e);
                            }
                        }
                    }
                } else {
                    console.log('No RAS data found in Firestore');
                }
            } else {
                console.log('No user document found in Firestore for ID:', userId);
            }
        })
        .catch(error => {
            console.error('Error syncing user data from Firestore:', error);
        });
}
