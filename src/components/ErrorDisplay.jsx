import React from 'react';

/**
 * ErrorDisplay component to show API errors
 */
function ErrorDisplay({ error }) {
    if (!error) return null;
    
    return (
        <div 
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
            role="alert"
        >
            <p className="font-bold">Error</p>
            <p>{error}</p>
        </div>
    );
}

export default ErrorDisplay;