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
  } else {
    console.log('User logged out');
    // User is signed out, show login form
    showLoginForm();
  }
});

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
  
  // Load user data from Firestore
  loadUserData(user.uid);
}

// Load user data from Firestore
function loadUserData(userId) {
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        console.log("User data:", userData);
        
        // Populate localStorage with user data for games that need it
        if (userData.games) {
          if (userData.games.combine) {
            localStorage.setItem('combineResults', JSON.stringify(userData.games.combine));
          }
          
          if (userData.games.playerInfo) {
            localStorage.setItem('playerInfo', JSON.stringify(userData.games.playerInfo));
          }
        }
      } else {
        console.log("No user data found");
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
    console.log("No user logged in, data saved to localStorage only");
    return;
  }
  
  const userRef = db.collection('users').doc(user.uid);
  
  // Use a transaction to update nested data
  return db.runTransaction(transaction => {
    return transaction.get(userRef).then(doc => {
      if (!doc.exists) {
        // Create user document if it doesn't exist
        transaction.set(userRef, {
          email: user.email,
          createdAt: new Date(),
          games: {
            [gameType]: data
          }
        });
      } else {
        // Update existing document
        const userData = doc.data();
        const games = userData.games || {};
        games[gameType] = data;
        
        transaction.update(userRef, { games: games });
      }
    });
  }).then(() => {
    console.log(`Data for ${gameType} saved to Firestore`);
  }).catch(error => {
    console.error("Error saving data:", error);
  });
}
