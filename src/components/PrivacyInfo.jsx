import React from 'react';

/**
 * Component to display privacy and analytics information
 */
function PrivacyInfo({ onClose }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Analytics & Privacy Information</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">Data We Collect</h3>
        <p>We collect anonymous usage data to improve this application, including:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Search terms entered</li>
          <li>Date ranges selected</li>
          <li>Features used (H-Index, Trend analysis)</li>
          <li>Application performance metrics</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">What We Don't Collect</h3>
        <ul className="list-disc pl-5 mt-2">
          <li>Your GitHub token</li>
          <li>Your IP address</li>
          <li>Any personally identifiable information</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">How We Use This Data</h3>
        <p>This data helps us:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Improve application performance</li>
          <li>Develop new features based on usage patterns</li>
          <li>Fix issues and bugs</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">Data Storage</h3>
        <p>All data is stored securely on Cloudflare's infrastructure and is not shared with third parties.</p>
      </div>
    </div>
  );
}

export default PrivacyInfo;
