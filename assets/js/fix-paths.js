// This script fixes paths based on the current environment (local file system vs server)
document.addEventListener('DOMContentLoaded', function() {
    // Detect if we're running on a local file system
    const isLocal = window.location.protocol === 'file:';
    
    if (isLocal) {
        console.log('Running on local file system, fixing paths...');
        
        // Fix header include path
        const pathToRoot = determinePathToRoot();
        
        // Function to determine the relative path to root from current location
        function determinePathToRoot() {
            const pathParts = window.location.pathname.split('/');
            const depth = pathParts.length;
            
            // If we're in root directory or in the index.html
            if (depth <= 2 || window.location.pathname.endsWith('index.html')) {
                return './';
            }
            
            // If we're one level deep (e.g., /combine/)
            if (depth === 3) {
                return '../';
            }
            
            // If we're two levels deep (e.g., /combine/40yard/)
            if (depth >= 4) {
                return '../../';
            }
            
            return './';
        }
        
        // Fix includes
        const headerInclude = document.getElementById('header-include');
        if (headerInclude) {
            fetch(pathToRoot + 'assets/includes/header.html')
                .then(response => response.text())
                .then(html => {
                    headerInclude.innerHTML = html;
                    console.log('Header loaded successfully');
                })
                .catch(error => {
                    console.error('Error loading header:', error);
                });
        }
    }
});
