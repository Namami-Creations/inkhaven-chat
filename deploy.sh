#!/bin/bash

echo "Deploying Inkhaven Chat to Vercel..."
echo

echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"
echo

echo "Deploying to Vercel..."
vercel --prod

echo
echo "Deployment complete!"
echo "Your app should be live at the Vercel URL provided above."
