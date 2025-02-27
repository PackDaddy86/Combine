// Helper functions for saving user-specific combine data

/**
 * Saves specific combine event data for the current user
 * @param {string} eventType - The type of event ('fortyYardDash', 'verticalJump', etc.)
 * @param {string|number} value - The value to store for this event
 * @returns {Promise} - A promise that resolves when the save is complete
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
            
            // Return a proper promise for this operation
            return new Promise((resolve, reject) => {
                // Save it directly to the users collection
                db.collection('users').doc(user.uid).update({
                    [eventType]: value,
                    lastUpdate: new Date()
                }).then(() => {
                    console.log(`Successfully saved ${eventType} = ${value} to Firestore via update`);
                    resolve();
                }).catch(error => {
                    // If update fails, try set instead (document might not exist)
                    console.log(`Update failed, trying to create document: ${error.message}`);
                    
                    db.collection('users').doc(user.uid).set({
                        [eventType]: value,
                        lastUpdate: new Date(),
                        email: user.email
                    }, { merge: true }) // Use merge option to preserve other fields
                    .then(() => {
                        console.log(`Successfully created/merged document`);
                        resolve();
                    }).catch(error => {
                        console.error(`Error saving data: ${error.message}`);
                        reject(error);
                    });
                });
            });
        } else {
            console.log('No user logged in, saved to localStorage only');
            return Promise.resolve();
        }
    } else {
        console.log('Firebase not available, saved to localStorage only');
        return Promise.resolve();
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

/**
 * Resets all combine data for the current user
 */
function resetCombineData() {
    console.log('🔴 Debug [resetCombineData] Resetting combine data');
    
    // First clear all localStorage
    clearLocalStorageData();
    
    // Then reset Firebase if user is logged in
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log(`🔴 Debug [resetCombineData] User logged in, resetting Firebase data for ${user.uid}`);
            
            const db = firebase.firestore();
            
            // DELETE the entire document and recreate it with minimal info
            return db.collection('users').doc(user.uid).delete()
                .then(() => {
                    console.log('🔴 Debug [resetCombineData] Successfully deleted Firebase document');
                    
                    // Create a new empty document with just the user's email
                    return db.collection('users').doc(user.uid).set({
                        email: user.email,
                        lastUpdate: new Date()
                    });
                })
                .then(() => {
                    console.log('🔴 Debug [resetCombineData] Successfully recreated empty Firebase document');
                    
                    // Force UI refresh by calling updateResultsAndButtons if it exists
                    if (typeof updateResultsAndButtons === 'function') {
                        try {
                            updateResultsAndButtons();
                        } catch (e) {
                            console.error('Error updating UI after reset:', e);
                        }
                    }
                    
                    // Force page reload to ensure everything is fresh
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                    
                    return true;
                })
                .catch(error => {
                    console.error('🔴 Debug [resetCombineData] Error resetting Firebase data:', error);
                    
                    // Force page reload even if there was an error
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                    
                    return false;
                });
        }
    }
    
    // Force UI refresh by calling updateResultsAndButtons if it exists
    if (typeof updateResultsAndButtons === 'function') {
        try {
            updateResultsAndButtons();
        } catch (e) {
            console.error('Error updating UI after reset:', e);
        }
    }
    
    // Force page reload to ensure everything is fresh
    setTimeout(() => {
        window.location.reload();
    }, 500);
    
    return Promise.resolve(true); // If no user or Firebase, just return a resolved promise
}

/**
 * Clears all combine-related data from localStorage
 */
function clearLocalStorageData() {
    console.log('🔴 Debug [clearLocalStorageData] Clearing combine data from localStorage');
    
    // Clear all individual event items
    localStorage.removeItem('fortyYardDash');
    localStorage.removeItem('verticalJump');
    localStorage.removeItem('benchPress');
    localStorage.removeItem('broadJump');
    localStorage.removeItem('coneDrill');
    localStorage.removeItem('shuttleRun');
    
    // Clear compound data
    localStorage.removeItem('combineResults');
    
    console.log('🔴 Debug [clearLocalStorageData] All combine data cleared from localStorage');
}

/**
 * Debug function to check the current structure of a user's Firebase document
 * This is helpful for troubleshooting 
 */
function checkFirebaseUserDocument() {
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log(`🔴 Debug [checkDocument] Checking Firebase document for user ${user.uid}`);
            
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        console.log('🔴 Debug [checkDocument] Document exists with data:', doc.data());
                        // Log each field individually
                        const data = doc.data();
                        Object.keys(data).forEach(key => {
                            console.log(`🔴 Field: ${key} = ${JSON.stringify(data[key])}`);
                        });
                    } else {
                        console.log('🔴 Debug [checkDocument] No document found for this user');
                    }
                })
                .catch(error => {
                    console.error('🔴 Debug [checkDocument] Error fetching document:', error);
                });
        } else {
            console.log('🔴 Debug [checkDocument] No user is currently logged in');
        }
    } else {
        console.log('🔴 Debug [checkDocument] Firebase is not initialized');
    }
}

// Add a global function to expose this for debugging in the console
window.checkFirebaseUserDocument = checkFirebaseUserDocument;

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
                
                // First check if the data exists in Firebase, if not, clear it from localStorage too
                if (!userData.hasOwnProperty('fortyYardDash')) localStorage.removeItem('fortyYardDash');
                if (!userData.hasOwnProperty('verticalJump')) localStorage.removeItem('verticalJump');
                if (!userData.hasOwnProperty('benchPress')) localStorage.removeItem('benchPress');
                if (!userData.hasOwnProperty('broadJump')) localStorage.removeItem('broadJump');
                if (!userData.hasOwnProperty('coneDrill')) localStorage.removeItem('coneDrill');
                if (!userData.hasOwnProperty('shuttleRun')) localStorage.removeItem('shuttleRun');
                
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
