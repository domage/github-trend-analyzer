/**
 * GitHub H-Index Analytics Worker
 * 
 * This Cloudflare Worker receives and stores analytics data from the GitHub H-Index application.
 * It stores data in Cloudflare KV and provides basic aggregation capabilities.
 * 
 * To use this worker:
 * 1. Create a Cloudflare Worker
 * 2. Create a KV namespace called "ANALYTICS_STORE"
 * 3. Bind the KV namespace to the worker with the variable name "ANALYTICS_STORE"
 * 4. Deploy this code to the worker
 * 5. Set the worker URL as VITE_ANALYTICS_ENDPOINT in your Cloudflare Pages environment variables
 */

// KV namespace binding
// ANALYTICS_STORE - KV namespace for storing analytics data

// CORS configuration - this can be modified manually or by Terraform during deployment
const ALLOWED_ORIGINS = [
  // Default to allowing all origins for standalone deployments
  "*"
  // Uncomment and add specific origins as needed:
  // "https://your-app.pages.dev",
  // "http://localhost:3000",
  // "http://localhost:5173"
];

/**
 * Handle incoming requests
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler
 * @param {Request} request - The incoming request
 * @returns {Response} - The response
 */
async function handleRequest(request) {
  // Get the origin from the request
  const origin = request.headers.get('Origin');
  
  // Determine if the origin is allowed
  const allowOrigin = determineAllowedOrigin(origin);
  
  // Set CORS headers with the proper allowed origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Parse the URL to determine the endpoint
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  try {
    // Route the request based on the path and method
    if (request.method === 'POST') {
      if (path === '/' || path === '/search') {
        return await handleSearchLog(request, corsHeaders);
      } else if (path === '/error') {
        return await handleErrorLog(request, corsHeaders);
      } else if (path === '/performance') {
        return await handlePerformanceLog(request, corsHeaders);
      }
    } else if (request.method === 'GET') {
      if (path === '/stats') {
        return await handleStatsRequest(request, corsHeaders);
      }
    }

    // If no route matches, return 404
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    // Handle any errors
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Determine the appropriate Access-Control-Allow-Origin value based on the request origin
 * @param {string} requestOrigin - The origin from the request headers
 * @returns {string} - The Access-Control-Allow-Origin value to use
 */
function determineAllowedOrigin(requestOrigin) {
  // If no origin in request, default to deny (unlikely to happen in browser requests)
  if (!requestOrigin) return "null";
  
  // If we're allowing all origins, return the wildcard
  if (ALLOWED_ORIGINS.includes("*")) return "*";
  
  // Check if the request origin is in our allowed list
  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Default to null (deny) if the origin isn't allowed
  return "null";
}

/**
 * Handle search log requests
 * @param {Request} request - The incoming request
 * @param {Object} headers - CORS headers
 * @returns {Response} - The response
 */
async function handleSearchLog(request, headers) {
  try {
    const data = await request.json();
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Generate a unique ID for this log entry
    const logId = `search_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store the log entry
    await ANALYTICS_STORE.put(logId, JSON.stringify(data));
    
    // Update search term counts
    if (data.searchTerms && Array.isArray(data.searchTerms)) {
      for (const term of data.searchTerms) {
        if (term && term.trim()) {
          const normalizedTerm = term.trim().toLowerCase();
          const countKey = `term_count_${normalizedTerm}`;
          
          // Get current count or default to 0
          const currentCount = parseInt(await ANALYTICS_STORE.get(countKey) || '0');
          
          // Increment and store
          await ANALYTICS_STORE.put(countKey, (currentCount + 1).toString());
        }
      }
    }
    
    // Update feature usage counts
    if (data.showHIndexAnalysis) {
      await incrementCounter('feature_hindex');
    }
    
    if (data.showTrendAnalysis) {
      await incrementCounter('feature_trends');
    }
    
    // Update metric usage counts
    if (data.metric) {
      await incrementCounter(`metric_${data.metric}`);
    }
    
    // Update granularity usage counts
    if (data.granularity) {
      await incrementCounter(`granularity_${data.granularity}`);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle error log requests
 * @param {Request} request - The incoming request
 * @param {Object} headers - CORS headers
 * @returns {Response} - The response
 */
async function handleErrorLog(request, headers) {
  try {
    const data = await request.json();
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Generate a unique ID for this log entry
    const logId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store the log entry
    await ANALYTICS_STORE.put(logId, JSON.stringify(data));
    
    // Update error type counts
    if (data.errorType) {
      const errorTypeKey = `error_type_${data.errorType}`;
      const currentCount = parseInt(await ANALYTICS_STORE.get(errorTypeKey) || '0');
      await ANALYTICS_STORE.put(errorTypeKey, (currentCount + 1).toString());
    }
    
    // Update error category counts
    if (data.errorCategory) {
      const errorCategoryKey = `error_category_${data.errorCategory}`;
      const currentCount = parseInt(await ANALYTICS_STORE.get(errorCategoryKey) || '0');
      await ANALYTICS_STORE.put(errorCategoryKey, (currentCount + 1).toString());
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle performance log requests
 * @param {Request} request - The incoming request
 * @param {Object} headers - CORS headers
 * @returns {Response} - The response
 */
async function handlePerformanceLog(request, headers) {
  try {
    const data = await request.json();
    
    // Add timestamp if not present
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    
    // Generate a unique ID for this log entry
    const logId = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store the log entry
    await ANALYTICS_STORE.put(logId, JSON.stringify(data));
    
    // Update API type counts and performance metrics
    if (data.apiType) {
      // Increment API type counter
      const apiTypeKey = `api_type_${data.apiType}`;
      const currentCount = parseInt(await ANALYTICS_STORE.get(apiTypeKey) || '0');
      await ANALYTICS_STORE.put(apiTypeKey, (currentCount + 1).toString());
      
      // Update performance metrics
      if (data.duration) {
        // Store the total duration for this API type
        const durationKey = `api_duration_${data.apiType}`;
        const currentDuration = parseFloat(await ANALYTICS_STORE.get(durationKey) || '0');
        await ANALYTICS_STORE.put(durationKey, (currentDuration + data.duration).toString());
        
        // Store the count of duration measurements for this API type
        const durationCountKey = `api_duration_count_${data.apiType}`;
        const currentDurationCount = parseInt(await ANALYTICS_STORE.get(durationCountKey) || '0');
        await ANALYTICS_STORE.put(durationCountKey, (currentDurationCount + 1).toString());
      }
      
      // Update success/failure counts
      if (data.success !== undefined) {
        const successKey = data.success ? 
          `api_success_${data.apiType}` : 
          `api_failure_${data.apiType}`;
        const currentSuccessCount = parseInt(await ANALYTICS_STORE.get(successKey) || '0');
        await ANALYTICS_STORE.put(successKey, (currentSuccessCount + 1).toString());
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle stats request
 * @param {Request} request - The incoming request
 * @param {Object} headers - CORS headers
 * @returns {Response} - The response
 */
async function handleStatsRequest(request, headers) {
  try {
    // Get all keys with the prefix "term_count_"
    const termCountKeys = await ANALYTICS_STORE.list({ prefix: 'term_count_' });
    
    // Get the top search terms
    const topSearchTerms = [];
    for (const key of termCountKeys.keys) {
      const term = key.name.replace('term_count_', '');
      const count = parseInt(await ANALYTICS_STORE.get(key.name) || '0');
      topSearchTerms.push({ term, count });
    }
    
    // Sort by count in descending order and take the top 10
    topSearchTerms.sort((a, b) => b.count - a.count);
    const top10SearchTerms = topSearchTerms.slice(0, 10);
    
    // Get feature usage
    const hIndexCount = parseInt(await ANALYTICS_STORE.get('feature_hindex') || '0');
    const trendsCount = parseInt(await ANALYTICS_STORE.get('feature_trends') || '0');
    
    // Get metric usage
    const repoMetricCount = parseInt(await ANALYTICS_STORE.get('metric_repositories') || '0');
    const prMetricCount = parseInt(await ANALYTICS_STORE.get('metric_prs') || '0');
    const issueMetricCount = parseInt(await ANALYTICS_STORE.get('metric_issues') || '0');
    
    // Get granularity usage
    const yearGranularityCount = parseInt(await ANALYTICS_STORE.get('granularity_year') || '0');
    const quarterGranularityCount = parseInt(await ANALYTICS_STORE.get('granularity_quarter') || '0');
    const monthGranularityCount = parseInt(await ANALYTICS_STORE.get('granularity_month') || '0');
    
    // Get API performance metrics
    const apiTypes = ['GraphQL', 'REST', 'TrendGraphQL', 'WindowedHIndex'];
    const apiPerformance = {};
    
    for (const apiType of apiTypes) {
      const totalDuration = parseFloat(await ANALYTICS_STORE.get(`api_duration_${apiType}`) || '0');
      const durationCount = parseInt(await ANALYTICS_STORE.get(`api_duration_count_${apiType}`) || '0');
      const successCount = parseInt(await ANALYTICS_STORE.get(`api_success_${apiType}`) || '0');
      const failureCount = parseInt(await ANALYTICS_STORE.get(`api_failure_${apiType}`) || '0');
      
      apiPerformance[apiType] = {
        averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
        totalCalls: successCount + failureCount,
        successRate: (successCount + failureCount) > 0 ? 
          (successCount / (successCount + failureCount)) * 100 : 0
      };
    }
    
    // Get error counts
    const errorTypeKeys = await ANALYTICS_STORE.list({ prefix: 'error_type_' });
    const errorTypes = {};
    
    for (const key of errorTypeKeys.keys) {
      const errorType = key.name.replace('error_type_', '');
      const count = parseInt(await ANALYTICS_STORE.get(key.name) || '0');
      errorTypes[errorType] = count;
    }
    
    // Compile the stats
    const stats = {
      topSearchTerms: top10SearchTerms,
      featureUsage: {
        hIndex: hIndexCount,
        trends: trendsCount
      },
      metricUsage: {
        repositories: repoMetricCount,
        pullRequests: prMetricCount,
        issues: issueMetricCount
      },
      granularityUsage: {
        year: yearGranularityCount,
        quarter: quarterGranularityCount,
        month: monthGranularityCount
      },
      apiPerformance,
      errorTypes
    };
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Increment a counter in KV
 * @param {string} key - The counter key
 * @returns {Promise<void>}
 */
async function incrementCounter(key) {
  const currentValue = parseInt(await ANALYTICS_STORE.get(key) || '0');
  await ANALYTICS_STORE.put(key, (currentValue + 1).toString());
}