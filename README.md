# Inkhaven Chat 🐾 - Ultimate Anonymous Chat Platform

A next-generation anonymous chat platform featuring AI-powered matching, dynamic themes, and autonomous moderation - all built on free-tier services.

## ✨ Features

### 🧠 AI-Powered Platform
- **Smart Matching Engine**: AI analyzes conversations to match users with compatible interests, languages, and chat styles
- **Intelligent Moderation**: Multi-API content filtering using OpenAI, Google Gemini, and Hugging Face (all free tiers)
- **AI Room Generation**: Automatically creates trending discussion rooms based on user activity
- **Conversation Enhancement**: AI-generated icebreakers and topic suggestions

### 🎨 Dynamic Theme System
- **Cosmic Theme**: Animated space background with floating stars
- **Forest Theme**: Woodland patterns with nature animations
- **Neon Theme**: Cyberpunk grid with glowing borders
- **Ocean Theme**: Wave animations with underwater effects
- **Bubble Theme**: Playful rounded corners with floating bubbles
- **Glass Theme**: Modern glass-morphism with blur effects
- **Retro Theme**: 8-bit pixel art with animated shifts
- **Modern Theme**: Clean minimal design with gradients

### 💬 Core Chat Features
- **Real-time Messaging**: Instant delivery with WebSocket connections
- **Anonymous Sessions**: Ephemeral chats that auto-expire after 24 hours
- **File Sharing**: Encrypted uploads for registered users (10MB limit)
- **Typing Indicators**: Smooth animations with user avatars
- **Message Reactions**: Express yourself with emoji reactions
- **Connection Status**: Live presence indicators

### 🏠 AI-Generated Rooms
- **Technology Help Desk**: Coding assistance and tech discussions
- **Mental Wellness Support**: Supportive conversations for mental health
- **Gaming Discussions**: Connect with fellow gamers
- **Career Advice**: Professional guidance and networking
- **Book Club**: Literary discussions and recommendations
- **Travel Stories**: Share adventures and get tips
- **Coding Help**: Programming assistance and code reviews
- **Relationship Advice**: Supportive discussions about relationships

### 🔒 Autonomous Moderation
- **7-Layer AI Moderation**: Real-time content analysis, sentiment detection, behavior monitoring
- **Progressive Actions**: Warn → Temp Ban → Permanent Ban system
- **Appeal System**: AI-assisted review of flagged content
- **Cultural Adaptation**: Context-aware filtering for different cultures

## 🌍 **Multi-Language Support**

Inkhaven Chat supports **25+ languages** including all major Indian languages and Nepali:

### **Indian Languages Supported**
- 🇮🇳 **Hindi** (हिंदी) - Primary language
- 🇮🇳 **Bengali** (বাংলা) - West Bengal, Tripura
- 🇮🇳 **Telugu** (తెలుగు) - Andhra Pradesh, Telangana
- 🇮🇳 **Marathi** (मराठी) - Maharashtra
- 🇮🇳 **Tamil** (தமிழ்) - Tamil Nadu, Puducherry
- 🇮🇳 **Urdu** (اردو) - Jammu & Kashmir, Delhi, UP
- 🇮🇳 **Gujarati** (ગુજરાતી) - Gujarat, Daman & Diu
- 🇮🇳 **Kannada** (ಕನ್ನಡ) - Karnataka
- 🇮🇳 **Odia** (ଓଡ଼ିଆ) - Odisha
- 🇮🇳 **Malayalam** (മലയാളം) - Kerala, Lakshadweep
- 🇮🇳 **Punjabi** (ਪੰਜਾਬੀ) - Punjab, Chandigarh, Delhi
- 🇮🇳 **Assamese** (অসমীয়া) - Assam
- 🇮🇳 **Maithili** (मैथिली) - Bihar, Nepal border
- 🇮🇳 **Santali** (ᱥᱟᱱᱛᱟᱲᱤ) - Jharkhand, Odisha, West Bengal
- 🇮🇳 **Kashmiri** (کٲشُر) - Jammu & Kashmir
- 🇮🇳 **Sindhi** (سنڌي) - Gujarat, Rajasthan, Maharashtra
- 🇮🇳 **Konkani** (कोंकणी) - Goa, Karnataka, Kerala
- 🇮🇳 **Dogri** (डोगरी) - Jammu & Kashmir
- 🇮🇳 **Manipuri** (মৈতৈলোন্) - Manipur
- 🇮🇳 **Bodo** (बोड़ो) - Assam

### **Other Languages**
- 🇳🇵 **Nepali** (नेपाली) - Nepal and Indian border regions
- 🇺🇸 **English** - International
- 🇪🇸 **Spanish** (Español) - Latin America
- 🇫🇷 **French** (Français) - France, Africa

**Language switching is available in the app interface and automatically detects user preferences.**

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Heroicons

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage

### AI Services
- **Chat Enhancement**: OpenAI GPT-4o-mini (free tier)
- **Content Moderation**: OpenAI + Google Gemini + Hugging Face (multi-layer)
- **Smart Matching**: Custom AI algorithms
- **Icebreakers**: DeepSeek API

### Hosting & Deployment
- **Platform**: Vercel
- **Domain**: inkhaven.in

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd inkhaven-chat
```
<!-- Fresh commit for deployment -->

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
```bash
# Create a new Supabase project at https://supabase.com
# Copy your project URL and anon key
```

4. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services (get free API keys)
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

5. **Set up database schema**
```bash
# Run the SQL schema from lib/supabase-schema.sql in your Supabase SQL editor
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Build for Production

```bash
npm run build
npm start
```

## 📊 Cost Management

### Free Tier Limits
- **Supabase**: 50K monthly active users, 500MB storage, 5GB bandwidth
- **OpenAI**: 5M tokens/month
- **Google Gemini**: 1M tokens/month
- **Hugging Face**: Unlimited community models
- **Vercel**: Unlimited static sites, 100GB bandwidth

### Auto-Scaling Features
- Monitor usage metrics automatically
- Optimize AI model selection based on traffic
- Cache frequent responses
- Load balance between AI services

## 🎯 Implementation Phases

### Phase 1: MVP ✅
- Basic anonymous chat with themes
- Supabase real-time messaging
- Simple AI matching
- Free-tier moderation

### Phase 2: Enhancement ✅
- Advanced theme system
- AI conversation assistance
- Room creation features
- Registration incentives

### Phase 3: Autonomy 🔄
- Full AI moderation
- Auto-scaling systems
- Advanced analytics
- Performance optimization

### Phase 4: Polish 📋
- Mobile optimization
- Multi-language support
- Advanced file sharing
- Community features

## 🗂️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ChatApp.tsx       # Main app component
│   ├── LandingPage.tsx   # Landing page with animations
│   ├── ChatInterface.tsx # Chat UI with themes
│   ├── ThemeCustomizer.tsx # Theme customization
│   └── RoomBrowser.tsx   # AI-generated rooms
├── lib/                   # Business logic
│   ├── supabase.ts       # Supabase client
│   ├── database.types.ts # TypeScript types
│   ├── ai-matching.ts    # AI matching engine
│   ├── ai-moderation.ts  # Content moderation
│   ├── ai-room-generation.ts # Room creation AI
│   ├── ai-services.ts    # AI service configuration
│   └── supabase-schema.sql # Database schema
├── utils/                 # Utilities
│   └── types.ts          # Shared types and constants
└── public/               # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- **[Developer Guide](./docs/developer-guide.md)** - Complete development setup and contribution guidelines
- **[API Documentation](./docs/api-spec.yaml)** - OpenAPI 3.0 specification for all API endpoints
- **[Testing Guide](./docs/testing.md)** - How to run and write tests
- **[Deployment Guide](./docs/deployment.md)** - Deployment and CI/CD information

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Live Demo

🚀 [Inkhaven Chat](https://inkhaven-chat.vercel.app) - Experience the future of anonymous chatting!

## 🙏 Acknowledgments

- Built with ❤️ using free-tier services
- AI-powered by OpenAI, Google, and Hugging Face
- Real-time magic by Supabase
- Beautiful animations by Framer Motion

---

**Join the revolution in anonymous chat!** 🚀
