// This script automatically runs the direct calculator
// to ensure all RAS scores are calculated correctly

console.log("Auto calculator script loaded");

// Function to automatically run the calculator
function runAutoCalculator() {
    console.log("Running auto calculator check");
    
    // Check if our direct calculation function exists
    if (typeof directCalculateAllScores === 'function') {
        console.log("Found directCalculateAllScores, running it");
        directCalculateAllScores();
    } else {
        console.log("directCalculateAllScores function not available");
    }
}

// Run immediately after page load
setTimeout(function() {
    console.log("Initial auto calculator run");
    runAutoCalculator();
}, 3000);

// Also set up interval to run periodically
setInterval(function() {
    runAutoCalculator();
}, 5000);

// Watch for changes in value elements and run calculator when they change
function setupValueWatcher() {
    console.log("Setting up value element watchers");
    
    const valueElements = [
        'forty-value',
        'vertical-value',
        'broad-value',
        'bench-value',
        'cone-value',
        'shuttle-value'
    ];
    
    valueElements.forEach(function(elemId) {
        const elem = document.getElementById(elemId);
        if (elem) {
            console.log(`Setting up observer for ${elemId}`);
            // Create an observer for this element
            const observer = new MutationObserver(function(mutations) {
                console.log(`${elemId} changed, running calculator`);
                runAutoCalculator();
            });
            
            // Start observing
            observer.observe(elem, { 
                characterData: true, 
                childList: true, 
                subtree: true 
            });
        }
    });
}

// Set up the value watchers after a delay
setTimeout(setupValueWatcher, 4000);

console.log("Auto calculator setup complete");
