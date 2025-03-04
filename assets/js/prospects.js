// NFL Draft Prospects Grading Page JavaScript

// Global variables for prospect data
let prospectForm;
let prospectsTable;
let prospectsList = [];
let dragStartIndex;
let loadingOverlay;
let saveIndicator;
let selectedProspectId = null;

// Default detail fields that every prospect will have
const defaultDetailFields = [
    { key: 'background', label: 'Background', type: 'textarea' },
    { key: 'strengths', label: 'Strengths', type: 'textarea' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
    { key: 'summary', label: 'Summary', type: 'textarea' }
];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    prospectForm = document.getElementById('prospect-form');
    prospectsTable = document.getElementById('prospects-table-body');
    loadingOverlay = document.getElementById('loading-overlay');
    saveIndicator = document.getElementById('save-indicator');
    
    // Show loading overlay
    showLoading(true);
    
    // Initialize Firebase auth listener
    initFirebaseAuthListener();
    
    // Only load prospects after authentication is confirmed
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('User authenticated, loading prospects from Firestore');
                loadProspectsFromFirestoreOnly()
                    .then(prospects => {
                        // Render prospects to the UI
                        renderProspects();
                        // Hide loading overlay
                        showLoading(false);
                        console.log('Prospects loaded and rendered successfully');
                        
                        // Set up direct jQuery click handling for prospect rows
                        setupRowClickHandlers();
                    })
                    .catch(error => {
                        console.error('Error loading prospects:', error);
                        showErrorMessage('Error loading prospects: ' + error.message);
                        showLoading(false);
                    });
            } else {
                console.log('No user logged in, showing empty board');
                showLoading(false);
                showLoginMessage();
            }
        });
    } else {
        console.error('Firebase not available');
        showLoading(false);
        showErrorMessage('Firebase not available. Please try again later.');
    }
    
    // Add event listeners
    setupEventListeners();
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
function showLoginMessage() {
    // Clear any existing prospects
    prospectsList = [];
    renderProspects();
    
    // Show login message instead of empty state
    const noProspectsDiv = document.getElementById('no-prospects');
    if (noProspectsDiv) {
        noProspectsDiv.innerHTML = `
            <p>You need to be logged in to view and manage your prospect board.</p>
            <p>Please <a href="/login.html">log in</a> to continue.</p>
        `;
    }
}

// Show error message
function showErrorMessage(message) {
    const noProspectsDiv = document.getElementById('no-prospects');
    if (noProspectsDiv) {
        noProspectsDiv.innerHTML = `
            <p>Error: ${message}</p>
            <p>Please try refreshing the page.</p>
        `;
        noProspectsDiv.style.display = 'block';
        document.getElementById('prospects-table').style.display = 'none';
    }
}

// Initialize Firebase auth listener if not in firebase-config.js
function initFirebaseAuthListener() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // Firebase is available, set up listener for user changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Auth state change: User logged in');
                // Enable the form when logged in
                if (prospectForm) prospectForm.classList.remove('disabled');
                document.querySelectorAll('.board-control-btn').forEach(btn => btn.disabled = false);
            } else {
                console.log('Auth state change: User logged out');
                // Disable the form when logged out
                if (prospectForm) prospectForm.classList.add('disabled');
                document.querySelectorAll('.board-control-btn').forEach(btn => btn.disabled = true);
                showLoginMessage();
            }
        });
    }
}

// Save prospects to Firestore
function saveProspectsToFirestoreOnly() {
    console.log('Saving prospects to Firestore...');
    
    return new Promise((resolve, reject) => {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            console.error('Firebase not initialized properly');
            reject(new Error('Firebase not initialized properly'));
            return;
        }
        
        // Check if user is logged in
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user logged in');
            reject(new Error('User not logged in'));
            return;
        }
        
        // Get a reference to the user's prospects document
        const db = firebase.firestore();
        const userProspectsRef = db.collection('userProspects').doc(user.uid);
        
        // Save data
        return userProspectsRef.set({
            prospects: JSON.parse(JSON.stringify(prospectsList)),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .then(() => {
            console.log('Prospects saved to Firestore successfully');
            resolve();
        })
        .catch(error => {
            console.error('Error saving to Firestore:', error);
            reject(error);
        });
    });
}

// Load prospects from Firestore
function loadProspectsFromFirestoreOnly() {
    console.log('Loading prospects from Firestore...');
    
    return new Promise((resolve, reject) => {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            console.error('Firebase not initialized properly');
            reject(new Error('Firebase not initialized properly'));
            return;
        }
        
        // Check if user is logged in
        const user = firebase.auth().currentUser;
        if (!user) {
            console.error('No user logged in');
            reject(new Error('User not logged in'));
            return;
        }
        
        // Try to get data from the new collection first
        const db = firebase.firestore();
        const userProspectsRef = db.collection('userProspects').doc(user.uid);
        
        return userProspectsRef.get()
            .then(doc => {
                if (doc.exists && doc.data() && doc.data().prospects) {
                    // Found data in new collection
                    prospectsList = doc.data().prospects;
                    console.log('Loaded', prospectsList.length, 'prospects from userProspects collection');
                    resolve(prospectsList);
                } else {
                    // Check the old collection as a fallback
                    console.log('No data in userProspects, checking users collection...');
                    const oldUserDocRef = db.collection('users').doc(user.uid);
                    
                    return oldUserDocRef.get()
                        .then(oldDoc => {
                            if (oldDoc.exists && oldDoc.data() && oldDoc.data().draftProspects) {
                                // Found data in old collection, migrate it
                                console.log('Found prospects in users collection, migrating...');
                                prospectsList = oldDoc.data().draftProspects;
                                
                                // Save to new collection
                                saveProspectsToFirestoreOnly()
                                    .then(() => {
                                        console.log('Successfully migrated data to new collection');
                                    })
                                    .catch(err => {
                                        console.error('Error migrating data:', err);
                                    });
                                
                                resolve(prospectsList);
                            } else {
                                // No data found in either collection
                                console.log('No prospects found in any collection, starting with empty array');
                                prospectsList = [];
                                resolve(prospectsList);
                            }
                        });
                }
            })
            .catch(error => {
                console.error('Error loading from Firestore:', error);
                reject(error);
            });
    });
}

// Simplified save function that only uses Firestore
function saveProspects() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            showSaveIndicator(true);
            return saveProspectsToFirestoreOnly()
                .then(() => {
                    console.log('Prospects saved successfully');
                    showSaveIndicator(false, true);
                })
                .catch(error => {
                    console.error('Error saving prospects:', error);
                    alert('There was an error saving your prospects. Please try again.');
                    showSaveIndicator(false);
                });
        } else {
            console.log('No user logged in, cannot save prospects');
            alert('You must be logged in to save prospects.');
            return Promise.reject(new Error('No user logged in'));
        }
    } else {
        console.error('Firebase not available');
        return Promise.reject(new Error('Firebase not initialized'));
    }
}

// Initialize UI and event listeners
function setupEventListeners() {
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
        addProspectBtn.addEventListener('click', function() {
            prospectFormModal.style.display = 'block';
        });
        
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
    
    // Board control buttons
    const exportBtn = document.getElementById('export-board-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBigBoard);
    }
    
    const clearBtn = document.getElementById('clear-board-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearBigBoard);
    }
}

// Handle form submission for adding a new prospect
function handleProspectSubmit(e) {
    e.preventDefault();
    
    // Check if user is logged in
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
        alert('You must be logged in to add prospects.');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    // Generate unique ID
    const prospectId = 'prospect_' + Date.now();
    
    // Get form values
    const name = document.getElementById('prospect-name').value;
    const position = document.getElementById('prospect-position').value;
    const college = document.getElementById('prospect-college').value;
    const age = document.getElementById('prospect-age').value;
    const height = document.getElementById('prospect-height').value;
    const weight = document.getElementById('prospect-weight').value;
    const notes = document.getElementById('prospect-notes').value;
    const grade = document.getElementById('prospect-grade').value;
    
    // Get detailed information
    const background = document.getElementById('prospect-background').value;
    const strengths = document.getElementById('prospect-strengths').value;
    const weaknesses = document.getElementById('prospect-weaknesses').value;
    const summary = document.getElementById('prospect-summary').value;
    
    // Create details object
    const details = {
        background: background || '',
        strengths: strengths || '',
        weaknesses: weaknesses || '',
        summary: summary || ''
    };
    
    // Create new prospect object
    const newProspect = {
        id: prospectId,
        name,
        position,
        college,
        age,
        height,
        weight,
        notes,
        grade,
        details: details,
        customFields: [],
        dateAdded: new Date().toISOString()
    };
    
    // Add to prospects array
    prospectsList.push(newProspect);
    
    // Save and render
    saveProspects();
    renderProspects();
    
    // Hide loading state
    showLoading(false);
    
    // Reset form
    prospectForm.reset();
    
    // Close modal
    const prospectFormModal = document.getElementById('prospect-form-modal');
    if (prospectFormModal) {
        prospectFormModal.style.display = 'none';
    }
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
function renderProspects() {
    console.log('Rendering prospects');
    
    // Clear the prospects table first
    prospectsTable.innerHTML = '';
    
    // Check if we have prospects to display
    if (!prospectsList || !Array.isArray(prospectsList) || prospectsList.length === 0) {
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
    
    // Sort by position if available
    let sortedProspects = [];
    if (Array.isArray(prospectsList)) {
        sortedProspects = [...prospectsList];
        // Sort by grade first (highest to lowest)
        sortedProspects.sort((a, b) => {
            const gradeA = parseFloat(a.grade) || 0;
            const gradeB = parseFloat(b.grade) || 0;
            return gradeB - gradeA;
        });
    } else if (typeof prospectsList === 'object') {
        // Convert object to array
        sortedProspects = Object.values(prospectsList);
    } else {
        console.error('Invalid prospects data format:', typeof prospectsList);
        return;
    }
    
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
                    <button class="view-details-btn" onclick="event.stopPropagation(); showProspectDetails('${prospect.id}'); return false;" data-id="${prospect.id}">
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
    
    console.log('Prospects rendered successfully');
}

// Set up event listeners for all detail buttons
function setButtonEventListeners() {
    // Set up add field buttons
    document.querySelectorAll('.add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.getAttribute('data-id');
            document.getElementById(`add-field-form-${prospectId}`).style.display = 'flex';
        });
    });
    
    // Set up cancel add field buttons
    document.querySelectorAll('.cancel-add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const formElement = btn.closest('.add-field-form');
            if (formElement) {
                formElement.style.display = 'none';
            }
        });
    });
    
    // Set up confirm add field buttons
    document.querySelectorAll('.confirm-add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
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
        });
    });
    
    // Set up save details buttons
    document.querySelectorAll('.save-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.getAttribute('data-id');
            if (prospectId) {
                showSaveIndicator(true);
                saveProspectDetails(prospectId).then(() => {
                    showSaveIndicator(false, true);
                });
            }
        });
    });
    
    // Set up field toggle buttons
    document.querySelectorAll('.field-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionId = toggle.getAttribute('data-section');
            if (sectionId) {
                const section = document.getElementById(sectionId);
                if (section) {
                    toggle.classList.toggle('open');
                    section.classList.toggle('open');
                }
            }
        });
    });
    
    // Set up remove field buttons
    document.querySelectorAll('.remove-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fieldKey = btn.getAttribute('data-field-key');
            const detailsDiv = btn.closest('.prospect-details');
            if (fieldKey && detailsDiv) {
                const prospectId = detailsDiv.id.replace('details-', '');
                removeCustomField(prospectId, fieldKey);
            }
        });
    });
    
    // Set up auto-save for all textareas
    document.querySelectorAll('.prospect-detail-textarea').forEach(textarea => {
        const detailsDiv = textarea.closest('.prospect-details');
        if (detailsDiv) {
            const prospectId = detailsDiv.id.replace('details-', '');
            setupTextareaAutoSave(textarea, prospectId);
        }
    });
}

// Set up auto-save for a textarea
function setupTextareaAutoSave(textarea, prospectId) {
    let saveTimeout;
    
    textarea.addEventListener('input', () => {
        // Show saving indicator
        showSaveIndicator(true);
        
        // Clear previous timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set new timeout for debounced save
        saveTimeout = setTimeout(() => {
            const fieldKey = textarea.getAttribute('data-field-key');
            const prospect = prospectsList.find(p => p.id === prospectId);
            
            if (prospect && fieldKey) {
                if (!prospect.details) {
                    prospect.details = {};
                }
                
                prospect.details[fieldKey] = textarea.value;
                saveProspects().then(() => {
                    console.log(`Auto-saved ${fieldKey} for prospect ${prospectId}`);
                });
            }
        }, 1000); // 1 second debounce
    });
}

// Toggle prospect details
function toggleProspectDetails(prospectId) {
    console.log('Toggling details for prospect:', prospectId);
    
    const detailsRow = document.getElementById(`details-row-${prospectId}`);
    const prospectRow = document.getElementById(`prospect-${prospectId}`);
    
    console.log('Details row found:', !!detailsRow);
    console.log('Prospect row found:', !!prospectRow);
    
    if (!detailsRow || !prospectRow) {
        console.error('Could not find details row or prospect row');
        return;
    }
    
    // Toggle open class on details row
    const isOpen = detailsRow.classList.contains('open');
    console.log('Details row is currently open?', isOpen);
    
    // Always close any previously open rows first
    document.querySelectorAll('.prospect-details-row.open').forEach(row => {
        if (row.id !== `details-row-${prospectId}`) {
            console.log('Closing already open row:', row.id);
            row.classList.remove('open');
            const rowId = row.getAttribute('data-details-for');
            const relatedRow = document.getElementById(`prospect-${rowId}`);
            if (relatedRow) relatedRow.classList.remove('selected');
            console.log('Removed selected class from:', relatedRow.id);
        }
    });
    
    // Toggle the current row
    if (isOpen) {
        console.log('Closing details row:', detailsRow.id);
        // Save any changes first
        showSaveIndicator(true);
        saveProspectDetails(prospectId).then(() => {
            detailsRow.classList.remove('open');
            prospectRow.classList.remove('selected');
            selectedProspectId = null;
            showSaveIndicator(false, true);
            console.log('Details row closed successfully');
        });
    } else {
        console.log('Opening details row:', detailsRow.id);
        detailsRow.classList.add('open');
        prospectRow.classList.add('selected');
        selectedProspectId = prospectId;
        console.log('Details row opened successfully');
        console.log('Current details row classes:', detailsRow.className);
    }
    
    // Log the final state
    console.log('Final state - is row open?', detailsRow.classList.contains('open'));
}

// Render the detail sections for a prospect
function renderDetailSections(prospect) {
    // Initialize details if not exists
    if (!prospect.details) {
        prospect.details = {};
    }
    
    // Initialize customFields if not exists
    if (!prospect.customFields) {
        prospect.customFields = [];
    }
    
    let sectionsHTML = '';
    
    // Render default fields
    defaultDetailFields.forEach(field => {
        const value = prospect.details[field.key] || '';
        sectionsHTML += createDetailSectionHTML(field.key, field.label, value, false);
    });
    
    // Render custom fields
    prospect.customFields.forEach(field => {
        const value = prospect.details[field.key] || '';
        sectionsHTML += createDetailSectionHTML(field.key, field.label, value, true);
    });
    
    return sectionsHTML;
}

// Create HTML for a detail section
function createDetailSectionHTML(key, label, value, isRemovable) {
    const sectionId = `section-${key}`;
    
    return `
        <div class="prospect-detail-section" data-field-key="${key}">
            <div class="prospect-detail-title">
                ${label} 
                <span>
                    ${isRemovable ? `<button class="remove-field-btn" data-field-key="${key}"><i class="fas fa-times"></i></button>` : ''}
                    <i class="fas fa-chevron-down field-toggle" data-section="${sectionId}"></i>
                </span>
            </div>
            <div id="${sectionId}" class="field-collapse open">
                <div class="prospect-detail-content">
                    <textarea class="prospect-detail-textarea" data-field-key="${key}">${value}</textarea>
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
    
    // Initialize details object if not exists
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
    if (!prospect.customFields) {
        prospect.customFields = [];
    }
    
    prospect.customFields.push({
        key: fieldKey,
        label: fieldName,
        type: 'textarea'
    });
    
    // Initialize the value
    if (!prospect.details) {
        prospect.details = {};
    }
    prospect.details[fieldKey] = '';
    
    // Hide the add field form
    document.getElementById(`add-field-form-${prospectId}`).style.display = 'none';
    document.getElementById(`add-field-form-${prospectId}`).querySelector('.field-name-input').value = '';
    
    // Save and rerender
    saveProspects();
    renderProspects();
}

// Remove custom field from a prospect
function removeCustomField(prospectId, fieldKey) {
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect || !prospect.customFields) return;
    
    // Remove from customFields array
    prospect.customFields = prospect.customFields.filter(field => field.key !== fieldKey);
    
    // Remove the value
    if (prospect.details) {
        delete prospect.details[fieldKey];
    }
    
    // Save and rerender
    saveProspects();
    renderProspects();
}

// Handle dragging functionality for reordering prospects
function dragStart(e) {
    const row = this.closest('tr');
    dragStartIndex = Array.from(prospectsTable.querySelectorAll('tr.prospect-row')).indexOf(row);
    this.classList.add('prospect-dragging');
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    this.classList.add('prospect-drag-over');
}

function dragLeave(e) {
    this.classList.remove('prospect-drag-over');
}

function dragDrop(e) {
    const row = this.closest('tr');
    const dragEndIndex = Array.from(prospectsTable.querySelectorAll('tr.prospect-row')).indexOf(row);
    
    this.classList.remove('prospect-drag-over');
    
    swapProspects(dragStartIndex, dragEndIndex);
    
    // Save the new order
    saveProspects();
    renderProspects();
}

// Swap prospects for drag and drop reordering
function swapProspects(startIndex, endIndex) {
    if (startIndex === endIndex) return;
    
    // Get the prospect we're moving
    const movedProspect = prospectsList[startIndex];
    
    // Remove from original position
    prospectsList.splice(startIndex, 1);
    
    // Insert at new position
    prospectsList.splice(endIndex, 0, movedProspect);
}

// Handle editing a prospect
function handleEditProspect(e) {
    const prospectId = e.currentTarget.getAttribute('data-id');
    const prospect = prospectsList.find(p => p.id === prospectId);
    
    if (prospect) {
        // Populate form with prospect data
        document.getElementById('prospect-name').value = prospect.name;
        document.getElementById('prospect-position').value = prospect.position;
        document.getElementById('prospect-college').value = prospect.college;
        document.getElementById('prospect-age').value = prospect.age;
        document.getElementById('prospect-height').value = prospect.height;
        document.getElementById('prospect-weight').value = prospect.weight;
        document.getElementById('prospect-notes').value = prospect.notes;
        document.getElementById('prospect-grade').value = prospect.grade;
        
        // Remove old prospect
        handleDeleteProspect(e, false); // false = don't re-render yet
        
        // Scroll to the form
        document.querySelector('.add-prospect-sidebar').scrollIntoView({ behavior: 'smooth' });
    }
}

// Export big board to CSV
function exportBigBoard() {
    if (prospectsList.length === 0) {
        alert('No prospects to export');
        return;
    }
    
    // Create CSV header row with columns and detailed fields
    let csvContent = 'Rank,Name,Position,College,Age,Height,Weight,Grade';
    
    // Add default detail fields to header
    defaultDetailFields.forEach(field => {
        csvContent += `,${field.label}`;
    });
    
    // Get all unique custom fields across all prospects
    const allCustomFields = new Set();
    prospectsList.forEach(prospect => {
        if (prospect.customFields) {
            prospect.customFields.forEach(field => {
                allCustomFields.add(JSON.stringify(field));
            });
        }
    });
    
    // Add custom fields to header
    Array.from(allCustomFields).forEach(fieldJson => {
        const field = JSON.parse(fieldJson);
        csvContent += `,${field.label}`;
    });
    
    csvContent += '\n';
    
    // Add each prospect as a row
    prospectsList.forEach((prospect, index) => {
        const rank = index + 1;
        csvContent += `${rank},${prospect.name},${prospect.position},${prospect.college},${prospect.age || ''},${prospect.height || ''},${prospect.weight || ''},${prospect.grade || ''}`;
        
        // Add default detail fields
        defaultDetailFields.forEach(field => {
            // Escape any commas in the text
            const value = prospect.details && prospect.details[field.key] 
                ? `"${prospect.details[field.key].replace(/"/g, '""')}"`
                : '';
            csvContent += `,${value}`;
        });
        
        // Add custom fields
        Array.from(allCustomFields).forEach(fieldJson => {
            const field = JSON.parse(fieldJson);
            const value = prospect.details && prospect.details[field.key]
                ? `"${prospect.details[field.key].replace(/"/g, '""')}"`
                : '';
            csvContent += `,${value}`;
        });
        
        csvContent += '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'draft_big_board.csv');
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
}

// Clear the big board
function clearBigBoard() {
    if (confirm('Are you sure you want to clear all prospects? This cannot be undone.')) {
        prospectsList = [];
        saveProspects();
        renderProspects();
    }
}

// Add click event listeners to prospect rows
function addProspectRowListeners() {
    // First remove any existing event listeners by cloning and replacing each row
    document.querySelectorAll('.prospect-row').forEach(row => {
        const prospectId = row.getAttribute('data-id');
        row.addEventListener('click', function(event) {
            // Prevent default and stop propagation
            event.preventDefault();
            event.stopPropagation();
            
            // Don't trigger if clicking delete button
            if (event.target.closest('.delete-prospect')) return;
            
            console.log('Row clicked via addProspectRowListeners, toggling details for:', prospectId);
            toggleProspectDetails(prospectId);
        });
    });
}

// Debounce function to limit how often a function runs
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Function to directly toggle details row visibility
function showProspectDetails(prospectId) {
    console.log('Showing details for prospect:', prospectId);
    
    // Get the details row
    const detailsRow = document.getElementById(`details-row-${prospectId}`);
    if (!detailsRow) {
        console.error(`Cannot find details row for prospect: ${prospectId}`);
        return;
    }
    
    // Close any already open rows
    document.querySelectorAll('.prospect-details-row.open').forEach(row => {
        if (row.id !== `details-row-${prospectId}`) {
            row.classList.remove('open');
        }
    });
    
    // Check if the row is already open
    if (detailsRow.classList.contains('open')) {
        // If it's open, close it and save changes
        detailsRow.classList.remove('open');
        saveProspectDetails(prospectId);
        console.log('Closed details for prospect:', prospectId);
    } else {
        // If it's closed, open it
        detailsRow.classList.add('open');
        console.log('Opened details for prospect:', prospectId);
    }
    
    return false; // Prevent default behavior
}

// Sanitize a string for safe display in HTML
function sanitize(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
