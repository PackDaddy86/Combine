// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuvUZW5AT_rZ7UQ5cP3_aA4_eXfH98vdM",
  authDomain: "combine-95a3a.firebaseapp.com",
  projectId: "combine-95a3a",
  storageBucket: "combine-95a3a.firebasestorage.app",
  messagingSenderId: "1008415583189",
  appId: "1:1008415583189:web:82adec40af114c27196b5c",
  measurementId: "G-Q3SKW2D7HP"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Initialize Analytics if available
if (typeof firebase.analytics === 'function') {
  const analytics = firebase.analytics();
  console.log('Firebase Analytics initialized with measurement ID:', firebaseConfig.measurementId);
  
  // Enable analytics debugging in console if in development environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    analytics.setAnalyticsCollectionEnabled(true);
    console.log('Analytics debug mode enabled for development');
  }
}

// Remove any existing user-nav elements that might be showing 
function removeExistingUserNav() {
  const userNavs = document.querySelectorAll('.user-nav');
  if (userNavs.length > 0) {
    console.log('Found existing user-nav elements, removing them');
    userNavs.forEach(nav => nav.remove());
  }
}

// Check authentication state
auth.onAuthStateChanged(user => {
  // Always remove any existing user-nav elements first
  removeExistingUserNav();
  
  if (user) {
    console.log('User logged in:', user.email);
    
    // Clear localStorage when logging in to prevent data leakage between accounts
    clearLocalStorageData();
    
    // Load this user's specific data
    loadUserData(user.uid);
    
    // Update auth link in the header instead of adding a redundant welcome message
    updateAuthLink(user);
  } else {
    console.log('User logged out');
    // User is signed out, show login form
    showLoginForm();
    
    // Clear localStorage when logging out
    clearLocalStorageData();
    
    // Update auth link in the header
    updateAuthLink(null);
  }
});

// Clear localStorage data to prevent sharing between accounts
function clearLocalStorageData() {
  // List of keys to clear (game-specific data)
  const keysToRemove = [
    'combineResults',
    'rasResults',
    'fortyYardDash',
    'verticalJump',
    'benchPress',
    'broadJump',
    'coneDrill',
    'shuttleRun'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('Cleared localStorage to prevent data sharing between accounts');
}

// Show login form or sign up option
function showLoginForm() {
  // Check if we're on the login page already
  if (window.location.pathname.includes('login.html')) return;
  
  // Check if the user auth overlay already exists
  if (document.getElementById('user-auth-overlay')) return;
  
  // Create login form overlay
  const overlay = document.createElement('div');
  overlay.id = 'user-auth-overlay';
  overlay.innerHTML = `
    <div class="auth-container">
      <h2>NFL Combine Training</h2>
      <div class="auth-tabs">
        <button class="tab-button active" data-tab="login">Login</button>
        <button class="tab-button" data-tab="signup">Sign Up</button>
      </div>
      
      <div class="tab-content" id="login-tab">
        <form id="login-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" required>
          </div>
          <button type="submit" class="auth-button">Login</button>
        </form>
      </div>
      
      <div class="tab-content" id="signup-tab" style="display:none">
        <form id="signup-form">
          <div class="form-group">
            <label for="signup-email">Email</label>
            <input type="email" id="signup-email" required>
          </div>
          <div class="form-group">
            <label for="signup-password">Password</label>
            <input type="password" id="signup-password" required>
          </div>
          <button type="submit" class="auth-button">Sign Up</button>
        </form>
      </div>
    </div>
  `;
  
  // Add overlay to document
  document.body.appendChild(overlay);
  
  // Set up tab switching
  const tabButtons = overlay.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Toggle active class on tab buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Show/hide tab content
      overlay.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
      });
      overlay.querySelector(`#${tabName}-tab`).style.display = 'block';
    });
  });
  
  // Handle login form submission
  const loginForm = overlay.querySelector('#login-form');
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        // Remove the overlay on successful login
        document.getElementById('user-auth-overlay').remove();
      })
      .catch(error => {
        alert('Login error: ' + error.message);
      });
  });
  
  // Handle signup form submission
  const signupForm = overlay.querySelector('#signup-form');
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        // Remove the overlay on successful sign up
        document.getElementById('user-auth-overlay').remove();
      })
      .catch(error => {
        alert('Sign up error: ' + error.message);
      });
  });
  
  // Close overlay when clicking outside the auth container
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      this.remove();
    }
  });
}

// Update the auth link in the header based on authentication state
function updateAuthLink(user) {
  const authLink = document.getElementById('auth-link');
  if (!authLink) return;
  
  if (user) {
    // User is signed in
    authLink.textContent = 'Logout';
    authLink.href = '#';
    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      auth.signOut().then(() => {
        console.log('User signed out');
        window.location.href = '/index.html';
      }).catch((error) => {
        console.error('Sign out error:', error);
      });
    });
  } else {
    // User is signed out
    authLink.textContent = 'Login / Sign Up';
    
    // Remove any existing click listeners
    const newAuthLink = authLink.cloneNode(true);
    authLink.parentNode.replaceChild(newAuthLink, authLink);
  }
}

// Load user data from Firestore
function loadUserData(userId) {
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        console.log("User data loaded:", userData);
        
        // Populate localStorage with user data for games that need it
        if (userData.games) {
          if (userData.games.combine) {
            localStorage.setItem('combineResults', JSON.stringify(userData.games.combine));
            
            // Set individual combine event values
            const combineData = userData.games.combine;
            if (combineData.fortyYardDash) localStorage.setItem('fortyYardDash', combineData.fortyYardDash);
            if (combineData.verticalJump) localStorage.setItem('verticalJump', combineData.verticalJump);
            if (combineData.benchPress) localStorage.setItem('benchPress', combineData.benchPress);
            if (combineData.broadJump) localStorage.setItem('broadJump', combineData.broadJump);
            if (combineData.coneDrill) localStorage.setItem('coneDrill', combineData.coneDrill);
            if (combineData.shuttleRun) localStorage.setItem('shuttleRun', combineData.shuttleRun);
            
            // Update UI if available
            if (typeof updateResultsAndButtons === 'function') {
              try {
                updateResultsAndButtons();
              } catch (e) {
                console.log("Could not update combine UI:", e);
              }
            }
          }
          
          if (userData.games.rasResults) {
            localStorage.setItem('rasResults', JSON.stringify(userData.games.rasResults));
            
            // Update RAS UI if we're on that page
            if (window.location.pathname.includes('/ras/')) {
              if (typeof updateSavedResultsList === 'function') {
                try {
                  updateSavedResultsList();
                } catch (e) {
                  console.log("Could not update RAS UI:", e);
                }
              }
            }
          }
          
          if (userData.games.playerInfo) {
            localStorage.setItem('playerInfo', JSON.stringify(userData.games.playerInfo));
          }
        }
      } else {
        console.log("No user data found - new user");
      }
    })
    .catch(error => {
      console.error("Error loading user data:", error);
    });
}

// Save user data to Firestore
function saveUserData(gameType, data) {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user logged in, data NOT saved to Firestore");
    return;
  }
  
  console.log(`Saving data for ${gameType} to Firestore for user ${user.uid}`, data);
  
  const userRef = db.collection('users').doc(user.uid);
  
  // First, check if the document exists and has the correct structure
  return userRef.get().then(doc => {
    if (doc.exists) {
      // Document exists, update it with the proper games structure
      console.log("User document exists, updating games data");
      
      // Get current data
      const userData = doc.data();
      // Create games object if it doesn't exist
      const games = userData.games || {};
      // Update the specific game type
      games[gameType] = data;
      
      // Ensure username is set
      let updateData = { games: games };
      
      // If username is missing, add it
      if (!userData.username && user.displayName) {
        updateData.username = user.displayName;
        console.log(`Adding missing username (${user.displayName}) to existing document`);
      } else if (!userData.username) {
        // Generate a fallback username
        const fallbackUsername = `User${Math.floor(Math.random() * 10000)}`;
        updateData.username = fallbackUsername;
        console.log(`Adding generated username (${fallbackUsername}) to existing document`);
        
        // Also update the Auth displayName
        user.updateProfile({
          displayName: fallbackUsername
        }).catch(err => {
          console.error("Error updating Auth displayName:", err);
        });
      }
      
      // Update the document with the new data
      return userRef.update(updateData)
        .then(() => {
          console.log(`Data for ${gameType} saved to Firestore successfully`);
        })
        .catch(error => {
          console.error("Error updating games data:", error);
        });
    } else {
      // Document doesn't exist, create it with proper structure
      console.log("User document not found, creating new document");
      
      // Get or generate username
      let username = user.displayName;
      if (!username) {
        username = `User${Math.floor(Math.random() * 10000)}`;
        console.log(`Generated fallback username: ${username}`);
        
        // Update Auth profile with the username
        user.updateProfile({
          displayName: username
        }).catch(err => {
          console.error("Error updating Auth displayName:", err);
        });
      }
      
      const newUserData = {
        email: user.email,
        username: username,
        createdAt: new Date(),
        games: {
          [gameType]: data
        }
      };
      
      return userRef.set(newUserData)
        .then(() => {
          console.log(`Created new user document and saved ${gameType} data`);
        })
        .catch(error => {
          console.error("Error creating user document:", error);
        });
    }
  })
  .catch(error => {
    console.error("Error accessing user document:", error);
  });
}

// Make sure we clean up any existing user-nav elements when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  removeExistingUserNav();
  
  // Also set up a periodic check for the first few seconds to catch any delayed insertions
  let checkCount = 0;
  const maxChecks = 5;
  const checkInterval = setInterval(function() {
    removeExistingUserNav();
    checkCount++;
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
    }
  }, 1000);
});
