import React, { useState, useEffect } from 'react';
import TokenInput from './components/TokenInput';
import ResultsDisplay from './components/ResultsDisplay';
import ErrorDisplay from './components/ErrorDisplay';
import Footer from './components/Footer';
import MultiSearchResults from './components/MultiSearchResults';
import TrendComparisonView from './components/TrendComparisonView';
import TrendChart from './components/TrendChart';
import ShareButton from './components/ShareButton';
import TagInput from './components/TagInput';
import * as githubService from './services/githubService';
import * as trendTrackerService from './services/trendTrackerService';
import * as urlSharingUtils from './utils/urlSharing';

/**
 * Main application component with unified search interface
 */
function GitHubHIndexApp() {
    // Parse initial values from URL if available
    const urlParams = urlSharingUtils.parseUrlParams();
    
    // Common state for both functionalities
    const [searchInput, setSearchInput] = useState(urlParams.searchTerm || '');
    const [searchTerms, setSearchTerms] = useState(
        urlParams.searchTerm ? urlParams.searchTerm.split(';').map(term => term.trim()).filter(term => term) : []
    );
    const [dateLimit, setDateLimit] = useState(urlParams.dateLimit || '2023-01-01');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [githubToken, setGithubToken] = useState(localStorage.getItem('githubToken') || '');
    
    // H-Index specific state
    const [hIndexResults, setHIndexResults] = useState(null);
    const [multiHIndexResults, setMultiHIndexResults] = useState([]);
    
    // Trend Tracker specific state
    const [startYear, setStartYear] = useState(urlParams.startYear || new Date().getFullYear() - 3);
    const [endYear, setEndYear] = useState(urlParams.endYear || new Date().getFullYear());
    const [granularity, setGranularity] = useState(urlParams.granularity || 'year');
    const [metric, setMetric] = useState(urlParams.metric || 'repositories');
    const [chartData, setChartData] = useState(null);
    
    // Analysis options
    const [showHIndexAnalysis, setShowHIndexAnalysis] = useState(Boolean(urlParams.showHIndexAnalysis) || false);
    const [showTrendAnalysis, setShowTrendAnalysis] = useState(Boolean(urlParams.showTrendAnalysis) || true);

    // Save token to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('githubToken', githubToken);
    }, [githubToken]);

    // Add a search term
    const addSearchTerm = () => {
        if (!searchInput.trim()) return;
        
        // Split the input by semicolons and process each term
        const terms = searchInput.split(';').map(term => term.trim()).filter(term => term);
        
        // Add each term if it's not already in the list
        const newTerms = [...searchTerms];
        let addedCount = 0;
        
        terms.forEach(term => {
            if (!newTerms.includes(term)) {
                newTerms.push(term);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            setSearchTerms(newTerms);
            setSearchInput('');
        }
    };

    // Allow adding search term with Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSearchTerm();
        }
    };

    // Remove a search term
    const removeSearchTerm = (term) => {
        setSearchTerms(searchTerms.filter(t => t !== term));
    };

    // Process a single search term for H-Index
    const processSearchTermForHIndex = async (term) => {
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

    // Handle form submission
    const handleSearch = async () => {
        if (searchTerms.length === 0) {
            setError('Please add at least one search term');
            return;
        }
        
        setIsLoading(true);
        setError(null);

        // Update URL with search parameters
        urlSharingUtils.updateSearchUrl(
            searchTerms.join(';'), 
            dateLimit,
            startYear,
            endYear,
            granularity,
            metric,
            showHIndexAnalysis,
            showTrendAnalysis
        );
        
        try {
            // Perform H-Index calculation if enabled
            if (showHIndexAnalysis) {
                if (searchTerms.length > 1) {
                    // Handle multiple search terms
                    const results = [];
                    
                    for (const term of searchTerms) {
                        try {
                            const result = await processSearchTermForHIndex(term);
                            results.push(result);
                        } catch (err) {
                            console.error(`Error processing term "${term}":`, err);
                            // Continue with other terms even if one fails
                        }
                    }
                    
                    setMultiHIndexResults(results);
                    setHIndexResults(null); // Clear single result when showing multiple
                } else {
                    // Handle single search term
                    const result = await processSearchTermForHIndex(searchTerms[0]);
                    setHIndexResults(result);
                    setMultiHIndexResults([]); // Clear multiple results when showing single
                }
            }
            
            // Perform trend analysis if enabled
            if (showTrendAnalysis && githubToken) {
                const timeWindows = trendTrackerService.generateTimeWindows(
                    startYear, 
                    endYear, 
                    granularity
                );
                
                // Fetch regular metric data
                const data = await trendTrackerService.compareSearchTerms(
                    searchTerms,
                    timeWindows,
                    metric,
                    githubToken
                );
                
                setChartData(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-4">
                GitHub Trends Analysis
            </h1>
            
            {/* Token Input */}
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <TokenInput githubToken={githubToken} setGithubToken={setGithubToken} />
            </div>
            
            {/* Unified Search Interface */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
               
                {/* Search terms input - using the new TagInput component */}
                <h3 className="font-bold mb-2">Search Terms</h3>
                <div className="mb-4">
                    <TagInput 
                        tags={searchTerms}
                        setTags={setSearchTerms}
                        onAnalyze={handleSearch}
                        isLoading={isLoading}
                    />
                </div>
                

                
                {/* Analysis Options */}
                <div className="mb-4">
                    <h3 className="font-bold mb-2">Trends Analysis</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showTrendAnalysis"
                                className="mr-2"
                                checked={showTrendAnalysis}
                                onChange={(e) => setShowTrendAnalysis(e.target.checked)}
                            />
                            <label htmlFor="showTrendAnalysis">Show Trends</label>
                        </div>
                    </div>
                </div>
                
                {/* Conditional Trend Settings */}
                {showTrendAnalysis && (
                    <div className="bg-gray-50 p-4 rounded mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Start Year */}
                            <div>
                                <label className="block text-gray-700 mb-2">Start Year</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                >
                                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 14 + i).map(year => (
                                        <option key={`start-${year}`} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* End Year */}
                            <div>
                                <label className="block text-gray-700 mb-2">End Year</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={endYear}
                                    onChange={(e) => setEndYear(e.target.value)}
                                >
                                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 14 + i).map(year => (
                                        <option key={`end-${year}`} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Granularity */}
                            <div>
                                <label className="block text-gray-700 mb-2">Time Granularity</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={granularity}
                                    onChange={(e) => setGranularity(e.target.value)}
                                >
                                    <option value="year">Yearly</option>
                                    <option value="quarter">Quarterly</option>
                                    <option value="month">Monthly</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Metric selection */}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Metric</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={metric}
                                onChange={(e) => setMetric(e.target.value)}
                            >
                                <option value="repositories">Repository Count</option>
                                <option value="prs">Pull Request Count</option>
                                <option value="issues">Issue Count</option>
                            </select>
                        </div>
                    </div>
                )}

                    {/* H-Index Options */}
                    <div className="mb-4">
                    <h3 className="font-bold mb-2">H-Index Analysis</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="showHIndexAnalysis"
                                className="mr-2"
                                checked={showHIndexAnalysis}
                                onChange={(e) => setShowHIndexAnalysis(e.target.checked)}
                            />
                            <label htmlFor="showHIndexAnalysis">Calculate H-Index</label>
                        </div>
                    </div>
                </div>

                {/* Basic date limit filter (common for both analyses) */}
                {showHIndexAnalysis && (
                    <div className="bg-gray-50 p-4 rounded mb-4">
                    <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="dateLimit">
                        Repositories Created After
                    </label>
                    <input
                        id="dateLimit"
                        type="date"
                        className="w-full p-2 border rounded"
                        value={dateLimit}
                        onChange={(e) => setDateLimit(e.target.value)}
                    />
                </div>
                </div>
                )}
            </div>
            
            
            {/* Error display */}
            <ErrorDisplay error={error} />
            
            {/* Token warning for trend analysis */}
            {showTrendAnalysis && !githubToken && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                    <p>GitHub token is required for trend analysis. Please add a token above.</p>
                </div>
            )}
            
            {/* Results Section */}
            {/* Trend Chart if trend analysis is enabled */}
            {showTrendAnalysis && chartData && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-2xl font-bold mb-4">Trend Analysis</h2>
                    
                    {/* Use the TrendChart component */}
                    <TrendChart 
                        chartData={chartData} 
                        metric={metric} 
                    />
                    
                    {/* Trend comparison table */}
                    <TrendComparisonView
                        chartData={chartData}
                        metric={metric}
                        useWindowedHIndex={false}
                    />
                </div>
            )}
            
            {/* H-Index results if H-Index analysis is enabled */}
            {showHIndexAnalysis && (
                <>
                    {multiHIndexResults.length > 0 ? (
                        <MultiSearchResults multiResults={multiHIndexResults} />
                    ) : (
                        <ResultsDisplay results={hIndexResults} />
                    )}
                </>
            )}
            
            {/* Share Button for both functionalities */}
            {(showHIndexAnalysis && (hIndexResults || multiHIndexResults.length > 0)) || 
             (showTrendAnalysis && chartData) ? (
                <div className="flex justify-center my-6">
                    <ShareButton 
                        settings={{
                            searchTerm: searchTerms.join(';'),
                            dateLimit,
                            startYear,
                            endYear,
                            granularity,
                            metric,
                            showHIndexAnalysis,
                            showTrendAnalysis
                        }}
                    />
                </div>
            ) : null}
            
            <Footer />
        </div>
    );
}

export default GitHubHIndexApp;