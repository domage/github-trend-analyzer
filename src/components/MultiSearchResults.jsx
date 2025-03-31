import React, { useState } from 'react';
import { formatNumber } from '../utils'; // Assuming formatNumber is in utils.js

/**
 * MultiSearchResults component to display comparison table for multiple search terms
 */
function MultiSearchResults({ multiResults }) {
    const [sortConfig, setSortConfig] = useState({
        key: 'searchTerm',
        direction: 'ascending'
    });

    if (!multiResults || multiResults.length === 0) return null;

    // Handle sort when a column header is clicked
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get sorted data based on current sort configuration
    const getSortedData = () => {
        const sortableData = [...multiResults];
        sortableData.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        return sortableData;
    };

    // Get class names for the table header based on current sort
    const getHeaderClassName = (key) => {
        const baseClassName = 'px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors';
        if (sortConfig.key === key) {
            return `${baseClassName} bg-gray-200 font-bold`;
        }
        return baseClassName;
    };

    // Create sort indicator arrows
    const getSortDirectionIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        
        return (
            <span className="ml-1 inline-block">
                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
            </span>
        );
    };

    // Create table header cell with sort functionality
    const createSortableHeader = (key, label) => {
        return (
            <th
                className={getHeaderClassName(key)}
                onClick={() => requestSort(key)}
            >
                {label}
                {getSortDirectionIndicator(key)}
            </th>
        );
    };

    // Render the main table
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">
                Comparative Analysis
            </h2>
            <p className="mb-4 text-sm text-gray-600">
                Click on any column header to sort the table.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead className="bg-gray-50 border-b text-left">
                        <tr>
                            {createSortableHeader('searchTerm', 'Search Term')}
                            {createSortableHeader('starHIndex', 'Star H-Index')}
                            {createSortableHeader('forkHIndex', 'Fork H-Index')}
                            {createSortableHeader('totalRepos', 'Total Repos')}
                            {createSortableHeader('totalPRs', 'PRs')}
                            {createSortableHeader('totalDiscussions', 'Discussions')}
                            {createSortableHeader('topStar', 'Top Starred')}
                        </tr>
                    </thead>
                    <tbody>
                        {getSortedData().map((result, index) => (
                            <tr
                                key={index}
                                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                            >
                                <td className="px-4 py-3 border-b">
                                    {result.searchTerm}
                                </td>
                                <td className="px-4 py-3 border-b text-center">
                                    {result.starHIndex}
                                </td>
                                <td className="px-4 py-3 border-b text-center">
                                    {result.forkHIndex}
                                </td>
                                <td className="px-4 py-3 border-b text-center">
                                    {formatNumber(result.totalRepos)}
                                </td>
                                <td className="px-4 py-3 border-b text-center">
                                    {formatNumber(result.totalPRs)}
                                </td>
                                <td className="px-4 py-3 border-b text-center">
                                    {result.githubToken ? formatNumber(result.totalDiscussions) : 'Requires token'}
                                </td>
                                <td className="px-4 py-3 border-b">
                                    {result.topStarredRepos && result.topStarredRepos.length > 0 
                                        ? (
                                            <a
                                                href={result.topStarredRepos[0].html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {`${result.topStarredRepos[0].full_name} (${result.topStarredRepos[0].stargazers_count} ⭐)`}
                                            </a>
                                        )
                                        : 'N/A'
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MultiSearchResults;