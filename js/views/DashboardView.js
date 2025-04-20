/**
 * DashboardView class
 * Handles rendering of the Dashboard section
 */
import { generateColorPalette, formatCurrency } from '../utils/DataHelpers.js';

export class DashboardView {
    /**
     * Create a new DashboardView instance
     */
    constructor() {
        this.kpiCardsContainer = document.querySelector('#dashboard > .grid.grid-cols-1.md\\:grid-cols-2');
        this.chartsContainer = document.querySelector('#dashboard > .grid.grid-cols-1.lg\\:grid-cols-1:last-child');
        this.charts = {};
        this.colorPalette = generateColorPalette(10);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const dashboardSection = document.getElementById('dashboard');
        dashboardSection.classList.add('loading');
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const dashboardSection = document.getElementById('dashboard');
        dashboardSection.classList.remove('loading');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const dashboardSection = document.getElementById('dashboard');
        
        // Add error message if it doesn't exist yet
        if (!dashboardSection.querySelector('.error-message')) {
            dashboardSection.innerHTML += `
                <div class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                    <strong class="font-bold">Erro!</strong>
                    <span class="block sm:inline">${message}</span>
                </div>
            `;
        }
    }
    
    /**
     * Render KPI cards
     * @param {Object} summary - Summary metrics data
     */
    renderKPICards(summary) {
        this.kpiCardsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Gasto</h3>
                        <p class="text-2xl font-bold text-gray-800">R$ ${summary.totalSpend.toFixed(2)}</p>
                    </div>
                    <div class="bg-indigo-100 p-3 rounded-full">
                        <i class="fas fa-hand-holding-usd text-indigo-500"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Cliques</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.totalClicks.toLocaleString()}</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-mouse-pointer text-green-500"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Impressões</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.totalImpressions.toLocaleString()}</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-eye text-blue-500"></i>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Média CTR</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.avgCTR.toFixed(2)}%</p>
                    </div>
                    <div class="bg-amber-100 p-3 rounded-full">
                        <i class="fas fa-percentage text-amber-500"></i>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render charts
     * @param {Array} data - Campaign data
     */
    renderCharts(data) {
        this.chartsContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4 text-gray-700">Performance por Campanha</h3>
                <canvas id="campaignPerformanceChart"></canvas>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4 text-gray-700">Distribuição de Gastos</h3>
                <canvas id="spendDistributionChart"></canvas>
            </div>
        `;
        
        try {
            this.renderCampaignPerformanceChart(data);
            this.renderSpendDistributionChart(data);
        } catch (error) {
            console.error('Error rendering dashboard charts:', error);
            this.chartsContainer.innerHTML += `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                    <strong class="font-bold">Erro!</strong>
                    <span class="block sm:inline">Não foi possível renderizar os gráficos.</span>
                </div>
            `;
        }
    }
    
    /**
     * Render campaign performance chart
     * @param {Array} data - Campaign data
     */
    renderCampaignPerformanceChart(data) {
        const ctx = document.getElementById('campaignPerformanceChart').getContext('2d');
        
        const campaigns = data.map((item, index) => {
            // Use campaign_name if available, otherwise create a name from index
            const name = item.campaign_name || `Campaign ${index + 1}`;
            // Truncate long names for better display
            return name.length > 20 ? name.substring(0, 20) + '...' : name;
        });
        
        const clicks = data.map(item => parseInt(item.clicks || 0));
        const impressions = data.map(item => parseInt(item.impressions || 0));
        
        // Destroy existing chart if any
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }
        
        this.charts.performance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: campaigns,
                datasets: [
                    {
                        label: 'Cliques',
                        data: clicks,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Impressões (÷100)',
                        data: impressions.map(value => value / 100),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.dataset.label.includes('Impressões')) {
                                    return label + (context.parsed.y * 100).toLocaleString();
                                } else {
                                    return label + context.parsed.y.toLocaleString();
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render spend distribution chart
     * @param {Array} data - Campaign data
     */
    renderSpendDistributionChart(data) {
        const ctx = document.getElementById('spendDistributionChart').getContext('2d');
        
        const campaigns = data.map((item, index) => {
            // Use campaign_name if available, otherwise create a name from index
            const name = item.campaign_name || `Campaign ${index + 1}`;
            // Truncate long names for better display
            return name.length > 20 ? name.substring(0, 20) + '...' : name;
        });
        
        const spends = data.map(item => parseFloat(item.spend || 0));
        
        // Destroy existing chart if any
        if (this.charts.spendDistribution) {
            this.charts.spendDistribution.destroy();
        }
        
        this.charts.spendDistribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: campaigns,
                datasets: [{
                    data: spends,
                    backgroundColor: this.colorPalette,
                    borderColor: this.colorPalette.map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render the dashboard with data
     * @param {Array} data - Campaign data
     */
    render(data) {
        if (!data || data.length === 0) {
            this.showError('Nenhum dado para exibir no dashboard.');
            this.hideLoading();
            return;
        }
        
        // Calculate summary metrics
        const summary = {
            totalSpend: data.reduce((acc, curr) => acc + (parseFloat(curr.spend) || 0), 0),
            totalClicks: data.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0),
            totalImpressions: data.reduce((acc, curr) => acc + (parseInt(curr.impressions) || 0), 0),
            avgCTR: 0
        };
        
        // Calculate average CTR
        if (summary.totalImpressions > 0) {
            summary.avgCTR = (summary.totalClicks / summary.totalImpressions) * 100;
        }
        
        // Render KPI cards and charts
        this.renderKPICards(summary);
        this.renderCharts(data);
        
        // Hide loading indicator
        this.hideLoading();
    }

    /**
     * Show chart loading specifically
     */
    showChartLoading() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.classList.add('loading');
        });
    }

    /**
     * Hide loading state for charts
     */
    hideChartLoading() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.classList.remove('loading');
        });
    }

    /**
     * Update charts size when window is resized
     */
    updateChartsSize() {
        if (this.charts.performance) {
            this.charts.performance.resize();
        }
        
        if (this.charts.spendDistribution) {
            this.charts.spendDistribution.resize();
        }
    }
} 