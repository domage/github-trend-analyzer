/**
 * TrendTracker component - Visualizes GitHub repository trends over time
 */
function TrendTracker({ githubToken }) {
    const { useState, useEffect, useRef } = React;

    const [searchInput, setSearchInput] = useState('');
    const [searchTerms, setSearchTerms] = useState([]);
    const [startYear, setStartYear] = useState(new Date().getFullYear() - 3);
    const [endYear, setEndYear] = useState(new Date().getFullYear());
    const [granularity, setGranularity] = useState('year');
    const [metric, setMetric] = useState('repositories');
    const [chartData, setChartData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useWindowedHIndex, setUseWindowedHIndex] = useState(false);
    const chartContainerRef = useRef(null);

    // Years range for the dropdown menus
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);

    // Add a search term
    const addSearchTerm = () => {
        if (!searchInput.trim()) return;
        
        // Split the input by semicolons and process each term
        const terms = searchInput.split(';').map(term => term.trim()).filter(term => term);
        
        // Add each term if it's not already in the list
        const newTerms = [...searchTerms];
        let addedCount = 0;
        
        terms.forEach(term => {
            if (!newTerms.includes(term)) {
                newTerms.push(term);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            setSearchTerms(newTerms);
            setSearchInput('');
        }
    };

    // Allow adding search term with Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSearchTerm();
        }
    };

    // Remove a search term
    const removeSearchTerm = (term) => {
        setSearchTerms(searchTerms.filter(t => t !== term));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (searchTerms.length === 0) {
            setError('Please add at least one search term');
            return;
        }
        
        if (!githubToken) {
            setError('GitHub token is required for trend analysis');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const timeWindows = trendTrackerService.generateTimeWindows(
                startYear, 
                endYear, 
                granularity
            );
            
            let data;
            
            if (useWindowedHIndex) {
                // Fetch windowed H-Index data
                data = {};
                
                for (const term of searchTerms) {
                    data[term] = [];
                    
                    for (const window of timeWindows) {
                        const starHIndex = await trendTrackerService.calculateWindowedHIndex(
                            term,
                            window.start,
                            window.end,
                            'stargazers_count',
                            githubToken
                        );
                        
                        data[term].push({
                            period: trendTrackerService.formatPeriodLabel(window),
                            startDate: window.start,
                            endDate: window.end,
                            value: starHIndex
                        });
                    }
                }
            } else {
                // Fetch regular metric data
                data = await trendTrackerService.compareSearchTerms(
                    searchTerms,
                    timeWindows,
                    metric,
                    githubToken
                );
            }
            
            setChartData(data);
            renderChart(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Render the chart using Chart.js
    const renderChart = (data) => {
        if (!data || Object.keys(data).length === 0 || !chartContainerRef.current) return;
        
        // Clear any existing chart
        chartContainerRef.current.innerHTML = '';
        const canvas = document.createElement('canvas');
        chartContainerRef.current.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Prepare data for Chart.js
        const labels = [];
        const datasets = [];
        const colors = ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'];
        
        // Get all unique period labels
        const firstTerm = Object.keys(data)[0];
        if (data[firstTerm] && Array.isArray(data[firstTerm])) {
            data[firstTerm].forEach(point => {
                labels.push(point.period);
            });
        }
        
        // Create datasets for each search term
        Object.keys(data).forEach((term, index) => {
            if (Array.isArray(data[term])) {
                const dataset = {
                    label: term,
                    data: data[term].map(point => {
                        if (useWindowedHIndex) {
                            return point.value;
                        } else {
                            switch (metric) {
                                case 'repositories': return point.repositoryCount;
                                case 'prs': return point.prCount;
                                case 'issues': return point.issueCount;
                                default: return point.repositoryCount;
                            }
                        }
                    }),
                    borderColor: colors[index % colors.length],
                    backgroundColor: colors[index % colors.length] + '33', // Add transparency
                    tension: 0.4
                };
                
                datasets.push(dataset);
            }
        });
        
        // Create the chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: useWindowedHIndex ? 
                            'Windowed H-Index Over Time' : 
                            `${metric.charAt(0).toUpperCase() + metric.slice(1)} Over Time`,
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: useWindowedHIndex ? 
                                'Windowed H-Index' : 
                                metric.charAt(0).toUpperCase() + metric.slice(1)
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
                        }
                    }
                }
            }
        });
    };

    // Load Chart.js dynamically
    useEffect(() => {
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
            script.async = true;
            
            script.onload = () => {
                if (chartData) {
                    renderChart(chartData);
                }
            };
            
            document.body.appendChild(script);
            
            return () => {
                document.body.removeChild(script);
            };
        } else if (chartData) {
            renderChart(chartData);
        }
    }, [chartData]);

    return React.createElement(
        'div',
        { className: 'bg-white p-6 rounded-lg shadow-md mb-6' },
        
        // Header
        React.createElement(
            'h2',
            { className: 'text-2xl font-bold mb-4' },
            'GitHub Trend Tracker'
        ),
        
        React.createElement(
            'p',
            { className: 'mb-4 text-gray-600' },
            'Track popularity trends of GitHub repositories over time.'
        ),
        
        // Error display
        error && React.createElement(
            'div',
            { className: 'bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4' },
            React.createElement('p', null, error)
        ),
        
        // Token warning
        !githubToken && React.createElement(
            'div',
            { className: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4' },
            React.createElement('p', null, 'GitHub token is required for trend analysis. Please add a token in the main form.')
        ),
        
        // Form
        React.createElement(
            'form',
            { onSubmit: handleSubmit, className: 'mb-6' },
            
            // Search terms section
            React.createElement(
                'div',
                { className: 'mb-4' },
                React.createElement(
                    'label',
                    { className: 'block text-gray-700 mb-2' },
                    'Search Terms'
                ),
                React.createElement(
                    'div',
                    { className: 'flex' },
                    React.createElement('input', {
                        type: 'text',
                        className: 'flex-grow p-2 border rounded',
                        value: searchInput,
                        onChange: (e) => setSearchInput(e.target.value),
                        onKeyPress: handleKeyPress,
                        placeholder: 'Enter search terms (use ; to separate multiple terms, e.g., "React; Vue; Angular")'
                    }),
                    React.createElement(
                        'button',
                        {
                            type: 'button',
                            className: 'ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded',
                            onClick: addSearchTerm
                        },
                        'Add'
                    )
                ),
                
                // Search terms pills
                React.createElement(
                    'div',
                    { className: 'mt-2 flex flex-wrap gap-2' },
                    searchTerms.map(term => React.createElement(
                        'div',
                        {
                            key: term,
                            className: 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center'
                        },
                        term,
                        React.createElement(
                            'button',
                            {
                                type: 'button',
                                className: 'ml-2 text-blue-600 hover:text-blue-800',
                                onClick: () => removeSearchTerm(term)
                            },
                            '×'
                        )
                    ))
                )
            ),
            
            // Time range and granularity
            React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-4' },
                
                // Start Year
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'label',
                        { className: 'block text-gray-700 mb-2' },
                        'Start Year'
                    ),
                    React.createElement(
                        'select',
                        {
                            className: 'w-full p-2 border rounded',
                            value: startYear,
                            onChange: (e) => setStartYear(e.target.value)
                        },
                        years.map(year => React.createElement(
                            'option',
                            { key: `start-${year}`, value: year },
                            year
                        ))
                    )
                ),
                
                // End Year
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'label',
                        { className: 'block text-gray-700 mb-2' },
                        'End Year'
                    ),
                    React.createElement(
                        'select',
                        {
                            className: 'w-full p-2 border rounded',
                            value: endYear,
                            onChange: (e) => setEndYear(e.target.value)
                        },
                        years.map(year => React.createElement(
                            'option',
                            { key: `end-${year}`, value: year },
                            year
                        ))
                    )
                ),
                
                // Granularity
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'label',
                        { className: 'block text-gray-700 mb-2' },
                        'Time Granularity'
                    ),
                    React.createElement(
                        'select',
                        {
                            className: 'w-full p-2 border rounded',
                            value: granularity,
                            onChange: (e) => setGranularity(e.target.value)
                        },
                        React.createElement('option', { value: 'year' }, 'Yearly'),
                        React.createElement('option', { value: 'quarter' }, 'Quarterly'),
                        React.createElement('option', { value: 'month' }, 'Monthly')
                    )
                )
            ),
            
            // Metrics and options
            React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4' },
                
                // Metric type
                React.createElement(
                    'div',
                    { className: useWindowedHIndex ? 'opacity-50' : '' },
                    React.createElement(
                        'label',
                        { className: 'block text-gray-700 mb-2' },
                        'Metric'
                    ),
                    React.createElement(
                        'select',
                        {
                            className: 'w-full p-2 border rounded',
                            value: metric,
                            onChange: (e) => setMetric(e.target.value),
                            disabled: useWindowedHIndex
                        },
                        React.createElement('option', { value: 'repositories' }, 'Repository Count'),
                        // React.createElement('option', { value: 'stars' }, 'Star Count'),
                        React.createElement('option', { value: 'prs' }, 'Pull Request Count'),
                        React.createElement('option', { value: 'issues' }, 'Issue Count')
                    )
                ),
                
                // Windowed H-Index option
                // React.createElement(
                //     'div',
                //     { className: 'flex items-center h-full pt-8' },
                //     React.createElement('input', {
                //         type: 'checkbox',
                //         id: 'windowedHIndex',
                //         className: 'mr-2',
                //         checked: useWindowedHIndex,
                //         onChange: (e) => setUseWindowedHIndex(e.target.checked)
                //     }),
                //     React.createElement(
                //         'label',
                //         { 
                //             htmlFor: 'windowedHIndex',
                //             className: 'text-gray-700'
                //         },
                //         'Use Windowed H-Index (Stars)'
                //     )
                // )
            ),
            
            // Submit button
            React.createElement(
                'div',
                { className: 'flex justify-end' },
                React.createElement(
                    'button',
                    {
                        type: 'submit',
                        className: 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50',
                        disabled: isLoading || !githubToken || searchTerms.length === 0
                    },
                    isLoading ? 'Loading...' : 'Generate Chart'
                )
            )
        ),
        
        // Chart container
        React.createElement(
            'div',
            { 
                ref: chartContainerRef,
                className: 'bg-white p-4 rounded border h-96 w-full'
            }
        ),
        
        // Comparison view for additional stats
        chartData && React.createElement(TrendComparisonView, { 
            chartData, 
            metric, 
            useWindowedHIndex 
        }),
        
        // Chart info
        chartData && React.createElement(
            'div',
            { className: 'mt-4 text-sm text-gray-600' },
        //    useWindowedHIndex ? 
        //        'Windowed H-Index shows the H-Index calculated only for repositories created within each time period.' :
                `The chart shows ${metric} for each search term over time.`
        )
    );
}