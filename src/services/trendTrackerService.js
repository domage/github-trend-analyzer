/**
 * Trend Tracker Service - Handles time-based trend analysis via GitHub GraphQL API
 */
import { calculateHIndex } from '../utils';
import * as analyticsService from './analyticsService';

/**
 * Fetch time-series data for a search term using GraphQL
 * 
 * @param {string} searchTerm - The search term to analyze
 * @param {Array} timeWindows - Array of time windows (e.g. [{start: '2020-01-01', end: '2020-12-31'}])
 * @param {string} githubToken - GitHub API token (required for GraphQL)
 * @param {string} metric - Metric to track ('repositories', 'stars', 'prs', 'issues')
 * @returns {Object} - Time series data for the requested metric
 */
export async function fetchTimeSeries(searchTerm, timeWindows, githubToken, metric = 'repositories') {
    if (!githubToken) {
        analyticsService.logError('trend_analysis', 'Missing GitHub token');
        throw new Error('GitHub token is required for time trend analysis');
    }
    
    const startTime = performance.now();
    let success = true;
    
    // Build the GraphQL query for all time windows in a single request
    let queryString = 'query {';
    
    timeWindows.forEach((window, index) => {
        // Create a unique alias for each time period query
        const periodAlias = `period${index}`;
        
        // Base query with time window
        const baseQuery = `${searchTerm} created:${window.start}..${window.end}`;
        
        // Add repository count query for this period
        // ${metric === 'stars' ? 'starCount: nodes(first: 0) { stargazerCount }' : ''}
        queryString += `
            ${periodAlias}: search(query: "${baseQuery}", type: REPOSITORY, first: 0) {
                repositoryCount
            }
        `;
        
        // Add pull requests and issues if requested
        if (metric === 'prs' || metric === 'all') {
            queryString += `
                ${periodAlias}_prs: search(query: "${baseQuery} is:pr", type: ISSUE, first: 0) {
                    issueCount
                }
            `;
        }
        
        if (metric === 'issues' || metric === 'all') {
            queryString += `
                ${periodAlias}_issues: search(query: "${baseQuery} is:issue", type: ISSUE, first: 0) {
                    issueCount
                }
            `;
        }
    });
    
    queryString += '}';
    
    try {
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: queryString })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            analyticsService.logError('trend_graphql_api', `Status ${response.status}`);
            throw new Error(`GitHub GraphQL API returned ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            analyticsService.logError('trend_graphql_error', result.errors[0].message);
            throw new Error(`GraphQL Error: ${result.errors[0].message}`);
        }
        
        // Process and format the results
        return processTimeSeriesData(result.data, timeWindows, metric);
    } catch (error) {
        console.error('Error fetching time series data:', error);
        success = false;
        analyticsService.logError('trend_fetch', error.message);
        throw error;
    } finally {
        // Log API performance
        const duration = performance.now() - startTime;
        analyticsService.logApiPerformance('TrendGraphQL', duration, success);
    }
}

/**
 * Process raw GraphQL response into formatted time series data
 * 
 * @param {Object} data - Raw GraphQL response
 * @param {Array} timeWindows - Array of time windows
 * @param {string} metric - Metric requested
 * @returns {Array} - Formatted time series data
 */
export function processTimeSeriesData(data, timeWindows, metric) {
    const timeSeriesData = [];
    
    timeWindows.forEach((window, index) => {
        const periodAlias = `period${index}`;
        const timePoint = {
            period: formatPeriodLabel(window),
            startDate: window.start,
            endDate: window.end
        };
        
        // Add repository count
        if (data[periodAlias]) {
            timePoint.repositoryCount = data[periodAlias].repositoryCount;
        }
        
        // Add PR count if available
        if (data[`${periodAlias}_prs`]) {
            timePoint.prCount = data[`${periodAlias}_prs`].issueCount;
        }
        
        // Add issue count if available
        if (data[`${periodAlias}_issues`]) {
            timePoint.issueCount = data[`${periodAlias}_issues`].issueCount;
        }
        
        timeSeriesData.push(timePoint);
    });
    
    return timeSeriesData;
}

/**
 * Generate time windows for analysis
 * 
 * @param {string} startYear - Starting year
 * @param {string} endYear - Ending year
 * @param {string} granularity - Time granularity ('year', 'quarter', 'month')
 * @returns {Array} - Array of time window objects
 */
export function generateTimeWindows(startYear, endYear, granularity = 'year') {
    const timeWindows = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Calculate current quarter (1-4)
    const currentQuarter = Math.ceil(currentMonth / 3);
    
    if (granularity === 'year') {
        // Generate yearly windows
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            // Skip current year since it's incomplete
            if (year === currentYear) {
                continue;
            }
            
            timeWindows.push({
                start: `${year}-01-01`,
                end: `${year}-12-31`
            });
        }
    } else if (granularity === 'quarter') {
        // Generate quarterly windows
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            for (let quarter = 1; quarter <= 4; quarter++) {
                // Skip current quarter and beyond in current year
                if (year === currentYear && quarter >= currentQuarter) {
                    continue;
                }
                
                const startMonth = (quarter - 1) * 3 + 1;
                const endMonth = quarter * 3;
                const endDay = endMonth === 2 ? (isLeapYear(year) ? 29 : 28) : 
                            [4, 6, 9, 11].includes(endMonth) ? 30 : 31;
                
                timeWindows.push({
                    start: `${year}-${String(startMonth).padStart(2, '0')}-01`,
                    end: `${year}-${String(endMonth).padStart(2, '0')}-${endDay}`
                });
            }
        }
    } else if (granularity === 'month') {
        // Generate monthly windows
        for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
            for (let month = 1; month <= 12; month++) {
                // Skip current month and beyond in current year
                if (year === currentYear && month >= currentMonth) {
                    continue;
                }
                
                const endDay = month === 2 ? (isLeapYear(year) ? 29 : 28) : 
                            [4, 6, 9, 11].includes(month) ? 30 : 31;
                
                timeWindows.push({
                    start: `${year}-${String(month).padStart(2, '0')}-01`,
                    end: `${year}-${String(month).padStart(2, '0')}-${endDay}`
                });
            }
        }
    }
    
    return timeWindows;
}

/**
 * Check if a year is a leap year
 * 
 * @param {number} year - Year to check
 * @returns {boolean} - True if leap year
 */
export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Format a period label for display
 * 
 * @param {Object} window - Time window object
 * @returns {string} - Formatted label
 */
export function formatPeriodLabel(window) {
    const startDate = new Date(window.start);
    const endDate = new Date(window.end);
    
    // If start and end are in the same month
    if (startDate.getFullYear() === endDate.getFullYear() && 
        startDate.getMonth() === endDate.getMonth()) {
        return `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getFullYear()}`;
    }
    
    // If start and end are in the same year but different quarters
    if (startDate.getFullYear() === endDate.getFullYear() && 
        Math.floor(startDate.getMonth() / 3) === Math.floor(endDate.getMonth() / 3)) {
        const quarter = Math.floor(startDate.getMonth() / 3) + 1;
        return `Q${quarter} ${startDate.getFullYear()}`;
    }
    
    // If start and end span a full year
    if (startDate.getMonth() === 0 && startDate.getDate() === 1 && 
        endDate.getMonth() === 11 && endDate.getDate() === 31) {
        return `${startDate.getFullYear()}`;
    }
    
    // Default: show range
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
}

/**
 * Calculate windowed H-Index for repositories created in a specific time window
 * 
 * @param {string} searchTerm - Search term
 * @param {string} startDate - Start date of window
 * @param {string} endDate - End date of window
 * @param {string} property - Property to calculate H-Index on ('stargazers_count' or 'forks_count')
 * @param {string} githubToken - GitHub API token
 * @returns {Promise<number>} - Windowed H-Index
 */
export async function calculateWindowedHIndex(searchTerm, startDate, endDate, property, githubToken) {
    if (!githubToken) {
        analyticsService.logError('windowed_hindex', 'Missing GitHub token');
        throw new Error('GitHub token is required for windowed H-Index calculation');
    }
    
    const startTime = performance.now();
    let success = true;
    
    // Map REST API property names to GraphQL property names
    const propertyMap = {
        'stargazers_count': 'stargazerCount',
        'forks_count': 'forkCount'
    };
    
    const graphqlProperty = propertyMap[property] || property;
    
    let allRepos = [];
    let hasNextPage = true;
    let endCursor = null;
    
    // GraphQL API endpoint
    const url = 'https://api.github.com/graphql';
    
    while (hasNextPage) {
        // Construct the pagination part of the query
        const afterClause = endCursor ? `, after: "${endCursor}"` : '';
        
        // Build the GraphQL query filtered by creation date
        const query = `
        query {
          search(
            query: "${searchTerm} created:${startDate}..${endDate}"
            type: REPOSITORY
            first: 100
            ${afterClause}
          ) {
            repositoryCount
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              ... on Repository {
                id
                stargazerCount
                forkCount
              }
            }
          }
        }`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error(`GitHub GraphQL API returned ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.errors) {
                throw new Error(`GraphQL Error: ${result.errors[0].message}`);
            }
            
            const searchData = result.data.search;
            
            // Transform GraphQL data to match the expected format for H-Index calculation
            const repos = searchData.nodes.map(node => ({
                id: node.id,
                stargazers_count: node.stargazerCount,
                forks_count: node.forkCount
            }));
            
            allRepos = [...allRepos, ...repos];
            
            // Update pagination info for next iteration
            hasNextPage = searchData.pageInfo.hasNextPage;
            endCursor = searchData.pageInfo.endCursor;
            
            // Stop fetching more data if we have enough repos or reached the API limit
            if (allRepos.length >= 1000) {
                break;
            }
        } catch (error) {
            console.error('GraphQL fetch error:', error);
            success = false;
            analyticsService.logError('windowed_hindex_fetch', error.message);
            throw error;
        }
    }
    
    try {
        // Calculate H-Index using the imported utility function
        const hIndex = calculateHIndex(allRepos, property);
        return hIndex;
    } finally {
        // Log API performance
        const duration = performance.now() - startTime;
        analyticsService.logApiPerformance('WindowedHIndex', duration, success);
    }
}

/**
 * Compare multiple search terms over time
 * 
 * @param {Array} searchTerms - Array of search terms to compare
 * @param {Array} timeWindows - Array of time windows
 * @param {string} metric - Metric to track
 * @param {string} githubToken - GitHub API token
 * @returns {Object} - Comparative time series data
 */
/**
 * Determine granularity from time windows
 * @param {Array} timeWindows - Array of time windows
 * @returns {string} - Granularity ('year', 'quarter', 'month', or 'unknown')
 */
function getGranularityFromWindows(timeWindows) {
    if (!timeWindows || timeWindows.length === 0) return 'unknown';
    
    // Check the first window
    const window = timeWindows[0];
    const start = new Date(window.start);
    const end = new Date(window.end);
    
    // Check if it's a full year
    if (start.getMonth() === 0 && start.getDate() === 1 && 
        end.getMonth() === 11 && end.getDate() === 31 && 
        start.getFullYear() === end.getFullYear()) {
        return 'year';
    }
    
    // Check if it's a quarter (3 months)
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    if (monthDiff === 2 && start.getDate() === 1) {
        return 'quarter';
    }
    
    // Check if it's a month
    if (start.getFullYear() === end.getFullYear() && 
        start.getMonth() === end.getMonth() && 
        start.getDate() === 1) {
        return 'month';
    }
    
    return 'custom';
}

export async function compareSearchTerms(searchTerms, timeWindows, metric, githubToken) {
    const results = {};
    
    // Log the trend analysis request
    analyticsService.logSearch({
        searchTerms,
        metric,
        granularity: timeWindows.length > 0 ? getGranularityFromWindows(timeWindows) : 'unknown',
        showTrendAnalysis: true
    });
    
    // Fetch data for each search term
    for (const term of searchTerms) {
        try {
            const termData = await fetchTimeSeries(term, timeWindows, githubToken, metric);
            results[term] = termData;
        } catch (error) {
            console.error(`Error fetching data for term "${term}":`, error);
            analyticsService.logError('trend_term_fetch', `Term: ${term}, Error: ${error.message}`);
            results[term] = { error: error.message };
        }
    }
    
    return results;
}
