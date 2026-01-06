'use client'

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Page Not Found | Inkhaven Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              max-width: 500px;
              text-align: center;
              padding: 2rem;
            }
            .icon {
              width: 4rem;
              height: 4rem;
              margin: 0 auto 1rem;
              opacity: 0.8;
            }
            h1 {
              font-size: 2.5rem;
              margin-bottom: 1rem;
              background: linear-gradient(45deg, #60a5fa, #a855f7);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              margin-bottom: 2rem;
              opacity: 0.9;
            }
            .button {
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: linear-gradient(45deg, #60a5fa, #a855f7);
              color: white;
              text-decoration: none;
              border-radius: 0.5rem;
              font-weight: 600;
              transition: opacity 0.2s;
            }
            .button:hover {
              opacity: 0.9;
            }
          `
        }} />
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1-5.625-2.708M12 4.5v3m0 4.5v3" />
            </svg>
          </div>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <a href="/" className="button">Go Home</a>
        </div>
      </body>
    </html>
  )
}
