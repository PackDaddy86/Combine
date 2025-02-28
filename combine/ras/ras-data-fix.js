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
                
                // Create the data object to save
                const dataToSave = {
                    games: {
                        rasResults: rasResults
                    }
                };
                
                // Add height and weight to the root of the user document if they exist
                if (height) {
                    dataToSave.height = height;
                    console.log(`Saving height to user profile: ${height}`);
                }
                
                if (weight) {
                    dataToSave.weight = weight;
                    console.log(`Saving weight to user profile: ${weight}`);
                }
                
                // Use set with merge to update only the rasResults field and profile info
                db.collection('users').doc(user.uid).set(dataToSave, { merge: true })
                .then(() => {
                    console.log('RAS results and profile data saved to Firestore successfully');
                })
                .catch((error) => {
                    console.error('Error saving RAS results to Firestore:', error);
                });
            } else {
                console.log('No user logged in, RAS results saved to localStorage only');
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
                    
                    // Helper function to check multiple field names and set the value if found
                    const setValueFromMultipleFields = (displayElementId, possibleFieldNames) => {
                        for (const fieldName of possibleFieldNames) {
                            if (userData[fieldName] !== undefined) {
                                console.log(`Found ${fieldName}: ${userData[fieldName]}`);
                                document.getElementById(displayElementId).textContent = userData[fieldName];
                                return true;
                            }
                        }
                        console.log(`No matches found for ${displayElementId} among fields: ${possibleFieldNames.join(', ')}`);
                        return false;
                    };
                    
                    // Try to populate each metric with various possible field names
                    setValueFromMultipleFields('forty-value', ['fortyYardDash', 'forty', '40yard', '40-yard', '40yd', '40']);
                    setValueFromMultipleFields('twenty-value', ['twentyYardDash', 'twenty', '20yard', '20-yard', '20yd', '20']);
                    setValueFromMultipleFields('ten-value', ['tenYardDash', 'ten', '10yard', '10-yard', '10yd', '10']);
                    setValueFromMultipleFields('vertical-value', ['verticalJump', 'vertical', 'vert']);
                    setValueFromMultipleFields('broad-value', ['broadJump', 'broad', 'jump']);
                    setValueFromMultipleFields('bench-value', ['benchPress', 'bench']);
                    setValueFromMultipleFields('cone-value', ['coneDrill', 'cone', '3cone']);
                    setValueFromMultipleFields('shuttle-value', ['shuttleRun', 'shuttle', 'shortShuttle', '20shuttle']);
                    
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
            
            btn.addEventListener('click', () => {
                window.enhancedGetUserData();
                btn.textContent = 'Data Refreshed!';
                setTimeout(() => {
                    btn.textContent = 'Refresh User Data';
                }, 2000);
            });
            
            // Add the button to the player form
            const playerForm = document.querySelector('.player-form');
            if (playerForm) {
                playerForm.prepend(btn);
            }
        }
    }
    
    // Add the refresh button
    setTimeout(addDataRefreshButton, 1000);
});
