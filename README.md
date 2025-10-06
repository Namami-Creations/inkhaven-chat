# Inkhaven Chat 🐾

A unique chat application featuring personality-driven animal avatars and premium gated features.

## Features

### 🐾 Animal Personality System
- **Personality Quiz**: 5-question quiz to discover your spirit animal
- **Animal Avatars**: 20+ unique animal characters with personality traits
- **Available to All Users**: Free feature to engage anonymous users

### 💬 Core Chat Features
- **Real-time Messaging**: Instant message delivery
- **Matchmaking**: Find conversation partners based on preferences
- **Smart Replies**: AI-powered conversation suggestions
- **Conversation Summaries**: AI-generated chat summaries
- **Moderation**: Content filtering and safety features

### 🔒 Premium Features (Registration Required)
- **File Sharing**: Upload images, videos, documents (10MB limit)
- **Chat Saving**: Permanent cloud storage for conversations
- **Mood-Reactive Avatars**: Dynamic animal avatar changes based on sentiment
- **Animal Sound Effects**: Procedural audio generation
- **AI Icebreakers**: Context-aware conversation starters
- **Advanced Preferences**: Detailed matchmaking settings

### 🎨 User Experience
- **Theme Support**: Light, dark, and auto themes
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: Screen reader support and keyboard navigation
- **Progressive Enhancement**: Features unlock based on registration status

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Deployment**: Vercel
- **Build Tool**: Vite

## Project Structure

```
src/
├── components/          # Vue components
│   ├── AnimalAvatarSelector.vue    # Personality quiz
│   ├── AnimalEmojiSystem.vue       # Emoji picker
│   ├── RegistrationModal.vue       # User registration
│   ├── ThemeSelector.vue           # Theme settings
│   └── MatchPreferences.vue        # Match preferences
├── pages/               # Page components
│   └── ChatApp.vue      # Main chat interface
├── services/            # Business logic
│   ├── firebase.ts      # Firebase configuration
│   ├── user.service.ts  # User management
│   ├── chat.service.ts  # Chat functionality
│   └── matchmaking.service.ts     # Matchmaking logic
├── stores/              # Pinia stores
│   ├── auth.ts          # Authentication state
│   └── theme.ts         # Theme state
├── router.ts            # Vue Router configuration
├── main.ts              # App entry point
└── style.css            # Global styles
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Deployment

The application is configured for deployment on Vercel:

```bash
npm run build
# Then deploy the dist/ directory
```

## Environment Setup

Create a Firebase project and add your configuration to `src/services/firebase.ts`.

## Features Overview

### For Anonymous Users (Free)
- ✅ Animal personality quiz
- ✅ Animal emoji system
- ✅ Basic chat functionality
- ✅ Theme customization
- ✅ Registration prompts for premium features

### For Registered Users (Premium)
- ✅ All anonymous features
- ✅ File sharing and uploads
- ✅ Permanent chat storage
- ✅ Mood-reactive avatars
- ✅ Animal sound effects
- ✅ AI conversation starters
- ✅ Advanced matchmaking
- ✅ Cross-device synchronization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Live Demo

🌐 [https://www.inkhaven.in](https://www.inkhaven.in)
