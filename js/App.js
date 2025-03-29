/**
 * Main application component
 */
function GitHubHIndexApp() {
    const { useState, useEffect } = React;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateLimit, setDateLimit] = useState('2023-01-01');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [githubToken, setGithubToken] = useState(localStorage.getItem('githubToken') || '');

    // Save token to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('githubToken', githubToken);
    }, [githubToken]);

    const searchGitHub = async () => {
        if (!searchTerm) {
            setError('Please enter a search term');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch and calculate the Star H-Index first (sorted by stars)
            const starResult = await githubService.fetchAndCalculateHIndex(
                searchTerm, 
                dateLimit, 
                'stargazers_count', 
                'stars',
                githubToken
            );
            
            // Then fetch and calculate the Fork H-Index (sorted by forks)
            const forkResult = await githubService.fetchAndCalculateHIndex(
                searchTerm, 
                dateLimit, 
                'forks_count', 
                'forks',
                githubToken
            );
            
            // Use combined repos from both fetches
            const allRepos = [...new Map(
                [...starResult.repos, ...forkResult.repos].map(repo => [repo.id, repo])
            ).values()];
            
            // Sort for display
            const topStarredRepos = [...allRepos]
                .sort((a, b) => b.stargazers_count - a.stargazers_count)
                .slice(0, 10);
                
            const topForkedRepos = [...allRepos]
                .sort((a, b) => b.forks_count - a.forks_count)
                .slice(0, 10);
            
            setResults({
                searchTerm,
                dateLimit,
                starHIndex: starResult.hIndex,
                forkHIndex: forkResult.hIndex,
                totalRepos: allRepos.length,
                topStarredRepos,
                topForkedRepos
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return React.createElement(
        'div',
        { className: 'max-w-4xl mx-auto' },
        React.createElement(
            'h1',
            { className: 'text-3xl font-bold text-center mb-8' },
            'GitHub H-Index Calculator'
        ),
        React.createElement(SearchForm, {
            searchTerm,
            setSearchTerm,
            dateLimit,
            setDateLimit,
            isLoading,
            handleSearch: searchGitHub,
            githubToken,
            setGithubToken
        }),
        React.createElement(ErrorDisplay, { error }),
        React.createElement(ResultsDisplay, { results }),
        React.createElement(Footer)
    );
}