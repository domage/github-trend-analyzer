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
    const [activeTab, setActiveTab] = useState('hindex'); // 'hindex' or 'trends'

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
            { className: 'text-3xl font-bold text-center mb-4' },
            'GitHub H-Index & Trends Calculator'
        ),
        
        // Token Input (shared across tabs)
        React.createElement(
            'div',
            { className: 'bg-white p-6 rounded-lg shadow-md mb-6' },
            React.createElement(TokenInput, { githubToken, setGithubToken })
        ),
        
        // Tab selector
        React.createElement(
            'div',
            { className: 'flex border-b mb-6' },
            React.createElement(
                'button',
                { 
                    className: `py-2 px-4 font-medium ${activeTab === 'hindex' ? 
                        'text-blue-500 border-b-2 border-blue-500' : 
                        'text-gray-500 hover:text-blue-500'}`,
                    onClick: () => setActiveTab('hindex')
                },
                'H-Index Calculator'
            ),
            React.createElement(
                'button',
                { 
                    className: `py-2 px-4 font-medium ${activeTab === 'trends' ? 
                        'text-blue-500 border-b-2 border-blue-500' : 
                        'text-gray-500 hover:text-blue-500'}`,
                    onClick: () => setActiveTab('trends')
                },
                'Trend Tracker'
            )
        ),
        
        // Tab content
        activeTab === 'hindex' ? (
            // H-Index Calculator Tab
            React.createElement(
                'div',
                null,
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
                    : React.createElement(ResultsDisplay, { results })
            )
        ) : (
            // Trend Tracker Tab
            React.createElement(TrendTracker, { githubToken })
        ),

        // GitHub repository link
        React.createElement(
            'div',
            { className: 'text-center mb-4' },
            React.createElement(
                'a',
                {
                    href: 'https://github.com/domage/github-trend-analyzer',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'text-blue-500 hover:underline flex items-center justify-center'
                },
                React.createElement(
                    'svg',
                    {
                        className: 'w-5 h-5 mr-1',
                        viewBox: '0 0 16 16',
                        fill: 'currentColor'
                    },
                    React.createElement(
                        'path',
                        {
                            fillRule: 'evenodd',
                            d: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'
                        }
                    )
                ),
                'View on GitHub'
            )
        ),
        
        React.createElement(Footer)
    );
}