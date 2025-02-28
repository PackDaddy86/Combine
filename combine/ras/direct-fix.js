// This is a standalone solution that directly fixes the grades issue
(function() {
    // Run when DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM loaded, adding grade fix listener");
        // Add mutation observer to detect when score elements are updated
        setupMutationObserver();
        // Also add a fix button
        addFixButton();
    });

    // Add a direct fix button
    function addFixButton() {
        const button = document.createElement('button');
        button.textContent = "FIX GRADES NOW";
        button.style.position = "fixed";
        button.style.bottom = "20px";
        button.style.right = "20px";
        button.style.zIndex = "10000";
        button.style.padding = "10px 15px";
        button.style.backgroundColor = "#ff5500";
        button.style.color = "white";
        button.style.fontWeight = "bold";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0 3px 5px rgba(0,0,0,0.2)";
        
        // Direct fix when button is clicked
        button.addEventListener('click', function() {
            applyDirectFix();
            button.textContent = "GRADES FIXED!";
            setTimeout(() => {
                button.textContent = "FIX GRADES NOW";
            }, 2000);
        });
        
        document.body.appendChild(button);
        console.log("Fix button added");
    }

    // Set up mutation observer to detect when scores change
    function setupMutationObserver() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Check if the mutation is related to a score element
                if (mutation.target && mutation.target.id && mutation.target.id.includes('-score')) {
                    console.log(`Score element changed: ${mutation.target.id}`);
                    // Apply fix to this specific element
                    applyFixToElement(mutation.target.id);
                }
            });
        });

        // Observe all metric-score elements
        const scoreElements = document.querySelectorAll('.metric-score');
        scoreElements.forEach(function(element) {
            observer.observe(element, { 
                attributes: true, 
                childList: true, 
                characterData: true,
                subtree: true
            });
        });

        console.log("Mutation observer set up for score elements");
    }

    // Get grade text and color based on score
    function getGradeInfo(score) {
        let gradeText, bgColor, textColor;
        
        if (score < 4) {
            gradeText = "POOR";
            bgColor = "#ff6b6b";
            textColor = "white";
        } else if (score < 5) {
            gradeText = "BELOW AVERAGE";
            bgColor = "#ffa06b";
            textColor = "white";
        } else if (score < 7) {
            gradeText = "AVERAGE";
            bgColor = "#ffc56b";
            textColor = "black";
        } else if (score < 9) {
            gradeText = "GOOD";
            bgColor = "#6bd46b";
            textColor = "white";
        } else {
            gradeText = "EXCELLENT";
            bgColor = "#53c2f0";
            textColor = "white";
        }
        
        return { gradeText, bgColor, textColor };
    }

    // Apply fix to a specific element
    function applyFixToElement(elementId) {
        const scoreElement = document.getElementById(elementId);
        if (!scoreElement) {
            console.error(`Element not found: ${elementId}`);
            return;
        }

        const scoreText = scoreElement.textContent;
        if (scoreText === "--" || scoreText === "") {
            console.log(`No score for ${elementId}`);
            return;
        }

        const score = parseFloat(scoreText);
        if (isNaN(score)) {
            console.error(`Invalid score for ${elementId}: ${scoreText}`);
            return;
        }

        console.log(`Fixing grade for ${elementId} with score ${score}`);
        
        // Get appropriate grade styling
        const { gradeText, bgColor, textColor } = getGradeInfo(score);
        
        // Apply styles directly to the score element
        scoreElement.style.cssText = `
            background-color: ${bgColor} !important; 
            color: ${textColor} !important;
            font-weight: bold !important;
            padding: 3px !important;
            border-radius: 3px !important;
            display: block !important;
            text-align: center !important;
            width: auto !important; 
            margin: 2px auto !important;
        `;
        
        // Now create or update a grade label beneath the score
        const labelId = elementId.replace("-score", "-grade");
        let labelElement = document.getElementById(labelId);
        
        if (!labelElement) {
            // Create new label
            labelElement = document.createElement("div");
            labelElement.id = labelId;
            labelElement.className = "direct-grade-label";
            
            // Insert after score element
            if (scoreElement.parentNode) {
                scoreElement.parentNode.insertBefore(labelElement, scoreElement.nextSibling);
            }
        }
        
        // Apply styles and text to the label
        labelElement.textContent = gradeText;
        labelElement.style.cssText = `
            background-color: ${bgColor} !important; 
            color: ${textColor} !important;
            font-size: 0.75em !important;
            font-weight: bold !important;
            text-align: center !important;
            padding: 2px 4px !important;
            margin: 1px auto !important;
            margin-top: 2px !important;
            border-radius: 3px !important;
            display: block !important;
            max-width: 80% !important;
        `;
        
        console.log(`Applied ${gradeText} grade style to ${elementId}`);
    }

    // Apply fix to all metric scores
    function applyDirectFix() {
        console.log("Applying direct fix to all metrics");
        
        const metricIds = [
            'forty-score',
            'twenty-score',
            'ten-score',
            'vertical-score',
            'broad-score',
            'bench-score',
            'shuttle-score',
            'cone-score'
        ];
        
        metricIds.forEach(function(id) {
            applyFixToElement(id);
        });
        
        console.log("Direct fix applied to all metrics");
    }

    // Also run the fix when window is fully loaded
    window.addEventListener('load', function() {
        console.log("Window loaded, applying direct fix");
        // Wait a bit to ensure all other scripts have completed
        setTimeout(applyDirectFix, 1000);
    });
})();
