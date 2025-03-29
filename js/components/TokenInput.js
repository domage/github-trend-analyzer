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
            'GitHub API Token (required for discussions count)'
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
            'p',
            { className: 'text-xs text-gray-500 mt-1' },
            'Tokens are stored in your browser\'s local storage.'
        )
    );
}