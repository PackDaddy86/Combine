// Firebase Analytics Installer
// This script automatically adds the needed Firebase Analytics scripts to pages
// Run it with: node analytics-installer.js

const fs = require('fs');
const path = require('path');

// Base directory for the project
const baseDir = path.resolve(__dirname, '../../');

// Analytics script URL
const analyticsScriptUrl = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js';
// Our custom analytics utility
const analyticsUtilityPath = '/assets/js/firebase-analytics.js';

// Function to find all HTML files in a directory (recursive)
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            fileList = findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to add Firebase Analytics scripts to an HTML file if needed
function addAnalyticsToFile(filePath) {
    try {
        console.log(`Processing: ${filePath}`);
        
        // Read the file content
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if Firebase is already being used in this file
        if (!content.includes('firebase')) {
            console.log(`  Skipping: Firebase not used in ${filePath}`);
            return;
        }
        
        // Check if analytics is already added
        if (content.includes('firebase-analytics') || content.includes(analyticsUtilityPath)) {
            console.log(`  Skipping: Analytics already added to ${filePath}`);
            return;
        }
        
        // Get the Firebase SDK scripts in this file
        const firebaseRegex = /<script src="[^"]*firebase[^"]*\.js"><\/script>/g;
        const firebaseScripts = content.match(firebaseRegex) || [];
        
        if (firebaseScripts.length === 0) {
            console.log(`  Warning: Firebase scripts not found in standard format in ${filePath}`);
            return;
        }
        
        // Get the relative path to assets
        let relativePath = path.relative(path.dirname(filePath), path.join(baseDir, 'assets')).replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }
        
        // If we're already at root level, use /assets
        if (filePath.indexOf('\\combine\\') === -1) {
            relativePath = '/assets';
        }
        
        // Add the analytics script after the last Firebase script
        const lastScript = firebaseScripts[firebaseScripts.length - 1];
        const analyticsScript = `<script src="${analyticsScriptUrl}"></script>\n    <script src="${relativePath}/js/firebase-analytics.js"></script>`;
        
        content = content.replace(lastScript, `${lastScript}\n    ${analyticsScript}`);
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Success: Added analytics scripts to ${filePath}`);
    } catch (error) {
        console.error(`  Error processing ${filePath}:`, error);
    }
}

// Main function to process all HTML files
function main() {
    console.log('Starting Firebase Analytics installation...');
    
    // Find all HTML files
    const htmlFiles = findHtmlFiles(baseDir);
    console.log(`Found ${htmlFiles.length} HTML files`);
    
    // Process each file
    htmlFiles.forEach(filePath => {
        addAnalyticsToFile(filePath);
    });
    
    console.log('Firebase Analytics installation complete!');
}

// Run the script
main();
