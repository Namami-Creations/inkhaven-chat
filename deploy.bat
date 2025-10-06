@echo off
echo  Deploying Inkhaven Chat to Vercel...
echo.

echo  Building project...
npm run build
if %errorlevel% neq 0 (
    echo  Build failed!
    pause
    exit /b 1
)

echo  Build successful!
echo.

echo  Deploying to Vercel...
vercel --prod

echo.
echo  Deployment complete!
echo Your app should be live at the Vercel URL provided above.
pause
