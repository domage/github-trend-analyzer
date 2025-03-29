/**
 * Calculate the H-Index from a list of repositories based on a specified property
 * 
 * @param {Array} repos - Array of repository objects
 * @param {string} property - The property to calculate H-Index on (e.g., 'stargazers_count')
 * @returns {number} - The calculated H-Index
 */
function calculateHIndex(repos, property) {
    // Sort repositories by the given property (stars or forks) in descending order
    const sortedRepos = [...repos].sort((a, b) => b[property] - a[property]);
    
    // Find the h-index
    let hIndex = 0;
    for (let i = 0; i < sortedRepos.length; i++) {
        if (sortedRepos[i][property] >= i + 1) {
            hIndex = i + 1;
        } else {
            break;
        }
    }
    
    return hIndex;
}

/**
 * Format a number with thousands separators for better readability
 * 
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}