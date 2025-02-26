// Combine auth utility for loading user-specific combine data

document.addEventListener('DOMContentLoaded', function() {
    console.log('combine-auth.js loaded, initializing');
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User logged in, loading personal combine data');
                loadUserCombineData(user.uid);
                
                // Check if we need to immediately save any data
                if (window.location.href.includes('/combine/')) {
                    const combineResults = JSON.parse(localStorage.getItem('combineResults') || '{}');
                    if (Object.keys(combineResults).length > 0) {
                        console.log('Found existing combine data in localStorage, syncing to Firestore');
                        if (typeof saveUserData === 'function') {
                            saveUserData('combine', combineResults);
                        }
                    }
                }
            } else {
                console.log('No user logged in, using local storage data only');
            }
        });
    }
});

/**
 * Load user-specific combine data from Firestore
 */
function loadUserCombineData(userId) {
    console.log('Loading combine data for user:', userId);
    const db = firebase.firestore();
    
    // Check if document exists by getting it first
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('User document does not exist, creating it');
                // Create the user document if it doesn't exist
                return db.collection('users').doc(userId).set({
                    email: firebase.auth().currentUser.email,
                    createdAt: new Date(),
                    games: {}
                }).then(() => {
                    console.log('Created new user document');
                });
            }
            
            if (doc.exists) {
                const userData = doc.data();
                console.log('User data loaded:', userData);
                
                // Load combine data if available
                if (userData.games && userData.games.combine) {
                    const combineData = userData.games.combine;
                    console.log('Found combine data in Firestore:', combineData);
                    
                    // Update localStorage with the user's combine data
                    localStorage.setItem('combineResults', JSON.stringify(combineData));
                    
                    // Set individual event data
                    if (combineData.fortyYardDash) {
                        localStorage.setItem('fortyYardDash', combineData.fortyYardDash);
                    }
                    
                    if (combineData.verticalJump) {
                        localStorage.setItem('verticalJump', combineData.verticalJump);
                    }
                    
                    if (combineData.benchPress) {
                        localStorage.setItem('benchPress', combineData.benchPress);
                    }
                    
                    if (combineData.broadJump) {
                        localStorage.setItem('broadJump', combineData.broadJump);
                    }
                    
                    if (combineData.coneDrill) {
                        localStorage.setItem('coneDrill', combineData.coneDrill);
                    }
                    
                    if (combineData.shuttleRun) {
                        localStorage.setItem('shuttleRun', combineData.shuttleRun);
                    }
                    
                    // Update the UI to reflect the user's data
                    if (typeof updateResultsAndButtons === 'function') {
                        console.log('Updating combine UI');
                        updateResultsAndButtons();
                    }
                }
                
                // Load RAS data if available 
                if (userData.games && userData.games.rasResults) {
                    console.log('Found RAS data in Firestore');
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                    
                    // Update RAS UI if on RAS page
                    if (window.location.href.includes('/ras/')) {
                        if (typeof updateSavedResultsList === 'function') {
                            console.log('Updating RAS UI');
                            updateSavedResultsList();
                        }
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error loading user combine data:', error);
        });
}
