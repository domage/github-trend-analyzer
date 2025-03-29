/**
 * MultiSearchResults component to display comparison table for multiple search terms
 */
function MultiSearchResults({ multiResults }) {
    const { useState } = React;
    const [sortConfig, setSortConfig] = useState({
        key: 'searchTerm',
        direction: 'ascending'
    });

    if (!multiResults || multiResults.length === 0) return null;

    // Handle sort when a column header is clicked
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get sorted data based on current sort configuration
    const getSortedData = () => {
        const sortableData = [...multiResults];
        sortableData.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableData;
    };

    // Get class names for the table header based on current sort
    const getHeaderClassName = (key) => {
        const baseClassName = 'px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors';
        if (sortConfig.key === key) {
            return `${baseClassName} bg-gray-200 font-bold`;
        }
        return baseClassName;
    };

    // Create sort indicator arrows
    const getSortDirectionIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        
        return React.createElement(
            'span',
            { className: 'ml-1 inline-block' },
            sortConfig.direction === 'ascending' ? '↑' : '↓'
        );
    };

    // Create table header cell with sort functionality
    const createSortableHeader = (key, label) => {
        return React.createElement(
            'th',
            {
                className: getHeaderClassName(key),
                onClick: () => requestSort(key)
            },
            label,
            getSortDirectionIndicator(key)
        );
    };

    // Render the main table
    return React.createElement(
        'div',
        { className: 'bg-white p-6 rounded-lg shadow-md mb-6' },
        React.createElement(
            'h2',
            { className: 'text-2xl font-bold mb-4' },
            'Comparative Analysis'
        ),
        React.createElement(
            'p',
            { className: 'mb-4 text-sm text-gray-600' },
            'Click on any column header to sort the table.'
        ),
        React.createElement(
            'div',
            { className: 'overflow-x-auto' },
            React.createElement(
                'table',
                { className: 'min-w-full bg-white border border-gray-300' },
                React.createElement(
                    'thead',
                    { className: 'bg-gray-50 border-b text-left' },
                    React.createElement(
                        'tr',
                        null,
                        createSortableHeader('searchTerm', 'Search Term'),
                        createSortableHeader('starHIndex', 'Star H-Index'),
                        createSortableHeader('forkHIndex', 'Fork H-Index'),
                        createSortableHeader('totalRepos', 'Total Repositories'),
                        createSortableHeader('topStar', 'Top Starred')
                    )
                ),
                React.createElement(
                    'tbody',
                    null,
                    getSortedData().map((result, index) => 
                        React.createElement(
                            'tr',
                            { 
                                key: index,
                                className: index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                            },
                            React.createElement(
                                'td',
                                { className: 'px-4 py-3 border-b' },
                                result.searchTerm
                            ),
                            React.createElement(
                                'td',
                                { className: 'px-4 py-3 border-b text-center' },
                                result.starHIndex
                            ),
                            React.createElement(
                                'td',
                                { className: 'px-4 py-3 border-b text-center' },
                                result.forkHIndex
                            ),
                            React.createElement(
                                'td',
                                { className: 'px-4 py-3 border-b text-center' },
                                result.totalRepos
                            ),
                            React.createElement(
                                'td',
                                { className: 'px-4 py-3 border-b' },
                                result.topStarredRepos && result.topStarredRepos.length > 0 
                                    ? React.createElement(
                                        'a',
                                        { 
                                            href: result.topStarredRepos[0].html_url,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            className: 'text-blue-600 hover:underline'
                                        },
                                        `${result.topStarredRepos[0].full_name} (${result.topStarredRepos[0].stargazers_count} ⭐)`
                                    )
                                    : 'N/A'
                            )
                        )
                    )
                )
            )
        )
    );
}