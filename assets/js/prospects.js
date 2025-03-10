// NFL Draft Prospects Grading Page JavaScript

// Global variables for prospect data
let prospectForm;
let prospectsTable;
let prospectsList = [];
let dragStartIndex;
let loadingOverlay;
let saveIndicator;
let selectedProspectId = null;

// Current sort state
let currentSort = {
    column: 'rank',
    direction: 'asc'
};

// Filter values
let filters = {
    position: '',
    college: '',
    name: '',
    grade: ''
};

// Default detail fields that every prospect will have
const defaultDetailFields = [
    { key: 'background', label: 'Background', type: 'textarea' },
    { key: 'strengths', label: 'Strengths', type: 'textarea' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
    { key: 'summary', label: 'Summary', type: 'textarea' }
];

// Global Firebase availability flag
let firebaseAvailable = false;
let firebaseInitAttempted = false;

// Function to safely check Firebase availability
function checkFirebaseAvailability() {
    if (firebaseInitAttempted) {
        return firebaseAvailable;
    }
    
    firebaseInitAttempted = true;
    
    try {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase is not defined');
            firebaseAvailable = false;
            return false;
        }
        
        if (!firebase.auth) {
            console.warn('Firebase auth is not available');
            firebaseAvailable = false;
            return false;
        }
        
        if (!firebase.firestore) {
            console.warn('Firebase firestore is not available');
            firebaseAvailable = false;
            return false;
        }
        
        console.log('Firebase is available');
        firebaseAvailable = true;
        return true;
    } catch (error) {
        console.error('Error checking Firebase availability:', error);
        firebaseAvailable = false;
        return false;
    }
}

// Check if a user is logged in safely
function isUserLoggedIn() {
    if (!checkFirebaseAvailability()) {
        return false;
    }
    
    try {
        const user = firebase.auth().currentUser;
        return user !== null;
    } catch (error) {
        console.error('Error checking if user is logged in:', error);
        return false;
    }
}

// Get current user safely
function getCurrentUser() {
    if (!checkFirebaseAvailability()) {
        return null;
    }
    
    try {
        return firebase.auth().currentUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Function to initialize the modal interactions
function initializeModal() {
    const modal = document.getElementById('prospect-form-modal');
    const closeBtn = document.querySelector('.close-modal');
    const addProspectBtn = document.getElementById('add-prospect-btn');
    const detailsToggle = document.getElementById('toggle-details');
    const detailsFields = document.getElementById('detailed-info-fields');
    
    // Open modal when clicking Add Prospect button
    if (addProspectBtn) {
        addProspectBtn.addEventListener('click', () => {
            // Reset form
            document.getElementById('prospect-form').reset();
            document.getElementById('prospect-form').removeAttribute('data-edit-id');
            document.querySelector('.modal-header h2').textContent = 'Add New Prospect';
            document.querySelector('.prospect-submit-btn').innerHTML = '<i class="fas fa-save"></i> Add Prospect';
            
            // Show modal
            modal.style.display = 'block';
        });
    }
    
    // Close the modal when clicking the X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Toggle detailed info section
    if (detailsToggle) {
        detailsToggle.addEventListener('click', () => {
            detailsToggle.classList.toggle('open');
            detailsFields.classList.toggle('open');
        });
    }
    
    // Handle form submission
    const form = document.getElementById('prospect-form');
    if (form) {
        form.addEventListener('submit', handleProspectSubmit);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    prospectForm = document.getElementById('prospect-form');
    prospectsTable = document.getElementById('prospects-table-body');
    loadingOverlay = document.getElementById('loading-overlay');
    saveIndicator = document.getElementById('save-indicator');
    
    // Initialize modal interactions
    initializeModal();
    
    // Show loading overlay
    showLoading(true);
    
    console.log('DOM content loaded, initializing application...');
    
    // Check Firebase availability first
    const firebaseReady = checkFirebaseAvailability();
    console.log('Firebase availability checked:', firebaseReady ? 'Available' : 'Not available');
    
    // Enable UI for local-only mode if Firebase isn't available
    if (!firebaseReady) {
        console.log('Starting in local-only mode due to Firebase unavailability');
        if (prospectForm) prospectForm.classList.remove('disabled');
        document.querySelectorAll('.board-control-btn').forEach(btn => btn.disabled = false);
        showLoginMessage('Working in offline mode. Your data will be saved locally only.');
    } else {
        // Initialize Firebase auth listener
        initFirebaseAuthListener();
    }
    
    // Add a delay to ensure everything is initialized
    console.log('Waiting for initialization before loading prospects...');
    setTimeout(() => {
        // First attempt to load prospects
        console.log('Attempting to load prospects...');
        loadProspects()
            .then(prospects => {
                console.log('Successfully loaded prospects, rendering UI...');
                // Render prospects to the UI
                renderProspects();
                
                // Hide loading overlay
                showLoading(false);
                
                // Set up direct jQuery click handling for prospect rows
                setupRowClickHandlers();
                
                // Set up all event listeners
                setupEventListeners();
                
                // Update position filter dropdown with new positions
                updatePositionFilterOptions();
            })
            .catch(error => {
                console.error('Initial load attempt failed:', error);
                
                // Clear any previous error
                const errorElement = document.getElementById('error-message');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                // Try loading from local storage as a guaranteed fallback
                console.log('Attempting emergency local storage fallback...');
                try {
                    let prospects = [];
                    const savedProspects = localStorage.getItem('prospects');
                    
                    if (savedProspects) {
                        try {
                            prospects = JSON.parse(savedProspects);
                            // Ensure all prospects have required fields
                            prospects = ensureProspectsHaveRequiredFields(prospects);
                            prospectsList = prospects;
                            console.log('Emergency fallback succeeded, loaded', prospects.length, 'prospects');
                        } catch (parseError) {
                            console.error('Error parsing local storage data:', parseError);
                            prospectsList = [];
                        }
                    } else {
                        console.log('No local storage data found, starting with empty list');
                        prospectsList = [];
                    }
                    
                    // Render UI with whatever we have
                    renderProspects();
                    showErrorMessage('Could not connect to cloud. Working in offline mode.');
                } catch (finalError) {
                    console.error('Final emergency fallback failed:', finalError);
                    showErrorMessage('Error loading prospects. Starting with empty board.');
                    prospectsList = [];
                    renderProspects();
                }
                
                // Always complete UI setup regardless of errors
                showLoading(false);
                setupRowClickHandlers();
                setupEventListeners();
                updatePositionFilterOptions();
            });
    }, 1000); // Longer 1000ms delay to ensure everything is ready
});

// Setup direct jQuery click handlers for rows
function setupRowClickHandlers() {
    // Make sure jQuery is available
    if (typeof $ === 'undefined') {
        console.error('jQuery not available for row click handlers');
        return;
    }
    
    console.log('Setting up jQuery row click handlers');
    
    // Remove any existing click handlers first
    $(document).off('click', '.prospect-row');
    
    // Add new click handler
    $(document).on('click', '.prospect-row', function(e) {
        // Don't trigger if clicking delete button
        if ($(e.target).closest('.delete-prospect').length) {
            return;
        }
        
        const prospectId = $(this).data('id');
        console.log('jQuery row click handler triggered for prospect:', prospectId);
        
        // Toggle details row visibility directly
        const detailsRowId = `#details-row-${prospectId}`;
        const detailsRow = $(detailsRowId);
        
        if (detailsRow.length) {
            console.log('Found details row:', detailsRowId);
            
            // First hide any open rows
            $('.prospect-details-row.open').not(detailsRowId).removeClass('open');
            $('.prospect-row.selected').not(this).removeClass('selected');
            
            // Toggle this row
            $(this).toggleClass('selected');
            detailsRow.toggleClass('open');
            
            if (detailsRow.hasClass('open')) {
                console.log('Row is now open');
            } else {
                console.log('Row is now closed');
                // Save changes if closing
                saveProspectDetails(prospectId);
            }
        } else {
            console.error('Could not find details row:', detailsRowId);
        }
    });
    
    console.log('jQuery row click handlers set up successfully');
}

// Show or hide loading overlay
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Show save indicator
function showSaveIndicator(saving = false, saved = false) {
    const saveIndicator = document.getElementById('save-indicator');
    if (!saveIndicator) return;
    
    // Update text and icon based on saving status
    if (saving) {
        saveIndicator.innerHTML = '<i class="fas fa-spinner"></i> Saving changes...';
        saveIndicator.classList.add('saving');
    } else {
        saveIndicator.innerHTML = saved ? '<i class="fas fa-check-circle"></i> Changes saved' : '<i class="fas fa-check-circle"></i> All changes saved';
        saveIndicator.classList.remove('saving');
    }
    
    saveIndicator.classList.add('show');
    
    // Remove the class after animation completes
    if (!saving) {
        setTimeout(() => {
            saveIndicator.classList.remove('show');
        }, 3000);
    }
}

// Show message when not logged in
function showLoginMessage(customMessage = null) {
    // Create a notification if it doesn't exist
    let loginNotification = document.getElementById('login-notification');
    
    if (!loginNotification) {
        loginNotification = document.createElement('div');
        loginNotification.id = 'login-notification';
        loginNotification.className = 'login-notification';
        loginNotification.style.position = 'fixed';
        loginNotification.style.top = '20px';
        loginNotification.style.right = '20px';
        loginNotification.style.width = 'auto';
        loginNotification.style.maxWidth = '400px';
        loginNotification.style.padding = '0';
        loginNotification.style.borderRadius = '5px';
        loginNotification.style.backgroundColor = '#fff';
        loginNotification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        loginNotification.style.zIndex = '9999';
        document.body.appendChild(loginNotification);
    }
    
    // Set the message content
    const message = customMessage || 'You are not logged in. Your changes will be saved locally only.';
    
    // Update the notification content
    loginNotification.innerHTML = `
        <div class="alert alert-warning" style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>Note:</strong> ${message}
            </div>
            <button type="button" class="close-login-notification" aria-label="Close" 
                style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 0 5px;">&times;</button>
        </div>
    `;
    
    // Show the notification
    loginNotification.style.display = 'block';
    
    // Add click handler to close button
    const closeBtn = loginNotification.querySelector('.close-login-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            loginNotification.style.display = 'none';
        });
    }
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        loginNotification.style.display = 'none';
    }, 10000);
    
    return loginNotification;
}

// Show error message
function showErrorMessage(message) {
    // Create a notification alert
    const errorElement = document.getElementById('error-message') || createErrorMessageElement();
    errorElement.innerHTML = `
        <div class="alert alert-danger">
            <strong>Error:</strong> ${message}
            <button type="button" class="close-error" aria-label="Close">&times;</button>
        </div>
    `;
    errorElement.style.display = 'block';
    
    // Add click handler to close button
    const closeBtn = errorElement.querySelector('.close-error');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            errorElement.style.display = 'none';
        });
    }
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 10000);
}

// Helper function to create error message element
function createErrorMessageElement() {
    const element = document.createElement('div');
    element.id = 'error-message';
    element.className = 'error-message';
    element.style.position = 'fixed';
    element.style.top = '20px';
    element.style.left = '50%';
    element.style.transform = 'translateX(-50%)';
    element.style.zIndex = '9999';
    element.style.width = 'auto';
    element.style.maxWidth = '90%';
    element.style.padding = '0';
    element.style.borderRadius = '5px';
    element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    element.style.display = 'none';
    document.body.appendChild(element);
    return element;
}

// Initialize Firebase auth listener if not in firebase-config.js
function initFirebaseAuthListener() {
    console.log('Initializing Firebase auth listener...');
    
    // First, check if Firebase is available
    if (!checkFirebaseAvailability()) {
        console.error('Firebase is not available');
        return false;
    }
    
    // Log current auth state
    console.log('Current auth state before listener:', getCurrentUser() ? 'User is logged in' : 'No user currently logged in');
    
    try {
        // Set up listener for user changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Auth state change: User logged in', user.uid);
                // Enable the form when logged in
                if (prospectForm) prospectForm.classList.remove('disabled');
                document.querySelectorAll('.board-control-btn').forEach(btn => btn.disabled = false);
                
                // Hide the login notification if it exists
                const loginNotification = document.getElementById('login-notification');
                if (loginNotification) {
                    loginNotification.style.display = 'none';
                }
                
                // Only reload if we don't already have prospects
                if (prospectsList.length === 0) {
                    console.log('Trying to load prospects again after login');
                    loadProspectsFromFirestoreOnly()
                        .then(prospects => {
                            console.log('Successfully loaded prospects after login');
                            renderProspects();
                            updatePositionFilterOptions();
                            // Show success message
                            showSuccessMessage('Successfully loaded your prospects from the cloud');
                        })
                        .catch(err => {
                            console.error('Still unable to load prospects after login:', err);
                            // If we already have local data, don't show an error
                            // If we have no data at all, show a more helpful message
                            if (prospectsList.length === 0) {
                                showErrorMessage('Unable to load prospects from cloud. Starting with an empty board.');
                            }
                        });
                }
            } else {
                console.log('Auth state change: User logged out');
                // Allow local usage even when not logged in
                if (prospectForm) prospectForm.classList.remove('disabled');
                // Don't disable buttons when not logged in to allow local usage
                document.querySelectorAll('.board-control-btn').forEach(btn => btn.disabled = false);
                // Show login message but don't prevent usage
                showLoginMessage();
            }
        }, error => {
            console.error('Auth state change error:', error);
        });
        
        return true;
    } catch (error) {
        console.error('Error setting up auth listener:', error);
        return false;
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create a notification alert
    const successElement = document.getElementById('success-message') || createSuccessMessageElement();
    successElement.innerHTML = `
        <div class="alert alert-success">
            <strong>Success:</strong> ${message}
            <button type="button" class="close-success" aria-label="Close">&times;</button>
        </div>
    `;
    successElement.style.display = 'block';
    
    // Add click handler to close button
    const closeBtn = successElement.querySelector('.close-success');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            successElement.style.display = 'none';
        });
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 5000);
}

// Helper function to create success message element
function createSuccessMessageElement() {
    const element = document.createElement('div');
    element.id = 'success-message';
    element.className = 'success-message';
    element.style.position = 'fixed';
    element.style.top = '80px'; // Position below error messages
    element.style.left = '50%';
    element.style.transform = 'translateX(-50%)';
    element.style.zIndex = '9999';
    element.style.width = 'auto';
    element.style.maxWidth = '90%';
    element.style.padding = '0';
    element.style.borderRadius = '5px';
    element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    element.style.display = 'none';
    document.body.appendChild(element);
    return element;
}

// Save prospects to Firestore
function saveProspectsToFirestoreOnly() {
    console.log('Saving prospects to Firestore only...');
    
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase is available
            if (!checkFirebaseAvailability()) {
                const error = new Error('Firebase not available');
                console.error(error);
                reject(error);
                return;
            }
            
            // Check if user is logged in
            const user = getCurrentUser();
            if (!user) {
                const error = new Error('No user logged in');
                console.error(error);
                reject(error);
                return;
            }
            
            console.log('Saving prospects for user:', user.uid);
            
            // Save to the new collection structure
            const db = firebase.firestore();
            const userProspectsRef = db.collection('userProspects').doc(user.uid);
            
            // Ensure all prospects have required fields
            const validProspects = ensureProspectsHaveRequiredFields(prospectsList);
            
            return userProspectsRef.set({
                prospects: validProspects,
                lastUpdated: new Date().toISOString()
            })
            .then(() => {
                console.log('Successfully saved to Firestore userProspects');
                resolve();
            })
            .catch(error => {
                console.error('Error saving to userProspects:', error);
                
                // Try the old collection as fallback
                console.log('Trying to save to old users collection as fallback...');
                return db.collection('users').doc(user.uid).update({
                    prospects: validProspects,
                    lastUpdated: new Date().toISOString()
                });
            })
            .then(() => {
                console.log('Successfully saved to Firestore users collection');
                resolve();
            })
            .catch(error => {
                console.error('All save attempts failed:', error);
                reject(error);
            });
        } catch (error) {
            console.error('Exception in saveProspectsToFirestoreOnly:', error);
            reject(error);
        }
    });
}

// Load prospects from Firestore
function loadProspectsFromFirestoreOnly() {
    console.log('Loading prospects from Firestore...');
    
    return new Promise((resolve, reject) => {
        try {
            // Check if Firebase is available
            if (!checkFirebaseAvailability()) {
                const error = new Error('Firebase not available');
                console.error(error);
                reject(error);
                return;
            }
            
            // Check if user is logged in
            const user = getCurrentUser();
            if (!user) {
                const error = new Error('No user logged in');
                console.error(error);
                reject(error);
                return;
            }
            
            console.log('Loading prospects for user:', user.uid);
            
            // Try to get data from Firestore
            const db = firebase.firestore();
            const userProspectsRef = db.collection('userProspects').doc(user.uid);
            
            userProspectsRef.get()
                .then(doc => {
                    if (doc.exists && doc.data() && doc.data().prospects) {
                        // Found data in new collection
                        console.log('Found prospects in userProspects collection');
                        let loadedProspects = doc.data().prospects;
                        
                        // Ensure all prospects have required fields with default values
                        loadedProspects = ensureProspectsHaveRequiredFields(loadedProspects);
                        
                        prospectsList = loadedProspects;
                        console.log('Loaded', prospectsList.length, 'prospects from userProspects collection');
                        resolve(prospectsList);
                    } else {
                        // Check the old collection as a fallback
                        console.log('No data in userProspects, checking users collection...');
                        db.collection('users').doc(user.uid).get()
                            .then(doc => {
                                if (doc.exists && doc.data() && doc.data().prospects) {
                                    // Found data in old collection
                                    console.log('Found prospects in users collection');
                                    let oldProspects = doc.data().prospects;
                                    
                                    // Ensure all prospects have all required fields
                                    oldProspects = ensureProspectsHaveRequiredFields(oldProspects);
                                    
                                    prospectsList = oldProspects;
                                    console.log('Loaded', prospectsList.length, 'prospects from users collection');
                                    
                                    // Save to the new collection for next time
                                    saveProspectsToFirestoreOnly()
                                        .then(() => {
                                            console.log('Migrated prospects to userProspects collection');
                                        })
                                        .catch(err => {
                                            console.error('Error migrating prospects:', err);
                                        });
                                    
                                    resolve(prospectsList);
                                } else {
                                    // No data found in either collection
                                    console.log('No prospects found in any collection, starting with empty list');
                                    prospectsList = [];
                                    resolve(prospectsList);
                                }
                            })
                            .catch(error => {
                                console.error('Error loading from users collection:', error);
                                reject(error);
                            });
                    }
                })
                .catch(error => {
                    console.error('Error loading from userProspects collection:', error);
                    reject(error);
                });
        } catch (error) {
            console.error('Exception in loadProspectsFromFirestoreOnly:', error);
            reject(error);
        }
    });
}

// Load prospects from Firestore and local storage
function loadProspects() {
    console.log('Loading prospects from preferred source...');
    
    return new Promise((resolve, reject) => {
        // First check if Firebase is properly initialized and user is logged in
        if (checkFirebaseAvailability()) {
            console.log('Firebase is available, checking authentication state...');
            
            // Check current user state
            const user = getCurrentUser();
            console.log('Current user state:', user ? 'Logged in' : 'Not logged in');
            
            if (user) {
                // User is logged in, try to load from Firestore
                console.log('User is logged in, attempting to load from Firestore...');
                loadProspectsFromFirestoreOnly()
                    .then(prospects => {
                        console.log('Successfully loaded prospects from Firestore');
                        resolve(prospects);
                    })
                    .catch(error => {
                        console.error('Error loading from Firestore, falling back to local storage:', error);
                        
                        // Fall back to local storage
                        new Promise(loadFromLocalStorage)
                            .then(localProspects => {
                                console.log('Loaded from local storage as fallback');
                                resolve(localProspects);
                            })
                            .catch(localError => {
                                console.error('Error loading from local storage:', localError);
                                reject(localError);
                            });
                    });
            } else {
                // User is not logged in, load from local storage
                console.log('No user logged in, loading from local storage...');
                new Promise(loadFromLocalStorage)
                    .then(prospects => {
                        console.log('Successfully loaded prospects from local storage');
                        resolve(prospects);
                    })
                    .catch(error => {
                        console.error('Error loading from local storage:', error);
                        reject(error);
                    });
            }
        } else {
            // Firebase auth not available, load from local storage
            console.log('Firebase auth not available, loading from local storage...');
            new Promise(loadFromLocalStorage)
                .then(prospects => {
                    console.log('Successfully loaded prospects from local storage');
                    resolve(prospects);
                })
                .catch(error => {
                    console.error('Error loading from local storage:', error);
                    reject(error);
                });
        }
    });
}

// Helper function to load prospects from local storage
function loadFromLocalStorage(resolve) {
    console.log('Loading prospects from local storage...');
    
    // Check if this was called with a Promise resolve function (old pattern)
    // or needs to act as a Promise executor function (new pattern)
    let promiseResolve = typeof resolve === 'function' ? resolve : null;
    let promiseReject = null;
    
    // If not called with a resolve function, create and return a new Promise
    if (!promiseResolve) {
        return new Promise((res, rej) => {
            promiseResolve = res;
            promiseReject = rej;
            // Call myself with the resolve function
            loadFromLocalStorage(res);
        });
    }
    
    try {
        const savedProspects = localStorage.getItem('prospects');
        if (savedProspects) {
            try {
                console.log('Found prospects in local storage');
                let parsedProspects = JSON.parse(savedProspects);
                // Ensure all prospects have required fields
                parsedProspects = ensureProspectsHaveRequiredFields(parsedProspects);
                prospectsList = parsedProspects;
                resolve(parsedProspects);
            } catch (e) {
                console.error('Error parsing local storage prospects:', e);
                prospectsList = [];
                resolve([]);
            }
        } else {
            console.log('No prospects found in local storage');
            prospectsList = [];
            resolve([]);
        }
    } catch (e) {
        console.error('Error accessing local storage:', e);
        if (promiseReject) {
            promiseReject(e);
        } else {
            // Fallback in case we're using the old pattern
            prospectsList = [];
            resolve([]);
        }
    }
}

// Save prospects to both Firebase and local storage
function saveProspects() {
    console.log('Saving prospects...');
    showSaveIndicator(true);
    
    return new Promise((resolve, reject) => {
        try {
            // Before saving, ensure all prospects have required fields
            const validProspects = ensureProspectsHaveRequiredFields(prospectsList);
            
            // Always save to local storage as backup
            localStorage.setItem('prospects', JSON.stringify(validProspects));
            console.log('Saved prospects to local storage');
            
            // Check if Firebase is properly initialized
            if (!checkFirebaseAvailability()) {
                console.warn('Firebase not available, saved to local storage only');
                showSaveIndicator(false, true);
                resolve();
                return;
            }
            
            if (!isUserLoggedIn()) {
                console.warn('Firebase auth not available, saved to local storage only');
                showSaveIndicator(false, true);
                resolve();
                return;
            }
            
            // Check if user is logged in for Firestore save
            const user = getCurrentUser();
            if (user) {
                console.log('User logged in, saving to Firestore:', user.uid);
                // First try saving to the new collection structure
                saveProspectsToFirestoreOnly()
                    .then(() => {
                        console.log('Saved prospects to Firestore');
                        showSaveIndicator(false, true);
                        
                        // Show success message
                        const successElement = document.getElementById('save-success') || createSaveSuccessElement();
                        successElement.style.display = 'block';
                        
                        // Auto-hide after 3 seconds
                        setTimeout(() => {
                            successElement.style.display = 'none';
                        }, 3000);
                        
                        resolve();
                    })
                    .catch(error => {
                        console.error('Error saving to Firestore:', error);
                        showSaveIndicator(false, false);
                        
                        // Show error message
                        const errorElement = document.getElementById('save-error') || createSaveErrorElement();
                        errorElement.style.display = 'block';
                        errorElement.querySelector('.save-error-message').textContent = 
                            'Error saving to cloud: ' + (error.message || 'Unknown error');
                        
                        // Auto-hide after 5 seconds
                        setTimeout(() => {
                            errorElement.style.display = 'none';
                        }, 5000);
                        
                        // Still consider it a success since we saved to local storage
                        resolve();
                    });
            } else {
                console.log('No user logged in, saved to local storage only');
                showSaveIndicator(false, true);
                resolve();
            }
        } catch (error) {
            console.error('Error in saveProspects:', error);
            showSaveIndicator(false, false);
            reject(error);
        }
    });
}

// Initialize UI and event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Add prospect form submission
    if (prospectForm) {
        prospectForm.addEventListener('submit', handleProspectSubmit);
    }
    
    // Add Prospect button - opens modal
    const addProspectBtn = document.getElementById('add-prospect-btn');
    const prospectFormModal = document.getElementById('prospect-form-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    
    if (addProspectBtn && prospectFormModal) {
        // Open modal when Add Prospect button is clicked
        addProspectBtn.addEventListener('click', showProspectForm);
        
        // Close modal when X is clicked
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', function() {
                prospectFormModal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target === prospectFormModal) {
                prospectFormModal.style.display = 'none';
            }
        });
    }
    
    // Form details toggle
    const toggleDetails = document.getElementById('toggle-details');
    const detailedFields = document.getElementById('detailed-info-fields');
    
    if (toggleDetails && detailedFields) {
        toggleDetails.addEventListener('click', function() {
            this.classList.toggle('open');
            detailedFields.classList.toggle('open');
        });
    }
    
    // Filter buttons
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', toggleFilterSection);
    }
    
    // Board control buttons
    const exportBtn = document.getElementById('export-board-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBoard);
    }
    
    const clearBtn = document.getElementById('clear-board-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearBoard);
    }
    
    // Template download and file import buttons
    const templateDownloadBtn = document.getElementById('template-download-btn');
    const importBtn = document.getElementById('import-btn');
    const csvUploadInput = document.getElementById('csv-upload');
    
    // Position filter
    const positionFilter = document.getElementById('position-filter');
    if (positionFilter) {
        positionFilter.addEventListener('change', function() {
            filters.position = this.value;
            applyFiltersAndSort();
        });
    }
    
    // College filter
    const collegeFilter = document.getElementById('college-filter');
    if (collegeFilter) {
        collegeFilter.addEventListener('input', function() {
            filters.college = this.value.toLowerCase();
            applyFiltersAndSort();
        });
    }
    
    // Name filter
    const nameFilter = document.getElementById('name-filter');
    if (nameFilter) {
        nameFilter.addEventListener('input', function() {
            filters.name = this.value.toLowerCase();
            applyFiltersAndSort();
        });
    }
    
    // Grade filter
    const gradeFilter = document.getElementById('grade-filter');
    if (gradeFilter) {
        gradeFilter.addEventListener('input', function() {
            filters.grade = this.value;
            applyFiltersAndSort();
        });
    }
    
    // Reset filters
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            // Reset all filter inputs
            if (positionFilter) positionFilter.value = '';
            if (collegeFilter) collegeFilter.value = '';
            if (nameFilter) nameFilter.value = '';
            if (gradeFilter) gradeFilter.value = '';
            
            // Reset filter values
            filters = {
                position: '',
                college: '',
                name: '',
                grade: ''
            };
            
            // Re-apply (empty) filters
            applyFiltersAndSort();
        });
    }
    
    // Set up sort headers
    const sortHeaders = document.querySelectorAll('#prospects-table th[data-sort]');
    sortHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            
            // Toggle sort direction if clicking the same header again
            if (currentSort.column === sortField) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // New sort field
                currentSort.column = sortField;
                currentSort.direction = 'asc'; // Default to ascending for new sort
            }
            
            // Update UI to show sort indicators
            updateSortIndicators();
            
            // Apply sort
            applyFiltersAndSort();
        });
    });
    
    // Set up prospect actions (edit/delete)
    setupProspectActions();
    
    // Update sort indicators
    updateSortIndicators();
}

// Handle form submission for adding a new prospect
function handleProspectSubmit(e) {
    e.preventDefault();
    
    // Get form values (properly formatted)
    const name = document.getElementById('name').value.trim();
    const position = document.getElementById('position').value.trim().toUpperCase(); // Store position in uppercase
    const college = document.getElementById('college').value.trim();
    const heightFt = parseInt(document.getElementById('height-ft').value) || 0;
    const heightIn = parseInt(document.getElementById('height-in').value) || 0;
    const weight = document.getElementById('weight').value.trim();
    const grade = document.getElementById('grade').value.trim();
    
    // Format height as 6'2" format
    const height = (heightFt > 0 || heightIn > 0) ? `${heightFt}'${heightIn}"` : '';
    
    // Check if this is an edit or a new prospect
    const editId = prospectForm.getAttribute('data-edit-id');
    
    if (editId) {
        // Find the prospect to edit
        const prospectIndex = prospectsList.findIndex(p => p.id === editId);
        
        if (prospectIndex !== -1) {
            // Get existing data to preserve other fields
            const existingProspect = prospectsList[prospectIndex];
            
            // Update the prospect data
            const updatedProspect = {
                ...existingProspect,
                name,
                position,
                college,
                height,
                weight,
                grade,
                // Preserve other fields
                rank: existingProspect.rank,
                background: document.getElementById('background')?.value || existingProspect.background,
                strengths: document.getElementById('strengths')?.value || existingProspect.strengths,
                weaknesses: document.getElementById('weaknesses')?.value || existingProspect.weaknesses,
                summary: document.getElementById('summary')?.value || existingProspect.summary
            };
            
            // Update the prospect in the array
            prospectsList[prospectIndex] = updatedProspect;
            
            console.log('Updated prospect:', updatedProspect);
        }
    } else {
        // Create a new prospect object
        const newProspect = {
            id: Date.now().toString(), // Use timestamp as unique ID
            name,
            position,
            college,
            height,
            weight,
            grade,
            rank: prospectsList.length + 1, // Default rank at the end
            background: document.getElementById('background')?.value || '',
            strengths: document.getElementById('strengths')?.value || '',
            weaknesses: document.getElementById('weaknesses')?.value || '',
            summary: document.getElementById('summary')?.value || ''
        };
        
        // Add the prospect to the array
        prospectsList.push(newProspect);
        
        console.log('Added new prospect:', newProspect);
    }
    
    // Sort prospects by rank
    prospectsList.sort((a, b) => a.rank - b.rank);
    
    // Save to Firestore if user is logged in
    saveProspects()
        .then(() => {
            // Render prospects
            renderProspects();
            
            // Update position filter dropdown with new positions
            updatePositionFilterOptions();
            
            // Close the modal
            const modal = document.getElementById('prospect-form-modal');
            if (modal) modal.style.display = 'none';
            
            // Reset the form
            prospectForm.reset();
            prospectForm.removeAttribute('data-edit-id');
            
            // Show success message
            const saveSuccess = document.getElementById('save-success') || createSaveSuccessElement();
            saveSuccess.innerText = editId ? 'Prospect updated successfully!' : 'New prospect added successfully!';
            saveSuccess.style.display = 'block';
            setTimeout(() => {
                saveSuccess.style.display = 'none';
            }, 3000);
        })
        .catch(error => {
            console.error('Error saving prospects:', error);
            // Show error message to user but continue with operation
            const saveError = document.getElementById('save-error') || createSaveErrorElement();
            saveError.style.display = 'block';
            setTimeout(() => {
                saveError.style.display = 'none';
            }, 3000);
            
            // Still render the prospects for user to see local changes
            renderProspects();
            updatePositionFilterOptions();
            
            // Close the modal even if there was an error
            const modal = document.getElementById('prospect-form-modal');
            if (modal) modal.style.display = 'none';
            
            // Reset the form
            prospectForm.reset();
            prospectForm.removeAttribute('data-edit-id');
        });
}

// Helper function to create the save success element
function createSaveSuccessElement() {
    const element = document.createElement('div');
    element.id = 'save-success';
    element.className = 'alert alert-success';
    element.style.position = 'fixed';
    element.style.top = '20px';
    element.style.right = '20px';
    element.style.zIndex = '9999';
    element.style.padding = '10px 20px';
    element.style.borderRadius = '5px';
    element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    element.style.display = 'none';
    document.body.appendChild(element);
    return element;
}

// Helper function to create the save error element
function createSaveErrorElement() {
    const element = document.createElement('div');
    element.id = 'save-error';
    element.className = 'alert alert-danger';
    element.style.position = 'fixed';
    element.style.top = '20px';
    element.style.right = '20px';
    element.style.zIndex = '9999';
    element.style.padding = '10px 20px';
    element.style.borderRadius = '5px';
    element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    element.style.display = 'none';
    element.innerText = 'Changes saved locally. Cloud sync unavailable.';
    document.body.appendChild(element);
    return element;
}

// Handle deleting a prospect
function handleDeleteProspect(e, shouldRender = true) {
    const prospectId = e.currentTarget.getAttribute('data-id');
    
    // Show loading state
    showLoading(true);
    
    // Remove from array
    prospectsList = prospectsList.filter(p => p.id !== prospectId);
    
    // Save and render if needed
    saveProspects();
    if (shouldRender) {
        renderProspects();
    }
    
    // Hide loading after a short delay
    setTimeout(() => {
        showLoading(false);
    }, 500);
}

// Render prospects to the table
function renderProspects(filteredProspects = prospectsList) {
    console.log('Rendering prospects');
    
    // Clear the prospects table first
    prospectsTable.innerHTML = '';
    
    // Check if we have prospects to display
    if (!filteredProspects || !Array.isArray(filteredProspects) || filteredProspects.length === 0) {
        const noDataRow = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = 6;
        noDataCell.className = 'text-center';
        noDataCell.textContent = 'No prospects available. Add your first prospect above.';
        noDataRow.appendChild(noDataCell);
        prospectsTable.appendChild(noDataRow);
        console.log('No prospects to display');
        return;
    }
    
    // Create a fully manual HTML structure for the prospects
    let tableHTML = '';
    
    // Important: Do NOT re-sort here, use the already sorted prospects from applyFiltersAndSort
    let sortedProspects = [...filteredProspects];
    
    // Get the table headers to ensure we use the right columns
    const tableHeaders = [];
    const tableHeadersRow = document.querySelector('#prospects-table thead tr');
    if (tableHeadersRow) {
        tableHeadersRow.querySelectorAll('th').forEach(th => {
            const headerText = th.textContent.trim().toLowerCase();
            if (headerText && headerText !== 'actions') {
                tableHeaders.push(headerText);
            }
        });
        console.log('Found table headers:', tableHeaders);
    }
    
    // Add rank counter
    let rank = 1;
    
    sortedProspects.forEach(prospect => {
        // Log each prospect
        console.log('Rendering prospect:', prospect.id, prospect);
        
        // Generate HTML for the main row with only the columns that exist
        tableHTML += `
            <tr id="prospect-${prospect.id}" class="prospect-row" data-id="${prospect.id}" draggable="true">`;
        
        // Add each column based on the table headers
        if (tableHeaders.includes('rank')) tableHTML += `<td>${rank++}</td>`;
        if (tableHeaders.includes('name')) tableHTML += `<td>${sanitize(prospect.name || '')}</td>`;
        if (tableHeaders.includes('position')) tableHTML += `<td>${sanitize(prospect.position || '')}</td>`;
        if (tableHeaders.includes('college')) tableHTML += `<td>${sanitize(prospect.college || '')}</td>`;
        if (tableHeaders.includes('height')) tableHTML += `<td>${sanitize(prospect.height || '')}</td>`;
        if (tableHeaders.includes('weight')) tableHTML += `<td>${sanitize(prospect.weight || '')}</td>`;
        if (tableHeaders.includes('grade')) tableHTML += `<td>${sanitize(prospect.grade || '')}</td>`;
        
        // Always add the actions column with both details and delete buttons
        tableHTML += `
                <td>
                    <button class="view-details-btn" data-id="${prospect.id}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="delete-prospect" data-id="${prospect.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <tr id="details-row-${prospect.id}" class="prospect-details-row" data-details-for="${prospect.id}">
                <td colspan="8">
                    <div class="prospect-details" id="details-${prospect.id}">
                        <h3>Prospect Details</h3>
                        
                        <div class="prospect-summary-data">
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Name:</span>
                                    <input type="text" class="summary-value-input" data-field="name" value="${sanitize(prospect.name || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Position:</span>
                                    <input type="text" class="summary-value-input" data-field="position" value="${sanitize(prospect.position || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">College:</span>
                                    <input type="text" class="summary-value-input" data-field="college" value="${sanitize(prospect.college || '')}" />
                                </div>
                            </div>
                            
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Height:</span>
                                    <div class="height-inputs">
                                        <input type="number" class="summary-value-input height-ft" data-field="heightFt" value="${getHeightFeet(prospect.height) || ''}" min="5" max="7" /> ft 
                                        <input type="number" class="summary-value-input height-in" data-field="heightIn" value="${getHeightInches(prospect.height) || ''}" min="0" max="11" /> in
                                    </div>
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Weight:</span>
                                    <input type="text" class="summary-value-input" data-field="weight" value="${sanitize(prospect.weight || '')}" /> lbs
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Grade:</span>
                                    <input type="text" class="summary-value-input" data-field="grade" value="${sanitize(prospect.grade || '')}" />
                                </div>
                            </div>
                            
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Hand Size:</span>
                                    <input type="text" class="summary-value-input" data-field="handSize" value="${sanitize(prospect.handSize || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Arm Length:</span>
                                    <input type="text" class="summary-value-input" data-field="armLength" value="${sanitize(prospect.armLength || '')}" />
                                </div>
                            </div>
                            
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">40 Yard:</span>
                                    <input type="text" class="summary-value-input" data-field="fortyYard" value="${sanitize(prospect.fortyYard || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">20 Yard Split:</span>
                                    <input type="text" class="summary-value-input" data-field="twentyYardSplit" value="${sanitize(prospect.twentyYardSplit || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">10 Yard Split:</span>
                                    <input type="text" class="summary-value-input" data-field="tenYardSplit" value="${sanitize(prospect.tenYardSplit || '')}" />
                                </div>
                            </div>
                            
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Vertical Jump:</span>
                                    <input type="text" class="summary-value-input" data-field="verticalJump" value="${sanitize(prospect.verticalJump || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Broad Jump:</span>
                                    <input type="text" class="summary-value-input" data-field="broadJump" value="${sanitize(prospect.broadJump || '')}" />
                                </div>
                            </div>
                            
                            <div class="prospect-summary-row">
                                <div class="prospect-summary-field">
                                    <span class="summary-label">3 Cone:</span>
                                    <input type="text" class="summary-value-input" data-field="threeCone" value="${sanitize(prospect.threeCone || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Shuttle:</span>
                                    <input type="text" class="summary-value-input" data-field="shuttle" value="${sanitize(prospect.shuttle || '')}" />
                                </div>
                                <div class="prospect-summary-field">
                                    <span class="summary-label">Bench Press:</span>
                                    <input type="text" class="summary-value-input" data-field="benchPress" value="${sanitize(prospect.benchPress || '')}" />
                                </div>
                            </div>
                        </div>
                        
                        <div class="prospect-detail-sections">
                            ${renderDetailSections(prospect)}
                        </div>
                        
                        <div class="detail-buttons">
                            <button class="detail-button add-field-btn" data-id="${prospect.id}">
                                <i class="fas fa-plus"></i> Add Field
                            </button>
                            <button class="detail-button save-details-btn" data-id="${prospect.id}">
                                <i class="fas fa-save"></i> Save Changes
                            </button>
                        </div>
                        
                        <div class="add-field-form" id="add-field-form-${prospect.id}" style="display: none;">
                            <input type="text" class="form-control field-name-input" placeholder="Field Name">
                            <button class="detail-button confirm-add-field-btn" data-id="${prospect.id}">
                                <i class="fas fa-check"></i> Add
                            </button>
                            <button class="detail-button cancel-add-field-btn">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    // Set the HTML directly
    prospectsTable.innerHTML = tableHTML;
    
    // Now set up event listeners for the buttons and form elements
    setButtonEventListeners();
    
    // Setup event handlers for the newly rendered prospects
    setupAllEventListeners();
    
    console.log('Prospects rendered successfully');
}

// Set up event listeners for all detail buttons
function setButtonEventListeners() {
    // Set up add field buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-field-btn')) {
            e.stopPropagation();
            const btn = e.target.closest('.add-field-btn');
            const id = btn.getAttribute('data-id');
            const formId = `add-field-form-${id}`;
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = form.style.display === 'none' ? 'flex' : 'none';
            }
        }
    });
    
    // Set up cancel add field buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.cancel-add-field-btn')) {
            e.stopPropagation();
            const formElement = e.target.closest('.add-field-form');
            if (formElement) {
                formElement.style.display = 'none';
            }
        }
    });
    
    // Set up confirm add field buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.confirm-add-field-btn')) {
            e.stopPropagation();
            const btn = e.target.closest('.confirm-add-field-btn');
            const prospectId = btn.getAttribute('data-id');
            const formElement = btn.closest('.add-field-form');
            if (formElement) {
                const fieldNameInput = formElement.querySelector('.field-name-input');
                if (fieldNameInput && fieldNameInput.value.trim()) {
                    addCustomField(prospectId, fieldNameInput.value.trim());
                    formElement.style.display = 'none';
                    fieldNameInput.value = '';
                }
            }
        }
    });
    
    // Set up save details buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.save-details-btn')) {
            e.stopPropagation();
            const prospectId = e.target.closest('.save-details-btn').getAttribute('data-id');
            if (prospectId) {
                showSaveIndicator(true);
                saveProspectDetails(prospectId).then(() => {
                    showSaveIndicator(false, true);
                });
            }
        }
    });
    
    // Set up field toggle buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.field-toggle')) {
            e.stopPropagation();
            const toggle = e.target.closest('.field-toggle');
            const sectionId = toggle.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.toggle('open');
                toggle.classList.toggle('open');
            }
        }
    });
    
    // Set up remove field buttons
    document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-field-btn');
        if (removeBtn) {
            e.stopPropagation();
            const fieldKey = removeBtn.getAttribute('data-field-key');
            const detailsDiv = removeBtn.closest('.prospect-details');
            if (fieldKey && detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                if (confirm('Are you sure you want to remove this field? This cannot be undone.')) {
                    removeCustomField(prospectId, fieldKey);
                }
            }
        }
    });
    
    // Set up auto-save for all textareas
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('prospect-detail-textarea')) {
            const textarea = e.target;
            const detailsDiv = textarea.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupTextareaAutoSave(textarea, prospectId);
            }
        }
    });
    
    // Set up auto-save for all input fields
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('prospect-detail-input')) {
            const input = e.target;
            const detailsDiv = input.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupInputAutoSave(input, prospectId);
            }
        }
    });
    
    // Set up auto-save for summary input fields
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('summary-value-input')) {
            const input = e.target;
            const detailsDiv = input.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupInputAutoSave(input, prospectId);
            }
        }
    });
}

// Setup auto-save for input fields and update table row cells
function setupInputAutoSave(input, prospectId) {
    const fieldName = input.getAttribute('data-field');
    const value = input.value;
    
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect) return;
    
    // Special handling for height inputs (combining feet and inches)
    if (fieldName === 'heightFt' || fieldName === 'heightIn') {
        const detailsDiv = input.closest('.prospect-details');
        if (detailsDiv) {
            const heightFtInput = detailsDiv.querySelector('.height-ft');
            const heightInInput = detailsDiv.querySelector('.height-in');
            
            if (heightFtInput && heightInInput) {
                const feet = heightFtInput.value || 0;
                const inches = heightInInput.value || 0;
                prospect.height = `${feet}'${inches}`;
                
                // Update the table cell
                updateTableCellValue(prospectId, 'height', prospect.height);
            }
        }
    } else {
        // Update the prospect object
        prospect[fieldName] = value;
        
        // Update the table cell
        updateTableCellValue(prospectId, fieldName, value);
    }
    
    // Save the changes (debounced)
    debouncedSave();
    
    // Show saving indicator
    showSaveIndicator(true);
}

// Update a specific table cell value
function updateTableCellValue(prospectId, fieldName, value) {
    console.log(`Updating table cell for prospect ${prospectId}, field ${fieldName}, value ${value}`);
    
    // Find the table row
    const row = document.getElementById(`prospect-${prospectId}`);
    if (!row) return;
    
    // Get all cells in the row
    const cells = row.querySelectorAll('td');
    if (!cells || cells.length < 2) return;
    
    // Map fieldName to table column indexes (0-based)
    const indexMap = {
        'name': 1,
        'position': 2,
        'college': 3,
        'height': 4,
        'weight': 5,
        'grade': 6
    };
    
    // Get the cell index for this field
    const cellIndex = indexMap[fieldName];
    if (cellIndex !== undefined && cells[cellIndex]) {
        cells[cellIndex].textContent = value;
        console.log(`Updated table cell at index ${cellIndex} with value ${value}`);
    }
}

// Debounce function to avoid too many saves
const debouncedSave = (function() {
    let timeout = null;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            saveProspects().then(() => {
                showSaveIndicator(false, true);
            });
        }, 1000);
    };
})();

// Function to render detail sections
function renderDetailSections(prospect) {
    let html = '';
    
    // Render default fields
    defaultDetailFields.forEach(field => {
        const value = prospect.details[field.key] || '';
        html += createDetailSectionHTML(field.key, field.label, value, false);
    });
    
    // Render custom fields
    if (prospect.details && prospect.details.customFields) {
        // Add a custom fields section header
        html += `<div class="prospect-detail-section-header">Custom Fields</div>`;
        
        // Render each custom field
        Object.entries(prospect.details.customFields).forEach(([key, field]) => {
            html += createCustomFieldHTML(key, field.label, field.value);
        });
    }
    
    return html;
}

// Create HTML for a detail section
function createDetailSectionHTML(key, label, value, isRemovable) {
    const sectionId = `section-${key}`;
    
    let contentHTML;
    if (isRemovable) {
        contentHTML = `<textarea class="prospect-detail-textarea" data-field-key="${key}">${sanitize(value)}</textarea>`;
    } else {
        contentHTML = `<textarea class="prospect-detail-textarea" data-field-key="${key}">${sanitize(value)}</textarea>`;
    }
    
    return `
        <div class="prospect-detail-section" data-field-key="${key}">
            <div class="prospect-detail-title">
                ${sanitize(label)} 
                <span>
                    ${isRemovable ? `<button class="remove-field-btn" data-field-key="${key}" onclick="removeCustomFieldDirect('${key}', event)"><i class="fas fa-times"></i></button>` : ''}
                    <i class="fas fa-chevron-down field-toggle" data-section="${sectionId}"></i>
                </span>
            </div>
            <div id="${sectionId}" class="field-collapse open">
                <div class="prospect-detail-content">
                    ${contentHTML}
                </div>
            </div>
        </div>
    `;
}

// Create HTML for a custom field
function createCustomFieldHTML(fieldKey, label, value) {
    const sectionId = `section-${fieldKey}`;
    
    return `
        <div class="prospect-detail-section" data-field-key="customFields.${fieldKey}">
            <div class="prospect-detail-title">
                ${sanitize(label)} 
                <span>
                    <button class="remove-field-btn" data-field-key="${fieldKey}" onclick="deleteCustomField(event, '${fieldKey}')"><i class="fas fa-times"></i></button>
                    <i class="fas fa-chevron-down field-toggle" data-section="${sectionId}"></i>
                </span>
            </div>
            <div id="${sectionId}" class="field-collapse open">
                <div class="prospect-detail-content">
                    <textarea class="prospect-detail-textarea" data-field-key="${fieldKey}">${sanitize(value)}</textarea>
                </div>
            </div>
        </div>
    `;
}

// Save prospect details from the form
function saveProspectDetails(prospectId) {
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect) return Promise.resolve();
    
    // Initialize details object if it doesn't exist
    if (!prospect.details) {
        prospect.details = {};
    }
    
    // Get all textarea values
    const detailsElement = document.getElementById(`details-${prospectId}`);
    if (!detailsElement) return Promise.resolve();
    
    detailsElement.querySelectorAll('.prospect-detail-textarea').forEach(textarea => {
        const fieldKey = textarea.getAttribute('data-field-key');
        prospect.details[fieldKey] = textarea.value;
    });
    
    // Get all input values
    detailsElement.querySelectorAll('.prospect-detail-input').forEach(input => {
        const fieldKey = input.getAttribute('data-field-key');
        prospect[fieldKey] = input.value;
    });
    
    // Save to Firestore and return the promise
    console.log('Saving prospect details for', prospectId);
    return saveProspects();
}

// Add custom field to a prospect
function addCustomField(prospectId, fieldName) {
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect) return;
    
    // Create a unique key for the field
    const fieldKey = 'custom_' + fieldName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    
    // Add to customFields array if not already there
    if (!prospect.details) {
        prospect.details = {};
    }
    
    if (!prospect.details.customFields) {
        prospect.details.customFields = {};
    }
    
    prospect.details.customFields[fieldKey] = {
        key: fieldKey,
        label: fieldName,
        value: ''
    };
    
    // Initialize the value
    prospect.details[fieldKey] = '';
    
    // Hide the add field form
    document.getElementById(`add-field-form-${prospectId}`).style.display = 'none';
    document.getElementById(`add-field-form-${prospectId}`).querySelector('.field-name-input').value = '';
    
    // Save and rerender
    saveProspects();
    
    // Instead of full rerender, just update the detail sections for this prospect
    updateProspectDetailsSection(prospectId);
}

// Remove custom field from a prospect
function removeCustomField(prospectId, fieldKey) {
    console.log('Removing custom field:', fieldKey, 'from prospect:', prospectId);
    
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect || !prospect.details) {
        console.error('Could not find prospect or details');
        return;
    }

    if (!prospect.details.customFields) {
        console.error('No custom fields found for prospect:', prospectId);
        return;
    }
    
    console.log('Removing field:', fieldKey);
    console.log('Available custom fields:', Object.keys(prospect.details.customFields));
    
    // Remove from customFields array
    if (!prospect.details.customFields[fieldKey]) {
        console.error('Custom field not found:', fieldKey);
        return;
    }
    
    delete prospect.details.customFields[fieldKey];
    
    // Remove the value
    if (prospect.details) {
        delete prospect.details[fieldKey];
    }
    
    // Save to database
    saveProspects();
    
    // Show success message
    showSaveIndicator(false, true);
    
    // Update only the details section
    updateProspectDetailsSection(prospectId);
    
    console.log('Field removed successfully');
}

// Update just the details section without losing click events
function updateProspectDetailsSection(prospectId) {
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect) return;
    
    // Get the details section
    const detailsSection = document.getElementById(`details-${prospectId}`);
    if (!detailsSection) return;
    
    // Get the detail sections container (keeps the summary intact)
    const detailSections = detailsSection.querySelector('.prospect-detail-sections');
    if (detailSections) {
        // Just update the detail sections HTML
        detailSections.innerHTML = renderDetailSections(prospect);
        
        // We don't need to re-attach event listeners here since we're using global event delegation
    }
}

// Global function to directly remove a custom field
window.removeCustomFieldDirect = function(fieldKey, event) {
    if (event) {
        event.stopPropagation();
    }
    
    console.log('Direct remove field called for:', fieldKey);
    
    // Find the button element
    const button = event.currentTarget;
    if (!button) {
        console.error('Could not find button element');
        return false;
    }
    
    // Find the prospect details section
    const detailsSection = button.closest('.prospect-details');
    if (!detailsSection) {
        console.error('Could not find prospect details section');
        return false;
    }
    
    // Get the prospect ID
    const prospectId = detailsSection.id.replace('details-', '');
    console.log('Found prospect ID:', prospectId);
    
    // Confirm removal
    if (confirm('Are you sure you want to remove this field? This cannot be undone.')) {
        // Find the prospect
        const prospect = prospectsList.find(p => p.id === prospectId);
        if (!prospect || !prospect.details) {
            console.error('Prospect details not found');
            return false;
        }

        if (!prospect.details.customFields) {
            console.error('No custom fields found for prospect:', prospectId);
            return false;
        }
        
        console.log('Removing field:', fieldKey);
        console.log('Available custom fields:', Object.keys(prospect.details.customFields));
        
        // Remove the field
        if (prospect.details.customFields[fieldKey]) {
            delete prospect.details.customFields[fieldKey];
            delete prospect.details[fieldKey];
            
            // Save to database
            saveProspects();
            
            // Show success message
            showSaveIndicator(false, true);
            
            // Update only the details section
            updateProspectDetailsSection(prospectId);
            
            console.log('Field removed successfully');
        } else {
            console.error('Custom field not found in prospect');
        }
    }
    
    return false;
};

// Global function to delete a custom field
window.deleteCustomField = function(event, fieldKey) {
    event.stopPropagation(); // Prevent event bubbling
    
    console.log('Delete custom field called for:', fieldKey);
    
    // Find the button that was clicked
    const button = event.currentTarget;
    
    // Find the prospect-details section that contains this button
    const detailsSection = button.closest('.prospect-details');
    if (!detailsSection) {
        console.error('Could not find the prospect details section');
        return false;
    }
    
    // Get the prospect ID from the details section id
    const prospectId = detailsSection.id.replace('details-', '');
    console.log('Prospect ID:', prospectId);
    
    // Confirm deletion
    if (confirm('Are you sure you want to remove this field? This cannot be undone.')) {
        // Find the prospect
        const prospect = prospectsList.find(p => p.id === prospectId);
        if (!prospect || !prospect.details || !prospect.details.customFields) {
            console.error('Prospect details or customFields not found');
            return false;
        }
        
        console.log('Removing custom field:', fieldKey);
        console.log('Available custom fields:', Object.keys(prospect.details.customFields));
        
        // Delete the custom field
        delete prospect.details.customFields[fieldKey];
        
        // Save changes
        saveProspects();
        
        // Show success message
        showSaveIndicator(false, true);
        
        // Update the UI
        const detailSections = detailsSection.querySelector('.prospect-detail-sections');
        if (detailSections) {
            detailSections.innerHTML = renderDetailSections(prospect);
        }
        
        console.log('Field removed successfully');
    }
    
    return false;
};

// Sanitize a string for safe display in HTML
function sanitize(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Function to extract feet from height string (e.g., "6'2" returns 6)
function getHeightFeet(heightStr) {
    if (!heightStr) return '';
    
    // Check if height is in the format 6'2" or 6-2 or 6 ft 2 in
    if (heightStr.includes("'")) {
        // Format: 6'2"
        return parseInt(heightStr.split("'")[0]);
    } else if (heightStr.includes("-")) {
        // Format: 6-2
        return parseInt(heightStr.split("-")[0]);
    } else if (heightStr.includes("ft")) {
        // Format: 6 ft 2 in
        return parseInt(heightStr.split("ft")[0]);
    }
    
    // If no recognized format, return empty
    return '';
}

// Function to extract inches from height string (e.g., "6'2" returns 2)
function getHeightInches(heightStr) {
    if (!heightStr) return '';
    
    // Check if height is in the format 6'2" or 6-2 or 6 ft 2 in
    if (heightStr.includes("'")) {
        // Format: 6'2"
        const inchPart = heightStr.split("'")[1];
        return parseInt(inchPart);
    } else if (heightStr.includes("-")) {
        // Format: 6-2
        return parseInt(heightStr.split("-")[1]);
    } else if (heightStr.includes("in")) {
        // Format: 6 ft 2 in
        const inchPart = heightStr.split("ft")[1].split("in")[0];
        return parseInt(inchPart);
    }
    
    // If no recognized format, return empty
    return '';
}

// Update header appearance based on current sort
function updateSortIndicators() {
    // Remove all sort indicators first
    document.querySelectorAll('.sort-indicator').forEach(el => {
        el.innerHTML = '';
    });
    
    // Add indicator to current sort column
    const sortHeader = document.querySelector(`#prospects-table th[data-sort="${currentSort.column}"]`);
    if (sortHeader) {
        const indicator = sortHeader.querySelector('.sort-indicator');
        if (indicator) {
            indicator.innerHTML = currentSort.direction === 'asc' ? '▲' : '▼';
        }
        
        console.log(`Updated header ${currentSort.column} to ${currentSort.direction}`);
    } else {
        console.error(`Could not find header with data-sort="${currentSort.column}"`);
    }
}

// Function to setup sort and filter event listeners
function setupSortAndFilters() {
    console.log('Setting up sort and filter listeners');
    
    // Setup sortable header clicks
    document.querySelectorAll('th.sortable').forEach(header => {
        // Remove existing listeners first to prevent duplicates
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', () => {
            const sortColumn = newHeader.getAttribute('data-sort');
            console.log(`Header clicked: ${sortColumn}`);
            
            // If clicking the same column, toggle direction
            if (currentSort.column === sortColumn) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // New column, default to ascending
                currentSort.column = sortColumn;
                currentSort.direction = 'asc'; // Default to ascending for new sort
            }
            
            // Update header appearance
            updateSortIndicators();
            
            // Apply sort
            applyFiltersAndSort();
        });
    });
    
    // Setup filter inputs
    document.getElementById('position-filter').addEventListener('change', e => {
        filters.position = e.target.value;
        applyFiltersAndSort();
    });
    
    document.getElementById('college-filter').addEventListener('input', e => {
        filters.college = e.target.value.toLowerCase();
        applyFiltersAndSort();
    });
    
    document.getElementById('name-filter').addEventListener('input', e => {
        filters.name = e.target.value.toLowerCase();
        applyFiltersAndSort();
    });
    
    document.getElementById('grade-filter').addEventListener('input', e => {
        filters.grade = e.target.value;
        applyFiltersAndSort();
    });
    
    // Setup reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        // Clear filter inputs
        document.getElementById('position-filter').value = '';
        document.getElementById('college-filter').value = '';
        document.getElementById('name-filter').value = '';
        document.getElementById('grade-filter').value = '';
        
        // Reset filter values
        filters = {
            position: '',
            college: '',
            name: '',
            grade: ''
        };
        
        // Re-apply filters (show all)
        applyFiltersAndSort();
    });
}

// Filter and sort all prospects
function applyFiltersAndSort() {
    console.log('Applying filters and sort:', filters, currentSort);
    
    // First filter the prospects
    const filteredProspects = prospectsList.filter(prospect => {
        // Position filter - case insensitive comparison
        if (filters.position && prospect.position?.toUpperCase() !== filters.position.toUpperCase()) {
            return false;
        }
        
        // College filter (partial match)
        if (filters.college && !prospect.college?.toLowerCase().includes(filters.college.toLowerCase())) {
            return false;
        }
        
        // Name filter (partial match)
        if (filters.name && !prospect.name?.toLowerCase().includes(filters.name.toLowerCase())) {
            return false;
        }
        
        // Grade filter (minimum value)
        if (filters.grade && (!prospect.grade || parseFloat(prospect.grade) < parseFloat(filters.grade))) {
            return false;
        }
        
        return true;
    });
    
    console.log(`Filtered to ${filteredProspects.length} prospects. Sorting by ${currentSort.column} ${currentSort.direction}`);
    
    // Then sort the filtered prospects
    filteredProspects.sort((a, b) => {
        console.log(`Comparing sort values for ${currentSort.column}:`, a[currentSort.column], b[currentSort.column]);
        
        let aValue = a[currentSort.column];
        let bValue = b[currentSort.column];
        
        // Handle special cases
        if (currentSort.column === 'height') {
            // Extract height in inches for comparison
            aValue = convertHeightToInches(a.height || '');
            bValue = convertHeightToInches(b.height || '');
        } else if (['weight', 'grade', 'rank'].includes(currentSort.column)) {
            // Convert numeric string values to numbers
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
        } else if (currentSort.column === 'college' || currentSort.column === 'name' || currentSort.column === 'position') {
            // Case insensitive string comparison
            aValue = (aValue || '').toLowerCase();
            bValue = (bValue || '').toLowerCase();
        }
        
        // Handle null values
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        // Compare values based on direction
        let result;
        if (currentSort.direction === 'asc') {
            result = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
            result = aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
        
        console.log(`Sort result: ${result}`);
        return result;
    });
    
    // Render the filtered and sorted prospects
    renderProspects(filteredProspects);
}

// Convert height string like "6'2" to inches for comparison
function convertHeightToInches(heightStr) {
    if (!heightStr) return 0;
    
    const heightMatch = heightStr.match(/(\d+)'(\d+)/);
    if (heightMatch) {
        const feet = parseInt(heightMatch[1], 10);
        const inches = parseInt(heightMatch[2], 10);
        return (feet * 12) + inches;
    }
    
    return 0;
}

// Drag and drop functionality for reordering prospects
function dragStart(e) {
    dragStartIndex = +this.closest('tr').getAttribute('data-id');
    this.classList.add('dragging');
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeave() {
    this.classList.remove('drag-over');
}

function drop(e) {
    const dragEndIndex = +this.getAttribute('data-id');
    this.classList.remove('drag-over');
    
    if (dragStartIndex !== dragEndIndex) {
        // Find the indexes in the prospectsList array
        const startIndex = prospectsList.findIndex(p => p.id === dragStartIndex);
        const endIndex = prospectsList.findIndex(p => p.id === dragEndIndex);
        
        if (startIndex !== -1 && endIndex !== -1) {
            // Reorder the array
            const [removed] = prospectsList.splice(startIndex, 1);
            prospectsList.splice(endIndex, 0, removed);
            
            // Save and render
            saveProspects();
            renderProspects();
        }
    }
}

// Initialize drag and drop functionality
function initDragAndDrop() {
    console.log('Initializing drag and drop functionality');
    // Initialize drag state
    window.dragState = {
        dragging: false,
        sourceElement: null,
        targetElement: null
    };
}

// Setup all event listeners for the page
function setupAllEventListeners() {
    console.log('Setting up all event listeners');
    
    // Initialize drag and drop functionality
    initDragAndDrop();
    
    // Ensure the event delegation for drag and drop
    document.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Add sort and filter setup
    setupSortAndFilters();
    
    // Set up auto-save for all textareas
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('prospect-detail-textarea')) {
            const textarea = e.target;
            const detailsDiv = textarea.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupTextareaAutoSave(textarea, prospectId);
            }
        }
    });
    
    // Set up auto-save for all input fields
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('prospect-detail-input')) {
            const input = e.target;
            const detailsDiv = input.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupInputAutoSave(input, prospectId);
            }
        }
    });
    
    // Set up auto-save for summary input fields
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('summary-value-input')) {
            const input = e.target;
            const detailsDiv = input.closest('.prospect-details');
            if (detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                setupInputAutoSave(input, prospectId);
            }
        }
    });
}

// Handle drag start event
function handleDragStart(e) {
    // Only handle drag on prospect table rows
    const row = e.target.closest('#prospects-table tbody tr');
    if (!row) return;
    
    console.log('Drag started on row:', row.id);
    window.dragState.dragging = true;
    window.dragState.sourceElement = row;
    
    // Add visual indicator
    row.classList.add('dragging');
}

// Handle drag move event
function handleDragMove(e) {
    if (!window.dragState.dragging) return;
    
    // Find element under cursor
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    const rowBelow = elemBelow?.closest('#prospects-table tbody tr');
    
    if (rowBelow && rowBelow !== window.dragState.sourceElement) {
        window.dragState.targetElement = rowBelow;
        
        // Add visual indicator for drop target
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
        rowBelow.classList.add('drop-target');
    }
}

// Handle drag end event
function handleDragEnd(e) {
    if (!window.dragState.dragging) return;
    
    console.log('Drag ended');
    
    // Remove visual indicators
    document.querySelectorAll('.dragging, .drop-target').forEach(el => {
        el.classList.remove('dragging', 'drop-target');
    });
    
    // Reset drag state
    window.dragState = {
        dragging: false,
        sourceElement: null,
        targetElement: null
    };
}

// Export board to CSV
function exportBoard() {
    console.log('Exporting board');
    
    if (!prospectsList || prospectsList.length === 0) {
        alert('No prospects to export.');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Rank,Name,Position,College,Height,Weight,Grade\n';
    
    // Sort prospects by grade
    const sortedProspects = [...prospectsList].sort((a, b) => {
        const gradeA = parseFloat(a.grade) || 0;
        const gradeB = parseFloat(b.grade) || 0;
        return gradeB - gradeA;
    });
    
    // Add each prospect to CSV
    sortedProspects.forEach((prospect, index) => {
        const rank = index + 1;
        const row = [
            rank,
            prospect.name || '',
            prospect.position || '',
            prospect.college || '',
            prospect.height || '',
            prospect.weight || '',
            prospect.grade || ''
        ].map(val => `"${val}"`).join(',');
        csvContent += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nfl_draft_prospects.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Clear the board
function clearBoard() {
    if (confirm('Are you sure you want to clear your prospect board? This cannot be undone.')) {
        console.log('Clearing board');
        prospectsList = [];
        saveProspects();
        renderProspects();
    }
}

// Update position filter options whenever prospects are loaded or added
function addProspect(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const position = document.getElementById('position').value.trim().toUpperCase(); // Store position in uppercase for consistency
    const college = document.getElementById('college').value.trim();
    const heightFt = parseInt(document.getElementById('height-ft').value) || 0;
    const heightIn = parseInt(document.getElementById('height-in').value) || 0;
    const weight = document.getElementById('weight').value.trim();
    const grade = document.getElementById('grade').value.trim();
    
    // ... rest of the function remains the same ...
    
    // Update position filter options
    updatePositionFilterOptions();
}

// Call updatePositionFilterOptions whenever prospects are loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... rest of the code remains the same ...
    
    // Load prospects from Firestore
    loadProspectsFromFirestoreOnly()
        .then(prospects => {
            // ... rest of the code remains the same ...
            
            // Update position filter options
            updatePositionFilterOptions();
        })
        .catch(error => {
            // ... rest of the code remains the same ...
        });
});

// Function to update the position filter dropdown with unique positions from prospects
function updatePositionFilterOptions() {
    const positionFilter = document.getElementById('position-filter');
    if (!positionFilter) return;
    
    // Save the current selection if any
    const currentSelection = positionFilter.value;
    
    // Clear all options except the "All Positions" default
    while (positionFilter.options.length > 1) {
        positionFilter.remove(1);
    }
    
    // Get unique positions from the prospects list (case insensitive)
    const uniquePositions = new Set();
    
    if (prospectsList && prospectsList.length > 0) {
        prospectsList.forEach(prospect => {
            if (prospect.position) {
                // Store positions in uppercase to avoid duplicates like 'qb', 'QB', 'Qb'
                uniquePositions.add(prospect.position.toUpperCase());
            }
        });
    }
    
    // Sort positions alphabetically
    const sortedPositions = Array.from(uniquePositions).sort();
    
    // Add options to the dropdown
    sortedPositions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position;
        positionFilter.appendChild(option);
    });
    
    // Restore previous selection if it exists in the new options
    if (currentSelection) {
        for (let i = 0; i < positionFilter.options.length; i++) {
            if (positionFilter.options[i].value.toUpperCase() === currentSelection.toUpperCase()) {
                positionFilter.selectedIndex = i;
                break;
            }
        }
    }
    
    console.log(`Updated position filter with ${sortedPositions.length} unique positions`);
}

// Download template
function downloadTemplate() {
    console.log('Downloading template');
    
    // Create headers for all possible fields
    const headers = [
        'name',
        'position',
        'college',
        'height',
        'weight',
        'grade',
        'background',
        'strengths',
        'weaknesses',
        'summary',
        'handSize',
        'armLength',
        'fortyYard',
        'twentyYardSplit',
        'tenYardSplit',
        'verticalJump',
        'broadJump',
        'threeCone',
        'shuttle',
        'benchPress',
        'notes'
    ];
    
    // Create sample data
    const sampleData = [
        'John Doe',
        'QB',
        'State University',
        '6\'2"',
        '210',
        'A',
        'Four-year starter',
        'Arm strength, accuracy',
        'Mobility could improve',
        'Solid pocket passer with NFL potential',
        '9.5',
        '33',
        '4.8',
        '2.7',
        '1.6',
        '32',
        '9\'5"',
        '7.1',
        '4.2',
        '15',
        'Leader on and off the field'
    ];
    
    // Create a second sample row with different position
    const sampleData2 = [
        'Mike Smith',
        'WR',
        'Tech University',
        '6\'0"',
        '195',
        'B+',
        'Two-year starter after transfer',
        'Speed, route-running',
        'Needs to improve catching in traffic',
        'Explosive playmaker with good upside',
        '9.0',
        '32',
        '4.4',
        '2.5',
        '1.5',
        '36',
        '10\'2"',
        '6.8',
        '4.0',
        '12',
        'Special teams contributor'
    ];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    csvContent += sampleData.join(',') + '\n';
    csvContent += sampleData2.join(',');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "prospects_template.csv");
    document.body.appendChild(link);
    
    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
}

// Show prospect form modal
function showProspectForm() {
    const modal = document.getElementById('prospect-form-modal');
    if (modal) {
        // Reset form if it's being used for a new prospect
        const form = document.getElementById('prospect-form');
        if (form) {
            form.reset();
            form.removeAttribute('data-edit-id');
            
            // Update the modal title
            const modalTitle = modal.querySelector('.modal-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Add New Prospect';
            }
        }
        
        modal.style.display = 'block';
    }
}

// Set up action buttons for prospects (edit/delete)
function setupProspectActions() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-prospect-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const prospectId = this.getAttribute('data-id');
            editProspect(prospectId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-prospect-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const prospectId = this.getAttribute('data-id');
            deleteProspect(prospectId);
        });
    });
}

// Update sort indicators in the table headers
function updateSortIndicators() {
    // Remove all sort indicators first
    document.querySelectorAll('.sort-indicator').forEach(el => {
        el.innerHTML = '';
    });
    
    // Add indicator to current sort column
    const sortHeader = document.querySelector(`#prospects-table th[data-sort="${currentSort.column}"]`);
    if (sortHeader) {
        const indicator = sortHeader.querySelector('.sort-indicator');
        if (indicator) {
            indicator.innerHTML = currentSort.direction === 'asc' ? '▲' : '▼';
        }
        
        console.log(`Updated header ${currentSort.column} to ${currentSort.direction}`);
    } else {
        console.error(`Could not find header with data-sort="${currentSort.column}"`);
    }
}

// Helper function to ensure all prospects have required fields
function ensureProspectsHaveRequiredFields(prospects) {
    if (!Array.isArray(prospects)) {
        console.error('Invalid prospects data, not an array:', prospects);
        return [];
    }
    
    return prospects.map(prospect => {
        // Skip invalid prospects
        if (!prospect || typeof prospect !== 'object') {
            console.error('Invalid prospect:', prospect);
            return null;
        }
        
        // Default complete prospect template with all fields
        const defaultProspect = {
            id: prospect.id || Date.now(),
            rank: prospect.rank || 0,
            name: prospect.name || 'Unknown Player',
            position: prospect.position ? prospect.position.toUpperCase() : '',
            college: prospect.college || '',
            height: prospect.height || '',
            weight: prospect.weight || '',
            grade: prospect.grade || '',
            // Ensure all scouting fields have default values
            background: '',
            strengths: '',
            weaknesses: '',
            summary: '',
            notes: '',
            // Add default combine measurement fields
            handSize: '',
            armLength: '',
            fortyYard: '',
            twentyYardSplit: '',
            tenYardSplit: '',
            verticalJump: '',
            broadJump: '',
            threeCone: '',
            shuttle: '',
            benchPress: ''
        };
        
        // Create a new object with defaults filled in
        const result = { ...defaultProspect };
        
        // Copy valid properties from the original prospect
        Object.keys(prospect).forEach(key => {
            if (prospect[key] !== undefined && prospect[key] !== null) {
                result[key] = prospect[key];
            }
        });
        
        return result;
    }).filter(p => p !== null); // Remove any invalid prospects
}
