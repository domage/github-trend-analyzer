import React from 'react';
import { formatNumber } from '../utils'; // Assuming the formatNumber utility is in utils

/**
 * ResultsDisplay component to show GitHub H-Index results
 */
function ResultsDisplay({ results }) {
    if (!results) return null;
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">
                Results for "{results.searchTerm}"
            </h2>
            <p className="mb-2">
                Repositories created after: {results.dateLimit}
            </p>
            <div className="mb-4">
                <p className="mb-1">
                    Total repositories: {formatNumber(results.totalRepos)}
                </p>
                <p className="mb-1">
                    Repositories analyzed for H-Index: {formatNumber(results.analyzedRepos)}
                </p>
                <p className="mb-1">
                    Total pull requests: {formatNumber(results.totalPRs)}
                </p>
                <p className="mb-1">
                    Total discussions: {results.githubToken ? formatNumber(results.totalDiscussions) : 'Requires token'}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Star H-Index section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold mb-3 text-blue-800">
                        Star H-Index: {results.starHIndex}
                    </h3>
                    <p className="mb-4 text-sm">
                        This means there are at least {results.starHIndex} repositories with at least {results.starHIndex} stars each.
                    </p>
                    <h4 className="font-bold mb-2">
                        Top Starred Repositories:
                    </h4>
                    <ul className="text-sm">
                        {results.topStarredRepos.map(repo => (
                            <li key={repo.id} className="mb-2">
                                <a 
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {repo.full_name}
                                </a>
                                <span className="ml-2 text-gray-600">
                                    ({repo.stargazers_count} ⭐)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Fork H-Index section */}
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-xl font-bold mb-3 text-green-800">
                        Fork H-Index: {results.forkHIndex}
                    </h3>
                    <p className="mb-4 text-sm">
                        This means there are at least {results.forkHIndex} repositories with at least {results.forkHIndex} forks each.
                    </p>
                    <h4 className="font-bold mb-2">
                        Top Forked Repositories:
                    </h4>
                    <ul className="text-sm">
                        {results.topForkedRepos.map(repo => (
                            <li key={repo.id} className="mb-2">
                                <a 
                                    href={repo.html_url}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {repo.full_name}
                                </a>
                                <span className="ml-2 text-gray-600">
                                    ({repo.forks_count} 🍴)
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ResultsDisplay;