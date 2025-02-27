// Path Helper Script
// This script helps handle path differences between local development and server environments

// Function to determine if we're running on a local file system
function isLocalFileSystem() {
    return window.location.protocol === 'file:';
}

// Function to get the correct base path depending on environment
function getBasePath() {
    if (isLocalFileSystem()) {
        // For local file system, determine relative path based on current directory depth
        const pathSegments = window.location.pathname.split('/');
        const depth = pathSegments.length - 1;
        
        // If we're in the root directory
        if (depth <= 1 || window.location.pathname.indexOf('CascadeProjects/Combine') !== -1) {
            return './';
        }
        
        // If we're one level deep (e.g., /combine/)
        if (depth === 2) {
            return '../';
        }
        
        // If we're two levels deep (e.g., /combine/40yard/)
        if (depth >= 3) {
            return '../../';
        }
    }
    
    // For server environment, use absolute paths
    return '/';
}

// Use this function to get the correct path to any resource
function getResourcePath(resourcePath) {
    // Remove leading slash if present
    if (resourcePath.startsWith('/')) {
        resourcePath = resourcePath.substring(1);
    }
    
    return getBasePath() + resourcePath;
}
