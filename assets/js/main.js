// Main application JavaScript

// Check if we're on a page with combine results
document.addEventListener('DOMContentLoaded', function() {
  // Set up storage listener to save data to Firestore when localStorage changes
  window.addEventListener('storage', function(e) {
    // Only process if this is a key we want to sync
    const syncKeys = ['combineResults', 'playerInfo', 'rasResults'];
    
    if (syncKeys.includes(e.key) && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        // Save to Firestore if possible
        if (typeof saveUserData === 'function') {
          saveUserData(e.key, data);
        }
      } catch (error) {
        console.error('Error processing localStorage change:', error);
      }
    }
  });
  
  // Handle RAS Page specific functionality
  if (window.location.href.includes('/ras/')) {
    setupRASPageSync();
  }
  
  // Handle other game types as needed
});

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
          
          // Save to Firestore if we have auth functions
          if (typeof saveUserData === 'function' && Object.keys(rasData).length > 0) {
            saveUserData('rasResults', rasData);
          }
        } catch (error) {
          console.error('Error syncing RAS data with Firestore:', error);
        }
      };
      
      console.log('RAS sync with user account set up');
    }
  }, 100);
}
