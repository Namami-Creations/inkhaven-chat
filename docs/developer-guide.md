# Inkhaven Chat Developer Guide

## Getting Started

Welcome to the Inkhaven Chat developer documentation! This guide will help you get started with developing, testing, and deploying the Inkhaven Chat platform.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Testing](#testing)
4. [API Documentation](#api-documentation)
5. [Deployment](#deployment)
6. [Contributing](#contributing)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

Inkhaven Chat is built with a modern, scalable architecture:

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Internationalization**: next-i18next

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage

### AI Services
- **OpenAI GPT-4o Mini**: Chat enhancement
- **Google Gemini**: Content moderation
- **Hugging Face**: Additional AI features

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Analytics**: Custom analytics service

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inkhaven-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI Services
   OPENAI_API_KEY=your-openai-key
   GOOGLE_AI_API_KEY=your-google-ai-key
   HUGGINGFACE_API_KEY=your-huggingface-key

   # Monitoring
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

   # Analytics (optional)
   GOOGLE_ANALYTICS_ID=your-ga-id
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `lib/supabase-schema.sql`
   - Copy your project URL and keys to `.env.local`

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

## Testing

### Unit Tests
```bash
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### E2E Tests
```bash
npm run cypress       # Open Cypress UI
npm run cypress:run   # Run E2E tests headlessly
```

### Testing Best Practices

- Write tests for all new features
- Aim for >80% code coverage
- Test both happy path and error scenarios
- Use descriptive test names
- Mock external API calls

## API Documentation

The complete API documentation is available in OpenAPI 3.0 format:

- [API Specification](./api-spec.yaml)
- Interactive API docs available at `/api/docs` when running locally

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/rooms` - Create chat room
- `GET /api/chat/messages` - Get messages
- `POST /api/chat/messages` - Send message

## Deployment

### Staging Deployment
Pushes to `develop` branch automatically deploy to staging.

### Production Deployment
Pushes to `main` branch automatically deploy to production.

### Manual Deployment
```bash
npm run deploy  # Deploy to Vercel
```

### Environment Variables
Make sure to set all required environment variables in your deployment platform:

- Supabase credentials
- AI service API keys
- Sentry DSN
- Analytics tracking IDs

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new features
5. Ensure all tests pass
6. Update documentation if needed
7. Create a pull request

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run lint` to check for linting issues
- Ensure all dependencies are installed: `npm install`
- Check TypeScript configuration in `tsconfig.json`

**Tests are failing**
- Make sure you're using the correct Node.js version
- Check if environment variables are set correctly
- Run `npm run test:coverage` to see detailed error messages

**API calls failing**
- Verify Supabase credentials in `.env.local`
- Check Supabase project status
- Ensure database schema is up to date

**Deployment issues**
- Check Vercel build logs
- Verify environment variables are set in Vercel dashboard
- Make sure all dependencies are in `package.json`

### Getting Help

- Check existing GitHub issues
- Create a new issue with detailed information
- Include error messages, environment details, and steps to reproduce

## Security

- Never commit API keys or sensitive data
- Use environment variables for configuration
- Follow OWASP guidelines for secure coding
- Report security vulnerabilities privately

## Performance

- Bundle size is monitored automatically
- Core Web Vitals are tracked
- Optimize images and lazy load components
- Use proper caching strategies

---

For more detailed information, check the individual documentation files in the `docs/` directory.
