const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Fix MIME type issues by explicitly setting correct content types for different file types
app.use((req, res, next) => {
  const url = req.url;
  
  // Strip any query parameters
  const cleanUrl = url.split('?')[0];
  
  if (cleanUrl.endsWith('.css')) {
    res.type('text/css');
  } else if (cleanUrl.endsWith('.js')) {
    res.type('application/javascript');
  } else if (cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) {
    res.type('image/' + cleanUrl.split('.').pop());
  } else if (cleanUrl.endsWith('.html')) {
    res.type('text/html');
  }
  
  next();
});

// Handle all HTML page requests to common pages regardless of path
app.get('*/login.html', (req, res) => {
  console.log('Serving login.html');
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('*/register.html', (req, res) => {
  console.log('Serving register.html');
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('*/index.html', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*/prospects.html', (req, res) => {
  console.log('Serving prospects.html');
  res.sendFile(path.join(__dirname, 'prospects.html'));
});

app.get('*/rankings.html', (req, res) => {
  console.log('Serving rankings.html');
  res.sendFile(path.join(__dirname, 'rankings.html'));
});

app.get('*/combine.html', (req, res) => {
  console.log('Serving combine.html');
  res.sendFile(path.join(__dirname, 'combine.html'));
});

// Special handling for JS file requests that might come from the proxy
app.get('*/assets/js/:file', (req, res) => {
  const jsFile = req.params.file;
  const filePath = path.join(__dirname, 'assets', 'js', jsFile);
  
  console.log(`Serving JS file from any path: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.type('application/javascript');
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log(`JS file not found: ${filePath}`);
    res.status(404).send('JS file not found');
  }
});

// Special handling for CSS file requests that might come from the proxy
app.get('*/assets/css/:file', (req, res) => {
  const cssFile = req.params.file;
  const filePath = path.join(__dirname, 'assets', 'css', cssFile);
  
  console.log(`Serving CSS file from any path: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.type('text/css');
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log(`CSS file not found: ${filePath}`);
    res.status(404).send('CSS file not found');
  }
});

// Special handling for image file requests
app.get('*/assets/images/:file', (req, res) => {
  const imageFile = req.params.file;
  const filePath = path.join(__dirname, 'assets', 'images', imageFile);
  
  console.log(`Serving image file: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    // Auto-determine content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') res.type('image/png');
    else if (ext === '.jpg' || ext === '.jpeg') res.type('image/jpeg');
    else if (ext === '.gif') res.type('image/gif');
    
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log(`Image file not found: ${filePath}`);
    res.status(404).send('Image file not found');
  }
});

// Handle includes that might come from the proxy
app.get('*/assets/includes/:file', (req, res) => {
  const includeFile = req.params.file;
  const filePath = path.join(__dirname, 'assets', 'includes', includeFile);
  
  console.log(`Serving include file: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.type('text/html');
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.log(`Include file not found: ${filePath}`);
    res.status(404).send('Include file not found');
  }
});

// Serve static files with proper MIME types
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
  }
}));

// Default route for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'prospects.html'));
});

// Catch-all handler for any unhandled routes
app.use((req, res) => {
  console.log(`404 for route: ${req.url}`);
  res.status(404).send(`
    <html>
      <head>
        <title>Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #444; }
          .links { margin-top: 30px; }
          .links a { margin: 0 10px; color: #0066cc; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>Page Not Found</h1>
        <p>The requested URL ${req.url} was not found on this server.</p>
        <div class="links">
          <a href="/">Home</a>
          <a href="/prospects.html">Prospects</a>
          <a href="/login.html">Login</a>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Handling all page requests with absolute paths to fix navigation`);
  console.log(`Open this URL in your browser: http://localhost:${port}/prospects.html`);
});
