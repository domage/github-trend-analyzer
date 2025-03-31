/**
 * Utility functions for URL parameter handling and sharing
 */

/**
 * Parse URL parameters into an object
 * @returns {Object} Parsed URL parameters
 */
export function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        searchTerm: params.get('search'),
        dateLimit: params.get('date') || '2023-01-01',
        startYear: parseInt(params.get('startYear')) || new Date().getFullYear() - 3,
        endYear: parseInt(params.get('endYear')) || new Date().getFullYear(),
        granularity: params.get('granularity') || 'year',
        metric: params.get('metric') || 'repositories',
        showHIndexAnalysis: params.get('showHIndex') === 'true',
        showTrendAnalysis: params.get('showTrend') === 'true'
    };
}

/**
 * Update URL with unified search parameters
 * @param {string} searchTerm - Search term or multiple terms separated by ;
 * @param {string} dateLimit - Date limit for repo creation
 * @param {number} startYear - Start year for trend analysis
 * @param {number} endYear - End year for trend analysis
 * @param {string} granularity - Time granularity for trend analysis
 * @param {string} metric - Metric type for trend analysis
 * @param {boolean} showHIndexAnalysis - Whether to show H-Index analysis
 * @param {boolean} showTrendAnalysis - Whether to show trend analysis
 */
export function updateSearchUrl(
    searchTerm, 
    dateLimit, 
    startYear, 
    endYear, 
    granularity, 
    metric, 
    showHIndexAnalysis,
    showTrendAnalysis
) {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (dateLimit) params.set('date', dateLimit);
    
    // Only add trend parameters if trend analysis is enabled
    if (showTrendAnalysis) {
        params.set('startYear', startYear);
        params.set('endYear', endYear);
        params.set('granularity', granularity);
        params.set('metric', metric);
    }
    
    // Add analysis option flags
    params.set('showHIndex', showHIndexAnalysis.toString());
    params.set('showTrend', showTrendAnalysis.toString());
    
    // Update URL without reloading page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

/**
 * Generate a shareable URL based on current settings
 * @param {Object} settings - Current application settings
 * @returns {string} Shareable URL
 */
export function generateShareableUrl(settings) {
    const params = new URLSearchParams();
    
    // Common parameters
    if (settings.searchTerm) params.set('search', settings.searchTerm);
    if (settings.dateLimit) params.set('date', settings.dateLimit);
    
    // Trend-specific parameters (only if trend analysis is enabled)
    if (settings.showTrendAnalysis) {
        if (settings.startYear) params.set('startYear', settings.startYear);
        if (settings.endYear) params.set('endYear', settings.endYear);
        if (settings.granularity) params.set('granularity', settings.granularity);
        if (settings.metric) params.set('metric', settings.metric);
    }
    
    // Analysis flags
    params.set('showHIndex', settings.showHIndexAnalysis?.toString() || 'false');
    params.set('showTrend', settings.showTrendAnalysis?.toString() || 'true');
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/**
 * Copy a shareable URL to clipboard
 * @param {Object} settings - Current application settings
 * @returns {Promise<boolean>} Success state
 */
export async function copyShareableUrl(settings) {
    const url = generateShareableUrl(settings);
    
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (err) {
        console.error('Failed to copy URL:', err);
        return false;
    }
}