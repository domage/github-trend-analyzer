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

    return React.createElement(
        'div',
        { className: 'bg-white p-6 rounded-lg shadow-md mb-6' },
        React.createElement(TokenInput, { githubToken, setGithubToken }),
        React.createElement(
            'div',
            { className: 'mb-4' },
            React.createElement(
                'label',
                { className: 'block text-gray-700 mb-2', htmlFor: 'searchTerm' },
                'Search Term'
            ),
            React.createElement('input', {
                id: 'searchTerm',
                type: 'text',
                className: 'w-full p-2 border rounded',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyPress: handleKeyPress,
                placeholder: 'e.g. SOAP, Python, React'
            })
        ),
        React.createElement(
            'div',
            { className: 'mb-6' },
            React.createElement(
                'label',
                { className: 'block text-gray-700 mb-2', htmlFor: 'dateLimit' },
                'Created After Date'
            ),
            React.createElement('input', {
                id: 'dateLimit',
                type: 'date',
                className: 'w-full p-2 border rounded',
                value: dateLimit,
                onChange: (e) => setDateLimit(e.target.value)
            })
        ),
        React.createElement(
            'button',
            {
                className: 'w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline',
                onClick: handleSearch,
                disabled: isLoading
            },
            isLoading ? 'Searching...' : 'Calculate H-Indices'
        )
    );
}