# PowerShell Setup Script for OmniDimension Integration
# Run this in PowerShell as Administrator

Write-Host "🚀 Lakshmi Trading Platform - OmniDimension Integration Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Check if Python is installed
function Test-Python {
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
        return $false
    }
}

# Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>&1
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
        return $false
    }
}

# Create and activate Python virtual environment
function Setup-VirtualEnv {
    Write-Host "🐍 Setting up Python virtual environment..." -ForegroundColor Yellow
    
    # Check if virtual environment already exists
    if (Test-Path ".venv") {
        Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
    } else {
        try {
            python -m venv .venv
            Write-Host "✅ Virtual environment created successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
            return $false
        }
    }
    
    # Activate virtual environment
    try {
        & ".\.venv\Scripts\Activate.ps1"
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
        return $false
    }
}

# Install Python dependencies in virtual environment
function Install-PythonDeps {
    Write-Host "📦 Installing Python dependencies in virtual environment..." -ForegroundColor Yellow
    
    # Create requirements.txt if it doesn't exist
    if (!(Test-Path "requirements.txt")) {
        $requirements = "requests==2.31.0`npython-dotenv==1.0.0`nomnidimension[mcp]==1.0.0`nflask==2.3.3`nflask-cors==4.0.0"
        $requirements | Out-File -FilePath "requirements.txt" -Encoding UTF8
    }
    
    try {
        # Make sure we're using the virtual environment's Python
        & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
        
        # Install dependencies using virtual environment's pip
        & ".\.venv\Scripts\pip.exe" install -r requirements.txt
        Write-Host "✅ Python dependencies installed successfully in virtual environment" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to install Python dependencies in virtual environment" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Install ngrok
function Install-Ngrok {
    Write-Host "🌐 Setting up ngrok..." -ForegroundColor Yellow
    
    # Check if ngrok is already installed
    try {
        $ngrokVersion = ngrok version 2>&1
        Write-Host "✅ ngrok already installed: $ngrokVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "📥 Installing ngrok via npm..." -ForegroundColor Yellow
        try {
            npm install -g ngrok
            Write-Host "✅ ngrok installed successfully" -ForegroundColor Green
            return $true
        }
        catch {
            Write-Host "❌ Failed to install ngrok. Please install manually from https://ngrok.com/download" -ForegroundColor Red
            return $false
        }
    }
}

# Check environment variables
function Test-EnvVars {
    Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow
    
    if (!(Test-Path ".env.local")) {
        Write-Host "❌ .env.local file not found" -ForegroundColor Red
        return $false
    }
    
    $envContent = Get-Content ".env.local" -Raw
    
    $hasOmniKey = $envContent -match "OMNIDIM_API_KEY=(?!your_omnidimension_api_key_here)"
    $hasNgrokUrl = $envContent -match "NGROK_URL=(?!https://your-ngrok-url.ngrok.io)"
    
    if (!$hasOmniKey) {
        Write-Host "❌ OMNIDIM_API_KEY not configured in .env.local" -ForegroundColor Red
    }
    
    if (!$hasNgrokUrl) {
        Write-Host "⚠️  NGROK_URL not configured in .env.local (will be set after ngrok starts)" -ForegroundColor Yellow
    }
    
    return $hasOmniKey
}

# Start Next.js development server
function Start-NextJSServer {
    Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Yellow
    
    # Check if package.json exists
    if (!(Test-Path "package.json")) {
        Write-Host "❌ package.json not found. Make sure you're in the project directory." -ForegroundColor Red
        return $false
    }
    
    # Install npm dependencies if node_modules doesn't exist
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Start the server in background
    Write-Host "▶️  Starting server on http://localhost:3000..." -ForegroundColor Green
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
    
    # Wait a moment for server to start
    Start-Sleep -Seconds 5
    
    # Test if server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ Next.js server is running successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to start Next.js server" -ForegroundColor Red
        return $false
    }
}

# Start ngrok
function Start-Ngrok {
    Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Yellow
    
    # Start ngrok in background
    Start-Process -NoNewWindow -FilePath "ngrok" -ArgumentList "http", "3000"
    
    # Wait for ngrok to start
    Start-Sleep -Seconds 5
    
    # Get ngrok URL
    try {
        $ngrokApi = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 10
        $publicUrl = $ngrokApi.tunnels[0].public_url
        
        if ($publicUrl) {
            Write-Host "✅ ngrok tunnel created: $publicUrl" -ForegroundColor Green
            
            # Update .env.local with ngrok URL
            $envContent = Get-Content ".env.local" -Raw
            $envContent = $envContent -replace "NGROK_URL=.*", "NGROK_URL=$publicUrl"
            $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
            
            Write-Host "✅ Updated .env.local with ngrok URL" -ForegroundColor Green
            return $publicUrl
        }
    }
    catch {
        Write-Host "❌ Failed to get ngrok URL. Please check ngrok is running." -ForegroundColor Red
        return $null
    }
}

# Run setup in virtual environment
function Start-Setup {
    Write-Host "🔧 Running integration setup in virtual environment..." -ForegroundColor Yellow
    
    try {
        # Use virtual environment's Python to run setup
        & ".\.venv\Scripts\python.exe" quick_setup.py
        Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Setup failed. Check the error messages above." -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "Prerequisites Check:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    $pythonOk = Test-Python
    $nodeOk = Test-NodeJS
    
    if (!$pythonOk -or !$nodeOk) {
        Write-Host "❌ Please install missing prerequisites and run this script again." -ForegroundColor Red
        return
    }
    
    Write-Host ""
    Write-Host "Python Environment Setup:" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    if (!(Setup-VirtualEnv)) {
        return
    }
    
    Write-Host ""
    Write-Host "Installing Dependencies:" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    
    if (!(Install-PythonDeps)) {
        return
    }
    
    if (!(Install-Ngrok)) {
        return
    }
    
    Write-Host ""
    Write-Host "Environment Setup:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    if (!(Test-EnvVars)) {
        Write-Host "⚠️  Please update your .env.local file with your OmniDimension API key" -ForegroundColor Yellow
        Write-Host "   Get your API key from: https://app.omnidimension.ai" -ForegroundColor Yellow
        return
    }
    
    Write-Host ""
    Write-Host "Starting Services:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    if (!(Start-NextJSServer)) {
        return
    }
    
    $ngrokUrl = Start-Ngrok
    if (!$ngrokUrl) {
        return
    }
    
    Write-Host ""
    Write-Host "Running Integration Setup:" -ForegroundColor Cyan
    Write-Host "==========================" -ForegroundColor Cyan
    
    if (Start-Setup) {
        Write-Host ""
        Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
        Write-Host "==================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Lakshmi Trading Platform is now integrated with OmniDimension!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Keep this PowerShell window open (ngrok tunnel is running)" -ForegroundColor White
        Write-Host "2. Go to https://app.omnidimension.ai to complete the manual setup" -ForegroundColor White
        Write-Host "3. Follow the instructions in OMNIDIMENSION_SETUP.md" -ForegroundColor White
        Write-Host ""
        Write-Host "Test Commands:" -ForegroundColor Cyan
        Write-Host "• 'What's my portfolio balance?'" -ForegroundColor White
        Write-Host "• 'Buy 10 shares of Apple'" -ForegroundColor White
        Write-Host "• 'What's the current price of Tesla?'" -ForegroundColor White
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the services when done." -ForegroundColor Yellow
        
        # Keep services running
        try {
            while ($true) {
                Start-Sleep -Seconds 30
                Write-Host "." -NoNewline -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "`n👋 Services stopped." -ForegroundColor Yellow
        }
    }
}

# Run the main function
Main
