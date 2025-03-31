import React from 'react';

/**
 * SearchForm component for GitHub repository search
 */
function SearchForm({ 
    searchTerm, 
    setSearchTerm, 
    dateLimit, 
    setDateLimit, 
    isLoading, 
    handleSearch,
    githubToken,
    setGithubToken
}) {
    // Handle key press in search term field
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="searchTerm">
                    Search Term
                </label>
                <input
                    id="searchTerm"
                    type="text"
                    className="w-full p-2 border rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g. SOAP; Python; React (use ; to compare multiple terms)"
                />
            </div>
            <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="dateLimit">
                    Created After Date
                </label>
                <input
                    id="dateLimit"
                    type="date"
                    className="w-full p-2 border rounded"
                    value={dateLimit}
                    onChange={(e) => setDateLimit(e.target.value)}
                />
            </div>
            <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleSearch}
                disabled={isLoading}
            >
                {isLoading ? 'Searching...' : 'Calculate H-Indices'}
            </button>
        </div>
    );
}

export default SearchForm;