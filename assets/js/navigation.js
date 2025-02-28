// Navigation functionality
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }
    
    // Set active navigation item based on current page
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-links a');
    
    navItems.forEach(item => {
        // Get the href attribute
        const itemPath = item.getAttribute('href');
        
        // Remove leading slash if it exists for comparison
        const normalizedItemPath = itemPath.replace(/^\//, '');
        const normalizedCurrentPath = currentPath.replace(/^\//, '');
        
        // Check if the current URL contains the menu item's URL
        if (normalizedCurrentPath === normalizedItemPath || 
            (normalizedItemPath !== 'index.html' && normalizedCurrentPath.includes(normalizedItemPath))) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update account link based on authentication state
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const authLink = document.getElementById('auth-link');
            const profileLink = document.getElementById('profile-link');
            
            if (authLink) {
                if (user) {
                    // User is signed in
                    authLink.textContent = 'Logout';
                    authLink.href = '#';
                    authLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        firebase.auth().signOut().then(() => {
                            console.log('User signed out');
                            window.location.href = '/index.html';
                        }).catch((error) => {
                            console.error('Sign out error:', error);
                        });
                    });
                    
                    // Show profile link when user is signed in
                    if (profileLink) {
                        profileLink.style.display = 'block';
                    }
                } else {
                    // User is not signed in
                    authLink.textContent = 'Login / Sign Up';
                    authLink.href = '/login.html';
                    
                    // Remove any previous click listeners by cloning the node
                    const newAuthLink = authLink.cloneNode(true);
                    authLink.parentNode.replaceChild(newAuthLink, authLink);
                    
                    // Hide profile link when user is not signed in
                    if (profileLink) {
                        profileLink.style.display = 'none';
                    }
                }
            }
        });
    }
}

// Run navigation when document is loaded
document.addEventListener('DOMContentLoaded', initNavigation);
