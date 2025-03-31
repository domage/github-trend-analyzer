import React, { useEffect, useRef } from 'react';

/**
 * TrendChart component - Renders a chart for GitHub trend data
 */
function TrendChart({ chartData, metric }) {
    const chartContainerRef = useRef(null);

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
                        switch (metric) {
                            case 'repositories': return point.repositoryCount;
                            case 'prs': return point.prCount;
                            case 'issues': return point.issueCount;
                            default: return point.repositoryCount;
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
                        text: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Over Time`,
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
                            text: metric.charAt(0).toUpperCase() + metric.slice(1)
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

    // Load Chart.js dynamically and render chart when data changes
    useEffect(() => {
        if (chartData) {
            if (!window.Chart) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
                script.async = true;
                
                script.onload = () => {
                    renderChart(chartData);
                };
                
                document.body.appendChild(script);
                
                return () => {
                    if (document.body.contains(script)) {
                        document.body.removeChild(script);
                    }
                };
            } else {
                renderChart(chartData);
            }
        }
    }, [chartData, metric]);

    return (
        <div
            ref={chartContainerRef}
            className="bg-white p-4 rounded border h-96 w-full mb-4"
        />
    );
}

export default TrendChart;