/**
 * GitHub OAuth authentication service
 */

/**
 * Initiates the GitHub OAuth flow
 */
export const initiateGitHubAuth = () => {
  // Redirect to the server endpoint that handles the OAuth initiation
  window.location.href = '/api/auth/login';
};

/**
 * Handles the OAuth callback and exchanges code for token
 * @param {string} code - The authorization code from GitHub
 */
export const handleAuthCallback = async (code) => {
  try {
    // Call our API endpoint to exchange the code for a token
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    // Store the token securely in localStorage
    localStorage.setItem('github_token', data.access_token);
    
    return data.access_token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Gets the stored GitHub token
 */
export const getGitHubToken = () => {
  return localStorage.getItem('github_token');
};

/**
 * Checks if the user is authenticated
 */
export const isAuthenticated = () => {
  return !!getGitHubToken();
};

/**
 * Logs the user out by removing the token
 */
export const logout = () => {
  localStorage.removeItem('github_token');
};
