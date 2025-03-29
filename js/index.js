/**
 * Entry point - renders the main app component
 */
document.addEventListener('DOMContentLoaded', function() {
    ReactDOM.render(
        React.createElement(GitHubHIndexApp),
        document.getElementById('app')
    );
});