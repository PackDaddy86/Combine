// EMERGENCY FIX FOR RAS METRICS
// This script completely bypasses all other code and applies styles directly

// Execute immediately when loaded
(function() {
  console.log("EMERGENCY FIX SCRIPT LOADED");
  
  // Run immediately and also on load
  fixAllMetrics();
  
  // Also run when the window loads
  window.addEventListener('load', function() {
    console.log("Window loaded, running emergency fix");
    setTimeout(fixAllMetrics, 500); // Small delay to ensure DOM is ready
  });
  
  // Add a button that will directly fix all metrics
  function addFixButton() {
    // Remove any existing button first
    const existingBtn = document.getElementById('emergency-fix-btn');
    if (existingBtn) existingBtn.remove();
    
    // Create new button
    const btn = document.createElement('button');
    btn.id = 'emergency-fix-btn';
    btn.innerText = 'EMERGENCY FIX ALL GRADES';
    btn.style.position = 'fixed';
    btn.style.bottom = '50px';
    btn.style.right = '50px';
    btn.style.zIndex = '99999';
    btn.style.backgroundColor = 'red';
    btn.style.color = 'white';
    btn.style.fontWeight = 'bold';
    btn.style.padding = '15px';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    
    // Add click handler
    btn.addEventListener('click', function() {
      fixAllMetrics();
      btn.innerText = 'FIXED! CLICK AGAIN IF NEEDED';
      setTimeout(() => {
        btn.innerText = 'EMERGENCY FIX ALL GRADES';
      }, 3000);
    });
    
    // Add to document
    document.body.appendChild(btn);
  }
  
  // Function to directly apply styles to a metric
  function applyMetricStyle(elementId, score) {
    // Get the element
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Cannot find element: ${elementId}`);
      return;
    }
    
    console.log(`Applying style to ${elementId} with score ${score}`);
    
    // Set background color based on score
    let bgColor, textColor;
    if (score < 4) {
      bgColor = '#ff6b6b';
      textColor = 'white';
    } else if (score < 5) {
      bgColor = '#ffa06b';
      textColor = 'white';
    } else if (score < 7) {
      bgColor = '#ffc56b';
      textColor = 'black';
    } else if (score < 9) {
      bgColor = '#6bd46b';
      textColor = 'white';
    } else {
      bgColor = '#53c2f0';
      textColor = 'white';
    }
    
    // Apply directly to the element's style
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    element.style.padding = '3px';
    element.style.borderRadius = '3px';
    element.style.fontWeight = 'bold';
    element.style.display = 'block';
    element.style.textAlign = 'center';
    
    // Force a style recalculation
    void element.offsetWidth;
    
    console.log(`Style applied to ${elementId}: bgColor=${bgColor}, textColor=${textColor}`);
  }
  
  // Fix all metrics
  function fixAllMetrics() {
    console.log("RUNNING EMERGENCY FIX FOR ALL METRICS");
    
    // Define all the metric IDs and their value IDs
    const metrics = [
      {scoreId: 'forty-score', valueId: 'forty-value'},
      {scoreId: 'vertical-score', valueId: 'vertical-value'},
      {scoreId: 'bench-score', valueId: 'bench-value'},
      {scoreId: 'broad-score', valueId: 'broad-value'},
      {scoreId: 'shuttle-score', valueId: 'shuttle-value'},
      {scoreId: 'cone-score', valueId: 'cone-value'},
      {scoreId: 'twenty-score', valueId: 'twenty-value'},
      {scoreId: 'ten-score', valueId: 'ten-value'}
    ];
    
    // Process each metric
    metrics.forEach(function(metric) {
      try {
        // Get the score element
        const scoreEl = document.getElementById(metric.scoreId);
        if (!scoreEl) {
          console.error(`Score element not found: ${metric.scoreId}`);
          return;
        }
        
        // Get the score value
        const scoreText = scoreEl.textContent;
        if (scoreText === '--' || !scoreText) {
          console.log(`No score for ${metric.scoreId}`);
          return;
        }
        
        // Parse the score
        const score = parseFloat(scoreText);
        if (isNaN(score)) {
          console.error(`Invalid score for ${metric.scoreId}: ${scoreText}`);
          return;
        }
        
        // Apply style directly
        applyMetricStyle(metric.scoreId, score);
        
      } catch (error) {
        console.error(`Error processing ${metric.scoreId}:`, error);
      }
    });
    
    console.log("EMERGENCY FIX COMPLETED");
    
    // Add fix button after everything else
    setTimeout(addFixButton, 1000);
  }
  
  // Hotfix for score calculation
  function hotfixScoreCalculation() {
    console.log("Applying hotfix for score calculation");
    
    // 40-Yard Dash - We know this works, so we'll use it as a reference
    const fortyValueEl = document.getElementById('forty-value');
    const fortyScoreEl = document.getElementById('forty-score');
    
    if (!fortyValueEl || !fortyScoreEl) {
      console.error("Couldn't find forty elements");
      return;
    }
    
    // Get the calculation logic from 40-yard dash (which works)
    const fortyTime = parseFloat(fortyValueEl.textContent);
    let fortyScore;
    
    if (fortyTime <= 4.2) fortyScore = 10;
    else if (fortyTime <= 4.3) fortyScore = 9;
    else if (fortyTime <= 4.4) fortyScore = 8;
    else if (fortyTime <= 4.5) fortyScore = 7;
    else if (fortyTime <= 4.6) fortyScore = 6;
    else if (fortyTime <= 4.7) fortyScore = 5;
    else if (fortyTime <= 4.8) fortyScore = 3;
    else if (fortyTime <= 4.9) fortyScore = 1;
    else fortyScore = 0;
    
    console.log(`Reference: 40yd ${fortyTime}s = score ${fortyScore}`);
    
    // Now apply the same logic to other metrics
    
    // Vertical Jump
    const verticalEl = document.getElementById('vertical-value');
    const verticalScoreEl = document.getElementById('vertical-score');
    
    if (verticalEl && verticalScoreEl) {
      const verticalHeight = parseFloat(verticalEl.textContent);
      let verticalScore;
      
      if (!isNaN(verticalHeight)) {
        if (verticalHeight >= 42) verticalScore = 10;
        else if (verticalHeight >= 40) verticalScore = 9;
        else if (verticalHeight >= 38) verticalScore = 8;
        else if (verticalHeight >= 36) verticalScore = 7;
        else if (verticalHeight >= 34) verticalScore = 6;
        else if (verticalHeight >= 32) verticalScore = 5;
        else if (verticalHeight >= 30) verticalScore = 4;
        else if (verticalHeight >= 28) verticalScore = 3;
        else if (verticalHeight >= 26) verticalScore = 2;
        else if (verticalHeight >= 24) verticalScore = 1;
        else verticalScore = 0;
        
        verticalScoreEl.textContent = verticalScore.toFixed(2);
        console.log(`Vertical ${verticalHeight}in = score ${verticalScore}`);
        applyMetricStyle('vertical-score', verticalScore);
      }
    }
    
    // Bench Press
    const benchEl = document.getElementById('bench-value');
    const benchScoreEl = document.getElementById('bench-score');
    
    if (benchEl && benchScoreEl) {
      const benchReps = parseFloat(benchEl.textContent);
      let benchScore;
      
      if (!isNaN(benchReps)) {
        if (benchReps >= 36) benchScore = 10;
        else if (benchReps >= 33) benchScore = 9;
        else if (benchReps >= 30) benchScore = 8;
        else if (benchReps >= 27) benchScore = 7;
        else if (benchReps >= 24) benchScore = 6;
        else if (benchReps >= 21) benchScore = 5;
        else if (benchReps >= 18) benchScore = 4;
        else if (benchReps >= 15) benchScore = 3;
        else if (benchReps >= 12) benchScore = 2;
        else if (benchReps >= 9) benchScore = 1;
        else benchScore = 0;
        
        benchScoreEl.textContent = benchScore.toFixed(2);
        console.log(`Bench ${benchReps} reps = score ${benchScore}`);
        applyMetricStyle('bench-score', benchScore);
      }
    }
    
    // Broad Jump
    const broadEl = document.getElementById('broad-value');
    const broadScoreEl = document.getElementById('broad-score');
    
    if (broadEl && broadScoreEl) {
      let broadInches;
      const broadValue = broadEl.textContent;
      
      // Handle different formats (inches vs feet'inches")
      if (broadValue.includes("'")) {
        // Format like 9'2"
        const parts = broadValue.split("'");
        const feet = parseInt(parts[0]);
        let inches = 0;
        if (parts[1]) {
          inches = parseInt(parts[1].replace('"', ''));
        }
        broadInches = (feet * 12) + inches;
      } else {
        broadInches = parseFloat(broadValue);
      }
      
      let broadScore;
      if (!isNaN(broadInches)) {
        if (broadInches >= 132) broadScore = 10;      // 11'0"
        else if (broadInches >= 126) broadScore = 9;  // 10'6"
        else if (broadInches >= 120) broadScore = 8;  // 10'0"
        else if (broadInches >= 114) broadScore = 7;  // 9'6"
        else if (broadInches >= 108) broadScore = 6;  // 9'0"
        else if (broadInches >= 102) broadScore = 5;  // 8'6"
        else if (broadInches >= 96) broadScore = 4;   // 8'0"
        else if (broadInches >= 90) broadScore = 3;   // 7'6"
        else if (broadInches >= 84) broadScore = 2;   // 7'0"
        else if (broadInches >= 78) broadScore = 1;   // 6'6"
        else broadScore = 0;
        
        broadScoreEl.textContent = broadScore.toFixed(2);
        console.log(`Broad ${broadValue} (${broadInches}in) = score ${broadScore}`);
        applyMetricStyle('broad-score', broadScore);
      }
    }
    
    // Shuttle Run
    const shuttleEl = document.getElementById('shuttle-value');
    const shuttleScoreEl = document.getElementById('shuttle-score');
    
    if (shuttleEl && shuttleScoreEl) {
      const shuttleTime = parseFloat(shuttleEl.textContent);
      let shuttleScore;
      
      if (!isNaN(shuttleTime)) {
        if (shuttleTime <= 3.9) shuttleScore = 10;
        else if (shuttleTime <= 4.0) shuttleScore = 9;
        else if (shuttleTime <= 4.1) shuttleScore = 8;
        else if (shuttleTime <= 4.2) shuttleScore = 7;
        else if (shuttleTime <= 4.3) shuttleScore = 6;
        else if (shuttleTime <= 4.4) shuttleScore = 5;
        else if (shuttleTime <= 4.5) shuttleScore = 4;
        else if (shuttleTime <= 4.6) shuttleScore = 3;
        else if (shuttleTime <= 4.7) shuttleScore = 2;
        else if (shuttleTime <= 4.8) shuttleScore = 1;
        else shuttleScore = 0;
        
        shuttleScoreEl.textContent = shuttleScore.toFixed(2);
        console.log(`Shuttle ${shuttleTime}s = score ${shuttleScore}`);
        applyMetricStyle('shuttle-score', shuttleScore);
      }
    }
    
    // 3-Cone
    const coneEl = document.getElementById('cone-value');
    const coneScoreEl = document.getElementById('cone-score');
    
    if (coneEl && coneScoreEl) {
      const coneTime = parseFloat(coneEl.textContent);
      let coneScore;
      
      if (!isNaN(coneTime)) {
        if (coneTime <= 6.5) coneScore = 10;
        else if (coneTime <= 6.7) coneScore = 9;
        else if (coneTime <= 6.9) coneScore = 8;
        else if (coneTime <= 7.1) coneScore = 7;
        else if (coneTime <= 7.3) coneScore = 6;
        else if (coneTime <= 7.5) coneScore = 5;
        else if (coneTime <= 7.7) coneScore = 4;
        else if (coneTime <= 7.9) coneScore = 3;
        else if (coneTime <= 8.1) coneScore = 2;
        else if (coneTime <= 8.3) coneScore = 1;
        else coneScore = 0;
        
        coneScoreEl.textContent = coneScore.toFixed(2);
        console.log(`3-Cone ${coneTime}s = score ${coneScore}`);
        applyMetricStyle('cone-score', coneScore);
      }
    }
    
    console.log("Hotfix for score calculation complete");
  }
  
  // Run the hotfix for score calculation
  setTimeout(hotfixScoreCalculation, 1500);
})();
