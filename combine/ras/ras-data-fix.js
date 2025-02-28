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
                        
                        // Update calculation
                        if (typeof fixAllScores === 'function') {
                            fixAllScores();
                        }
                        
                        if (typeof calculateRASScores === 'function') {
                            calculateRASScores();
                        }
                        
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
                    
                    if (typeof fixAllScores === 'function') {
                        fixAllScores();
                    }
                    
                    if (typeof calculateRASScores === 'function') {
                        calculateRASScores();
                    }
                } else {
                    console.log("No matching data found in any path");
                }
            })
            .catch((error) => {
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
