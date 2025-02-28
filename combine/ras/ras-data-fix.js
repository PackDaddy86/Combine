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
                    setValueFromMultipleFields('forty-value', ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40', 'games.combine.fortyYardDash']);
                    setValueFromMultipleFields('twenty-value', ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20', 'twenty_yard', 'twenty_yard_dash', 'twenty_split']);
                    setValueFromMultipleFields('ten-value', ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10', 'ten_yard', 'ten_yard_dash', 'ten_split']);
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
    btn.innerText = 'Emergency Fix';
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
        
        // Run direct calculation
        directCalculationTest();
    });
    
    // Add to document body
    document.body.appendChild(btn);
};

// Add the emergency fix button after a delay to ensure page is loaded
setTimeout(addEmergencyFixButton, 2000);
