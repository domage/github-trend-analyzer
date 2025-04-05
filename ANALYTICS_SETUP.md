# GitHub H-Index Analytics Setup Guide

This guide explains how to set up and use the analytics system for the GitHub H-Index application. The analytics system collects anonymous usage data to help improve the application without compromising user privacy or security.

## Overview

The analytics system consists of:

1. **Client-side analytics service** - Collects and sends non-personal usage data
2. **Cloudflare Worker** - Receives, processes, and stores the analytics data
3. **Privacy information** - Informs users about data collection practices

## Setup Instructions

### 1. Deploy the Cloudflare Worker

1. Log in to your [Cloudflare dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages
3. Click "Create application" and select "Create Worker"
4. Give your worker a name (e.g., "github-hindex-analytics")
5. In the editor, paste the code from `analytics-worker.js`
6. Click "Save and Deploy"

### 2. Create a KV Namespace

1. In your Cloudflare dashboard, go to Workers & Pages
2. Select "KV" from the sidebar
3. Click "Create namespace"
4. Name it "ANALYTICS_STORE"
5. Go back to your worker
6. Click on "Settings" > "Variables"
7. Under "KV Namespace Bindings", click "Add binding"
8. Set the Variable name to "ANALYTICS_STORE" and select your KV namespace
9. Click "Save"

### 3. Configure Environment Variables in Cloudflare Pages

1. In your Cloudflare Pages project, go to "Settings" > "Environment variables"
2. Add a new variable:
   - Name: `VITE_ANALYTICS_ENDPOINT`
   - Value: `https://your-worker-name.your-account.workers.dev` (the URL of your worker)
3. Make sure to set this for both Production and Preview environments
4. Deploy your site to apply the changes

## How It Works

### Data Collection

The analytics system collects:

- Search terms entered by users
- Features used (H-Index, Trend analysis)
- Date ranges and metrics selected
- API performance metrics
- Error information (without personal details)

It does NOT collect:

- GitHub tokens
- IP addresses
- Personal identifiable information

### Data Flow

1. When a user performs a search or encounters an error, the client-side analytics service sends the data to the Cloudflare Worker
2. The worker processes the data and stores it in Cloudflare KV
3. The data is aggregated to provide insights into application usage

### Viewing Analytics Data

You can view basic analytics by accessing:

```
https://your-worker-name.your-account.workers.dev/stats
```

This endpoint returns a JSON object with:

- Top search terms
- Feature usage statistics
- API performance metrics
- Error counts

## Privacy Considerations

The analytics system is designed with privacy in mind:

- All data is anonymous
- No personal information is collected
- GitHub tokens are never sent to the analytics server
- Users are informed about data collection via the Privacy Information link in the footer

## Customization

### Modifying the Worker

You can modify the `analytics-worker.js` file to add additional analytics capabilities:

- Add new endpoints for specific analytics needs
- Implement more sophisticated aggregation
- Add authentication for accessing analytics data

### Disabling Analytics

To disable analytics:

1. Remove the `VITE_ANALYTICS_ENDPOINT` environment variable from Cloudflare Pages
2. The client-side analytics service will automatically detect this and stop sending data

## Troubleshooting

### Worker Not Receiving Data

1. Check that the `VITE_ANALYTICS_ENDPOINT` environment variable is set correctly
2. Verify that the worker is deployed and running
3. Check browser console for any CORS errors

### KV Storage Issues

1. Verify that the KV namespace is correctly bound to the worker
2. Check worker logs for any errors related to KV operations

## Security Recommendations

1. Consider adding authentication to the `/stats` endpoint if you want to restrict access
2. Regularly review the collected data to ensure no sensitive information is being captured
3. Set up Cloudflare Access policies if you need more granular control over who can access the analytics data
