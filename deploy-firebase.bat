@echo off
echo 🚀 Deploying Firebase Backend for Inkhaven Chat...
echo.

echo 📦 Installing Firebase CLI (if not already installed)...
npm install -g firebase-tools
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI installation failed
    pause
    exit /b 1
)

echo ✅ Firebase CLI ready
echo.

echo 🔐 Logging into Firebase...
firebase login
if %errorlevel% neq 0 (
    echo ❌ Firebase login failed
    pause
    exit /b 1
)

echo ✅ Logged into Firebase
echo.

echo 📋 Initializing Firebase project (if needed)...
firebase init
if %errorlevel% neq 0 (
    echo ❌ Firebase initialization failed
    pause
    exit /b 1
)

echo ✅ Firebase project initialized
echo.

echo 🔥 Deploying Firestore security rules...
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo ❌ Firestore rules deployment failed
    pause
    exit /b 1
)

echo ✅ Firestore rules deployed
echo.

echo 📦 Deploying Storage security rules...
firebase deploy --only storage
if %errorlevel% neq 0 (
    echo ❌ Storage rules deployment failed
    pause
    exit /b 1
)

echo ✅ Storage rules deployed
echo.

echo ⚙️ Deploying Cloud Functions...
cd firebase-config\functions
npm install
if %errorlevel% neq 0 (
    echo ❌ Functions dependencies installation failed
    pause
    exit /b 1
)

firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ❌ Functions deployment failed
    pause
    exit /b 1
)

cd ..\..
echo ✅ Cloud Functions deployed
echo.

echo 🎉 Firebase backend deployment complete!
echo.
echo 📊 Your Inkhaven Chat backend is now live with:
echo    • Firestore database with security rules
echo    • Firebase Storage for file uploads
echo    • Cloud Functions for AI features
echo    • Real-time chat capabilities
echo    • User authentication
echo.
echo 🌐 Frontend can now connect to Firebase!
echo.
pause
