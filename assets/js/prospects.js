// NFL Draft Prospects Grading Page JavaScript

// DOM Elements
let prospectForm;
let prospectsTable;
let prospectsList = [];
let dragStartIndex;
let loadingOverlay;
let saveIndicator;

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

// Load prospects ONLY from Firestore, no localStorage fallback
function loadProspectsFromFirestoreOnly() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.error('Firebase not available');
        showErrorMessage('Firebase not available');
        return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user logged in');
        showLoginMessage();
        return;
    }
    
    console.log(`Loading prospects from Firestore for user ${user.uid}`);
    const db = firebase.firestore();
    
    // Get user document from Firestore
    db.collection('users').doc(user.uid).get()
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

// Save prospects ONLY to Firestore
function saveProspectsToFirestoreOnly() {
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.error('Firebase not available');
        return Promise.reject(new Error('Firebase not available'));
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user logged in, cannot save prospects');
        return Promise.reject(new Error('No user logged in'));
    }
    
    console.log(`Saving prospects to Firestore for user ${user.uid}`);
    const db = firebase.firestore();
    
    return db.collection('users').doc(user.uid).update({
        'draftProspects': prospectsList,
        lastUpdate: new Date()
    }).catch(error => {
        // If update fails (document might not exist), create it
        if (error.code === 'not-found') {
            console.log('Document not found, creating new document');
            return db.collection('users').doc(user.uid).set({
                'draftProspects': prospectsList,
                lastUpdate: new Date(),
                email: user.email,
                username: user.displayName || `User${Math.floor(Math.random() * 10000)}`
            });
        }
        return Promise.reject(error);
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

// Add event listeners
function setupEventListeners() {
    if (prospectForm) {
        prospectForm.addEventListener('submit', handleProspectSubmit);
    }
    
    // Export button
    const exportBtn = document.getElementById('export-board-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBigBoard);
    }
    
    // Clear button
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
    
    // Clear existing table rows
    prospectsTable.innerHTML = '';
    
    // Check if we have prospects
    if (prospectsList.length === 0) {
        document.getElementById('no-prospects').style.display = 'block';
        document.getElementById('prospects-table').style.display = 'none';
        return;
    }
    
    // Show table, hide empty message
    document.getElementById('no-prospects').style.display = 'none';
    document.getElementById('prospects-table').style.display = 'table';
    
    // Sort by grade (if available)
    prospectsList.sort((a, b) => {
        // Sort by the numeric value of grade (higher grade first)
        return parseFloat(b.grade || 0) - parseFloat(a.grade || 0);
    });
    
    // Add each prospect to the table
    prospectsList.forEach((prospect, index) => {
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.setAttribute('data-index', index);
        tr.setAttribute('data-id', prospect.id);
        
        // Add dragstart and dragover event listeners
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragleave', handleDragLeave);
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${prospect.name}</td>
            <td>${prospect.position}</td>
            <td>${prospect.college}</td>
            <td>${prospect.height}</td>
            <td>${prospect.weight}</td>
            <td>${prospect.grade || '-'}</td>
            <td>
                <div class="prospect-actions">
                    <button class="prospect-action-btn edit-prospect-btn" data-id="${prospect.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="prospect-action-btn delete-prospect-btn" data-id="${prospect.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        prospectsTable.appendChild(tr);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-prospect-btn').forEach(btn => {
        btn.addEventListener('click', handleEditProspect);
    });
    
    document.querySelectorAll('.delete-prospect-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteProspect);
    });
}

// Handle dragging functionality for reordering prospects
function handleDragStart(e) {
    dragStartIndex = +this.closest('tr').getAttribute('data-index');
    this.classList.add('prospect-dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    this.classList.add('prospect-drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('prospect-drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const dragEndIndex = +this.getAttribute('data-index');
    swapProspects(dragStartIndex, dragEndIndex);
    this.classList.remove('prospect-drag-over');
}

// Swap prospects in the array and update order
function swapProspects(fromIndex, toIndex) {
    // Get prospect to move
    const prospectToMove = prospectsList[fromIndex];
    
    // Remove from original position
    prospectsList.splice(fromIndex, 1);
    
    // Insert at new position
    prospectsList.splice(toIndex, 0, prospectToMove);
    
    // Save and render
    saveProspects();
    renderProspects();
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
        alert('No prospects to export!');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Rank,Name,Position,College,Height,Weight,Grade,Notes\n';
    
    prospectsList.forEach((prospect, index) => {
        const row = [
            index + 1,
            prospect.name,
            prospect.position,
            prospect.college,
            prospect.height,
            prospect.weight,
            prospect.grade,
            prospect.notes
        ].map(value => `"${value || ''}"`).join(',');
        
        csvContent += row + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'draft_prospects.csv');
    a.click();
}

// Clear the big board
function clearBigBoard() {
    if (confirm('Are you sure you want to clear all prospects? This cannot be undone.')) {
        prospectsList = [];
        saveProspects();
        renderProspects();
    }
}
