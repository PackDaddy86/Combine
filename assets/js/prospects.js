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
                loadProspectsFromFirestoreOnly();
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

// Show or hide loading overlay
function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Show save indicator
function showSaveIndicator() {
    if (saveIndicator) {
        saveIndicator.classList.add('show');
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
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('No user logged in');
        return Promise.reject(new Error('You must be logged in to save prospects'));
    }
    
    // Reference to the user's document
    const userDocRef = firebase.firestore().collection('users').doc(user.uid);
    
    // Data to save
    const data = {
        draftProspects: prospectsList,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Check if document exists before saving
    return userDocRef.get()
        .then(doc => {
            // If document doesn't exist, create it
            if (!doc.exists) {
                return userDocRef.set(data);
            } else {
                // Otherwise update it
                return userDocRef.update(data);
            }
        })
        .then(() => {
            console.log('Prospects saved to Firestore');
            return Promise.resolve();
        })
        .catch(error => {
            console.error('Error saving prospects to Firestore:', error);
            return Promise.reject(error);
        });
}

// Load prospects from Firestore
function loadProspectsFromFirestoreOnly() {
    // Get current user
    const user = firebase.auth().currentUser;
    if (!user) {
        console.error('No user logged in');
        showLoginMessage();
        return Promise.reject(new Error('You must be logged in to load prospects'));
    }
    
    // Reference to the user's document
    const userDocRef = firebase.firestore().collection('users').doc(user.uid);
    
    // Get the document
    return userDocRef.get()
        .then(doc => {
            if (doc.exists && doc.data().draftProspects) {
                console.log('Prospects found in Firestore:', doc.data().draftProspects);
                prospectsList = doc.data().draftProspects;
                renderProspects();
                showLoading(false);
            } else {
                console.log('No prospects found in Firestore');
                prospectsList = [];
                renderProspects();
                showLoading(false);
            }
        })
        .catch(error => {
            console.error('Error loading prospects from Firestore:', error);
            showErrorMessage('Error loading prospects: ' + error.message);
            showLoading(false);
        });
}

// Simplified save function that only uses Firestore
function saveProspects() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            saveProspectsToFirestoreOnly()
                .then(() => {
                    console.log('Prospects saved successfully');
                    showSaveIndicator();
                })
                .catch(error => {
                    console.error('Error saving prospects:', error);
                    alert('There was an error saving your prospects. Please try again.');
                });
        } else {
            console.log('No user logged in, cannot save prospects');
            alert('You must be logged in to save prospects.');
        }
    } else {
        console.error('Firebase not available');
    }
}

// Initialize UI and event listeners
function setupEventListeners() {
    // Add prospect form submission
    if (prospectForm) {
        prospectForm.addEventListener('submit', handleProspectSubmit);
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
    
    // Show save indicator
    showSaveIndicator();
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
    if (!prospectsTable) return;
    
    // Sort prospects by grade (highest to lowest)
    prospectsList.sort((a, b) => b.grade - a.grade);
    
    // Clear existing table rows
    prospectsTable.innerHTML = '';
    
    // Show or hide the no prospects message
    const noProspectsElement = document.getElementById('no-prospects');
    if (noProspectsElement) {
        noProspectsElement.style.display = prospectsList.length === 0 ? 'flex' : 'none';
    }
    
    // If there are no prospects, return early
    if (prospectsList.length === 0) return;
    
    // Add each prospect to the table
    prospectsList.forEach((prospect, index) => {
        // Create table row for the prospect
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', prospect.id);
        tr.classList.add('prospect-row');
        tr.draggable = true;
        
        // Add class to the selected row
        if (prospect.id === selectedProspectId) {
            tr.classList.add('selected');
        }
        
        // Basic prospect info
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${prospect.name}</td>
            <td>${prospect.position}</td>
            <td>${prospect.college}</td>
            <td>${prospect.age || '-'}</td>
            <td>${prospect.height || '-'}</td>
            <td>${prospect.weight || '-'}</td>
            <td>${prospect.grade || '-'}</td>
            <td class="action-cell">
                <button class="delete-prospect" data-id="${prospect.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Add drag and drop event listeners
        tr.addEventListener('dragstart', dragStart);
        tr.addEventListener('dragover', dragOver);
        tr.addEventListener('drop', dragDrop);
        tr.addEventListener('dragenter', dragEnter);
        tr.addEventListener('dragleave', dragLeave);
        
        // Add click event to expand/collapse details
        tr.addEventListener('click', function(e) {
            // Don't trigger row click when clicking delete button
            if (e.target.closest('.delete-prospect')) return;
            
            toggleProspectDetails(prospect.id);
        });
        
        prospectsTable.appendChild(tr);
        
        // Create and append the details row
        const detailsRow = document.createElement('tr');
        detailsRow.setAttribute('data-details-for', prospect.id);
        detailsRow.classList.add('prospect-details-row');
        
        const detailsCell = document.createElement('td');
        detailsCell.setAttribute('colspan', '9');
        detailsCell.innerHTML = `
            <div class="prospect-details" id="details-${prospect.id}">
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
        `;
        
        detailsRow.appendChild(detailsCell);
        prospectsTable.appendChild(detailsRow);
        
        // Show details if this is the selected prospect
        if (prospect.id === selectedProspectId) {
            document.getElementById(`details-${prospect.id}`).classList.add('visible');
        }
        
        // Add delete button event listener
        const deleteButton = tr.querySelector('.delete-prospect');
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop event propagation
            handleDeleteProspect(e);
        });
    });
    
    // Add event listeners to detail buttons
    document.querySelectorAll('.add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.getAttribute('data-id');
            document.getElementById(`add-field-form-${prospectId}`).style.display = 'flex';
        });
    });
    
    document.querySelectorAll('.cancel-add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.closest('.add-field-form').id.replace('add-field-form-', '');
            document.getElementById(`add-field-form-${prospectId}`).style.display = 'none';
        });
    });
    
    document.querySelectorAll('.confirm-add-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.getAttribute('data-id');
            const fieldName = btn.closest('.add-field-form').querySelector('.field-name-input').value.trim();
            
            if (fieldName) {
                addCustomField(prospectId, fieldName);
            }
        });
    });
    
    document.querySelectorAll('.save-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.getAttribute('data-id');
            saveProspectDetails(prospectId);
        });
    });
    
    document.querySelectorAll('.remove-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const prospectId = btn.closest('.prospect-details').id.replace('details-', '');
            const fieldKey = btn.getAttribute('data-field-key');
            
            removeCustomField(prospectId, fieldKey);
        });
    });
    
    document.querySelectorAll('.field-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionId = toggle.getAttribute('data-section');
            toggle.classList.toggle('open');
            document.getElementById(sectionId).classList.toggle('open');
        });
    });
}

// Render the detail sections for a prospect
function renderDetailSections(prospect) {
    // Initialize details object if not exists
    if (!prospect.details) {
        prospect.details = {};
        
        // Initialize default fields
        defaultDetailFields.forEach(field => {
            prospect.details[field.key] = '';
        });
    }
    
    // If customFields array doesn't exist, create it
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
    const sectionId = `section-${key}-${Date.now()}`;
    
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

// Toggle prospect details
function toggleProspectDetails(prospectId) {
    const detailsElement = document.getElementById(`details-${prospectId}`);
    
    // If it's already visible, hide it and deselect
    if (detailsElement.classList.contains('visible')) {
        detailsElement.classList.remove('visible');
        document.querySelector(`tr[data-id="${prospectId}"]`).classList.remove('selected');
        selectedProspectId = null;
    } else {
        // Hide any other open details
        document.querySelectorAll('.prospect-details.visible').forEach(el => {
            el.classList.remove('visible');
        });
        
        document.querySelectorAll('.prospect-row.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Show this detail
        detailsElement.classList.add('visible');
        document.querySelector(`tr[data-id="${prospectId}"]`).classList.add('selected');
        selectedProspectId = prospectId;
    }
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

// Save prospect details from the form
function saveProspectDetails(prospectId) {
    // Find the prospect
    const prospect = prospectsList.find(p => p.id === prospectId);
    if (!prospect) return;
    
    // Initialize details object if not exists
    if (!prospect.details) {
        prospect.details = {};
    }
    
    // Get all textarea values
    const detailsElement = document.getElementById(`details-${prospectId}`);
    detailsElement.querySelectorAll('.prospect-detail-textarea').forEach(textarea => {
        const fieldKey = textarea.getAttribute('data-field-key');
        prospect.details[fieldKey] = textarea.value;
    });
    
    // Save to Firestore
    saveProspects();
    showSaveIndicator();
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
