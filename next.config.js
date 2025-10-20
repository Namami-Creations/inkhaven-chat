/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  swcMinify: true, // Use SWC for faster builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },

  // Image optimization
  images: {
    domains: ['localhost', 'www.inkhaven.in', 'emaznvqnynfgudlazzqz.supabase.co'],
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
  },

  // Experimental features for performance
  experimental: {
    scrollRestoration: true, // Better UX on navigation
  },

  // Bundle analyzer (uncomment when needed)
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.fallback = {
  //       ...config.resolve.fallback,
  //       fs: false,
  //     }
  //   }
  //   return config
  // },

  // Security headers (additional to middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Environment variables exposure
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
