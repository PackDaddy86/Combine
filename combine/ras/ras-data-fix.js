// This script ensures we properly load user data from Firebase
// into the RAS calculator, including username, height, and weight
console.log("RAS data fix script loaded");

// When the DOM is fully loaded, set up the fix
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up RAS data fix");
    
    // Replace the existing saveRASScorestoFirestore function to save in multiple formats
    window.saveRASScorestoFirestore = function() {
        console.log("Saving RAS scores to Firestore...");
        
        // Check if user is logged in
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
            console.log("Cannot save - Firebase not available or user not logged in");
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("Cannot save - No user is logged in");
            return;
        }
        
        // Get values from the form
        const playerName = document.getElementById('name').value;
        const position = document.getElementById('position').value;
        const school = document.getElementById('school').value;
        const year = document.getElementById('year').value;
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;
        
        // Get displayed values from the RAS card (these are what's actually used in calculations)
        const fortyYardDash = document.getElementById('forty-value').textContent;
        const twentyYardDash = document.getElementById('twenty-value').textContent;
        const tenYardDash = document.getElementById('ten-value').textContent;
        const verticalJump = document.getElementById('vertical-value').textContent;
        const broadJump = document.getElementById('broad-value').textContent;
        const benchPress = document.getElementById('bench-value').textContent;
        const coneDrill = document.getElementById('cone-value').textContent;
        const shuttleRun = document.getElementById('shuttle-value').textContent;
        
        // Helper function to convert string to number or keep as string if NaN
        const toNumberOrKeep = (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? val : num;
        };
        
        // Helper function to convert height to integer if in inches format
        const processHeight = (height) => {
            // Check if it's a simple number format (just inches)
            if (/^\d+$/.test(height)) {
                return parseInt(height, 10);
            } 
            // Check if it's a decimal format (feet.inches)
            else if (/^\d+\.\d+$/.test(height)) {
                return toNumberOrKeep(height);
            }
            // Otherwise keep as is
            return height;
        };
        
        // Helper function to convert weight to integer
        const processWeight = (weight) => {
            const num = parseInt(weight, 10);
            return isNaN(num) ? weight : num;
        };
        
        // Prepare data for Firestore
        // 1. Root level data (original format)
        const userData = {
            // Player info
            name: playerName,
            username: playerName,  // Also save as username for compatibility
            position: position,
            school: school,
            year: year,
            height: processHeight(height),
            weight: processWeight(weight),
            
            // Combine metrics
            fortyYardDash: toNumberOrKeep(fortyYardDash),
            twentyYardDash: toNumberOrKeep(twentyYardDash),
            tenYardDash: toNumberOrKeep(tenYardDash),
            verticalJump: toNumberOrKeep(verticalJump),
            broadJump: toNumberOrKeep(broadJump),
            benchPress: toNumberOrKeep(benchPress),
            coneDrill: toNumberOrKeep(coneDrill),
            shuttleRun: toNumberOrKeep(shuttleRun),
            
            // Add timestamp
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 2. Prepare nested format (games.combine)
        const combineData = {
            fortyYardDash: toNumberOrKeep(fortyYardDash),
            twentyYardDash: toNumberOrKeep(twentyYardDash),
            tenYardDash: toNumberOrKeep(tenYardDash),
            verticalJump: toNumberOrKeep(verticalJump),
            broadJump: toNumberOrKeep(broadJump),
            benchPress: toNumberOrKeep(benchPress),
            coneDrill: toNumberOrKeep(coneDrill),
            shuttleRun: toNumberOrKeep(shuttleRun),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 3. Create a complete update with dot notation for nested fields
        const completeUpdate = {
            ...userData,
            "games.combine": combineData
        };
        
        // Update Firestore using merge to keep existing data
        const db = firebase.firestore();
        db.collection("users").doc(user.uid)
            .set(completeUpdate, { merge: true })
            .then(() => {
                console.log("Successfully saved user data to Firestore!");
                
                // Add visual confirmation
                const feedbackElement = document.createElement('div');
                feedbackElement.textContent = "Data saved successfully!";
                feedbackElement.style.backgroundColor = "#4CAF50";
                feedbackElement.style.color = "white";
                feedbackElement.style.padding = "10px";
                feedbackElement.style.borderRadius = "4px";
                feedbackElement.style.margin = "10px 0";
                feedbackElement.style.fontWeight = "bold";
                feedbackElement.style.textAlign = "center";
                
                // Find a good place to insert it
                const form = document.getElementById('player-info-form');
                if (form) {
                    form.parentNode.insertBefore(feedbackElement, form.nextSibling);
                    
                    // Remove after 3 seconds
                    setTimeout(() => {
                        feedbackElement.remove();
                    }, 3000);
                }
                
                // Also save using the nested structure with set + merge to ensure it works
                db.collection("users").doc(user.uid).set({
                    games: {
                        combine: combineData
                    }
                }, { merge: true })
                .then(() => {
                    console.log("Also saved in games.combine structure");
                })
                .catch((error) => {
                    console.error("Error saving nested structure:", error);
                });
            })
            .catch((error) => {
                console.error("Error saving data to Firestore:", error);
            });
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
                    setValueFromMultipleFields('forty-value', ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40', 'fortyYard', 'forty_yard_dash']);
                    setValueFromMultipleFields('twenty-value', ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20', 'twenty_yard', 'twenty_yard_dash', 'twenty_split']);
                    setValueFromMultipleFields('ten-value', ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10', 'ten_yard', 'ten_yard_dash', 'ten_split']);
                    setValueFromMultipleFields('vertical-value', ['verticalJump', 'vertical', 'vert', 'vertical_jump', 'vert_jump']);
                    setValueFromMultipleFields('broad-value', ['broadJump', 'broad', 'jump', 'broad_jump']);
                    setValueFromMultipleFields('bench-value', ['benchPress', 'bench', 'benchpress', 'bench_press', 'bench_reps']);
                    setValueFromMultipleFields('cone-value', ['coneDrill', 'cone', '3cone', 'three_cone', '3-cone', 'threeCone']);
                    setValueFromMultipleFields('shuttle-value', ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle', '20_shuttle', 'short_shuttle', 'shuttle_run']);
                    
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
                    
                    // Ensure all calculations are complete
                    updateRASCalculations();
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
                    let dataLoaded = false;
                    
                    // Define all possible field name variations
                    const fieldVariations = {
                        'bench-value': ['benchPress', 'bench', 'benchpress', 'bench_press', 'bench_reps'],
                        'forty-value': ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40', 'fortyYard', 'forty_yard_dash'],
                        'vertical-value': ['verticalJump', 'vertical', 'vert', 'vertical_jump', 'vert_jump'],
                        'broad-value': ['broadJump', 'broad', 'jump', 'broad_jump'],
                        'cone-value': ['coneDrill', 'cone', '3cone', 'three_cone', '3-cone', 'threeCone'],
                        'shuttle-value': ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle', '20_shuttle', 'short_shuttle', 'shuttle_run'],
                        'ten-value': ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10', 'ten_yard', 'ten_yard_dash', 'ten_split'],
                        'twenty-value': ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20', 'twenty_yard', 'twenty_yard_dash', 'twenty_split']
                    };

                    // Helper function to set value if any of the variations exist
                    const setValueIfAnyExists = (elementId, fieldList) => {
                        for (const field of fieldList) {
                            if (combineData[field] !== undefined && combineData[field] !== null) {
                                document.getElementById(elementId).textContent = combineData[field];
                                console.log(`Set ${elementId} from games.combine.${field}: ${combineData[field]}`);
                                dataLoaded = true;
                                return true;
                            }
                        }
                        return false;
                    };
                    
                    // Try to set values for each field with all possible variations
                    for (const [elementId, variations] of Object.entries(fieldVariations)) {
                        setValueIfAnyExists(elementId, variations);
                    }
                    
                    // Also check for alternate structures in games.combine
                    if (combineData.metrics) {
                        console.log("Found games.combine.metrics structure:", combineData.metrics);
                        const metrics = combineData.metrics;
                        
                        // Try to set values from the metrics object
                        for (const [elementId, variations] of Object.entries(fieldVariations)) {
                            for (const field of variations) {
                                if (metrics[field] !== undefined && metrics[field] !== null) {
                                    document.getElementById(elementId).textContent = metrics[field];
                                    console.log(`Set ${elementId} from games.combine.metrics.${field}: ${metrics[field]}`);
                                    dataLoaded = true;
                                }
                            }
                        }
                    }
                    
                    // If we successfully loaded any data, update calculations
                    if (dataLoaded) {
                        console.log("Successfully loaded some data from games.combine structure");
                        
                        // Update calculation with our enhanced method
                        updateRASCalculations();
                        
                        return true;
                    } else {
                        console.log("Found games.combine structure but no matching fields");
                        return false;
                    }
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
        
        // Define all possible field name variations for each RAS metric
        const fieldMappings = {
            'bench-value': ['benchPress', 'bench', 'benchpress', 'bench_press', 'bench_reps'],
            'forty-value': ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40', 'fortyYard', 'forty_yard_dash'],
            'vertical-value': ['verticalJump', 'vertical', 'vert', 'vertical_jump', 'vert_jump'],
            'broad-value': ['broadJump', 'broad', 'jump', 'broad_jump'],
            'cone-value': ['coneDrill', 'cone', '3cone', 'three_cone', '3-cone', 'threeCone'],
            'shuttle-value': ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle', '20_shuttle', 'short_shuttle', 'shuttle_run'],
            'ten-value': ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10', 'ten_yard', 'ten_yard_dash', 'ten_split'],
            'twenty-value': ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20', 'twenty_yard', 'twenty_yard_dash', 'twenty_split']
        };
        
        // Get user data from Firestore
        const db = firebase.firestore();
        db.collection("users").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists) {
                    console.log("No user document found");
                    return;
                }
                
                let userData = doc.data();
                console.log("Full Firestore data:", userData);
                let dataFound = false;
                
                // Recursively search through the user data for key-value pairs matching RAS metrics
                function searchObject(obj, path = '') {
                    if (!obj || typeof obj !== 'object') return;
                    
                    Object.entries(obj).forEach(([key, value]) => {
                        const currentPath = path ? `${path}.${key}` : key;
                        
                        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                            // If it's an object, search recursively
                            searchObject(value, currentPath);
                        } else {
                            // Check if this key matches any of our field mappings
                            for (const [displayField, possibleNames] of Object.entries(fieldMappings)) {
                                if (possibleNames.includes(key)) {
                                    document.getElementById(displayField).textContent = value;
                                    console.log(`MATCH FOUND! Setting ${displayField} to ${value} from path ${currentPath}`);
                                    dataFound = true;
                                }
                            }
                        }
                    });
                }
                
                // Start the search at the root
                searchObject(userData);
                
                // Check for special "games.combine.latest" format
                if (userData.games && userData.games.combine && userData.games.combine.latest) {
                    console.log("Special case: checking games.combine.latest");
                    searchObject(userData.games.combine.latest, 'games.combine.latest');
                }
                
                // Check for special "combo" format
                if (userData.combo) {
                    console.log("Special case: checking combo object");
                    searchObject(userData.combo, 'combo');
                }
                
                // Also look for ras_metrics structure
                if (userData.ras_metrics) {
                    console.log("Special case: checking ras_metrics object");
                    searchObject(userData.ras_metrics, 'ras_metrics');
                }
                
                // Update calculation if we found anything
                if (dataFound) {
                    console.log("Some data was found and populated in the UI!");
                    
                    // Update calculations with our enhanced method
                    updateRASCalculations();
                } else {
                    console.log("No matching data found in any path");
                }
            })
            .catch(error => {
                console.error("Error inspecting Firestore data:", error);
            });
    };
    
    // Add the setupExtraFeatures function
    window.setupExtraFeatures = function() {
        console.log("Setting up extra features...");
        
        // Create a container for our debug tools
        const container = document.createElement('div');
        container.id = 'debug-container';
        container.style.backgroundColor = '#f8f9fa';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '4px';
        container.style.padding = '10px';
        container.style.margin = '10px 0';
        container.style.fontFamily = 'sans-serif';
        
        // Add a title
        const title = document.createElement('h3');
        title.textContent = 'RAS Data Tools';
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '16px';
        container.appendChild(title);
        
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
            
            // Step 2: After a delay, try the enhanced loader
            setTimeout(() => {
                window.enhancedGetUserData();
            }, 500);
            
            // Step 3: Finally try the fallback method
            setTimeout(() => {
                window.inspectAllFirestoreData();
                
                // Run final calculations after all loading attempts
                setTimeout(() => {
                    updateRASCalculations();
                    window.forceRecalculateAllScores();
                }, 500);
            }, 1000);
        });
        
        toggleDebugBtn.addEventListener('click', () => {
            if (debugInfo.style.display === 'none') {
                debugInfo.style.display = 'block';
                toggleDebugBtn.textContent = 'Hide Debug Info';
                updateDebugInfo();
            } else {
                debugInfo.style.display = 'none';
                toggleDebugBtn.textContent = 'Show Debug Info';
            }
        });
        
        // Add elements to container
        container.appendChild(btn);
        container.appendChild(toggleDebugBtn);
        container.appendChild(debugInfo);
        
        // Add to the page
        const rasCard = document.querySelector('.ras-card');
        if (rasCard) {
            rasCard.parentNode.insertBefore(container, rasCard);
        } else {
            // Fallback - add to the beginning of the body
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        console.log("Extra features setup complete");
    };
    
    // Add a function to update debug info
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
            
            // Fetch latest Firestore data
            debugText.push('\nFetching latest Firestore data...');
            
            const db = firebase.firestore();
            db.collection("users").doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        
                        debugText.push('\n=== ROOT LEVEL FIELDS ===');
                        Object.keys(userData).forEach(key => {
                            if (typeof userData[key] !== 'object' || userData[key] === null) {
                                debugText.push(`${key}: ${userData[key]}`);
                            } else if (userData[key] && userData[key].toDate && typeof userData[key].toDate === 'function') {
                                debugText.push(`${key}: Timestamp(${userData[key].toDate()})`);
                            } else {
                                debugText.push(`${key}: [object]`);
                            }
                        });
                        
                        // Check for games structure
                        if (userData.games) {
                            debugText.push('\n=== GAMES STRUCTURE ===');
                            Object.keys(userData.games).forEach(key => {
                                debugText.push(`games.${key}: [object]`);
                            });
                            
                            // Check for combine structure
                            if (userData.games.combine) {
                                debugText.push('\n=== GAMES.COMBINE STRUCTURE ===');
                                Object.keys(userData.games.combine).forEach(key => {
                                    debugText.push(`games.combine.${key}: ${userData.games.combine[key]}`);
                                });
                            }
                        }
                        
                        debugInfo.textContent = debugText.join('\n');
                    } else {
                        debugText.push('No user document found in Firestore.');
                        debugInfo.textContent = debugText.join('\n');
                    }
                })
                .catch(error => {
                    debugText.push(`Error fetching Firestore data: ${error.message}`);
                    debugInfo.textContent = debugText.join('\n');
                });
        } else {
            debugText.push('Cannot fetch Firestore data - user not logged in.');
        }
        
        // Check local storage data
        debugText.push('\n=== LOCAL STORAGE DATA ===');
        debugText.push(`- benchPress: ${localStorage.getItem('benchPress') || 'Not set'}`);
        debugText.push(`- fortyYardDash: ${localStorage.getItem('fortyYardDash') || 'Not set'}`);
        debugText.push(`- verticalJump: ${localStorage.getItem('verticalJump') || 'Not set'}`);
        debugText.push(`- broadJump: ${localStorage.getItem('broadJump') || 'Not set'}`);
        debugText.push(`- coneDrill: ${localStorage.getItem('coneDrill') || 'Not set'}`);
        debugText.push(`- shuttleRun: ${localStorage.getItem('shuttleRun') || 'Not set'}`);
        
        // Form data
        debugText.push('\n=== CURRENT FORM VALUES ===');
        debugText.push(`- Height: ${document.getElementById('height').value || 'Not set'}`);
        debugText.push(`- Weight: ${document.getElementById('weight').value || 'Not set'}`);
        
        // Display value fields
        debugText.push('\n=== CURRENT DISPLAY VALUES ===');
        debugText.push(`- Player: ${document.getElementById('player-name').textContent || 'Not set'}`);
        debugText.push(`- Forty: ${document.getElementById('forty-value').textContent || 'Not set'}`);
        debugText.push(`- Vertical: ${document.getElementById('vertical-value').textContent || 'Not set'}`);
        debugText.push(`- Bench: ${document.getElementById('bench-value').textContent || 'Not set'}`);
        debugText.push(`- Broad: ${document.getElementById('broad-value').textContent || 'Not set'}`);
        debugText.push(`- Cone: ${document.getElementById('cone-value').textContent || 'Not set'}`);
        debugText.push(`- Shuttle: ${document.getElementById('shuttle-value').textContent || 'Not set'}`);
        
        // Set initial content
        debugInfo.textContent = debugText.join('\n');
    }
    
    // Add function to sync display values with form inputs
    window.syncDisplayWithFormInputs = function() {
        console.log("Syncing display values with form inputs...");
        
        const metricsToSync = [
            { display: 'forty-value', input: 'forty' },
            { display: 'twenty-value', input: 'twenty' },
            { display: 'ten-value', input: 'ten' },
            { display: 'vertical-value', input: 'vertical' },
            { display: 'broad-value', input: 'broad' },
            { display: 'bench-value', input: 'bench' },
            { display: 'cone-value', input: 'cone' },
            { display: 'shuttle-value', input: 'shuttle' },
            { display: 'height-value', input: 'height' },
            { display: 'weight-value', input: 'weight' }
        ];
        
        metricsToSync.forEach(pair => {
            const displayElement = document.getElementById(pair.display);
            const inputElement = document.getElementById(pair.input);
            
            if (displayElement && inputElement) {
                // Get the value from the display element
                const displayValue = displayElement.textContent;
                
                // Only update if we have a value
                if (displayValue && displayValue !== '0' && displayValue !== '0.00') {
                    inputElement.value = displayValue;
                    console.log(`Synced ${pair.input} form input with ${displayValue} from display`);
                }
            }
        });
    };
    
    // Helper function to ensure all grades and calculations update correctly
    function updateRASCalculations() {
        console.log("Triggering RAS calculations after data load...");
        
        // First sync display values to form inputs
        window.syncDisplayWithFormInputs();
        
        // Force update calculations
        if (typeof fixAllScores === 'function') {
            console.log("Running fixAllScores");
            fixAllScores();
        }
        
        if (typeof calculateRASScores === 'function') {
            console.log("Running calculateRASScores");
            calculateRASScores();
        }
        
        if (typeof updateAllGrades === 'function') {
            console.log("Running updateAllGrades");
            updateAllGrades();
        }
        
        if (typeof calculateAndUpdateCompositeScores === 'function') {
            console.log("Running calculateAndUpdateCompositeScores");
            calculateAndUpdateCompositeScores();
        }
        
        // Fallback if we have a custom function
        if (typeof calculateCompositeScores === 'function') {
            console.log("Running calculateCompositeScores");
            calculateCompositeScores();
        }
        
        // Force a final update
        setTimeout(() => {
            console.log("Final calculation update");
            if (typeof calculateRASScores === 'function') {
                calculateRASScores();
            }
        }, 500);
    }

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

    // Patch the updateAllGrades function to correctly use score elements instead of input values
    window.patchedUpdateAllGrades = function() {
        console.log("Running patched updateAllGrades function");
        
        try {
            // Get all scores from the score display elements (not inputs)
            const fortyScore = document.getElementById('forty-score');
            const verticalScore = document.getElementById('vertical-score');
            const benchScore = document.getElementById('bench-score');  
            const broadScore = document.getElementById('broad-score');
            const coneScore = document.getElementById('cone-score');
            const shuttleScore = document.getElementById('shuttle-score');
            
            // Check if all the score elements exist
            if (!fortyScore || !verticalScore || !benchScore || !broadScore || !coneScore || !shuttleScore) {
                console.error("Some score elements not found");
                return;
            }
            
            // Get the raw metric values from the display elements
            const fortyValue = parseFloat(document.getElementById('forty-value').textContent);
            const verticalValue = parseFloat(document.getElementById('vertical-value').textContent);
            const benchValue = parseFloat(document.getElementById('bench-value').textContent);
            const broadValue = parseFloat(document.getElementById('broad-value').textContent);
            const coneValue = parseFloat(document.getElementById('cone-value').textContent);
            const shuttleValue = parseFloat(document.getElementById('shuttle-value').textContent);
            
            console.log("Raw values for calculation:");
            console.log(`Forty: ${fortyValue}`);
            console.log(`Vertical: ${verticalValue}`);
            console.log(`Bench: ${benchValue}`);
            console.log(`Broad: ${broadValue}`);
            console.log(`Cone: ${coneValue}`);
            console.log(`Shuttle: ${shuttleValue}`);
            
            // Calculate scores directly
            const calculatedFortyScore = calculateSpeedScore(fortyValue, 'forty');
            const calculatedVerticalScore = calculateJumpScore(verticalValue, 'vertical');
            const calculatedBenchScore = calculateStrengthScore(benchValue);
            const calculatedBroadScore = calculateJumpScore(broadValue, 'broad');
            const calculatedConeScore = calculateAgilityScore(coneValue, 'cone');
            const calculatedShuttleScore = calculateAgilityScore(shuttleValue, 'shuttle');
            
            console.log("Calculated scores:");
            console.log(`Forty: ${calculatedFortyScore}`);
            console.log(`Vertical: ${calculatedVerticalScore}`);
            console.log(`Bench: ${calculatedBenchScore}`);
            console.log(`Broad: ${calculatedBroadScore}`);
            console.log(`Cone: ${calculatedConeScore}`);
            console.log(`Shuttle: ${calculatedShuttleScore}`);
            
            // Directly update score displays
            updateScoreDisplay('forty-score', calculatedFortyScore);
            updateScoreDisplay('vertical-score', calculatedVerticalScore);
            updateScoreDisplay('bench-score', calculatedBenchScore);
            updateScoreDisplay('broad-score', calculatedBroadScore);
            updateScoreDisplay('cone-score', calculatedConeScore);
            updateScoreDisplay('shuttle-score', calculatedShuttleScore);
            
            // Update composite scores
            if (typeof calculateAndUpdateCompositeScores === 'function') {
                calculateAndUpdateCompositeScores();
            }
            
            console.log("Patched updateAllGrades completed successfully");
        } catch (error) {
            console.error("Error in patched updateAllGrades:", error);
        }
    };

    // Override the updateAllGrades function
    if (typeof updateAllGrades === 'function') {
        console.log("Overriding updateAllGrades with patched version");
        window.updateAllGrades = window.patchedUpdateAllGrades;
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
                
                // Step 2: After a delay, try the enhanced loader
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
            
            // Add elements to container
            container.appendChild(btn);
            container.appendChild(toggleDebugBtn);
            container.appendChild(debugInfo);
            
            // Add to the page
            const playerForm = document.querySelector('.player-form');
            if (playerForm) {
                playerForm.prepend(container);
            }
        }
    }
    
    // Add the refresh button
    setTimeout(addDataRefreshButton, 1000);
    
    // Add a direct call to manually trigger calculations and test
    window.manualTestRasCalculations = function() {
        console.log("=== MANUAL TEST CALCULATION ===");
        
        // Try to set some test values
        const testValues = {
            'forty': '4.5',
            'vertical': '36',
            'broad': '120',
            'bench': '20',
            'cone': '6.8',
            'shuttle': '4.2',
            'height': '72',
            'weight': '200'
        };
        
        // Set values directly to form inputs
        Object.keys(testValues).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = testValues[id];
                console.log(`Set test value for ${id}: ${testValues[id]}`);
            }
        });
        
        // Set display values to match
        Object.keys(testValues).forEach(id => {
            const displayId = `${id}-value`;
            const element = document.getElementById(displayId);
            if (element) {
                element.textContent = testValues[id];
                console.log(`Set display value for ${displayId}: ${testValues[id]}`);
            }
        });
        
        // Force direct call to original calculation functions
        console.log("Running direct calculation sequence");
        
        if (typeof fixAllScores === 'function') {
            console.log("Running fixAllScores directly");
            fixAllScores();
        }
        
        if (typeof calculateRASScores === 'function') {
            console.log("Running calculateRASScores directly");
            calculateRASScores(); 
        }
        
        if (typeof updateAllGrades === 'function') {
            console.log("Running updateAllGrades directly");
            updateAllGrades();
        }
        
        if (typeof calculateAndUpdateCompositeScores === 'function') {
            console.log("Running calculateAndUpdateCompositeScores directly");
            calculateAndUpdateCompositeScores();
        }
        
        console.log("=== MANUAL TEST COMPLETE ===");
    };

    // Add a debug button for manual testing
    const addManualTestButton = function() {
        // Create button container
        const btnContainer = document.createElement('div');
        btnContainer.style.position = 'fixed';
        btnContainer.style.bottom = '10px';
        btnContainer.style.right = '10px';
        btnContainer.style.zIndex = '9999';
        
        // Create button
        const btn = document.createElement('button');
        btn.id = 'manual-test-button';
        btn.innerText = 'Test Calculation';
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = '#ff6b6b';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        
        // Add click event
        btn.addEventListener('click', () => {
            window.manualTestRasCalculations();
        });
        
        // Add to container
        btnContainer.appendChild(btn);
        
        // Add to document
        document.body.appendChild(btnContainer);
    };

    // Add the test button
    setTimeout(addManualTestButton, 1500);
});

// Add a function to explicitly recalculate all scores and update the UI
window.forceRecalculateAllScores = function() {
    console.log("Forcing complete recalculation of all RAS scores");
    
    // First sync display values to inputs
    window.syncDisplayWithFormInputs();
    
    // Ensure we have the required functions
    if (typeof fixAllScores !== 'function' || 
        typeof calculateRASScores !== 'function') {
        console.error("Required calculation functions not found");
        return;
    }
    
    // The sequence matters - we need to fix inputs first
    fixAllScores();
    
    // Then do all calculations
    calculateRASScores();
    
    // Update all grades if available
    if (typeof updateAllGrades === 'function') {
        updateAllGrades();
    }
    
    // Update composite scores
    if (typeof calculateAndUpdateCompositeScores === 'function') {
        calculateAndUpdateCompositeScores();
    } else if (typeof calculateCompositeScores === 'function') {
        calculateCompositeScores();
    }
    
    console.log("Recalculation complete");
};

// Create a direct debug element on the page
function createVisibleDebugger() {
    // Create container if it doesn't exist
    if (!document.getElementById('visible-debug-container')) {
        const container = document.createElement('div');
        container.id = 'visible-debug-container';
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.left = '10px';
        container.style.width = '80%';
        container.style.maxHeight = '80vh';
        container.style.overflowY = 'auto';
        container.style.backgroundColor = 'rgba(0,0,0,0.85)';
        container.style.color = '#00ff00';
        container.style.fontFamily = 'monospace';
        container.style.fontSize = '12px';
        container.style.padding = '10px';
        container.style.border = '1px solid #00ff00';
        container.style.zIndex = '9999';
        container.style.display = 'none';
        document.body.appendChild(container);
        
        // Add a toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Toggle Debug';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.zIndex = '10000';
        toggleBtn.style.backgroundColor = '#ff0000';
        toggleBtn.style.color = 'white';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.addEventListener('click', () => {
            const container = document.getElementById('visible-debug-container');
            if (container) {
                container.style.display = container.style.display === 'none' ? 'block' : 'none';
            }
        });
        document.body.appendChild(toggleBtn);
    }
    
    return document.getElementById('visible-debug-container');
}

// Function to log to visible debugger
function debugLog(message, color = '#00ff00') {
    const container = createVisibleDebugger();
    const line = document.createElement('div');
    line.style.marginBottom = '5px';
    line.style.color = color;
    line.textContent = message;
    container.appendChild(line);
    
    // Keep only the most recent 100 lines
    while (container.children.length > 100) {
        container.removeChild(container.firstChild);
    }
    
    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Function to directly extract all available calculation functions
function extractAndDisplayCalculationFunctions() {
    debugLog('-- CHECKING AVAILABLE CALCULATION FUNCTIONS --', '#ffff00');
    
    // Look for key calculation functions
    const functionNames = [
        'calculateSpeedScore', 
        'calculateJumpScore', 
        'calculateStrengthScore', 
        'calculateAgilityScore',
        'updateScoreDisplay',
        'calculateRASScores',
        'updateAllGrades',
        'fixAllScores'
    ];
    
    functionNames.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            debugLog(`✓ Function ${funcName} is available`, '#00ff00');
            
            // For critical functions, show their source code
            if (['calculateSpeedScore', 'updateScoreDisplay'].includes(funcName)) {
                const funcStr = window[funcName].toString().substring(0, 100) + '...';
                debugLog(`Function code: ${funcStr}`, '#aaaaaa');
            }
        } else {
            debugLog(`✗ Function ${funcName} is NOT AVAILABLE`, '#ff0000');
        }
    });
}

// Function to verify DOM elements
function verifyDOMElements() {
    debugLog('-- CHECKING DOM ELEMENTS --', '#ffff00');
    
    // Check display elements
    const displayElements = [
        'forty-value', 'vertical-value', 'broad-value', 
        'bench-value', 'cone-value', 'shuttle-value'
    ];
    
    displayElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            debugLog(`✓ Element ${id} exists with value: "${el.textContent}"`, '#00ff00');
        } else {
            debugLog(`✗ Element ${id} NOT FOUND`, '#ff0000');
        }
    });
    
    // Check score elements
    const scoreElements = [
        'forty-score', 'vertical-score', 'broad-score', 
        'bench-score', 'cone-score', 'shuttle-score'
    ];
    
    scoreElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            debugLog(`✓ Score element ${id} exists with value: "${el.textContent}"`, '#00ff00');
        } else {
            debugLog(`✗ Score element ${id} NOT FOUND`, '#ff0000');
        }
    });
}

// Manual direct calculation test that doesn't rely on existing functions
function directCalculationTest() {
    debugLog('-- DIRECT CALCULATION TEST --', '#ffff00');
    
    try {
        // Get raw values
        const fortyEl = document.getElementById('forty-value');
        const fortyValue = fortyEl ? parseFloat(fortyEl.textContent) : null;
        
        if (fortyValue) {
            debugLog(`Found forty time: ${fortyValue}`, '#00ff00');
            
            // Calculate forty score directly using our own logic
            let fortyScore;
            if (fortyValue <= 4.2) fortyScore = 10;
            else if (fortyValue <= 4.3) fortyScore = 9;
            else if (fortyValue <= 4.4) fortyScore = 8;
            else if (fortyValue <= 4.5) fortyScore = 7;
            else if (fortyValue <= 4.6) fortyScore = 6;
            else if (fortyValue <= 4.7) fortyScore = 5;
            else if (fortyValue <= 4.8) fortyScore = 3;
            else if (fortyValue <= 4.9) fortyScore = 1;
            else fortyScore = 0;
            
            debugLog(`Calculated forty score directly: ${fortyScore}`, '#ffff00');
            
            // Update the score element directly
            const scoreEl = document.getElementById('forty-score');
            if (scoreEl) {
                scoreEl.textContent = fortyScore.toFixed(2);
                scoreEl.style.backgroundColor = '#53c2f0';
                scoreEl.style.color = 'white';
                scoreEl.style.padding = '3px';
                scoreEl.style.borderRadius = '3px';
                debugLog(`Updated forty score element to: ${fortyScore.toFixed(2)}`, '#00ff00');
            }
        } else {
            debugLog('No forty time found', '#ff0000');
        }
        
        // Same for vertical
        const verticalEl = document.getElementById('vertical-value');
        const verticalValue = verticalEl ? parseFloat(verticalEl.textContent) : null;
        
        if (verticalValue) {
            debugLog(`Found vertical jump: ${verticalValue}`, '#00ff00');
            
            // Calculate vertical score directly
            let verticalScore;
            if (verticalValue >= 40) verticalScore = 10;
            else if (verticalValue >= 37) verticalScore = 9;
            else if (verticalValue >= 35) verticalScore = 8;
            else if (verticalValue >= 33) verticalScore = 7;
            else if (verticalValue >= 30) verticalScore = 6;
            else if (verticalValue >= 28) verticalScore = 5;
            else if (verticalValue >= 26) verticalScore = 4;
            else if (verticalValue >= 24) verticalScore = 3;
            else if (verticalValue >= 22) verticalScore = 2;
            else if (verticalValue >= 20) verticalScore = 1;
            else verticalScore = 0;
            
            debugLog(`Calculated vertical score directly: ${verticalScore}`, '#ffff00');
            
            // Update the score element directly
            const scoreEl = document.getElementById('vertical-score');
            if (scoreEl) {
                scoreEl.textContent = verticalScore.toFixed(2);
                scoreEl.style.backgroundColor = '#53c2f0';
                scoreEl.style.color = 'white';
                scoreEl.style.padding = '3px';
                scoreEl.style.borderRadius = '3px';
                debugLog(`Updated vertical score element to: ${verticalScore.toFixed(2)}`, '#00ff00');
            }
        } else {
            debugLog('No vertical jump found', '#ff0000');
        }
    } catch (error) {
        debugLog(`ERROR: ${error.message}`, '#ff0000');
    }
}

// Add a test button that uses our own direct calculation
const addEmergencyFixButton = function() {
    // Create button
    const btn = document.createElement('button');
    btn.id = 'emergency-fix-button';
    btn.innerText = 'Calculate RAS Score';
    btn.style.position = 'fixed';
    btn.style.bottom = '60px';
    btn.style.right = '10px';
    btn.style.padding = '8px 12px';
    btn.style.backgroundColor = '#FFD700';
    btn.style.color = 'black';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';
    btn.style.zIndex = '9999';
    
    // Add click event
    btn.addEventListener('click', () => {
        const container = createVisibleDebugger();
        container.style.display = 'block';
        debugLog('Starting emergency fix procedure...', '#FFD700');
        
        // Check for available functions
        extractAndDisplayCalculationFunctions();
        
        // Verify DOM elements
        verifyDOMElements();
        
        // Run full direct calculation with our implementation
        window.directCalculateAllScores();
    });
    
    // Add to document body
    document.body.appendChild(btn);
};

// Add the emergency fix button after a delay to ensure page is loaded
setTimeout(addEmergencyFixButton, 2000);

// Add our own calculation functions since the originals aren't available
// Direct calculation functions for each metric type
function calculateSpeedScoreDirect(time, type) {
    if (time === null || time === undefined || isNaN(time)) {
        return 0;
    }
    
    let score;
    
    switch (type) {
        case 'forty':
            if (time <= 4.2) score = 10;
            else if (time <= 4.3) score = 9;
            else if (time <= 4.4) score = 8;
            else if (time <= 4.5) score = 7;
            else if (time <= 4.6) score = 6;
            else if (time <= 4.7) score = 5;
            else if (time <= 4.8) score = 3;
            else if (time <= 4.9) score = 1;
            else score = 0;
            break;
        case 'twenty':
            if (time <= 2.5) score = 10;
            else if (time <= 2.55) score = 9;
            else if (time <= 2.6) score = 8;
            else if (time <= 2.65) score = 7;
            else if (time <= 2.7) score = 6;
            else if (time <= 2.8) score = 5;
            else if (time <= 2.9) score = 4;
            else if (time <= 3.0) score = 3;
            else if (time <= 3.1) score = 2;
            else if (time <= 3.2) score = 1;
            else score = 0;
            break;
        case 'ten':
            if (time <= 1.4) score = 10;
            else if (time <= 1.45) score = 9;
            else if (time <= 1.5) score = 8;
            else if (time <= 1.55) score = 7;
            else if (time <= 1.6) score = 6;
            else if (time <= 1.65) score = 5;
            else if (time <= 1.7) score = 4;
            else if (time <= 1.75) score = 3;
            else if (time <= 1.8) score = 2;
            else if (time <= 1.85) score = 1;
            else score = 0;
            break;
        default:
            score = 0;
    }
    
    return score;
}

function calculateJumpScoreDirect(value, type) {
    if (value === null || value === undefined || isNaN(value)) {
        debugLog(`Invalid ${type} value: ${value}`, '#ff0000');
        return 0;
    }
    
    let score;
    
    switch (type) {
        case 'vertical':
            if (value >= 40) score = 10;
            else if (value >= 37) score = 9;
            else if (value >= 35) score = 8;
            else if (value >= 33) score = 7;
            else if (value >= 30) score = 6;
            else if (value >= 28) score = 5;
            else if (value >= 26) score = 4;
            else if (value >= 24) score = 3;
            else if (value >= 22) score = 2;
            else if (value >= 20) score = 1;
            else score = 0;
            
            debugLog(`Vertical jump ${value} inches = score ${score}`, '#ffff00');
            break;
            
        case 'broad':
            // Handle broad jump in inches (or converted to inches)
            let inches = value;
            // Check if it might be in feet/inches format
            if (typeof value === 'string' && value.includes("'")) {
                const parts = value.split("'");
                const feet = parseInt(parts[0]) || 0;
                let inchPart = 0;
                if (parts[1]) {
                    inchPart = parseInt(parts[1]) || 0;
                }
                inches = feet * 12 + inchPart;
                debugLog(`Converted ${value} to ${inches} inches`, '#ffff00');
            } 
            // If the value is a small number (< 20), it's likely meters or decimal feet
            else if (value < 20) {
                // If it's very small (< 5), assume it's meters
                if (value < 5) {
                    inches = value * 39.37; // Convert meters to inches
                    debugLog(`Converted ${value} meters to ${inches} inches`, '#ffff00');
                } 
                // If it's between 5-20, could be feet in decimal
                else {
                    // Try converting as a decimal foot measurement
                    const tryDecimalFeet = value * 12;
                    debugLog(`Trying to interpret ${value} as decimal feet = ${tryDecimalFeet} inches`, '#ffff00');
                    inches = tryDecimalFeet;
                }
            }
            // For broad jump specifically, handle the value 120 as 120 inches (10 feet)
            else if (value == 120) {
                inches = 120;
                debugLog(`Interpreting ${value} as 120 inches (10 feet)`, '#ffff00');
            }
            
            debugLog(`Final broad jump inches value: ${inches}`, '#00ffff');
            
            // Score based on inches
            if (inches >= 130) score = 10;
            else if (inches >= 125) score = 9;
            else if (inches >= 120) score = 8;
            else if (inches >= 115) score = 7;
            else if (inches >= 110) score = 6;
            else if (inches >= 105) score = 5;
            else if (inches >= 100) score = 4;
            else if (inches >= 95) score = 3;
            else if (inches >= 90) score = 2;
            else if (inches >= 85) score = 1;
            else score = 0;
            
            debugLog(`Broad jump ${inches} inches = score ${score}`, '#ffff00');
            break;
            
        default:
            score = 0;
            debugLog(`Unknown jump type: ${type}`, '#ff0000');
    }
    
    return score;
}

function calculateStrengthScoreDirect(reps) {
    if (reps === null || reps === undefined || isNaN(reps)) {
        return 0;
    }
    
    if (reps >= 36) return 10;
    else if (reps >= 32) return 9;
    else if (reps >= 28) return 8;
    else if (reps >= 24) return 7;
    else if (reps >= 20) return 6;
    else if (reps >= 16) return 5;
    else if (reps >= 12) return 4;
    else if (reps >= 8) return 3;
    else if (reps >= 4) return 2;
    else if (reps >= 1) return 1;
    else return 0;
}

function calculateAgilityScoreDirect(time, type) {
    if (time === null || time === undefined || isNaN(time)) {
        return 0;
    }
    
    let score;
    
    switch (type) {
        case 'cone':
            if (time <= 6.45) score = 10;
            else if (time <= 6.6) score = 9;
            else if (time <= 6.75) score = 8;
            else if (time <= 6.9) score = 7;
            else if (time <= 7.05) score = 6;
            else if (time <= 7.2) score = 5;
            else if (time <= 7.35) score = 4;
            else if (time <= 7.5) score = 3;
            else if (time <= 7.65) score = 2;
            else if (time <= 7.8) score = 1;
            else score = 0;
            break;
        case 'shuttle':
            if (time <= 4.0) score = 10;
            else if (time <= 4.1) score = 9;
            else if (time <= 4.2) score = 8;
            else if (time <= 4.3) score = 7;
            else if (time <= 4.4) score = 6;
            else if (time <= 4.5) score = 5;
            else if (time <= 4.6) score = 4;
            else if (time <= 4.7) score = 3;
            else if (time <= 4.8) score = 2;
            else if (time <= 4.9) score = 1;
            else score = 0;
            break;
        default:
            score = 0;
    }
    
    return score;
}

// Main function to calculate all scores directly
window.directCalculateAllScores = function() {
    debugLog('=== PERFORMING COMPLETE CALCULATION ON ALL VALUES ===', '#ffff00');
    
    // Calculate scores for all metrics
    try {
        // Get all metric values
        const metrics = {
            forty: {
                element: document.getElementById('forty-value'),
                scoreElement: document.getElementById('forty-score'),
                calculator: calculateSpeedScoreDirect
            },
            vertical: {
                element: document.getElementById('vertical-value'),
                scoreElement: document.getElementById('vertical-score'),
                calculator: calculateJumpScoreDirect
            },
            broad: {
                element: document.getElementById('broad-value'),
                scoreElement: document.getElementById('broad-score'),
                calculator: calculateJumpScoreDirect
            },
            bench: {
                element: document.getElementById('bench-value'),
                scoreElement: document.getElementById('bench-score'),
                calculator: calculateStrengthScoreDirect
            },
            cone: {
                element: document.getElementById('cone-value'),
                scoreElement: document.getElementById('cone-score'),
                calculator: calculateAgilityScoreDirect
            },
            shuttle: {
                element: document.getElementById('shuttle-value'),
                scoreElement: document.getElementById('shuttle-score'),
                calculator: calculateAgilityScoreDirect
            }
        };
        
        // Process each metric
        Object.keys(metrics).forEach(key => {
            const metric = metrics[key];
            if (metric.element && metric.scoreElement) {
                const value = parseFloat(metric.element.textContent);
                if (!isNaN(value)) {
                    debugLog(`Found ${key} value: ${value}`, '#00ff00');
                    const score = metric.calculator(value, key);
                    debugLog(`Calculated ${key} score directly: ${score}`, '#ffff00');
                    updateScoreElementDirect(metric.scoreElement, score);
                } else {
                    debugLog(`Invalid ${key} value: ${metric.element.textContent}`, '#ff0000');
                }
            } else {
                debugLog(`Missing elements for ${key}`, '#ff0000');
            }
        });
        
        // Calculate composite scores after individual scores
        calculateCompositeScoresDirect();
        
        debugLog('=== CALCULATION COMPLETE ===', '#ffff00');
    } catch (error) {
        debugLog(`ERROR DURING CALCULATION: ${error.message}`, '#ff0000');
    }
};

// Function to update score element
function updateScoreElementDirect(element, score) {
    if (!element) return;
    
    const formattedScore = parseFloat(score).toFixed(2);
    element.textContent = formattedScore;
    
    // Set color based on score
    let bgColor, textColor;
    const scoreValue = parseFloat(score);
    
    if (scoreValue < 4) {
        bgColor = "#ff6b6b";
        textColor = "white";
    } else if (scoreValue < 5) {
        bgColor = "#ffa06b";
        textColor = "white";
    } else if (scoreValue < 7) {
        bgColor = "#ffc56b";
        textColor = "black";
    } else if (scoreValue < 9) {
        bgColor = "#6bd46b";
        textColor = "white";
    } else {
        bgColor = "#53c2f0";
        textColor = "white";
    }
    
    // Apply inline styles
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    element.style.padding = "3px";
    element.style.borderRadius = "3px";
    element.style.fontWeight = "bold";
    
    debugLog(`Updated ${element.id} element to: ${formattedScore}`, '#00ffff');
}

// Calculate composite scores
function calculateCompositeScoresDirect() {
    try {
        // Get all scores
        const fortyScore = getScoreValue('forty-score');
        const verticalScore = getScoreValue('vertical-score');
        const broadScore = getScoreValue('broad-score');
        const benchScore = getScoreValue('bench-score');
        const coneScore = getScoreValue('cone-score');
        const shuttleScore = getScoreValue('shuttle-score');
        
        // Calculate composite scores
        // Speed (40 only for now)
        const speedScores = [fortyScore].filter(score => !isNaN(score));
        const speedTotal = speedScores.length > 0 ? 
            speedScores.reduce((sum, score) => sum + score, 0) / speedScores.length : 0;
        
        // Explosion (vertical, broad, bench)
        const explosiveScores = [verticalScore, broadScore, benchScore].filter(score => !isNaN(score));
        const explosiveTotal = explosiveScores.length > 0 ? 
            explosiveScores.reduce((sum, score) => sum + score, 0) / explosiveScores.length : 0;
        
        // Agility (cone, shuttle)
        const agilityScores = [coneScore, shuttleScore].filter(score => !isNaN(score));
        const agilityTotal = agilityScores.length > 0 ? 
            agilityScores.reduce((sum, score) => sum + score, 0) / agilityScores.length : 0;
        
        // Total (all scores)
        const allScores = [fortyScore, verticalScore, broadScore, benchScore, coneScore, shuttleScore].filter(score => !isNaN(score));
        const totalScore = allScores.length > 0 ? 
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
        
        // Update composite score displays
        updateCompositeElement('speed-score', speedTotal);
        updateCompositeElement('explosive-score', explosiveTotal);
        updateCompositeElement('agility-score', agilityTotal);
        updateCompositeElement('total-score', totalScore);
        
        // Update RAS grade
        const rasGrade = calculateRASGrade(totalScore);
        const rasElement = document.getElementById('composite-score');
        if (rasElement) {
            rasElement.textContent = rasGrade;
            rasElement.style.fontWeight = 'bold';
            rasElement.style.fontSize = '24px';
        }
        
        debugLog(`Speed score: ${speedTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Explosive score: ${explosiveTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Agility score: ${agilityTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Total score: ${totalScore.toFixed(2)}`, '#00ff00');
        debugLog(`RAS Grade: ${rasGrade}`, '#00ff00');
    } catch (error) {
        debugLog(`Error calculating composite scores: ${error.message}`, '#ff0000');
    }
}

// Helper to get score value
function getScoreValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? parseFloat(element.textContent) : NaN;
}

// Update composite element 
function updateCompositeElement(elementId, score) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.textContent = score.toFixed(2);
    
    // Color based on score
    let bgColor, textColor;
    if (score < 4) {
        bgColor = "#ff6b6b";
        textColor = "white";
    } else if (score < 5) {
        bgColor = "#ffa06b";
        textColor = "white";
    } else if (score < 7) {
        bgColor = "#ffc56b";
        textColor = "black";
    } else if (score < 9) {
        bgColor = "#6bd46b";
        textColor = "white";
    } else {
        bgColor = "#53c2f0";
        textColor = "white";
    }
    
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    element.style.padding = "3px";
    element.style.borderRadius = "3px";
    element.style.fontWeight = "bold";
}

// Calculate RAS grade from total score
function calculateRASGrade(score) {
    if (score >= 9.5) return "A+";
    else if (score >= 9.0) return "A";
    else if (score >= 8.5) return "A-";
    else if (score >= 8.0) return "B+";
    else if (score >= 7.5) return "B";
    else if (score >= 7.0) return "B-";
    else if (score >= 6.5) return "C+";
    else if (score >= 6.0) return "C";
    else if (score >= 5.5) return "C-";
    else if (score >= 5.0) return "D+";
    else if (score >= 4.5) return "D";
    else if (score >= 4.0) return "D-";
    else return "F";
}

// Add functions to calculate height and weight scores
function calculateHeightScore(height) {
    if (height === null || height === undefined || height === '') {
        debugLog(`Invalid height value: ${height}`, '#ff0000');
        return 0;
    }
    
    // Convert height to inches if it's in feet/inches format (e.g., "6'2")
    let inches = height;
    if (typeof height === 'string') {
        if (height.includes("'")) {
            const parts = height.split("'");
            const feet = parseInt(parts[0]) || 0;
            let inchPart = 0;
            if (parts[1]) {
                inchPart = parseInt(parts[1]) || 0;
            }
            inches = feet * 12 + inchPart;
            debugLog(`Converted height ${height} to ${inches} inches`, '#ffff00');
        } else {
            // Try to parse as a simple number
            inches = parseFloat(height);
        }
    }
    
    if (isNaN(inches)) {
        debugLog(`Could not parse height: ${height}`, '#ff0000');
        return 0;
    }
    
    // Score based on height in inches
    let score;
    if (inches >= 78) score = 10;      // 6'6" or taller
    else if (inches >= 76) score = 9;  // 6'4" to 6'5"
    else if (inches >= 74) score = 8;  // 6'2" to 6'3"
    else if (inches >= 72) score = 7;  // 6'0" to 6'1"
    else if (inches >= 70) score = 6;  // 5'10" to 5'11"
    else if (inches >= 68) score = 5;  // 5'8" to 5'9"
    else if (inches >= 66) score = 4;  // 5'6" to 5'7"
    else if (inches >= 64) score = 3;  // 5'4" to 5'5"
    else if (inches >= 62) score = 2;  // 5'2" to 5'3"
    else if (inches >= 60) score = 1;  // 5'0" to 5'1"
    else score = 0;                    // Under 5'0"
    
    debugLog(`Height ${inches} inches = score ${score}`, '#ffff00');
    return score;
}

function calculateWeightScore(weight) {
    if (weight === null || weight === undefined || weight === '') {
        debugLog(`Invalid weight value: ${weight}`, '#ff0000');
        return 0;
    }
    
    // Parse weight as a number
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
        debugLog(`Could not parse weight: ${weight}`, '#ff0000');
        return 0;
    }
    
    // Score based on weight in pounds
    let score;
    if (weightNum >= 300) score = 10;      // 300+ lbs
    else if (weightNum >= 275) score = 9;  // 275-299 lbs
    else if (weightNum >= 250) score = 8;  // 250-274 lbs
    else if (weightNum >= 225) score = 7;  // 225-249 lbs
    else if (weightNum >= 200) score = 6;  // 200-224 lbs
    else if (weightNum >= 185) score = 5;  // 185-199 lbs
    else if (weightNum >= 170) score = 4;  // 170-184 lbs
    else if (weightNum >= 155) score = 3;  // 155-169 lbs
    else if (weightNum >= 140) score = 2;  // 140-154 lbs
    else if (weightNum >= 125) score = 1;  // 125-139 lbs
    else score = 0;                        // Under 125 lbs
    
    debugLog(`Weight ${weightNum} lbs = score ${score}`, '#ffff00');
    return score;
}

// Function to create or update the RAS score display at the top
function updateTopRASDisplay(score) {
    debugLog(`Updating top RAS display with score: ${score}`, '#00ffff');
    
    // Find the logo-left element which contains "RAS"
    const logoLeft = document.querySelector('.logo-left');
    if (!logoLeft) {
        debugLog('Could not find .logo-left element to add RAS score', '#ff0000');
        return;
    }
    
    // Check if we already have a RAS score element
    let rasScoreElement = document.getElementById('top-ras-score');
    if (!rasScoreElement) {
        // Create the score element if it doesn't exist
        rasScoreElement = document.createElement('div');
        rasScoreElement.id = 'top-ras-score';
        rasScoreElement.style.display = 'inline-block';
        rasScoreElement.style.marginLeft = '10px';
        rasScoreElement.style.fontWeight = 'bold';
        rasScoreElement.style.fontSize = '24px';
        rasScoreElement.style.padding = '3px 6px';
        rasScoreElement.style.borderRadius = '4px';
        
        // Insert after the logo-left element
        logoLeft.insertAdjacentElement('afterend', rasScoreElement);
    }
    
    // Update the score and styling
    rasScoreElement.textContent = score.toFixed(2);
    
    // Set color based on score
    let bgColor, textColor;
    if (score < 4) {
        bgColor = "#ff6b6b";
        textColor = "white";
    } else if (score < 5) {
        bgColor = "#ffa06b";
        textColor = "white";
    } else if (score < 7) {
        bgColor = "#ffc56b";
        textColor = "black";
    } else if (score < 9) {
        bgColor = "#6bd46b";
        textColor = "white";
    } else {
        bgColor = "#53c2f0";
        textColor = "white";
    }
    
    rasScoreElement.style.backgroundColor = bgColor;
    rasScoreElement.style.color = textColor;
}

// Update our composite score calculation to include height and weight
function calculateCompositeScoresDirect() {
    try {
        // Get all scores
        const fortyScore = getScoreValue('forty-score');
        const verticalScore = getScoreValue('vertical-score');
        const broadScore = getScoreValue('broad-score');
        const benchScore = getScoreValue('bench-score');
        const coneScore = getScoreValue('cone-score');
        const shuttleScore = getScoreValue('shuttle-score');
        
        // Get height and weight values
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        
        // Calculate height and weight scores
        let heightScore = 0;
        let weightScore = 0;
        
        if (heightInput && heightInput.value) {
            heightScore = calculateHeightScore(heightInput.value);
            debugLog(`Height input value: ${heightInput.value}, score: ${heightScore}`, '#00ff00');
        }
        
        if (weightInput && weightInput.value) {
            weightScore = calculateWeightScore(weightInput.value);
            debugLog(`Weight input value: ${weightInput.value}, score: ${weightScore}`, '#00ff00');
        }
        
        // Calculate composite scores
        // Speed (40 only for now)
        const speedScores = [fortyScore].filter(score => !isNaN(score));
        const speedTotal = speedScores.length > 0 ? 
            speedScores.reduce((sum, score) => sum + score, 0) / speedScores.length : 0;
        
        // Explosion (vertical, broad, bench)
        const explosiveScores = [verticalScore, broadScore, benchScore].filter(score => !isNaN(score));
        const explosiveTotal = explosiveScores.length > 0 ? 
            explosiveScores.reduce((sum, score) => sum + score, 0) / explosiveScores.length : 0;
        
        // Agility (cone, shuttle)
        const agilityScores = [coneScore, shuttleScore].filter(score => !isNaN(score));
        const agilityTotal = agilityScores.length > 0 ? 
            agilityScores.reduce((sum, score) => sum + score, 0) / agilityScores.length : 0;
        
        // Size (height, weight)
        const sizeScores = [heightScore, weightScore].filter(score => !isNaN(score));
        const sizeTotal = sizeScores.length > 0 ? 
            sizeScores.reduce((sum, score) => sum + score, 0) / sizeScores.length : 0;
        
        // Total (all scores, including height and weight)
        const allScores = [
            fortyScore, verticalScore, broadScore, 
            benchScore, coneScore, shuttleScore,
            heightScore, weightScore
        ].filter(score => !isNaN(score));
        
        const totalScore = allScores.length > 0 ? 
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
        
        // Update composite score displays
        updateCompositeElement('speed-score', speedTotal);
        updateCompositeElement('explosive-score', explosiveTotal);
        updateCompositeElement('agility-score', agilityTotal);
        updateCompositeElement('total-score', totalScore);
        
        // Also update the size score if that element exists
        const sizeScoreElement = document.getElementById('size-score');
        if (sizeScoreElement) {
            updateCompositeElement('size-score', sizeTotal);
        } else {
            debugLog('Size score element not found, size score: ' + sizeTotal.toFixed(2), '#ffff00');
        }
        
        // Update RAS grade
        const rasGrade = calculateRASGrade(totalScore);
        const rasElement = document.getElementById('composite-score');
        if (rasElement) {
            rasElement.textContent = rasGrade;
            rasElement.style.fontWeight = 'bold';
            rasElement.style.fontSize = '24px';
        }
        
        // Update the RAS score at the top of the page
        updateTopRASDisplay(totalScore);
        
        debugLog(`Speed score: ${speedTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Explosive score: ${explosiveTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Agility score: ${agilityTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Size score: ${sizeTotal.toFixed(2)}`, '#00ff00');
        debugLog(`Total score: ${totalScore.toFixed(2)}`, '#00ff00');
        debugLog(`RAS Grade: ${rasGrade}`, '#00ff00');
    } catch (error) {
        debugLog(`Error calculating composite scores: ${error.message}`, '#ff0000');
    }
}

// Make our direct calculation functions available globally
window.calculateSpeedScoreDirect = calculateSpeedScoreDirect;
window.calculateJumpScoreDirect = calculateJumpScoreDirect;
window.calculateStrengthScoreDirect = calculateStrengthScoreDirect;
window.calculateAgilityScoreDirect = calculateAgilityScoreDirect;
window.directCalculateAllScores = directCalculateAllScores;
window.calculateHeightScore = calculateHeightScore;
window.calculateWeightScore = calculateWeightScore;
window.calculateCompositeScoresDirect = calculateCompositeScoresDirect;
window.updateTopRASDisplay = updateTopRASDisplay;
