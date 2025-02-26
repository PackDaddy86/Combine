// Combine auth utility for loading user-specific combine data

document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User logged in, loading personal combine data');
                loadUserCombineData(user.uid);
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
    const db = firebase.firestore();
    
    db.collection('users').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Load combine data if available
                if (userData.games && userData.games.combine) {
                    const combineData = userData.games.combine;
                    
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
                        updateResultsAndButtons();
                    }
                }
                
                // Load RAS data if available 
                if (userData.games && userData.games.rasResults) {
                    localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
                    
                    // Update RAS UI if on RAS page
                    if (window.location.href.includes('/ras/')) {
                        if (typeof updateSavedResultsList === 'function') {
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
