import React from 'react';

/**
 * TrendComparisonView component - Displays comparison charts for different search terms
 */
function TrendComparisonView({ chartData, metric }) {
    // Format data for download
    const getDownloadData = () => {
        if (!chartData) return null;
        
        const terms = Object.keys(chartData);
        if (terms.length === 0) return null;
        
        // Create headers
        let csv = 'Period';
        terms.forEach(term => {
            csv += `,${term}`;
        });
        csv += '\n';
        
        // Get all periods from the first term
        const periods = chartData[terms[0]].map(point => point.period);
        
        // Add data for each period
        periods.forEach((period, periodIndex) => {
            csv += period;
            
            terms.forEach(term => {
                const pointData = chartData[term][periodIndex];
                let value = 0;
                
                switch(metric) {
                    case 'repositories':
                        value = pointData?.repositoryCount || 0;
                        break;
                    case 'prs':
                        value = pointData?.prCount || 0;
                        break;
                    case 'issues':
                        value = pointData?.issueCount || 0;
                        break;
                    default:
                        value = pointData?.repositoryCount || 0;
                }
                
                csv += `,${value}`;
            });
            
            csv += '\n';
        });
        
        return csv;
    };
    
    // Handle download button click
    const handleDownload = () => {
        const csv = getDownloadData();
        if (!csv) return;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'github-trend-data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    return (
        <div className="mt-6">
            {/* Download button */}
            <div className="flex justify-end mb-4">
                <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    onClick={handleDownload}
                >
                    Download CSV
                </button>
            </div>
        </div>
    );
}

export default TrendComparisonView;