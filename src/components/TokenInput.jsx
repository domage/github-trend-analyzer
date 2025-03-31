import React from 'react';

/**
 * TokenInput component for GitHub API token input
 * Shows input field when no token is present, or a logout button when token exists
 */
function TokenInput({ githubToken, setGithubToken }) {
    // Handle logout by clearing the token
    const handleLogout = () => {
        setGithubToken('');
        localStorage.removeItem('githubToken');
    };

    // If token exists, show the logout button
    if (githubToken) {
        return (
            <div className="flex justify-between items-center">
                <div className="text-gray-700">
                    <span className="font-medium">GitHub API Token:</span> 
                    <span className="ml-2 text-green-600">✓ Connected</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                    Logout
                </button>
            </div>
        );
    }

    // Otherwise show the token input field
    return (
        <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="githubToken">
                GitHub API Token (enables GraphQL for better performance and trend analysis)
            </label>
            <input
                id="githubToken"
                type="password"
                className="w-full p-2 border rounded"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxx"
            />
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>
                    Tokens are stored in your browser's local storage. Required for discussions data and trend analysis.
                </span>
                <a
                    href="https://github.com/settings/personal-access-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                >
                    Generate token
                </a>
            </div>
        </div>
    );
}

export default TokenInput;