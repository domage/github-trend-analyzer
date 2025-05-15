import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback } from '../services/authService';
import ErrorDisplay from '../components/ErrorDisplay';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received from GitHub');
      return;
    }
    
    const processAuth = async () => {
      try {
        await handleAuthCallback(code);
        navigate('/'); // Redirect to home page after successful authentication
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Failed to authenticate with GitHub. Please try again.');
      }
    };
    
    processAuth();
  }, [searchParams, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {error ? (
          <ErrorDisplay message={error} />
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authenticating with GitHub</h2>
            <p className="mb-4">Please wait while we complete your authentication...</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
