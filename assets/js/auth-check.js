// Auth check script - Redirects users who are not logged in
// This should be included in all pages that require authentication

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a combine page that requires auth
    const isProtectedPage = window.location.pathname.includes('/combine/');
    
    // Skip the check if we're on the login page to avoid redirect loops
    const isLoginPage = window.location.pathname.includes('/login.html');
    
    if (isProtectedPage && !isLoginPage) {
        console.log('Protected page detected, checking authentication...');
        
        // Check if Firebase is loaded
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function(user) {
                if (!user) {
                    console.log('User not authenticated, redirecting to login page');
                    
                    // Save the current URL to redirect back after login
                    localStorage.setItem('authRedirectUrl', window.location.href);
                    
                    // Redirect to login page
                    window.location.href = '/login.html';
                } else {
                    console.log('User authenticated, allowing access to protected page');
                }
            });
        } else {
            console.error('Firebase Auth not available, cannot check authentication');
        }
    }
});
