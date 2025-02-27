// Helper functions for saving user-specific combine data

/**
 * Saves specific combine event data for the current user
 * @param {string} eventType - The type of event ('fortyYardDash', 'verticalJump', etc.)
 * @param {string|number} value - The value to store for this event
 */
function saveCombineEventData(eventType, value) {
    console.log(`SUPER SIMPLE SAVE: Saving ${eventType} = ${value}`);
    
    // Always save to localStorage first
    localStorage.setItem(eventType, value);
    
    // Get the firebase user
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log(`User logged in as ${user.uid}, saving directly to Firestore`);
            
            // Get Firestore reference
            const db = firebase.firestore();
            
            // Save it directly to the games collection without nesting
            db.collection('users').doc(user.uid).update({
                [eventType]: value,
                lastUpdate: new Date()
            }).then(() => {
                console.log(`Successfully saved ${eventType} = ${value} to Firestore`);
            }).catch(error => {
                // If update fails, try set instead (document might not exist)
                console.log(`Update failed, trying to create document: ${error.message}`);
                
                db.collection('users').doc(user.uid).set({
                    [eventType]: value,
                    lastUpdate: new Date(),
                    email: user.email
                }).then(() => {
                    console.log(`Successfully created document with ${eventType} = ${value}`);
                }).catch(error => {
                    console.error(`Error saving data: ${error.message}`);
                });
            });
        } else {
            console.log('No user logged in, saved to localStorage only');
        }
    } else {
        console.log('Firebase not available, saved to localStorage only');
    }
}

/**
 * Loads data for a specific combine event
 * @param {string} eventType - The type of event to load
 * @returns {string|null} - The value or null if not found
 */
function loadCombineEventData(eventType) {
    console.log(`🔴 Debug [${eventType}] loadCombineEventData called`);
    
    // First check localStorage
    const value = localStorage.getItem(eventType);
    console.log(`🔴 Debug [${eventType}] Loaded from localStorage: ${eventType} = ${value}`);
    
    return value;
}

/**
 * Loads the combine results for the current user
 */
function loadCombineResults() {
    console.log('🔴 Debug [loadCombineResults] Loading from localStorage:');
    
    // First try to load from localStorage
    const fortyYard = localStorage.getItem('fortyYardDash');
    const vertical = localStorage.getItem('verticalJump');
    const bench = localStorage.getItem('benchPress');
    const broad = localStorage.getItem('broadJump');
    const cone = localStorage.getItem('coneDrill');
    const shuttle = localStorage.getItem('shuttleRun');
    
    console.log('  fortyYardDash:', fortyYard);
    console.log('  verticalJump:', vertical);
    console.log('  benchPress:', bench);
    console.log('  broadJump:', broad);
    console.log('  coneDrill:', cone);
    console.log('  shuttleRun:', shuttle);
    
    return {
        fortyYardDash: fortyYard,
        verticalJump: vertical,
        benchPress: bench,
        broadJump: broad,
        coneDrill: cone,
        shuttleRun: shuttle
    };
}

// Initialize Firebase auth listener if not already listening
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(`Auth state changed: User logged in as ${user.uid}`);
            syncUserData(user.uid);
        } else {
            console.log('Auth state changed: User logged out');
            clearLocalStorageData();
        }
    });
}

// Clear localStorage data
function clearLocalStorageData() {
    console.log('🔴 Debug [clearLocalStorageData] Clearing localStorage data');
    
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
    console.log('🔴 Debug [clearLocalStorageData] Cleared localStorage data');
}

// Sync user data between Firestore and localStorage
function syncUserData(userId) {
    console.log(`🔴 Debug [syncUserData] Syncing user data for user ID: ${userId}`);
    
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.log('🔴 Debug [syncUserData] Firebase not available for syncing');
        return;
    }
    
    const db = firebase.firestore();
    db.collection('users').doc(userId).get()
        .then(doc => {
            console.log(`🔴 Debug [syncUserData] Retrieved user document, exists: ${doc.exists}`);
            
            if (doc.exists) {
                console.log('🔴 Debug [syncUserData] Syncing user data from Firestore to localStorage');
                const userData = doc.data();
                
                // Update individual event data in localStorage
                if (userData.fortyYardDash) localStorage.setItem('fortyYardDash', userData.fortyYardDash);
                if (userData.verticalJump) localStorage.setItem('verticalJump', userData.verticalJump);
                if (userData.benchPress) localStorage.setItem('benchPress', userData.benchPress);
                if (userData.broadJump) localStorage.setItem('broadJump', userData.broadJump);
                if (userData.coneDrill) localStorage.setItem('coneDrill', userData.coneDrill);
                if (userData.shuttleRun) localStorage.setItem('shuttleRun', userData.shuttleRun);
                
                console.log('🔴 Debug [syncUserData] Synchronized combine data from Firestore');
                
                // Update the UI where appropriate
                if (typeof updateResultsAndButtons === 'function') {
                    try {
                        console.log('🔴 Debug [syncUserData] Updating combine UI');
                        updateResultsAndButtons();
                    } catch (e) {
                        console.log('🔴 Debug [syncUserData] Error updating combine UI:', e);
                    }
                }
                
                // Handle RAS data if needed
                if (userData.games && userData.games.rasResults) {
                    console.log('🔴 Debug [syncUserData] Syncing RAS data from Firestore');
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                    
                    // Update RAS UI if we're on the RAS page
                    if (window.location.href.includes('/combine/ras/')) {
                        if (typeof updateSavedResultsList === 'function') {
                            try {
                                console.log('🔴 Debug [syncUserData] Updating RAS UI');
                                updateSavedResultsList();
                            } catch (e) {
                                console.log('🔴 Debug [syncUserData] Error updating RAS UI:', e);
                            }
                        }
                    }
                } else {
                    console.log('🔴 Debug [syncUserData] No RAS data found in Firestore');
                }
            } else {
                console.log(`🔴 Debug [syncUserData] No user document found in Firestore for ID: ${userId}`);
            }
        })
        .catch(error => {
            console.error(`🔴 Debug [syncUserData] Error syncing user data from Firestore:`, error);
        });
}
