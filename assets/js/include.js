// Function to load and include HTML partials
async function includeHTML(elementId, filePath) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        // Use path helper if available
        if (typeof getResourcePath === 'function') {
            filePath = getResourcePath(filePath);
        }
        
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const content = await response.text();
        element.innerHTML = content;
        
        // Execute any scripts that were in the included HTML
        const scripts = element.querySelectorAll('script');
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
        
        // Also run navigation script if it exists
        if (typeof initNavigation === 'function') {
            initNavigation();
        }
    } catch (error) {
        console.error('Error including HTML:', error);
        console.error('Failed to fetch:', filePath);
    }
}

// Initialize includes when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Include header - use consistent path that works in all environments
    includeHTML('header-include', 'assets/includes/header.html');
});
