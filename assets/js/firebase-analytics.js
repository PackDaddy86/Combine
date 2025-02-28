// Firebase Analytics Helper Functions

// Initialize analytics events for common user actions
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase Analytics utilities loaded');
    initializeAnalyticsEvents();
});

// Initialize analytics event listeners
function initializeAnalyticsEvents() {
    if (typeof firebase === 'undefined' || typeof firebase.analytics !== 'function') {
        console.log('Firebase Analytics not available');
        return;
    }
    
    const analytics = firebase.analytics();
    
    // Track page views
    logPageView();

    // Track login events
    trackAuthEvents();
    
    // Track navigation
    trackNavigation();
    
    // Track game starts and completions
    trackGameEvents();
    
    console.log('Firebase Analytics event tracking initialized');
}

// Log current page view
function logPageView() {
    if (typeof firebase === 'undefined' || typeof firebase.analytics !== 'function') return;
    
    const analytics = firebase.analytics();
    const pagePath = window.location.pathname;
    const pageTitle = document.title;
    
    analytics.logEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
    });
    
    console.log('Analytics: Logged page view for', pagePath);
}

// Track authentication events
function trackAuthEvents() {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    
    // Listen for login button clicks
    const loginButtons = document.querySelectorAll('.login-btn, .signup-btn, [data-action="login"], [data-action="signup"]');
    loginButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const action = e.target.classList.contains('signup-btn') || 
                          e.target.getAttribute('data-action') === 'signup' ? 
                          'sign_up_attempt' : 'login_attempt';
            
            if (typeof firebase.analytics === 'function') {
                firebase.analytics().logEvent(action);
                console.log('Analytics: Logged', action);
            }
        });
    });
    
    // Track successful login/signup
    firebase.auth().onAuthStateChanged(user => {
        if (user && typeof firebase.analytics === 'function') {
            // Don't log every page load for existing users, only new logins
            // We do this by checking if the user was just created or if this is a new session
            const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
            
            if (isNewUser) {
                firebase.analytics().logEvent('sign_up', {
                    method: user.providerData[0].providerId
                });
                console.log('Analytics: Logged new user signup');
            } else {
                firebase.analytics().logEvent('login', {
                    method: user.providerData[0].providerId
                });
                console.log('Analytics: Logged user login');
            }
        }
    });
}

// Track navigation across the site
function trackNavigation() {
    // Track clicks on navigation links
    const navLinks = document.querySelectorAll('nav a, .navigation a, .action-button');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (typeof firebase === 'undefined' || typeof firebase.analytics !== 'function') return;
            
            const linkText = e.target.textContent.trim();
            const linkHref = e.target.getAttribute('href');
            
            firebase.analytics().logEvent('navigation_click', {
                link_text: linkText,
                link_url: linkHref
            });
            
            console.log('Analytics: Tracked navigation to', linkHref);
        });
    });
}

// Track game-related events
function trackGameEvents() {
    if (typeof firebase === 'undefined' || typeof firebase.analytics !== 'function') return;
    
    // Track game starts
    const startGameButtons = document.querySelectorAll('.start-game, [data-action="start-game"]');
    startGameButtons.forEach(button => {
        button.addEventListener('click', function() {
            const gameType = getGameType();
            if (gameType) {
                firebase.analytics().logEvent('game_start', { game_type: gameType });
                console.log('Analytics: Logged game start for', gameType);
            }
        });
    });
    
    // We'll need to handle game completions in the specific game scripts
}

// Helper to determine which game we're currently on
function getGameType() {
    const path = window.location.pathname.toLowerCase();
    
    if (path.includes('/forty/')) return 'forty_yard_dash';
    if (path.includes('/vertical/')) return 'vertical_jump';
    if (path.includes('/broad/')) return 'broad_jump';
    if (path.includes('/bench/')) return 'bench_press';
    if (path.includes('/cone/')) return 'cone_drill';
    if (path.includes('/shuttle/')) return 'shuttle_run';
    if (path.includes('/ras/')) return 'ras_calculator';
    
    return null;
}

// Public API for other scripts to use
window.firebaseAnalytics = {
    logEvent: function(eventName, params) {
        if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
            firebase.analytics().logEvent(eventName, params);
            console.log('Analytics: Logged custom event', eventName, params);
        }
    },
    
    logGameCompletion: function(gameType, score) {
        if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
            firebase.analytics().logEvent('game_completion', { 
                game_type: gameType,
                score: score
            });
            console.log('Analytics: Logged game completion for', gameType, 'with score', score);
        }
    },
    
    setUserProperties: function(properties) {
        if (typeof firebase !== 'undefined' && typeof firebase.analytics === 'function') {
            for (const [key, value] of Object.entries(properties)) {
                firebase.analytics().setUserProperty(key, value);
            }
            console.log('Analytics: Set user properties', properties);
        }
    }
};
