'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PriceChartProps {
    dataPoints: { date: string; price: number }[];
    tokenId: string;
    currency: string;
}

export default function PriceChart({ dataPoints, tokenId, currency }: PriceChartProps) {
    const dates = dataPoints.map(d => d.date);
    const prices = dataPoints.map(d => d.price);

    return (
        <div className="mt-4 rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900/50 p-4">
            <Plot
                data={[
                    {
                        x: dates,
                        y: prices,
                        type: 'scatter',
                        mode: 'lines+markers',
                        marker: {
                            color: 'rgb(59, 130, 246)',
                            size: 8,
                        },
                        line: {
                            color: 'rgb(59, 130, 246)',
                            width: 3,
                            shape: 'spline',
                        },
                        fill: 'tonexty',
                        fillcolor: 'rgba(59, 130, 246, 0.1)',
                        name: `${tokenId.toUpperCase()}`,
                        hovertemplate: '<b>%{x}</b><br>$%{y:.2f}<extra></extra>',
                    },
                ]}
                layout={{
                    title: {
                        text: `${tokenId.toUpperCase()} Price History (Last ${dataPoints.length} Days)`,
                        font: {
                            color: '#e4e4e7',
                            size: 18,
                        },
                    },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: {
                        color: '#a1a1aa',
                    },
                    xaxis: {
                        gridcolor: 'rgba(255, 255, 255, 0.1)',
                        showgrid: true,
                    },
                    yaxis: {
                        gridcolor: 'rgba(255, 255, 255, 0.1)',
                        showgrid: true,
                        tickprefix: '$',
                        tickformat: ',.2f',
                    },
                    hovermode: 'x unified',
                    showlegend: false,
                    margin: { t: 50, r: 30, b: 50, l: 60 },
                }}
                config={{
                    responsive: true,
                    displayModeBar: false, // Hide the mode bar for cleaner look
                }}
                style={{ width: '100%', height: '400px' }}
            />
        </div>
    );
}
