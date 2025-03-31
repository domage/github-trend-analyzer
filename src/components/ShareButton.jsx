import React, { useState } from 'react';
import * as urlSharingUtils from '../utils/urlSharing';

/**
 * ShareButton component for sharing analysis results via URL
 */
function ShareButton({ settings }) {
    const [copied, setCopied] = useState(false);
    
    const handleShare = async () => {
        const success = await urlSharingUtils.copyShareableUrl(settings);
        
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    return (
        <button
            onClick={handleShare}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors duration-200"
        >
            <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
            >
                <path 
                    d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
                />
            </svg>
            <span>{copied ? 'URL Copied!' : 'Share Analysis'}</span>
        </button>
    );
}

export default ShareButton;