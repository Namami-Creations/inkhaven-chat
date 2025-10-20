#!/bin/bash

echo "🚀 Deploying Firebase Backend for Inkhaven Chat..."
echo

echo "📦 Installing Firebase CLI (if not already installed)..."
npm install -g firebase-tools

if [ $? -ne 0 ]; then
    echo "❌ Firebase CLI installation failed"
    exit 1
fi

echo "✅ Firebase CLI ready"
echo

echo "🔐 Logging into Firebase..."
firebase login

if [ $? -ne 0 ]; then
    echo "❌ Firebase login failed"
    exit 1
fi

echo "✅ Logged into Firebase"
echo

echo "📋 Initializing Firebase project (if needed)..."
firebase init

if [ $? -ne 0 ]; then
    echo "❌ Firebase initialization failed"
    exit 1
fi

echo "✅ Firebase project initialized"
echo

echo "🔥 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    echo "❌ Firestore rules deployment failed"
    exit 1
fi

echo "✅ Firestore rules deployed"
echo

echo "📦 Deploying Storage security rules..."
firebase deploy --only storage

if [ $? -ne 0 ]; then
    echo "❌ Storage rules deployment failed"
    exit 1
fi

echo "✅ Storage rules deployed"
echo

echo "⚙️ Deploying Cloud Functions..."
cd firebase-config/functions
npm install

if [ $? -ne 0 ]; then
    echo "❌ Functions dependencies installation failed"
    exit 1
fi

firebase deploy --only functions

if [ $? -ne 0 ]; then
    echo "❌ Functions deployment failed"
    exit 1
fi

cd ../..
echo "✅ Cloud Functions deployed"
echo

echo "🎉 Firebase backend deployment complete!"
echo
echo "📊 Your Inkhaven Chat backend is now live with:"
echo "   • Firestore database with security rules"
echo "   • Firebase Storage for file uploads"
echo "   • Cloud Functions for AI features"
echo "   • Real-time chat capabilities"
echo "   • User authentication"
echo
echo "🌐 Frontend can now connect to Firebase!"
