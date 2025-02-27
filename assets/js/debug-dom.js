// Debug script to identify elements in the DOM
document.addEventListener('DOMContentLoaded', function() {
    // Wait for everything to be loaded
    setTimeout(function() {
        console.log('Inspecting DOM structure...');
        
        // Check for elements with 'user-nav' class
        const userNavs = document.querySelectorAll('.user-nav');
        console.log('Found user-nav elements:', userNavs.length);
        userNavs.forEach((el, i) => {
            console.log(`user-nav ${i}:`, el.outerHTML);
        });
        
        // Check for logout buttons
        const logoutButtons = document.querySelectorAll('#logout-button');
        console.log('Found logout buttons:', logoutButtons.length);
        logoutButtons.forEach((el, i) => {
            console.log(`logout button ${i}:`, el.outerHTML);
        });
        
        // Check auth link status
        const authLink = document.getElementById('auth-link');
        if (authLink) {
            console.log('Auth link found:', authLink.outerHTML);
        } else {
            console.log('Auth link not found');
        }
        
        // Check for welcome text anywhere in the DOM
        const allElements = document.querySelectorAll('*');
        const welcomeElements = [];
        
        allElements.forEach(el => {
            if (el.textContent && el.textContent.toLowerCase().includes('welcome') && 
                !el.tagName.toLowerCase().match(/^(html|head|script|style)$/)) {
                if (el.textContent.trim().length < 100) { // Avoid large text blocks
                    welcomeElements.push(el);
                }
            }
        });
        
        console.log('Found elements with "welcome" text:', welcomeElements.length);
        welcomeElements.forEach((el, i) => {
            console.log(`Welcome element ${i}:`, el.outerHTML);
        });
    }, 1000); // Wait 1 second for everything to load
});
