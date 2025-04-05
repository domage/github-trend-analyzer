/**
 * GitHub service module to handle API interactions
 */
import { calculateHIndex } from '../utils';
import * as analyticsService from './analyticsService';

/**
 * Fetch repositories and calculate H-Index using GraphQL or REST API
 * 
 * @param {string} searchTerm - Search term for GitHub repositories
 * @param {string} dateLimit - Date limit for repository creation
 * @param {string} property - Property to calculate H-Index on ('stargazers_count' or 'forks_count')
 * @param {string} sortParam - GitHub API sort parameter ('stars' or 'forks')
 * @param {string} githubToken - Optional GitHub API token
 * @returns {Object} - Object containing H-Index, repositories, and fetch details
 */
export async function fetchAndCalculateHIndex(searchTerm, dateLimit, property, sortParam, githubToken) {
    // Use GraphQL if token is available, otherwise fall back to REST
    const startTime = performance.now();
    let result;
    let success = true;
    
    try {
        if (githubToken) {
            result = await fetchAndCalculateHIndexGraphQL(searchTerm, dateLimit, property, githubToken);
        } else {
            result = await fetchAndCalculateHIndexREST(searchTerm, dateLimit, property, sortParam);
        }
    } catch (error) {
        success = false;
        throw error;
    } finally {
        // Log API performance
        const duration = performance.now() - startTime;
        const apiType = githubToken ? 'GraphQL' : 'REST';
        analyticsService.logApiPerformance(apiType, duration, success);
    }
    
    return result;
}

/**
 * Fetch repositories and calculate H-Index using GraphQL API
 * 
 * @param {string} searchTerm - Search term for GitHub repositories
 * @param {string} dateLimit - Date limit for repository creation
 * @param {string} property - Property to calculate H-Index on ('stargazerCount' or 'forkCount')
 * @param {string} githubToken - GitHub API token
 * @returns {Object} - Object containing H-Index, repositories, and fetch details
 */
export async function fetchAndCalculateHIndexGraphQL(searchTerm, dateLimit, property, githubToken) {
    // Map REST API property names to GraphQL property names
    const propertyMap = {
        'stargazers_count': 'stargazerCount',
        'forks_count': 'forkCount'
    };
    
    const graphqlProperty = propertyMap[property] || property;
    
    // Build the sort argument based on the property
    const sortField = graphqlProperty === 'stargazerCount' ? 'STARS' : 'FORKS';
    
    let allRepos = [];
    let hasNextPage = true;
    let endCursor = null;
    let totalCount = 0;
    
    // GraphQL API endpoint
    const url = 'https://api.github.com/graphql';
    
    while (hasNextPage) {
        // Construct the pagination part of the query
        const afterClause = endCursor ? `, after: "${endCursor}"` : '';
        
        // Build the GraphQL query
        const query = `
        query {
          search(
            query: "${searchTerm} created:>${dateLimit}"
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
                name
                owner {
                  login
                }
                nameWithOwner
                url
                stargazerCount
                forkCount
                createdAt
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
                const errorText = await response.text();
                analyticsService.logError('graphql_api', `Status ${response.status}`);
                throw new Error(`GitHub GraphQL API returned ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.errors) {
                analyticsService.logError('graphql_error', result.errors[0].message);
                throw new Error(`GraphQL Error: ${result.errors[0].message}`);
            }
            
            const searchData = result.data.search;
            totalCount = searchData.repositoryCount;
            
            // Transform GraphQL data to match the REST API format
            const repos = searchData.nodes.map(node => ({
                id: node.id,
                name: node.name,
                full_name: node.nameWithOwner,
                html_url: node.url,
                stargazers_count: node.stargazerCount,
                forks_count: node.forkCount,
                // Add other fields for compatibility with the REST API format
                owner: {
                    login: node.owner.login
                },
                created_at: node.createdAt
            }));
            
            allRepos = [...allRepos, ...repos];
            
            // Update pagination info for next iteration
            hasNextPage = searchData.pageInfo.hasNextPage;
            endCursor = searchData.pageInfo.endCursor;
            
            // Calculate current H-Index with the repositories we have so far
            const currentHIndex = calculateHIndex(allRepos, property);
            
            // Stop fetching more data if we've fetched enough to determine the H-Index
            if (allRepos.length >= currentHIndex * 3 && allRepos.length >= 100) {
                // We've likely found the true H-Index
                break;
            }
            
            // Limit to a reasonable number of pages to avoid excessive API usage
            if (allRepos.length >= 500) {
                break;
            }
        } catch (error) {
            console.error('GraphQL fetch error:', error);
            analyticsService.logError('graphql_fetch', error.message);
            throw error;
        }
    }
    
    return {
        hIndex: calculateHIndex(allRepos, property),
        repos: allRepos,
        totalItems: totalCount,
        totalFetched: allRepos.length
    };
}

/**
 * Fetch repositories and calculate H-Index using REST API (fallback method)
 * 
 * @param {string} searchTerm - Search term for GitHub repositories
 * @param {string} dateLimit - Date limit for repository creation
 * @param {string} property - Property to calculate H-Index on ('stargazers_count' or 'forks_count')
 * @param {string} sortParam - GitHub API sort parameter ('stars' or 'forks')
 * @returns {Object} - Object containing H-Index, repositories, and fetch details
 */
export async function fetchAndCalculateHIndexREST(searchTerm, dateLimit, property, sortParam) {
    let repos = [];
    let page = 1;
    let currentHIndex = 0;
    let hasMoreRepos = true;
    let reachedHIndex = false;
    let totalItems = 0;
    const perPage = 100; // Maximum allowed by GitHub API
    
    while (hasMoreRepos && page <= 10 && !reachedHIndex) {
        const query = encodeURIComponent(`${searchTerm} created:>${dateLimit}`);
        const url = `https://api.github.com/search/repositories?q=${query}&sort=${sortParam}&order=desc&page=${page}&per_page=${perPage}`;
        
        const headers = {
            'Accept': 'application/vnd.github+json'
        };
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            const errorText = await response.text();
            analyticsService.logError('rest_api', `Status ${response.status}`);
            throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        totalItems = data.total_count;
        
        if (data.items && data.items.length > 0) {
            repos = [...repos, ...data.items];
            
            // Check if we've reached the h-index with the current set of repos
            const tempHIndex = calculateHIndex(repos, property);
            
            // If h-index hasn't increased or we've reached theoretical maximum, stop fetching
            if (tempHIndex > currentHIndex) {
                currentHIndex = tempHIndex;
                
                // If the current count of repos is significantly greater than the h-index,
                // we've likely found the true h-index
                if (repos.length >= currentHIndex * 2 && repos[currentHIndex-1][property] === currentHIndex && 
                    (repos.length === data.total_count || repos.length >= currentHIndex * 3)) {
                    reachedHIndex = true;
                }
            } else if (repos.length >= perPage * 2 && tempHIndex === currentHIndex) {
                // If h-index hasn't improved after fetching 200+ repositories, likely found it
                reachedHIndex = true;
            }
            
            if (data.items.length < perPage) {
                hasMoreRepos = false;
            }
        } else {
            hasMoreRepos = false;
        }
        
        page++;
    }
    
    return {
        hIndex: currentHIndex,
        repos,
        totalItems,
        totalFetched: Math.min(totalItems, repos.length)
    };
}

/**
 * Get multiple metrics in a single GraphQL query
 * 
 * @param {string} searchTerm - Search term
 * @param {string} dateLimit - Date limit for item creation
 * @param {string} githubToken - GitHub API token
 * @returns {Object} - Object containing various counts and metrics
 */
export async function getMetricsWithGraphQL(searchTerm, dateLimit, githubToken) {
    if (!githubToken) {
        return null; // GraphQL requires a token
    }
    
    const query = `
    query {
      repositories: search(query: "${searchTerm} created:>${dateLimit}", type: REPOSITORY, first: 0) {
        repositoryCount
      }
      pullRequests: search(query: "${searchTerm} created:>${dateLimit} is:pr", type: ISSUE, first: 0) {
        issueCount
      }
      discussions: search(query: "${searchTerm} created:>${dateLimit}", type: DISCUSSION, first: 0) {
        discussionCount
      }
    }`;
    
    try {
        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) {
            console.warn(`GitHub GraphQL API returned ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.errors) {
            console.warn('GraphQL errors:', data.errors);
            return null;
        }
        
        return {
            totalRepos: data.data.repositories.repositoryCount,
            totalPRs: data.data.pullRequests.issueCount,
            totalDiscussions: data.data.discussions.discussionCount
        };
    } catch (error) {
        console.error('Error fetching metrics with GraphQL:', error);
        return null;
    }
}

/**
 * Get total count of items matching the search query for different GitHub item types
 * Using REST API as fallback when no token is available
 * 
 * @param {string} searchTerm - Search term
 * @param {string} dateLimit - Date limit for item creation
 * @param {string} itemType - Type of GitHub items to search ('repositories', 'issues', 'discussions')
 * @param {string} githubToken - Optional GitHub API token
 * @returns {number} - Total count of matching items
 */
export async function getTotalCount(searchTerm, dateLimit, itemType, githubToken) {
    const query = encodeURIComponent(`${searchTerm} created:>${dateLimit}`);
    
    // For discussions, we need the GraphQL API which requires a token
    if (itemType === 'discussions') {
        if (!githubToken) {
            return 0; // Can't fetch discussions without a token
        }
        
        try {
            const graphqlUrl = 'https://api.github.com/graphql';
            const graphqlQuery = {
                query: `
                query {
                    search(query: "${searchTerm} created:>${dateLimit}", type: DISCUSSION, first: 0) {
                        discussionCount
                    }
                }
                `
            };
            
            const response = await fetch(graphqlUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(graphqlQuery)
            });
            
            if (!response.ok) {
                console.warn(`GitHub GraphQL API returned ${response.status} for discussions count`);
                return 0;
            }
            
            const data = await response.json();
            
            if (data.errors) {
                console.warn('GraphQL errors:', data.errors);
                return 0;
            }
            
            return data.data?.search?.discussionCount || 0;
        } catch (error) {
            console.error('Error fetching discussions count with GraphQL:', error);
            return 0;
        }
    } else {
        // For repositories and pull requests, use the REST API
        let url;
        if (itemType === 'repositories') {
            url = `https://api.github.com/search/repositories?q=${query}&per_page=1`;
        } else if (itemType === 'pull_requests') {
            url = `https://api.github.com/search/issues?q=${query}+is:pr&per_page=1`;
        } else {
            throw new Error(`Unknown item type: ${itemType}`);
        }
        
        try {
            const headers = {
                'Accept': 'application/vnd.github+json'
            };
            
            if (githubToken) {
                headers['Authorization'] = `Bearer ${githubToken}`;
            }
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                console.warn(`GitHub API returned ${response.status} for ${itemType} count`);
                return 0;
            }
            
            const data = await response.json();
            return data.total_count || 0;
        } catch (error) {
            console.error(`Error fetching ${itemType} count:`, error);
            analyticsService.logError('count_fetch', `${itemType}: ${error.message}`);
            return 0;
        }
    }
}
