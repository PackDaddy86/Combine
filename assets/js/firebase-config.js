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

// Check authentication state
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user.email);
    // User is signed in, show user-specific content
    showUserContent(user);
    
    // Clear localStorage when logging in to prevent data leakage between accounts
    clearLocalStorageData();
    
    // Load this user's specific data
    loadUserData(user.uid);
  } else {
    console.log('User logged out');
    // User is signed out, show login form
    showLoginForm();
    
    // Clear localStorage when logging out
    clearLocalStorageData();
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
          <div class="form-group">
            <label for="signup-confirm">Confirm Password</label>
            <input type="password" id="signup-confirm" required>
          </div>
          <button type="submit" class="auth-button">Sign Up</button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  // Add event listeners
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      // Toggle active class
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      
      // Show corresponding tab
      const tabId = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
      document.getElementById(`${tabId}-tab`).style.display = 'block';
    });
  });
  
  // Login form submission
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        // Hide the overlay after successful login
        overlay.remove();
      })
      .catch(error => {
        alert(`Login error: ${error.message}`);
      });
  });
  
  // Sign up form submission
  document.getElementById('signup-form').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (password !== confirm) {
      alert("Passwords don't match");
      return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        // Create a user profile in Firestore
        return db.collection('users').doc(userCredential.user.uid).set({
          email: email,
          createdAt: new Date(),
          games: {}
        });
      })
      .then(() => {
        // Hide the overlay after successful signup
        overlay.remove();
      })
      .catch(error => {
        alert(`Sign up error: ${error.message}`);
      });
  });
}

// Show user-specific content
function showUserContent(user) {
  // Add user info and logout button to page
  const userNav = document.createElement('div');
  userNav.className = 'user-nav';
  userNav.innerHTML = `
    <span>Welcome, ${user.email}</span>
    <button id="logout-button">Logout</button>
  `;
  
  // Check if element already exists
  if (!document.querySelector('.user-nav')) {
    document.querySelector('header').appendChild(userNav);
  }
  
  // Add logout functionality
  document.getElementById('logout-button').addEventListener('click', () => {
    auth.signOut();
  });
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
      
      // Update the document with the new games object
      return userRef.update({ games: games })
        .then(() => {
          console.log(`Data for ${gameType} saved to Firestore successfully`);
        })
        .catch(error => {
          console.error("Error updating games data:", error);
        });
    } else {
      // Document doesn't exist, create it with proper structure
      console.log("User document not found, creating new document");
      const newUserData = {
        email: user.email,
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

// Save combine event data directly (bypass the saveUserData function)
function saveEventDirectly(eventType, value) {
  console.log(`🔵 Direct Save: Attempting to save ${eventType} with value ${value}`);
  
  const user = auth.currentUser;
  if (!user) {
    console.log("🔵 Direct Save: No user logged in, data NOT saved to Firestore");
    return;
  }
  
  console.log(`🔵 Direct Save: Saving ${eventType} for user ${user.uid}`);
  
  const userRef = db.collection('users').doc(user.uid);
  
  // Get the document first
  userRef.get().then(doc => {
    if (doc.exists) {
      console.log("🔵 Direct Save: User document exists, updating");
      
      // Get current data
      const userData = doc.data();
      // Create games object if it doesn't exist
      const games = userData.games || {};
      // Create combine object if it doesn't exist
      const combine = games.combine || {};
      
      // Update specific event
      combine[eventType] = value;
      games.combine = combine;
      
      console.log("🔵 Direct Save: Updated data structure:", { games });
      
      // Update document
      userRef.update({ games: games })
        .then(() => {
          console.log(`🔵 Direct Save: ${eventType} saved successfully!`);
        })
        .catch(error => {
          console.error("🔵 Direct Save: Error updating:", error);
        });
    } else {
      console.log("🔵 Direct Save: User document doesn't exist, creating new one");
      
      // Create new document with proper structure
      const newData = {
        email: user.email,
        createdAt: new Date(),
        games: {
          combine: {
            [eventType]: value
          }
        }
      };
      
      console.log("🔵 Direct Save: New data structure:", newData);
      
      // Save document
      userRef.set(newData)
        .then(() => {
          console.log(`🔵 Direct Save: ${eventType} saved successfully in new document!`);
        })
        .catch(error => {
          console.error("🔵 Direct Save: Error creating document:", error);
        });
    }
  }).catch(error => {
    console.error("🔵 Direct Save: Error accessing document:", error);
  });
}
