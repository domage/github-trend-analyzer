// A serverless approach to GitHub authentication using the device flow
// This avoids needing a server-side component for token exchange

class ServerlessGitHubAuth {
    constructor() {
        // Client ID for GitHub OAuth Apps
        this.clientId = 'YOUR_GITHUB_CLIENT_ID'; // Replace with your own
        
        // Storage keys
        this.TOKEN_KEY = 'gh_access_token';
        this.USER_KEY = 'gh_user_data';
        
        // Load existing data
        this.accessToken = localStorage.getItem(this.TOKEN_KEY) || null;
        this.userData = JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
        
        // Auth state listeners
        this.listeners = [];
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.accessToken;
    }

    // Get current access token
    getAccessToken() {
        return this.accessToken;
    }

    // Get user data
    getUser() {
        return this.userData;
    }

    // Start device flow authentication
    async login() {
        try {
            // Show loading state
            this.notifyListeners('authenticating');
            
            // Step 1: Request device and user verification codes
            const deviceResponse = await fetch('https://github.com/login/device/code', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.clientId,
                    scope: 'repo read:user'
                })
            });
            
            if (!deviceResponse.ok) {
                throw new Error('Failed to start device flow');
            }
            
            const deviceData = await deviceResponse.json();
            const { 
                device_code, 
                user_code, 
                verification_uri, 
                expires_in, 
                interval 
            } = deviceData;
            
            // Step 2: Show the user the verification code and URL
            this.notifyListeners('verification_needed', {
                userCode: user_code,
                verificationUrl: verification_uri
            });
            
            // Step 3: Poll for the token
            const pollStartTime = Date.now();
            const expiresAt = pollStartTime + (expires_in * 1000);
            
            const pollForToken = async () => {
                if (Date.now() > expiresAt) {
                    this.notifyListeners('error', { message: 'Authentication timed out' });
                    return;
                }
                
                try {
                    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_id: this.clientId,
                            device_code: device_code,
                            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                        })
                    });
                    
                    const tokenData = await tokenResponse.json();
                    
                    if (tokenData.error === 'authorization_pending') {
                        // User hasn't authorized yet, keep polling
                        setTimeout(pollForToken, interval * 1000);
                        return;
                    }
                    
                    if (tokenData.error) {
                        this.notifyListeners('error', { message: tokenData.error_description || tokenData.error });
                        return;
                    }
                    
                    if (tokenData.access_token) {
                        // Success! Save the token
                        this.accessToken = tokenData.access_token;
                        localStorage.setItem(this.TOKEN_KEY, this.accessToken);
                        
                        // Fetch user data
                        await this.fetchUserData();
                        
                        // Notify success
                        this.notifyListeners('authenticated');
                    }
                } catch (error) {
                    setTimeout(pollForToken, interval * 1000);
                }
            };
            
            // Start polling
            setTimeout(pollForToken, interval * 1000);
            
        } catch (error) {
            this.notifyListeners('error', { message: error.message });
        }
    }

    // Fetch user data with the token
    async fetchUserData() {
        if (!this.accessToken) return null;
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            
            this.userData = await response.json();
            localStorage.setItem(this.USER_KEY, JSON.stringify(this.userData));
            return this.userData;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    // Logout and clear stored data
    logout() {
        this.accessToken = null;
        this.userData = null;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.notifyListeners('logged_out');
    }

    // Subscribe to auth state changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    // Notify all listeners of state change
    notifyListeners(state, data = {}) {
        this.listeners.forEach(listener => {
            listener(state, data);
        });
    }
}

// Create and export a singleton instance
const auth = new ServerlessGitHubAuth();
export default auth;