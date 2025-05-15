// /functions/api/auth/callback.js
export async function onRequest(context) {
  const { request, env } = context;
  
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const { code } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
      // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },      body: JSON.stringify({
        client_id: env.VITE_GITHUB_CLIENT_ID,
        client_secret: env.VITE_GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: env.VITE_REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return the token to client
    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
