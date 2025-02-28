// Direct fix for RAS card grades
(function() {
    console.log("Running direct fix for RAS card grades");
    
    // Wait for the page to fully load
    window.addEventListener('load', function() {
        // Give time for other scripts to finish
        setTimeout(fixGrades, 1000);
    });
    
    // Function to fix all grades directly
    function fixGrades() {
        console.log("Applying grade fixes to all metrics");
        
        // Define all metrics to process
        const metrics = [
            { id: 'forty-score', name: '40-yard dash' },
            { id: 'vertical-score', name: 'Vertical jump' },
            { id: 'broad-score', name: 'Broad jump' },
            { id: 'bench-score', name: 'Bench press' },
            { id: 'shuttle-score', name: 'Shuttle run' },
            { id: 'cone-score', name: 'Cone drill' },
            { id: 'twenty-score', name: '20-yard split' },
            { id: 'ten-score', name: '10-yard split' }
        ];
        
        // Process each metric
        metrics.forEach(function(metric) {
            const scoreElement = document.getElementById(metric.id);
            
            if (!scoreElement) {
                console.error(`Could not find score element for ${metric.name} (${metric.id})`);
                return;
            }
            
            // Get the current score value
            const scoreText = scoreElement.textContent;
            if (scoreText === "--" || scoreText === "") {
                console.log(`${metric.name} has no score value`);
                return;
            }
            
            const score = parseFloat(scoreText);
            if (isNaN(score)) {
                console.error(`Invalid score for ${metric.name}: ${scoreText}`);
                return;
            }
            
            console.log(`Processing ${metric.name} with score ${score}`);
            
            // Apply direct styling based on score value
            let bgColor, textColor, gradeText;
            
            if (score < 4) {
                bgColor = "#ff6b6b";
                textColor = "white";
                gradeText = "POOR";
            } else if (score < 5) {
                bgColor = "#ffa06b";
                textColor = "white";
                gradeText = "BELOW AVERAGE";
            } else if (score < 7) {
                bgColor = "#ffc56b";
                textColor = "black";
                gradeText = "AVERAGE";
            } else if (score < 9) {
                bgColor = "#6bd46b";
                textColor = "white";
                gradeText = "GOOD";
            } else {
                bgColor = "#53c2f0";
                textColor = "white";
                gradeText = "EXCELLENT";
            }
            
            // Apply direct styles to ensure they override any CSS
            scoreElement.style.cssText = `
                background-color: ${bgColor} !important; 
                color: ${textColor} !important;
                padding: 3px !important;
                border-radius: 3px !important;
                font-weight: bold !important;
                display: block !important;
                text-align: center !important;
                margin: 2px auto !important;
            `;
            
            // Create or update grade label
            let labelId = metric.id.replace('-score', '-grade-label');
            let labelElement = document.getElementById(labelId);
            
            if (!labelElement) {
                // Create a new label element
                labelElement = document.createElement('div');
                labelElement.id = labelId;
                labelElement.className = 'grade-label';
                
                // Insert after the score element
                if (scoreElement.parentNode) {
                    scoreElement.parentNode.insertBefore(labelElement, scoreElement.nextSibling);
                }
            }
            
            // Style and set content for the label
            labelElement.textContent = gradeText;
            labelElement.style.cssText = `
                background-color: ${bgColor} !important;
                color: ${textColor} !important;
                font-size: 0.8em !important;
                font-weight: bold !important;
                text-align: center !important;
                padding: 2px 4px !important;
                margin: 2px auto !important;
                border-radius: 3px !important;
                display: block !important;
                max-width: 90% !important;
            `;
            
            console.log(`Applied styles to ${metric.name}: ${gradeText}`);
        });
        
        console.log("All grades fixed successfully");
    }
    
    // Add a button to manually trigger the fix
    function addFixButton() {
        const button = document.createElement('button');
        button.textContent = "Fix Grades";
        button.style.position = "fixed";
        button.style.bottom = "10px";
        button.style.right = "10px";
        button.style.zIndex = "9999";
        button.style.padding = "8px";
        button.style.backgroundColor = "#333";
        button.style.color = "#fff";
        button.style.border = "none";
        button.style.borderRadius = "4px";
        button.style.cursor = "pointer";
        
        button.addEventListener('click', fixGrades);
        document.body.appendChild(button);
    }
    
    // Add the fix button after a delay
    setTimeout(addFixButton, 2000);
})();
