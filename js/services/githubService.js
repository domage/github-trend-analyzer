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
            totalFetched: Math.min(totalItems, repos.length)
        };
    }
};