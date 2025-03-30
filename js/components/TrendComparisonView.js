/**
 * TrendComparisonView component - Displays comparison charts for different search terms
 */
function TrendComparisonView({ chartData, metric, useWindowedHIndex }) {
    const { useEffect, useRef } = React;
    const chartRef = useRef(null);
    
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
                
                if (useWindowedHIndex) {
                    value = pointData?.value || 0;
                } else {
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
    
    // Get percentage change year over year for each term
    const getYoYChangeData = () => {
        if (!chartData) return null;
        
        const terms = Object.keys(chartData);
        if (terms.length === 0) return null;
        
        const results = {};
        
        terms.forEach(term => {
            const data = chartData[term];
            if (!data || data.length < 2) return;
            
            // Get the last two data points
            const lastPoint = data[data.length - 1];
            const previousPoint = data[data.length - 2];
            
            let currentValue, previousValue;
            
            if (useWindowedHIndex) {
                currentValue = lastPoint.value;
                previousValue = previousPoint.value;
            } else {
                switch(metric) {
                    case 'repositories':
                        currentValue = lastPoint.repositoryCount;
                        previousValue = previousPoint.repositoryCount;
                        break;
                    case 'prs':
                        currentValue = lastPoint.prCount;
                        previousValue = previousPoint.prCount;
                        break;
                    case 'issues':
                        currentValue = lastPoint.issueCount;
                        previousValue = previousPoint.issueCount;
                        break;
                    default:
                        currentValue = lastPoint.repositoryCount;
                        previousValue = previousPoint.repositoryCount;
                }
            }
            
            // Calculate percentage change
            const percentChange = previousValue === 0 ? 
                100 : // If previous was 0, assume 100% growth
                ((currentValue - previousValue) / previousValue) * 100;
            
            results[term] = {
                current: currentValue,
                previous: previousValue,
                percentChange: percentChange.toFixed(2),
                increased: percentChange > 0
            };
        });
        
        return results;
    };
    
    // Render YoY comparison table
    const renderComparisonTable = () => {
        const yoyData = getYoYChangeData();
        if (!yoyData) return null;
        
        const terms = Object.keys(yoyData);
        
        return React.createElement(
            'div',
            { className: 'mt-6' },
            React.createElement(
                'h3',
                { className: 'text-lg font-bold mb-2' },
                'Year-over-Year Comparison'
            ),
            React.createElement(
                'div',
                { className: 'overflow-x-auto' },
                React.createElement(
                    'table',
                    { className: 'min-w-full bg-white border' },
                    React.createElement(
                        'thead',
                        { className: 'bg-gray-100' },
                        React.createElement(
                            'tr',
                            null,
                            React.createElement('th', { className: 'px-4 py-2 text-left' }, 'Search Term'),
                            React.createElement('th', { className: 'px-4 py-2 text-right' }, 'Current'),
                            React.createElement('th', { className: 'px-4 py-2 text-right' }, 'Previous'),
                            React.createElement('th', { className: 'px-4 py-2 text-right' }, 'Change %')
                        )
                    ),
                    React.createElement(
                        'tbody',
                        null,
                        terms.map(term => {
                            const data = yoyData[term];
                            
                            return React.createElement(
                                'tr',
                                { key: term },
                                React.createElement('td', { className: 'border px-4 py-2' }, term),
                                React.createElement('td', { className: 'border px-4 py-2 text-right' }, formatNumber(data.current)),
                                React.createElement('td', { className: 'border px-4 py-2 text-right' }, formatNumber(data.previous)),
                                React.createElement(
                                    'td', 
                                    { 
                                        className: `border px-4 py-2 text-right ${
                                            data.increased ? 'text-green-600' : 'text-red-600'
                                        }`
                                    },
                                    `${data.increased ? '+' : ''}${data.percentChange}%`
                                )
                            );
                        })
                    )
                )
            )
        );
    };
    
    return React.createElement(
        'div',
        { className: 'mt-6' },
        
        // Chart container and download button
        React.createElement(
            'div',
            { className: 'flex justify-between items-center mb-4' },
            //React.createElement(
            //    'h3',
            //    { className: 'text-lg font-bold' },
            //    useWindowedHIndex ? 'Windowed H-Index Comparison' : `${metric.charAt(0).toUpperCase() + metric.slice(1)} Comparison`
        //    ),
        React.createElement(
            'button',
            {
                className: 'bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm',
                onClick: handleDownload
            },
            'Download CSV'
        )
        ),
        
        // Year-over-year comparison table
        renderComparisonTable()
    );
}