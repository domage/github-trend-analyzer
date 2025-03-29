/**
 * Main application component
 */
function GitHubHIndexApp() {
    const { useState, useEffect } = React;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateLimit, setDateLimit] = useState('2023-01-01');
    const [results, setResults] = useState(null);
    const [multiResults, setMultiResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [githubToken, setGithubToken] = useState(localStorage.getItem('githubToken') || '');

    // Save token to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('githubToken', githubToken);
    }, [githubToken]);

    // Process a single search term
    const processSearchTerm = async (term) => {
        // Fetch and calculate the Star H-Index first (sorted by stars)
        const starResult = await githubService.fetchAndCalculateHIndex(
            term, 
            dateLimit, 
            'stargazers_count', 
            'stars',
            githubToken
        );
        
        // Then fetch and calculate the Fork H-Index (sorted by forks)
        const forkResult = await githubService.fetchAndCalculateHIndex(
            term, 
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
            
        // Get additional counts for total repositories, pull requests and discussions
        const [totalReposCount, totalPRsCount, totalDiscussionsCount] = await Promise.all([
            githubService.getTotalCount(term, dateLimit, 'repositories', githubToken),
            githubService.getTotalCount(term, dateLimit, 'pull_requests', githubToken),
            githubService.getTotalCount(term, dateLimit, 'discussions', githubToken)
        ]);
        
        return {
            searchTerm: term,
            dateLimit,
            starHIndex: starResult.hIndex,
            forkHIndex: forkResult.hIndex,
            totalRepos: totalReposCount,
            analyzedRepos: allRepos.length,
            totalPRs: totalPRsCount,
            totalDiscussions: totalDiscussionsCount,
            topStarredRepos,
            topForkedRepos,
            githubToken: !!githubToken // Include token availability flag
        };
    };

    const searchGitHub = async () => {
        if (!searchTerm) {
            setError('Please enter a search term');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Check if there are multiple search terms separated by semicolons
            const searchTerms = searchTerm.split(';').map(term => term.trim()).filter(term => term);
            
            if (searchTerms.length > 1) {
                // Handle multiple search terms
                const results = [];
                
                for (const term of searchTerms) {
                    try {
                        const result = await processSearchTerm(term);
                        results.push(result);
                    } catch (err) {
                        console.error(`Error processing term "${term}":`, err);
                        // Continue with other terms even if one fails
                    }
                }
                
                setMultiResults(results);
                setResults(null); // Clear single result when showing multiple
            } else {
                // Handle single search term
                const result = await processSearchTerm(searchTerm);
                setResults(result);
                setMultiResults([]); // Clear multiple results when showing single
            }
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
        
        // Show either single result or multiple results table based on what we have
        multiResults.length > 0 
            ? React.createElement(MultiSearchResults, { multiResults }) 
            : React.createElement(ResultsDisplay, { results }),
            
        React.createElement(Footer)
    );
}