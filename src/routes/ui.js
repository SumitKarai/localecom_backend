const express = require('express');
const router = express.Router();

// Test UI for Google Auth
router.get('/auth-test', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperLocal Auth Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px;
            background-color: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        .btn:hover {
            background-color: #3367d6;
        }
        .btn-success {
            background-color: #34a853;
        }
        .btn-success:hover {
            background-color: #2d8f47;
        }
        .btn-warning {
            background-color: #fbbc04;
            color: #333;
        }
        .btn-warning:hover {
            background-color: #f9ab00;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h3 {
            margin-top: 0;
            color: #555;
        }
        .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 14px;
            overflow-x: auto;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HyperLocal Ecommerce - Auth Test</h1>
        
        <div class="section">
            <h3>📋 System Status</h3>
            <button class="btn btn-warning" onclick="checkStatus()">Check System Status</button>
            <div id="status-result"></div>
        </div>

        <div class="section">
            <h3>🔐 Google OAuth Test</h3>
            <p>Test Google authentication with different methods:</p>
            
            <a href="/api/auth/google" class="btn">
                🔗 Test Passport Google Auth
            </a>
            
            <a href="/api/auth/google-direct" class="btn btn-success">
                🚀 Test Direct Google Auth
            </a>
            
            <button class="btn btn-warning" onclick="getGoogleUrl()">
                📋 Get Google Auth URL
            </button>
            
            <div id="google-url-result"></div>
        </div>

        <div class="section">
            <h3>🧪 Debug Routes</h3>
            <a href="/api/auth/test" class="btn" target="_blank">Test Basic Route</a>
            <a href="/api/auth/env-check" class="btn" target="_blank">Check Environment</a>
            <a href="/api/auth/google-test" class="btn" target="_blank">Check Passport</a>
        </div>

        <div class="section">
            <h3>📝 Instructions</h3>
            <ol>
                <li><strong>Check System Status</strong> - Verify all components are working</li>
                <li><strong>Test Direct Google Auth</strong> - Bypass Passport, test Google directly</li>
                <li><strong>Test Passport Google Auth</strong> - Full authentication flow</li>
                <li><strong>Check server console</strong> for detailed logs</li>
            </ol>
        </div>
    </div>

    <script>
        async function checkStatus() {
            const resultDiv = document.getElementById('status-result');
            resultDiv.innerHTML = '<div class="status">Checking...</div>';
            
            try {
                const response = await fetch('/api/auth/google-test');
                const data = await response.json();
                
                let html = '<div class="status success">✅ System Status</div>';
                html += '<div class="code-block">' + JSON.stringify(data, null, 2) + '</div>';
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
            }
        }

        async function getGoogleUrl() {
            const resultDiv = document.getElementById('google-url-result');
            resultDiv.innerHTML = '<div class="status">Getting URL...</div>';
            
            try {
                const response = await fetch('/api/auth/google-url');
                const data = await response.json();
                
                let html = '<div class="status success">✅ Google OAuth URL Generated</div>';
                html += '<div class="code-block">';
                html += '<strong>URL:</strong><br>';
                html += '<a href="' + data.url + '" target="_blank" class="btn" style="margin: 10px 0; word-break: break-all;">';
                html += '🔗 Click to Test Google Auth';
                html += '</a><br><br>';
                html += '<strong>Details:</strong><br>';
                html += JSON.stringify(data, null, 2);
                html += '</div>';
                
                resultDiv.innerHTML = html;
            } catch (error) {
                resultDiv.innerHTML = '<div class="status error">❌ Error: ' + error.message + '</div>';
            }
        }

        // Auto-check status on page load
        window.onload = function() {
            checkStatus();
        };
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

module.exports = router;