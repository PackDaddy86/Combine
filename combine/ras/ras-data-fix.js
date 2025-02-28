// This script ensures we properly load user data from Firebase
// into the RAS calculator, including username, height, and weight
console.log("RAS data fix script loaded");

// When the DOM is fully loaded, set up the fix
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up RAS data fix");
    
    // Override the saveRASScorestoFirestore function to also save height and weight
    window.saveRASScorestoFirestore = function() {
        console.log('Saving RAS scores to Firestore (enhanced version)');
        // Get existing results from localStorage
        const rasResults = JSON.parse(localStorage.getItem('rasResults') || '{}');
        
        // Only proceed if we have results to save
        if (Object.keys(rasResults).length === 0) {
            console.log('No RAS results to save');
            return;
        }
        
        // Check if user is logged in
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                console.log('User logged in, saving RAS results to Firestore');
                const db = firebase.firestore();
                
                // Get height and weight values to save to the user profile
                const height = document.getElementById('height').value;
                const weight = document.getElementById('weight').value;
                
                // Also get combine metrics from the form
                const benchValue = document.getElementById('bench-value').textContent || '';
                const fortyValue = document.getElementById('forty-value').textContent || '';
                const verticalValue = document.getElementById('vertical-value').textContent || '';
                const broadValue = document.getElementById('broad-value').textContent || '';
                const coneValue = document.getElementById('cone-value').textContent || '';
                const shuttleValue = document.getElementById('shuttle-value').textContent || '';
                
                // Create the data object to save in two formats for compatibility
                const dataToSave = {
                    // Save RAS results
                    games: {
                        rasResults: rasResults,
                        // Also save in games.combine structure for compatibility
                        combine: {
                            benchPress: benchValue,
                            fortyYardDash: fortyValue,
                            verticalJump: verticalValue,
                            broadJump: broadValue,
                            coneDrill: coneValue,
                            shuttleRun: shuttleValue,
                            lastUpdated: new Date().toISOString()
                        }
                    },
                    // Save metrics at root level for backward compatibility
                    benchPress: benchValue,
                    fortyYardDash: fortyValue,
                    verticalJump: verticalValue,
                    broadJump: broadValue,
                    coneDrill: coneValue,
                    shuttleRun: shuttleValue,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                // Add height and weight to the root of the user document if they exist
                if (height) {
                    dataToSave.height = parseInt(height, 10) || height;
                    console.log(`Saving height to user profile: ${height}`);
                }
                
                if (weight) {
                    dataToSave.weight = parseInt(weight, 10) || weight;
                    console.log(`Saving weight to user profile: ${weight}`);
                }
                
                // Use set with merge to update only the specified fields
                db.collection('users').doc(user.uid).set(dataToSave, { merge: true })
                    .then(() => {
                        console.log('Successfully saved RAS scores and metrics to Firestore');
                        
                        // Show visual feedback
                        const saveBtn = document.querySelector('.save-btn');
                        if (saveBtn) {
                            const originalText = saveBtn.textContent;
                            saveBtn.textContent = 'Saved!';
                            setTimeout(() => {
                                saveBtn.textContent = originalText;
                            }, 2000);
                        }
                    })
                    .catch((error) => {
                        console.error('Error saving RAS scores to Firestore:', error);
                    });
            } else {
                console.log('User not logged in, RAS results saved to localStorage only');
            }
        } else {
            console.log('Firebase not available, RAS results saved to localStorage only');
        }
    };

    // Add a function to ensure we properly load user data
    window.enhancedGetUserData = function() {
        console.log("Running enhanced user data loader");
        
        // Check if Firebase is available and user is logged in
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
            console.log("Firebase not available or user not logged in");
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("No user is currently logged in");
            return;
        }
        
        console.log("User is logged in:", user.uid);
        
        // Get user data from Firestore
        const db = firebase.firestore();
        db.collection("users").doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    console.log("Document data:", doc.data());
                    const userData = doc.data();
                    
                    // Log all available fields to help debug what's available
                    console.log("All available fields in user document:");
                    Object.keys(userData).forEach(key => {
                        console.log(`- ${key}: ${userData[key]}`);
                    });
                    
                    // Prepare a flattened data object to make it easier to access nested properties
                    const flatData = flattenUserData(userData);
                    console.log("Flattened data for easier access:", flatData);
                    
                    // Helper function to check multiple field names and set the value if found
                    const setValueFromMultipleFields = (displayElementId, possibleFieldNames) => {
                        for (const fieldName of possibleFieldNames) {
                            // Check in both the original userData and the flattened data
                            const value = flatData[fieldName] || userData[fieldName];
                            if (value !== undefined && value !== null) {
                                console.log(`Found ${fieldName}: ${value}`);
                                document.getElementById(displayElementId).textContent = value;
                                
                                // If there's a matching input field, set its value too
                                try {
                                    const inputElement = document.getElementById(displayElementId.replace('-value', ''));
                                    if (inputElement) {
                                        inputElement.value = value;
                                    }
                                } catch (e) {
                                    console.log("No matching input element found");
                                }
                                
                                return true;
                            }
                        }
                        console.log(`No matches found for ${displayElementId} among fields: ${possibleFieldNames.join(', ')}`);
                        return false;
                    };
                    
                    // Try to populate each metric with various possible field names
                    setValueFromMultipleFields('forty-value', ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40', 'games.combine.fortyYardDash']);
                    setValueFromMultipleFields('twenty-value', ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20', 'games.combine.twentyYardDash']);
                    setValueFromMultipleFields('ten-value', ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10', 'games.combine.tenYardDash']);
                    setValueFromMultipleFields('vertical-value', ['verticalJump', 'vertical', 'vert', 'games.combine.verticalJump']);
                    setValueFromMultipleFields('broad-value', ['broadJump', 'broad', 'jump', 'games.combine.broadJump']);
                    setValueFromMultipleFields('bench-value', ['benchPress', 'bench', 'games.combine.benchPress']);
                    setValueFromMultipleFields('cone-value', ['coneDrill', 'cone', '3cone', 'games.combine.coneDrill']);
                    setValueFromMultipleFields('shuttle-value', ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle', 'games.combine.shuttleRun']);
                    
                    // Set player name from username (priority) or fallback options
                    let playerName = '';
                    
                    // First priority: Use the username field
                    if (userData.username) {
                        playerName = userData.username;
                        console.log(`Using username: ${playerName}`);
                    }
                    // Second priority: Use display name from auth
                    else if (user.displayName) {
                        playerName = user.displayName;
                        console.log(`Using displayName from auth: ${playerName}`);
                    }
                    // Other fallbacks
                    else if (userData.name) {
                        playerName = userData.name;
                    } 
                    else if (userData.displayName) {
                        playerName = userData.displayName;
                    }
                    else {
                        playerName = "Player";
                        console.log("No name found, using default 'Player'");
                    }
                    
                    // Construct the player display text with position, school, year
                    let playerDisplayText = playerName;
                    
                    const position = userData.position || document.getElementById('position').value || '';
                    const school = userData.school || userData.college || document.getElementById('school').value || '';
                    const year = userData.year || document.getElementById('year').value || '';
                    
                    if (position || school || year) {
                        playerDisplayText += ' | ';
                        
                        if (position) playerDisplayText += position + ' | ';
                        if (school) playerDisplayText += school;
                        if (year && school) playerDisplayText += ' | ' + year;
                        else if (year) playerDisplayText += year;
                    }
                    
                    document.getElementById('player-name').textContent = playerDisplayText;
                    
                    // Handle height and weight which might be in different formats
                    if (userData.height) {
                        document.getElementById('height-value').textContent = userData.height;
                        document.getElementById('height').value = userData.height;
                        console.log(`Set height to: ${userData.height}`);
                    }
                    
                    if (userData.weight) {
                        document.getElementById('weight-value').textContent = userData.weight;
                        document.getElementById('weight').value = userData.weight;
                        console.log(`Set weight to: ${userData.weight}`);
                    }
                    
                    // After loading all data, call fixAllScores to update the UI
                    if (typeof fixAllScores === 'function') {
                        fixAllScores();
                    }
                    
                    if (typeof calculateRASScores === 'function') {
                        calculateRASScores();
                    }
                    
                    console.log("Successfully loaded user data from Firebase");
                } else {
                    console.log("No user data found in Firestore");
                }
            })
            .catch((error) => {
                console.error("Error getting user data:", error);
            });
    };
    
    // Add a function to handle loading specifically from the games.combine structure
    window.loadFromNestedCombineData = function() {
        console.log("Attempting to load from nested games.combine structure...");
        
        // Check if Firebase is available and user is logged in
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
            console.log("Firebase not available or user not logged in");
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("No user is currently logged in");
            return;
        }
        
        console.log("User is logged in, fetching nested data structure");
        
        // Get user data from Firestore
        const db = firebase.firestore();
        db.collection("users").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log("No user document found");
                    return;
                }
                
                const userData = doc.data();
                console.log("Full user data:", userData);
                
                // Try to load from games.combine structure first
                if (userData.games && userData.games.combine) {
                    console.log("Found games.combine structure:", userData.games.combine);
                    const combineData = userData.games.combine;
                    
                    // Load each value into the corresponding field
                    if (combineData.benchPress) {
                        document.getElementById('bench-value').textContent = combineData.benchPress;
                        console.log("Set bench press from games.combine:", combineData.benchPress);
                    }
                    
                    if (combineData.fortyYardDash) {
                        document.getElementById('forty-value').textContent = combineData.fortyYardDash;
                        console.log("Set forty yard dash from games.combine:", combineData.fortyYardDash);
                    }
                    
                    if (combineData.verticalJump) {
                        document.getElementById('vertical-value').textContent = combineData.verticalJump;
                        console.log("Set vertical jump from games.combine:", combineData.verticalJump);
                    }
                    
                    if (combineData.broadJump) {
                        document.getElementById('broad-value').textContent = combineData.broadJump;
                        console.log("Set broad jump from games.combine:", combineData.broadJump);
                    }
                    
                    if (combineData.coneDrill) {
                        document.getElementById('cone-value').textContent = combineData.coneDrill;
                        console.log("Set cone drill from games.combine:", combineData.coneDrill);
                    }
                    
                    if (combineData.shuttleRun) {
                        document.getElementById('shuttle-value').textContent = combineData.shuttleRun;
                        console.log("Set shuttle run from games.combine:", combineData.shuttleRun);
                    }
                    
                    console.log("Successfully loaded from games.combine structure");
                    
                    // Update calculation
                    if (typeof fixAllScores === 'function') {
                        fixAllScores();
                    }
                    
                    if (typeof calculateRASScores === 'function') {
                        calculateRASScores();
                    }
                    
                    return true;
                } else {
                    console.log("No games.combine structure found");
                    return false;
                }
            })
            .catch((error) => {
                console.error("Error loading nested data:", error);
                return false;
            });
    };
    
    // Add a fallback loader that uses console.log to dump all data
    window.inspectAllFirestoreData = function() {
        console.log("FALLBACK: Inspecting all available Firestore data...");
        
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
            console.log("Firebase not available or user not logged in");
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("No user is currently logged in");
            return;
        }
        
        const db = firebase.firestore();
        db.collection("users").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log("No user document found");
                    return;
                }
                
                // Output all fields recursively for debugging
                function dumpObject(obj, path = "") {
                    for (const key in obj) {
                        const newKey = path ? `${path}.${key}` : key;
                        
                        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                            console.log(`${newKey}: (${Array.isArray(obj[key]) ? 'array' : 'object'})`);
                            dumpObject(obj[key], newKey);
                        } else {
                            console.log(`${newKey}: ${obj[key]} (${typeof obj[key]})`);
                            
                            // Try to use this value as a fallback for a field
                            tryUseFallbackValue(key, obj[key]);
                        }
                    }
                }
                
                // Try to use a value as a fallback for a field
                function tryUseFallbackValue(key, value) {
                    // Skip null/undefined values
                    if (value === null || value === undefined) return;
                    
                    // Map of Firestore keys to RAS display element IDs
                    const fieldMap = {
                        'benchPress': 'bench-value',
                        'bench': 'bench-value',
                        'fortyYardDash': 'forty-value',
                        'forty': 'forty-value',
                        'verticalJump': 'vertical-value',
                        'vertical': 'vertical-value',
                        'broadJump': 'broad-value',
                        'broad': 'broad-value',
                        'coneDrill': 'cone-value',
                        'cone': 'cone-value',
                        'shuttleRun': 'shuttle-value',
                        'shuttle': 'shuttle-value',
                        'height': 'height-value',
                        'weight': 'weight-value'
                    };
                    
                    const elementId = fieldMap[key];
                    if (elementId) {
                        const element = document.getElementById(elementId);
                        if (element && (!element.textContent || element.textContent === '0')) {
                            element.textContent = value.toString();
                            console.log(`FALLBACK: Set ${elementId} to ${value} from key ${key}`);
                            
                            // Also update input if available
                            const inputId = elementId.replace('-value', '');
                            const inputElement = document.getElementById(inputId);
                            if (inputElement) {
                                inputElement.value = value.toString();
                            }
                        }
                    }
                }
                
                const userData = doc.data();
                console.log("FALLBACK DATA DUMP:");
                dumpObject(userData);
                
                // After trying all fallbacks, recalculate scores
                if (typeof fixAllScores === 'function') {
                    fixAllScores();
                }
                
                if (typeof calculateRASScores === 'function') {
                    calculateRASScores();
                }
            })
            .catch((error) => {
                console.error("Error in fallback data inspection:", error);
            });
    };
    
    // Helper function to flatten nested objects for easier access
    function flattenUserData(userData) {
        const result = {};
        
        function recurse(obj, currentKey) {
            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                Object.keys(obj).forEach(key => {
                    const newKey = currentKey ? `${currentKey}.${key}` : key;
                    
                    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                        recurse(obj[key], newKey);
                    } else {
                        result[newKey] = obj[key];
                    }
                    
                    // Also add the key directly for easier matching
                    if (!result[key]) {
                        result[key] = obj[key];
                    }
                });
            }
        }
        
        recurse(userData, '');
        return result;
    }

    // Override the default getUserData function with our enhanced version
    if (typeof window.getUserData === 'function') {
        console.log("Overriding getUserData with enhanced version");
        window.getUserData = window.enhancedGetUserData;
        
        // Call it immediately to load user data
        setTimeout(window.getUserData, 500);
    }
    
    // Add a button to manually trigger the enhanced data loading
    function addDataRefreshButton() {
        const existingBtn = document.getElementById('refresh-data-btn');
        if (!existingBtn) {
            const container = document.createElement('div');
            container.className = 'debug-container';
            container.style.margin = '10px 0';
            
            // Create refresh button
            const btn = document.createElement('button');
            btn.id = 'refresh-data-btn';
            btn.textContent = 'Refresh User Data';
            btn.className = 'refresh-btn';
            btn.style.backgroundColor = '#2c3e50';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.padding = '8px 12px';
            btn.style.margin = '5px 0';
            btn.style.cursor = 'pointer';
            
            // Create debug info element
            const debugInfo = document.createElement('div');
            debugInfo.id = 'debug-info';
            debugInfo.style.fontSize = '12px';
            debugInfo.style.backgroundColor = '#f8f9fa';
            debugInfo.style.border = '1px solid #ddd';
            debugInfo.style.padding = '5px';
            debugInfo.style.borderRadius = '4px';
            debugInfo.style.marginTop = '5px';
            debugInfo.style.display = 'none';
            debugInfo.style.maxHeight = '200px';
            debugInfo.style.overflowY = 'auto';
            debugInfo.style.whiteSpace = 'pre-wrap';
            debugInfo.style.fontFamily = 'monospace';
            
            // Create toggle debug button
            const toggleDebugBtn = document.createElement('button');
            toggleDebugBtn.textContent = 'Show Debug Info';
            toggleDebugBtn.className = 'toggle-debug-btn';
            toggleDebugBtn.style.backgroundColor = '#6c757d';
            toggleDebugBtn.style.color = 'white';
            toggleDebugBtn.style.border = 'none';
            toggleDebugBtn.style.borderRadius = '4px';
            toggleDebugBtn.style.padding = '5px 8px';
            toggleDebugBtn.style.margin = '5px 0 5px 5px';
            toggleDebugBtn.style.cursor = 'pointer';
            toggleDebugBtn.style.fontSize = '12px';
            
            // Add event listeners
            btn.addEventListener('click', () => {
                // Update debug info
                updateDebugInfo();
                
                // Try the three methods in sequence with slight delays
                
                // Step 1: Try loading from nested structure
                window.loadFromNestedCombineData();
                
                // Step 2: Try the enhanced general loader after a small delay
                setTimeout(() => {
                    window.enhancedGetUserData();
                    
                    // Step 3: Try the fallback as last resort
                    setTimeout(() => {
                        window.inspectAllFirestoreData();
                        
                        btn.textContent = 'Data Refreshed!';
                        setTimeout(() => {
                            btn.textContent = 'Refresh User Data';
                        }, 2000);
                    }, 500);
                }, 500);
            });
            
            toggleDebugBtn.addEventListener('click', () => {
                const isVisible = debugInfo.style.display !== 'none';
                debugInfo.style.display = isVisible ? 'none' : 'block';
                toggleDebugBtn.textContent = isVisible ? 'Show Debug Info' : 'Hide Debug Info';
                
                // Update debug info if becoming visible
                if (!isVisible) {
                    updateDebugInfo();
                }
            });
            
            // Function to update debug info
            function updateDebugInfo() {
                const debugText = [];
                
                // Check if logged in
                const isLoggedIn = typeof firebase !== 'undefined' && 
                                   firebase.auth && 
                                   firebase.auth().currentUser;
                
                debugText.push(`User logged in: ${isLoggedIn ? 'Yes' : 'No'}`);
                
                if (isLoggedIn) {
                    const user = firebase.auth().currentUser;
                    debugText.push(`User ID: ${user.uid}`);
                    debugText.push(`User Email: ${user.email}`);
                    debugText.push(`Display Name: ${user.displayName || 'Not set'}`);
                }
                
                // Check local storage data
                debugText.push('\nLocal Storage Data:');
                debugText.push(`- benchPress: ${localStorage.getItem('benchPress') || 'Not set'}`);
                debugText.push(`- fortyYardDash: ${localStorage.getItem('fortyYardDash') || 'Not set'}`);
                debugText.push(`- verticalJump: ${localStorage.getItem('verticalJump') || 'Not set'}`);
                debugText.push(`- broadJump: ${localStorage.getItem('broadJump') || 'Not set'}`);
                debugText.push(`- coneDrill: ${localStorage.getItem('coneDrill') || 'Not set'}`);
                debugText.push(`- shuttleRun: ${localStorage.getItem('shuttleRun') || 'Not set'}`);
                
                // Form data
                debugText.push('\nCurrent Form Values:');
                debugText.push(`- Height: ${document.getElementById('height').value || 'Not set'}`);
                debugText.push(`- Weight: ${document.getElementById('weight').value || 'Not set'}`);
                
                // Display value fields
                debugText.push('\nCurrent Display Values:');
                debugText.push(`- Player: ${document.getElementById('player-name').textContent || 'Not set'}`);
                debugText.push(`- Forty: ${document.getElementById('forty-value').textContent || 'Not set'}`);
                debugText.push(`- Vertical: ${document.getElementById('vertical-value').textContent || 'Not set'}`);
                debugText.push(`- Bench: ${document.getElementById('bench-value').textContent || 'Not set'}`);
                debugText.push(`- Broad: ${document.getElementById('broad-value').textContent || 'Not set'}`);
                debugText.push(`- Cone: ${document.getElementById('cone-value').textContent || 'Not set'}`);
                debugText.push(`- Shuttle: ${document.getElementById('shuttle-value').textContent || 'Not set'}`);
                
                debugInfo.textContent = debugText.join('\n');
            }
            
            // Add elements to container
            container.appendChild(btn);
            container.appendChild(toggleDebugBtn);
            container.appendChild(debugInfo);
            
            // Add container to the player form
            const playerForm = document.querySelector('.player-form');
            if (playerForm) {
                playerForm.prepend(container);
            }
        }
    }
    
    // Add the refresh button
    setTimeout(addDataRefreshButton, 1000);
});
