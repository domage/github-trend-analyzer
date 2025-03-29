/**
 * GitHub service module to handle API interactions
 */
const githubService = {
    /**
     * Fetch repositories and calculate H-Index based on a property (stars or forks)
     * 
     * @param {string} searchTerm - Search term for GitHub repositories
     * @param {string} dateLimit - Date limit for repository creation
     * @param {string} property - Property to calculate H-Index on ('stargazers_count' or 'forks_count')
     * @param {string} sortParam - GitHub API sort parameter ('stars' or 'forks')
     * @param {string} githubToken - Optional GitHub API token
     * @returns {Object} - Object containing H-Index, repositories, and fetch details
     */
    async fetchAndCalculateHIndex(searchTerm, dateLimit, property, sortParam, githubToken) {
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
            
            if (githubToken) {
                headers['Authorization'] = `Bearer ${githubToken}`;
            }
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${await response.text()}`);
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
    },

    /**
     * Get total count of items matching the search query for different GitHub item types
     * 
     * @param {string} searchTerm - Search term
     * @param {string} dateLimit - Date limit for item creation
     * @param {string} itemType - Type of GitHub items to search ('repositories', 'issues', 'discussions')
     * @param {string} githubToken - Optional GitHub API token
     * @returns {number} - Total count of matching items
     */
    async getTotalCount(searchTerm, dateLimit, itemType, githubToken) {
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
                return 0;
            }
        }
    }
};