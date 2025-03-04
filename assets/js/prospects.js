// NFL Draft Prospects Grading Page JavaScript

// DOM Elements
let prospectForm;
let prospectsTable;
let prospectsList = [];
let dragStartIndex;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase auth listener
    initFirebaseAuthListener();
    
    // Initialize prospect form and table
    prospectForm = document.getElementById('prospect-form');
    prospectsTable = document.getElementById('prospects-table-body');
    
    // Load existing prospects from localStorage or Firestore
    loadProspects();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize Firebase auth listener if not in firebase-config.js
function initFirebaseAuthListener() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // Firebase is available, set up listener for user changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('Auth state change: User logged in');
                // Load user's prospects from Firestore
                loadProspects();
            } else {
                console.log('Auth state change: User logged out');
                // Just use localStorage when logged out
                loadProspects();
            }
        });
    }
}

// Load prospects from Firestore or localStorage
function loadProspects() {
    // Use the new loadProspectsFromFirestore function from user-data.js
    if (typeof loadProspectsFromFirestore === 'function') {
        loadProspectsFromFirestore().then(prospects => {
            if (prospects && prospects.length > 0) {
                prospectsList = prospects;
                renderProspects();
            } else {
                // If no prospects in Firestore, check localStorage as fallback
                const savedProspects = localStorage.getItem('draftProspects');
                if (savedProspects) {
                    prospectsList = JSON.parse(savedProspects);
                    renderProspects();
                    
                    // Save to Firestore if user is logged in
                    if (typeof firebase !== 'undefined' && firebase.auth) {
                        const user = firebase.auth().currentUser;
                        if (user && typeof saveProspectsToFirestore === 'function') {
                            saveProspectsToFirestore(prospectsList);
                        }
                    }
                } else {
                    // No prospects found anywhere
                    prospectsList = [];
                    renderProspects();
                }
            }
        }).catch(error => {
            console.error('Error loading prospects:', error);
            
            // Fall back to localStorage
            const savedProspects = localStorage.getItem('draftProspects');
            if (savedProspects) {
                prospectsList = JSON.parse(savedProspects);
                renderProspects();
            }
        });
    } else {
        // If the Firestore function isn't available, use localStorage
        const savedProspects = localStorage.getItem('draftProspects');
        if (savedProspects) {
            prospectsList = JSON.parse(savedProspects);
            renderProspects();
        }
    }
}

// Save prospects using the new Firestore function
function saveProspects() {
    // Use the new saveProspectsToFirestore function
    if (typeof saveProspectsToFirestore === 'function') {
        saveProspectsToFirestore(prospectsList).catch(error => {
            console.error('Error saving prospects to Firestore:', error);
        });
    } else {
        // Fall back to localStorage only
        localStorage.setItem('draftProspects', JSON.stringify(prospectsList));
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
    
    // Reset form
    prospectForm.reset();
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

// Handle deleting a prospect
function handleDeleteProspect(e, shouldRender = true) {
    const prospectId = e.currentTarget.getAttribute('data-id');
    
    // Remove from array
    prospectsList = prospectsList.filter(p => p.id !== prospectId);
    
    // Save and render if needed
    saveProspects();
    if (shouldRender) {
        renderProspects();
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
