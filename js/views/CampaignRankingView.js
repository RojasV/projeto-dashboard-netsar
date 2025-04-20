/**
 * CampaignRankingView class
 * Renders an interactive ranking of campaigns by performance metrics
 */
import { formatCurrency, formatPercentage, truncateText, generateColorPalette } from '../utils/DataHelpers.js';

export class CampaignRankingView {
    /**
     * Create a new CampaignRankingView instance
     */
    constructor() {
        this.container = null;
        this.data = [];
        this.colorPalette = generateColorPalette(10);
        this.currentMetric = 'ctr'; // Default sorting metric
        this.sortDirection = 'desc'; // Default sort direction
        this.charts = {};
    }
    
    /**
     * Initialize the view
     * @param {HTMLElement} container - The container element
     */
    init(container) {
        this.container = container;
        
        // Create metric selector
        this.createMetricSelector();
        
        // Initialize tooltips and interactivity
        this.setupTooltips();
        
        // Listen for theme changes
        document.addEventListener('theme:change', () => {
            // Redraw charts when theme changes
            if (this.data.length > 0) {
                this.render(this.data);
            }
        });
    }
    
    /**
     * Create metric selector for different ranking criteria
     */
    createMetricSelector() {
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'flex flex-wrap justify-center gap-3 mb-6';
        selectorContainer.innerHTML = `
            <button data-metric="ctr" class="metric-btn active">
                <i class="fas fa-percentage mr-2"></i>CTR
            </button>
            <button data-metric="clicks" class="metric-btn">
                <i class="fas fa-mouse-pointer mr-2"></i>Cliques
            </button>
            <button data-metric="spend" class="metric-btn">
                <i class="fas fa-hand-holding-usd mr-2"></i>Gasto
            </button>
            <button data-metric="impressions" class="metric-btn">
                <i class="fas fa-eye mr-2"></i>Impressões
            </button>
        `;
        
        this.container.appendChild(selectorContainer);
        
        // Add click event to metric buttons
        const metricButtons = selectorContainer.querySelectorAll('.metric-btn');
        metricButtons.forEach(button => {
            // Style the buttons
            button.classList.add('px-4', 'py-2', 'rounded-full', 'bg-white', 'text-gray-700', 'font-medium', 'shadow-sm', 'hover:shadow-md', 'transition', 'border', 'border-gray-200');
            
            button.addEventListener('click', (e) => {
                // Update active state
                metricButtons.forEach(btn => {
                    btn.classList.remove('active', 'bg-blue-light', 'text-blue-primary');
                    btn.classList.add('bg-white', 'text-gray-700');
                });
                
                button.classList.add('active', 'bg-blue-light', 'text-blue-primary');
                button.classList.remove('bg-white', 'text-gray-700');
                
                // Update current metric and resort
                this.currentMetric = button.getAttribute('data-metric');
                this.sortData();
                this.renderRanking();
            });
        });
        
        // Set initial active button
        const initialActive = selectorContainer.querySelector(`[data-metric="${this.currentMetric}"]`);
        if (initialActive) {
            initialActive.classList.add('active', 'bg-blue-light', 'text-blue-primary');
            initialActive.classList.remove('bg-white', 'text-gray-700');
        }
    }
    
    /**
     * Setup tooltips and interactivity
     */
    setupTooltips() {
        // Tooltip functionality will be initialized during render
        // Using event delegation
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('campaign-card') || e.target.closest('.campaign-card')) {
                const card = e.target.classList.contains('campaign-card') ? e.target : e.target.closest('.campaign-card');
                card.classList.add('transform', 'scale-105', 'z-10');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('campaign-card') || e.target.closest('.campaign-card')) {
                const card = e.target.classList.contains('campaign-card') ? e.target : e.target.closest('.campaign-card');
                card.classList.remove('transform', 'scale-105', 'z-10');
            }
        });
    }
    
    /**
     * Sort data based on current metric and direction
     */
    sortData() {
        this.data.sort((a, b) => {
            let valueA = parseFloat(a[this.currentMetric]) || 0;
            let valueB = parseFloat(b[this.currentMetric]) || 0;
            
            // For CTR, convert from string percentage format
            if (this.currentMetric === 'ctr') {
                valueA = parseFloat(a[this.currentMetric]) || 0;
                valueB = parseFloat(b[this.currentMetric]) || 0;
            }
            
            return this.sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
        });
    }
    
    /**
     * Toggle sort direction
     */
    toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
        this.sortData();
        this.renderRanking();
    }
    
    /**
     * Create comparison chart for top 5 campaigns
     */
    createComparisonChart() {
        // Create chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'bg-white rounded-lg shadow-md p-6 mt-6 chart-container';
        chartContainer.innerHTML = `
            <h3 class="text-lg font-semibold mb-4 text-gray-700">Comparativo das Top 5 Campanhas</h3>
            <canvas id="campaignComparisonChart"></canvas>
        `;
        
        this.container.appendChild(chartContainer);
        
        // Get top 5 campaigns
        const top5 = this.data.slice(0, 5);
        
        // Prepare data for chart
        const labels = top5.map(campaign => truncateText(campaign.campaign_name, 15));
        const ctrData = top5.map(campaign => parseFloat(campaign.ctr) || 0);
        const clicksData = top5.map(campaign => parseInt(campaign.clicks) || 0);
        const spendData = top5.map(campaign => parseFloat(campaign.spend) || 0);
        
        // Destroy existing chart if exists
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }
        
        // Determine if we're in dark mode
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Define colors based on theme
        const colors = {
            ctr: {
                bg: isDarkMode ? 'rgba(65, 147, 255, 0.3)' : 'rgba(79, 70, 229, 0.2)',
                border: isDarkMode ? 'rgba(65, 147, 255, 1)' : 'rgba(79, 70, 229, 1)',
                point: isDarkMode ? 'rgba(65, 147, 255, 1)' : 'rgba(79, 70, 229, 1)'
            },
            clicks: {
                bg: isDarkMode ? 'rgba(76, 217, 100, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                border: isDarkMode ? 'rgba(76, 217, 100, 1)' : 'rgba(16, 185, 129, 1)',
                point: isDarkMode ? 'rgba(76, 217, 100, 1)' : 'rgba(16, 185, 129, 1)'
            },
            spend: {
                bg: isDarkMode ? 'rgba(255, 204, 0, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                border: isDarkMode ? 'rgba(255, 204, 0, 1)' : 'rgba(245, 158, 11, 1)',
                point: isDarkMode ? 'rgba(255, 204, 0, 1)' : 'rgba(245, 158, 11, 1)'
            }
        };
        
        // Create chart
        const ctx = document.getElementById('campaignComparisonChart').getContext('2d');
        this.charts.comparison = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'CTR (×1000)',
                        data: ctrData.map(val => val * 1000), // Scale for better visualization
                        backgroundColor: colors.ctr.bg,
                        borderColor: colors.ctr.border,
                        pointBackgroundColor: colors.ctr.point,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: colors.ctr.border,
                        borderWidth: 2
                    },
                    {
                        label: 'Cliques (÷100)',
                        data: clicksData.map(val => val / 100), // Scale for better visualization
                        backgroundColor: colors.clicks.bg,
                        borderColor: colors.clicks.border,
                        pointBackgroundColor: colors.clicks.point,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: colors.clicks.border,
                        borderWidth: 2
                    },
                    {
                        label: 'Gasto (÷100)',
                        data: spendData.map(val => val / 100), // Scale for better visualization
                        backgroundColor: colors.spend.bg,
                        borderColor: colors.spend.border,
                        pointBackgroundColor: colors.spend.point,
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: colors.spend.border,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                elements: {
                    line: {
                        tension: 0.4 // Smoothes the line
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.15)' 
                                : 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.25)' 
                                : 'rgba(0, 0, 0, 0.15)'
                        },
                        pointLabels: {
                            color: isDarkMode 
                                ? 'rgba(255, 255, 255, 0.9)' 
                                : 'rgba(0, 0, 0, 0.7)',
                            font: {
                                weight: isDarkMode ? 'bold' : 'normal'
                            }
                        },
                        ticks: {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                            backdropColor: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                            z: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: isDarkMode ? '#ffffff' : '#303338',
                            font: {
                                weight: isDarkMode ? 'bold' : 'normal'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        titleColor: isDarkMode ? '#ffffff' : '#303338',
                        bodyColor: isDarkMode ? '#cccccc' : '#606770',
                        borderColor: isDarkMode ? 'rgba(65, 147, 255, 0.5)' : 'rgba(79, 70, 229, 0.5)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label.includes('CTR')) {
                                    return `CTR: ${(context.raw / 1000).toFixed(2)}%`;
                                } else if (label.includes('Cliques')) {
                                    return `Cliques: ${(context.raw * 100).toLocaleString()}`;
                                } else if (label.includes('Gasto')) {
                                    return `Gasto: R$ ${(context.raw * 100).toFixed(2)}`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Render the ranking cards
     */
    renderRanking() {
        // Clear existing ranking
        const existingRanking = this.container.querySelector('.ranking-container');
        if (existingRanking) {
            existingRanking.remove();
        }
        
        // Create ranking container
        const rankingContainer = document.createElement('div');
        rankingContainer.className = 'ranking-container';
        
        // Create grid for cards
        const cardsGrid = document.createElement('div');
        cardsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        // Add cards for each campaign
        this.data.forEach((campaign, index) => {
            const position = index + 1;
            let positionClass = '';
            let medalIcon = '';
            
            // Styling for top 3 positions
            if (position === 1) {
                positionClass = 'bg-yellow-100 border-yellow-500';
                medalIcon = '<i class="fas fa-medal text-yellow-500 text-xl mr-2"></i>';
            } else if (position === 2) {
                positionClass = 'bg-gray-100 border-gray-500';
                medalIcon = '<i class="fas fa-medal text-gray-500 text-xl mr-2"></i>';
            } else if (position === 3) {
                positionClass = 'bg-amber-100 border-amber-600';
                medalIcon = '<i class="fas fa-medal text-amber-600 text-xl mr-2"></i>';
            }
            
            const card = document.createElement('div');
            card.className = `campaign-card bg-white rounded-lg shadow-md overflow-hidden border-l-4 transition-all duration-300 ${positionClass || 'border-indigo-500'}`;
            card.dataset.id = campaign.id || index;
            
            // Calculate performance score (normalized between 0-100)
            let performanceScore = 0;
            
            switch(this.currentMetric) {
                case 'ctr':
                    performanceScore = Math.min(parseFloat(campaign.ctr) * 10, 100);
                    break;
                case 'clicks':
                    performanceScore = Math.min((parseInt(campaign.clicks) / 1000) * 10, 100);
                    break;
                case 'spend':
                    performanceScore = Math.min((parseFloat(campaign.spend) / 1000) * 10, 100);
                    break;
                case 'impressions':
                    performanceScore = Math.min((parseInt(campaign.impressions) / 10000) * 10, 100);
                    break;
                default:
                    performanceScore = 50;
            }
            
            // Card content
            card.innerHTML = `
                <div class="p-5">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-bold text-gray-800 text-lg">
                            ${medalIcon}${truncateText(campaign.campaign_name, 28)}
                        </h3>
                        <span class="text-2xl font-bold ${position <= 3 ? 'text-indigo-600' : 'text-gray-500'}">#${position}</span>
                    </div>
                    
                    <div class="flex flex-col gap-4">
                        <div class="performance-meter">
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-gray-700">Performance</span>
                                <span class="text-sm font-medium text-gray-700">${performanceScore.toFixed(0)}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2.5">
                                <div class="h-2.5 rounded-full" style="width: ${performanceScore}%; background-color: ${this.getPerformanceColor(performanceScore)}"></div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-gray-50 p-2 rounded">
                                <span class="text-xs text-gray-500">CTR</span>
                                <p class="text-lg font-semibold">${campaign.ctr}%</p>
                            </div>
                            <div class="bg-gray-50 p-2 rounded">
                                <span class="text-xs text-gray-500">Cliques</span>
                                <p class="text-lg font-semibold">${parseInt(campaign.clicks).toLocaleString()}</p>
                            </div>
                            <div class="bg-gray-50 p-2 rounded">
                                <span class="text-xs text-gray-500">Gasto</span>
                                <p class="text-lg font-semibold">R$ ${parseFloat(campaign.spend).toFixed(2)}</p>
                            </div>
                            <div class="bg-gray-50 p-2 rounded">
                                <span class="text-xs text-gray-500">Impressões</span>
                                <p class="text-lg font-semibold">${parseInt(campaign.impressions).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            cardsGrid.appendChild(card);
        });
        
        rankingContainer.appendChild(cardsGrid);
        this.container.appendChild(rankingContainer);
        
        // Create comparison chart
        this.createComparisonChart();
    }
    
    /**
     * Get color for performance meter based on score
     * @param {number} score - Performance score (0-100)
     * @returns {string} - Color string
     */
    getPerformanceColor(score) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        if (isDarkMode) {
            if (score >= 80) return '#4cd964'; // Green (higher contrast)
            if (score >= 60) return '#4193ff'; // Blue (higher contrast)
            if (score >= 40) return '#ffcc00'; // Yellow (higher contrast)
            if (score >= 20) return '#ff9500'; // Orange (higher contrast)
            return '#ff453a'; // Red (higher contrast)
        } else {
            if (score >= 80) return '#10b981'; // Green
            if (score >= 60) return '#4f46e5'; // Indigo 
            if (score >= 40) return '#f59e0b'; // Amber
            if (score >= 20) return '#f97316'; // Orange
            return '#ef4444'; // Red
        }
    }
    
    /**
     * Render the view with data
     * @param {Array} data - Array of campaign data
     */
    render(data) {
        this.data = data;
        
        // Sort data based on current metric
        this.sortData();
        
        // Render ranking UI
        this.renderRanking();
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        if (!this.container) return;
        
        this.container.classList.add('loading');
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        if (!this.container) return;
        
        this.container.classList.remove('loading');
    }
} 