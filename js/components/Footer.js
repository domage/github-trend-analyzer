/**
 * Footer component with API usage information
 */
function Footer() {
    return React.createElement(
        'footer',
        { className: 'mt-8 text-center text-gray-500 text-sm' },
        React.createElement(
            'p',
            null,
            'Note: GitHub API has rate limits. For unauthenticated requests, the rate limit is 60 requests per hour.'
        ),
        React.createElement(
            'p',
            null,
            'A GitHub personal access token is required to fetch discussions data and increases rate limits.'
        )
    );
}