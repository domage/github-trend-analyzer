/**
 * TokenInput component for GitHub API token input
 */
function TokenInput({ githubToken, setGithubToken }) {
    return React.createElement(
        'div',
        { className: 'mb-4' },
        React.createElement(
            'label',
            { className: 'block text-gray-700 mb-2', htmlFor: 'githubToken' },
            'GitHub API Token (enables GraphQL for better performance and trend analysis)'
        ),
        React.createElement('input', {
            id: 'githubToken',
            type: 'password',
            className: 'w-full p-2 border rounded',
            value: githubToken,
            onChange: (e) => setGithubToken(e.target.value),
            placeholder: 'ghp_xxxxxxxxxxxxxxx'
        }),
        React.createElement(
            'div',
            { className: 'text-xs text-gray-500 mt-1 flex justify-between' },
            React.createElement(
                'span',
                null,
                'Tokens are stored in your browser\'s local storage. Required for discussions data and trend analysis.'
            ),
            React.createElement(
                'a',
                { 
                    href: 'https://github.com/settings/tokens',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-500 hover:underline'
                },
                'Generate token'
            )
        )
    );
}