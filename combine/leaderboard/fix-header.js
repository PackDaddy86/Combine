// Fix header inclusion for leaderboard page
document.addEventListener('DOMContentLoaded', function() {
    const headerInclude = document.getElementById('header-include');
    if (headerInclude) {
        // Fetch the header HTML directly
        fetch('../../assets/includes/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(content => {
                headerInclude.innerHTML = content;
                
                // Execute any scripts that were in the included HTML
                const scripts = headerInclude.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    
                    // Copy attributes
                    Array.from(script.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    // Copy content
                    newScript.textContent = script.textContent;
                    
                    // Replace old script with new one
                    script.parentNode.replaceChild(newScript, script);
                });
                
                // Set up navigation if available
                if (typeof initNavigation === 'function') {
                    setTimeout(initNavigation, 100);
                }
            })
            .catch(error => {
                console.error('Error loading header:', error);
            });
    }
});
