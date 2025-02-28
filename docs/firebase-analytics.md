# Firebase Analytics Integration Guide

This document provides an overview of how Firebase Analytics has been integrated into the Combine website, as well as how to use the analytics system to track user behavior and app usage.

## Setup Overview

Firebase Analytics has been integrated into all pages that use Firebase. The setup consists of:

1. **Firebase Analytics Script** - Added to all HTML files that use Firebase
2. **firebase-analytics.js** - Utility file with pre-configured tracking events
3. **analytics-installer.js** - Node.js script to add analytics to all pages (already run)

## Available Analytics Features

The following events are automatically tracked:

- **Page Views** - Every page visit is tracked with page path and title
- **Authentication Events** - User logins, signups, and authentication method
- **Navigation** - User clicks on navigation links and buttons
- **Game Events** - Game starts and completions with scores

## Viewing Analytics Data

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project "combine-95a3a"
3. Click on "Analytics" in the left sidebar
4. You can view:
   - Dashboard overview
   - Realtime user activity
   - User engagement metrics
   - Custom events
   - User properties

## Custom Event Tracking

You can track custom events in your JavaScript code using:

```javascript
// Simple event tracking
window.firebaseAnalytics.logEvent('event_name', { 
  parameter1: 'value1',
  parameter2: 'value2'
});

// Game completion tracking
window.firebaseAnalytics.logGameCompletion('game_type', score);

// Set user properties
window.firebaseAnalytics.setUserProperties({
  favorite_game: 'bench_press',
  user_level: 'advanced'
});
```

## Available Custom Events

The following custom events are already implemented:

1. **game_start** - When a user starts a game
2. **game_completion** - When a user completes a game
3. **navigation_click** - When a user clicks a navigation link
4. **login** - When a user logs in
5. **sign_up** - When a user signs up

## Advanced Google Analytics Integration

Firebase Analytics is built on Google Analytics 4. For more advanced analytics needs:

1. Go to Firebase Console > Analytics > Dashboard
2. Click "View in Google Analytics" button
3. This gives you access to more advanced reporting, audience segmentation, and custom funnels

## Debugging Analytics

To verify analytics events are being sent correctly:

1. Open browser developer tools (F12)
2. Check the console for "Analytics:" log messages
3. In Google Chrome, you can install the "Google Analytics Debugger" extension for more detailed event logging

## Adding Analytics to New Pages

If you create new pages, you can either:

1. Manually add the Firebase Analytics script tags, or
2. Run the analytics-installer.js script again:

```
node assets/js/analytics-installer.js
```

## Best Practices

1. Use consistent event names (snake_case)
2. Keep parameter values simple and consistent
3. Don't include personally identifiable information in analytics events
4. Focus on tracking meaningful user actions rather than everything

## Support

If you need help with Firebase Analytics, refer to:
- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
