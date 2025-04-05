/**
 * Analytics service for logging non-personal user activity
 */

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;

/**
 * Log search event to analytics
 * @param {Object} searchData - Data about the search
 */
export const logSearch = async (searchData) => {
  if (!ANALYTICS_ENDPOINT) return;
  
  try {
    // Only include non-personal data
    const analyticsData = {
      timestamp: new Date().toISOString(),
      searchTerms: searchData.searchTerms,
      dateLimit: searchData.dateLimit,
      features: {
        hIndex: searchData.showHIndexAnalysis,
        trends: searchData.showTrendAnalysis,
      },
      // Include metrics if available
      ...(searchData.metric && { metric: searchData.metric }),
      ...(searchData.granularity && { granularity: searchData.granularity }),
      // Include a session ID that's regenerated each time the app loads
      // This helps group requests without tracking users
      sessionId: getSessionId(),
    };
    
    // Send data to analytics endpoint
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
      // Use keepalive to ensure the request completes even if the page is being unloaded
      keepalive: true,
    });
  } catch (error) {
    // Silently fail - analytics should never break the main app
    console.debug('Analytics error:', error);
  }
};

/**
 * Get or create a session ID
 * @returns {string} Session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateRandomId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Generate a random ID
 * @returns {string} Random ID
 */
const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Log error event to analytics
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 */
export const logError = async (errorType, errorMessage) => {
  if (!ANALYTICS_ENDPOINT) return;
  
  try {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      type: 'error',
      errorType,
      // Don't include full error message as it might contain sensitive info
      // Just include a sanitized version or classification
      errorCategory: sanitizeErrorMessage(errorMessage),
      sessionId: getSessionId(),
    };
    
    await fetch(`${ANALYTICS_ENDPOINT}/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Analytics error logging failed:', error);
  }
};

/**
 * Log API performance metrics
 * @param {string} apiType - Type of API call (REST or GraphQL)
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} success - Whether the call was successful
 */
export const logApiPerformance = async (apiType, duration, success) => {
  if (!ANALYTICS_ENDPOINT) return;
  
  try {
    const analyticsData = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      apiType,
      duration,
      success,
      sessionId: getSessionId(),
    };
    
    await fetch(`${ANALYTICS_ENDPOINT}/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
      keepalive: true,
    });
  } catch (error) {
    console.debug('Analytics performance logging failed:', error);
  }
};

/**
 * Sanitize error message to remove any potentially sensitive information
 * @param {string} message - Original error message
 * @returns {string} Sanitized message
 */
const sanitizeErrorMessage = (message) => {
  // Remove potential tokens, URLs with auth params, etc.
  if (!message) return 'unknown';
  
  // Categorize errors rather than sending raw messages
  if (message.includes('rate limit')) return 'rate_limit';
  if (message.includes('authentication')) return 'auth_error';
  if (message.includes('network')) return 'network_error';
  
  return 'general_error';
};
