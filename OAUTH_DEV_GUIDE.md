# Local Development Guide for GitHub Trend Analyzer

This guide explains how to set up and test the GitHub OAuth integration locally.

## Prerequisites

1. Node.js and npm installed
2. GitHub OAuth App registered (with `http://localhost:5173/callback` as callback URL)

## Setup Steps

1. Clone the repository
   ```
   git clone https://github.com/yourusername/github-trend-analyzer.git
   cd github-trend-analyzer
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your GitHub OAuth credentials:
   ```
   VITE_GITHUB_CLIENT_ID=your_client_id
   VITE_GITHUB_CLIENT_SECRET=your_client_secret
   VITE_REDIRECT_URI=http://localhost:5173/callback
   ```

4. Start the Cloudflare Functions development server
   ```
   npx wrangler pages dev --compatibility-date=2023-12-01 . --port 8788
   ```

5. In a separate terminal, start the Vite development server
   ```
   npm run dev
   ```

6. Open your browser to http://localhost:5173

## Testing the OAuth Flow

1. Click "Sign in with GitHub" on the app
2. You'll be redirected to GitHub for authorization
3. After authorization, you'll be redirected back to the callback URL
4. The app should now be authenticated and display "✓ Connected"

## Troubleshooting

- If you see CORS errors, make sure both servers are running
- Check that your GitHub OAuth App has the correct callback URL
- Verify that the environment variables are correctly set
- Clear localStorage and cookies if you encounter persistent issues
