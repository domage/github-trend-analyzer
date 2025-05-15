// /functions/api/auth/login.js
export async function onRequest(context) {  
  const { env, request } = context;
  
  // Force a console log with a timestamp
  const timestamp = new Date().toISOString();

  // Get the GitHub OAuth URL with fallbacks
  const clientId = env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = env.VITE_REDIRECT_URI;
  
  // Scopes we need: read-only access to repos and user info
  const scope = 'read:user,read:org,repo';
  // Create the GitHub authorization URL
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  
  // Redirect the user to GitHub for authorization
  return new Response('Redirecting to GitHub...', {
   status: 302,
   headers: {
     'Location': githubAuthUrl
   }
  });
}
