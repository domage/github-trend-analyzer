# GitHub Trend Analyzer

<img src="https://domage.github.io/github-trend-analyzer/images/Trends.png" alt=""></p>

GitHub Trend Analyzer tracks and visualizes the popularity trends of technologies and projects on GitHub, providing H-Index calculations and comparative metrics over time.

**Live Demo**: [https://trends.domage.dev/](https://trends.domage.dev/)

## Features

### H-Index Calculator

The H-Index Calculator calculates the [H-Index](https://en.wikipedia.org/wiki/H-index) for GitHub repositories matching your search terms. Originally developed for measuring academic impact, the H-Index is adapted here for GitHub metrics:

- **Star H-Index**: A topic has an H-Index of _h_ if it has _h_ repositories with at least _h_ stars each
- **Fork H-Index**: A topic has an H-Index of _h_ if it has _h_ repositories with at least _h_ forks each

This provides a more nuanced view of a technology's popularity than simple repository counts or total stars.

### Trend Tracker

The Trend Tracker visualizes GitHub activity over time for different search terms, allowing you to:

- Compare multiple technologies/projects side by side
- Track metrics like repository count, pull requests, and issues
- Visualize trends with flexible time granularity (yearly, quarterly, monthly)
- View year-over-year percentage changes
- Export data to CSV for further analysis

## Getting Started

### Using the H-Index Calculator

1. Enter a search term (e.g., "React", "machine learning", "language:python")
2. Optionally set a creation date filter
3. Click "Calculate H-Indices"
4. View results with the top repositories by stars and forks

For multiple search terms, separate them with semicolons (e.g., "React; Vue; Angular") to generate a comparison table.

### Using the Trend Tracker

1. Add one or more search terms
2. Select your time range and granularity
3. Choose the metric you want to track (repositories, PRs, issues)
4. Click "Generate Chart" to visualize the trends
5. View comparative data and download as CSV if needed

## GitHub API Token

This tool requires a GitHub personal access token to:
- Access the GitHub GraphQL API (better performance)
- Fetch discussion data
- Increase rate limits

You can generate a token here: [https://github.com/settings/tokens](https://github.com/settings/tokens)

No special permissions are required - a basic token with no additional scopes is sufficient.

## Search Tips

- Use GitHub's search syntax for more specific results:
  - `language:javascript` - Filter by programming language
  - `stars:>1000` - Repositories with more than 1000 stars
  - `created:>2022-01-01` - Created after a specific date
  - `org:microsoft` - From a specific organization

- Combine multiple criteria:
  - `machine learning language:python stars:>100`
  - `web framework language:javascript created:>2020-01-01`

## Technical Details

GitHub Trend Analyzer is a client-side JavaScript application that uses:
- GitHub's REST and GraphQL APIs for data
- Chart.js for data visualization
- React for UI components

No data is stored on any server - the application runs entirely in your browser, with optional local storage for your GitHub token.

## Limitations

- GitHub API rate limits: Without authentication, requests are limited to 60 per hour
- GraphQL API requires authentication

## Contributing

Contributions are welcome! Feel free to open issues or pull requests on the GitHub repository.

## License

GNU General Public License v3.0 (GPL-3.0)
