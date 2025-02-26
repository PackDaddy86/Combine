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
            const accountLink = document.getElementById('account-link');
            
            if (accountLink) {
                if (user) {
                    // User is signed in
                    accountLink.textContent = 'My Account';
                    accountLink.href = '/history.html';
                    
                    // Update the login button in user-status if it exists
                    const loginButton = document.querySelector('.login-button');
                    if (loginButton) {
                        loginButton.textContent = 'Logout';
                        loginButton.href = '#';
                        loginButton.addEventListener('click', (e) => {
                            e.preventDefault();
                            firebase.auth().signOut().then(() => {
                                window.location.reload();
                            });
                        });
                    }
                } else {
                    // User is signed out
                    accountLink.textContent = 'Log In';
                    accountLink.href = '/login.html';
                }
            }
        });
    }
}

// Run navigation when document is loaded
document.addEventListener('DOMContentLoaded', initNavigation);
