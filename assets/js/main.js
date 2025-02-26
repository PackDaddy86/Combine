// Main application JavaScript

// Check if we're on a page with combine results
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase auth listener if not already done
  initFirebaseAuthListener();
  
  // Handle RAS Page specific functionality
  if (window.location.href.includes('/ras/')) {
    setupRASPageSync();
  }
  
  // Handle other game types as needed
});

// Initialize Firebase auth listener if not in firebase-config.js
function initFirebaseAuthListener() {
  if (typeof firebase !== 'undefined' && firebase.auth) {
    // Firebase is available, set up listener for user changes
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log('Auth state change: User logged in with main.js listener');
      } else {
        console.log('Auth state change: User logged out with main.js listener');
      }
    });
  }
}

// Monitor localStorage for changes that should be synced with Firestore
function setupLocalStorageSync() {
  const syncKeys = ['combineResults', 'playerInfo', 'rasResults', 
                   'fortyYardDash', 'verticalJump', 'benchPress', 
                   'broadJump', 'coneDrill', 'shuttleRun'];
  
  // Instead of using storage event (which doesn't work reliably between tabs),
  // we'll intercept localStorage setItem method
  const originalSetItem = localStorage.setItem;
  
  localStorage.setItem = function(key, value) {
    // Call the original method
    originalSetItem.apply(this, arguments);
    
    // Process if this is a key we want to sync
    if (syncKeys.includes(key)) {
      try {
        // For individual event data, update the combined object first
        if (key !== 'combineResults' && key !== 'rasResults' && key !== 'playerInfo') {
          // Update the combined object
          const combineResults = JSON.parse(localStorage.getItem('combineResults') || '{}');
          combineResults[key] = value;
          combineResults.lastUpdated = new Date().toISOString();
          
          // Save the updated combined object
          originalSetItem.call(localStorage, 'combineResults', JSON.stringify(combineResults));
          
          // Get the updated data
          const data = combineResults;
          
          // Save to Firestore if possible and if user is logged in
          if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
            const user = firebase.auth().currentUser;
            if (user) {
              saveUserData('combine', data);
            }
          }
        } 
        // For combined objects, just sync them directly
        else if (key === 'combineResults' || key === 'rasResults' || key === 'playerInfo') {
          let data;
          try {
            data = JSON.parse(value);
          } catch (e) {
            data = value;
          }
          
          // Save to Firestore if possible and if user is logged in
          if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
            const user = firebase.auth().currentUser;
            if (user) {
              saveUserData(key, data);
            }
          }
        }
      } catch (error) {
        console.error('Error processing localStorage change:', error);
      }
    }
  };
}

// Function to intercept localStorage setItem to sync with Firestore
function setupRASPageSync() {
  // Wait for RAS calculations to be available
  const checkInterval = setInterval(() => {
    if (typeof calculateRASScores === 'function') {
      clearInterval(checkInterval);
      
      // Override the original function with our version that also saves to Firestore
      const originalCalculateRAS = calculateRASScores;
      
      // Replace with our version that also saves to Firestore
      window.calculateRASScores = function() {
        // Run the original calculation function
        originalCalculateRAS.apply(this, arguments);
        
        // Get the data from localStorage
        try {
          const rasData = JSON.parse(localStorage.getItem('rasResults') || '{}');
          
          // Save to Firestore if we have auth functions and user is logged in
          if (typeof firebase !== 'undefined' && firebase.auth && typeof saveUserData === 'function') {
            const user = firebase.auth().currentUser;
            if (user && Object.keys(rasData).length > 0) {
              saveUserData('rasResults', rasData);
            }
          }
        } catch (error) {
          console.error('Error syncing RAS data with Firestore:', error);
        }
      };
    }
  }, 100);
}

// Initialize localStorage monitoring
setupLocalStorageSync();
