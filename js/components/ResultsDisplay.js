/**
 * ResultsDisplay component to show GitHub H-Index results
 */
function ResultsDisplay({ results }) {
    if (!results) return null;
    
    return React.createElement(
        'div',
        { className: 'bg-white p-6 rounded-lg shadow-md' },
        React.createElement(
            'h2',
            { className: 'text-2xl font-bold mb-4' },
            `Results for "${results.searchTerm}"`
        ),
        React.createElement(
            'p',
            { className: 'mb-2' },
            `Repositories created after: ${results.dateLimit}`
        ),
        React.createElement(
            'p',
            { className: 'mb-2' },
            `Total repositories analyzed: ${results.totalRepos}`
        ),
        React.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mt-6' },
            // Star H-Index section
            React.createElement(
                'div',
                { className: 'bg-blue-50 p-4 rounded-lg' },
                React.createElement(
                    'h3',
                    { className: 'text-xl font-bold mb-3 text-blue-800' },
                    `Star H-Index: ${results.starHIndex}`
                ),
                React.createElement(
                    'p',
                    { className: 'mb-4 text-sm' },
                    `This means there are at least ${results.starHIndex} repositories with at least ${results.starHIndex} stars each.`
                ),
                React.createElement(
                    'h4',
                    { className: 'font-bold mb-2' },
                    'Top Starred Repositories:'
                ),
                React.createElement(
                    'ul',
                    { className: 'text-sm' },
                    results.topStarredRepos.map(repo => 
                        React.createElement(
                            'li',
                            { key: repo.id, className: 'mb-2' },
                            React.createElement(
                                'a',
                                { 
                                    href: repo.html_url, 
                                    target: '_blank', 
                                    rel: 'noopener noreferrer',
                                    className: 'text-blue-600 hover:underline'
                                },
                                repo.full_name
                            ),
                            React.createElement(
                                'span',
                                { className: 'ml-2 text-gray-600' },
                                `(${repo.stargazers_count} ⭐)`
                            )
                        )
                    )
                )
            ),
            // Fork H-Index section
            React.createElement(
                'div',
                { className: 'bg-green-50 p-4 rounded-lg' },
                React.createElement(
                    'h3',
                    { className: 'text-xl font-bold mb-3 text-green-800' },
                    `Fork H-Index: ${results.forkHIndex}`
                ),
                React.createElement(
                    'p',
                    { className: 'mb-4 text-sm' },
                    `This means there are at least ${results.forkHIndex} repositories with at least ${results.forkHIndex} forks each.`
                ),
                React.createElement(
                    'h4',
                    { className: 'font-bold mb-2' },
                    'Top Forked Repositories:'
                ),
                React.createElement(
                    'ul',
                    { className: 'text-sm' },
                    results.topForkedRepos.map(repo => 
                        React.createElement(
                            'li',
                            { key: repo.id, className: 'mb-2' },
                            React.createElement(
                                'a',
                                { 
                                    href: repo.html_url, 
                                    target: '_blank', 
                                    rel: 'noopener noreferrer',
                                    className: 'text-blue-600 hover:underline'
                                },
                                repo.full_name
                            ),
                            React.createElement(
                                'span',
                                { className: 'ml-2 text-gray-600' },
                                `(${repo.forks_count} 🍴)`
                            )
                        )
                    )
                )
            )
        )
    );
}