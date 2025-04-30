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
        this.currentMetric = 'roas'; // Default sorting metric
        this.sortDirection = 'desc'; // Default sort direction
        this.charts = {};
        this.dateFilter = 'last7days'; // Default date filter
    }
    
    /**
     * Initialize the view
     * @param {HTMLElement} container - The container element
     */
    init(container) {
        this.container = container;
        
        // Create filter controls
        this.createFilterControls();
        
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
     * Create filter controls for the ranking
     */
    createFilterControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'flex justify-between items-center mb-6';
        controlsContainer.innerHTML = `
            <div class="flex gap-4">
                <select id="dateFilter" class="px-4 py-2 border border-gray-200 rounded-lg bg-white">
                    <option value="last7days">Últimos 7 dias</option>
                    <option value="last30days">Últimos 30 dias</option>
                    <option value="custom">Personalizado</option>
                </select>
                <select id="metricFilter" class="px-4 py-2 border border-gray-200 rounded-lg bg-white">
                    <option value="roas">Ordenar por ROAS</option>
                    <option value="cpa">Ordenar por CPA</option>
                    <option value="spend">Ordenar por Gasto</option>
                    <option value="conversions">Ordenar por Conversões</option>
                </select>
            </div>
        `;
        
        this.container.appendChild(controlsContainer);
        
        // Add event listeners to filters
        const dateFilter = controlsContainer.querySelector('#dateFilter');
        const metricFilter = controlsContainer.querySelector('#metricFilter');
        
        dateFilter.addEventListener('change', (e) => {
            this.dateFilter = e.target.value;
            // In a real app, this would trigger a data refresh
            // For now, just re-render with current data
            this.renderRanking();
        });
        
        metricFilter.addEventListener('change', (e) => {
            this.currentMetric = e.target.value;
            this.sortData();
            this.renderRanking();
        });
    }
    
    /**
     * Setup tooltips and interactivity
     */
    setupTooltips() {
        // Using event delegation
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('#campaign-grid > div')) {
                const card = e.target.closest('#campaign-grid > div');
                card.classList.add('shadow-lg');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('#campaign-grid > div')) {
                const card = e.target.closest('#campaign-grid > div');
                if (!card.classList.contains('modal-open')) {
                    card.classList.remove('shadow-lg');
                }
            }
        });
        
        // Handle campaign card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('#campaign-grid > div')) {
                const card = e.target.closest('#campaign-grid > div');
                const campaignId = card.getAttribute('data-id');
                this.openCampaignDetails(campaignId);
            }
            
            // Close modal if click on close button - replace :has selector
            const closeButton = e.target.closest('#campaign-modal button');
            if (closeButton && closeButton.querySelector('.fa-xmark')) {
                this.closeCampaignModal();
            }
            
            // Close modal if click outside modal content
            if (e.target.id === 'campaign-modal') {
                this.closeCampaignModal();
            }
        });
    }
    
    /**
     * Sort data based on current metric and direction
     */
    sortData() {
        this.data.sort((a, b) => {
            let valueA, valueB;
            
            switch(this.currentMetric) {
                case 'roas':
                    valueA = parseFloat(a.roas || 0);
                    valueB = parseFloat(b.roas || 0);
                    break;
                case 'cpa':
                    valueA = parseFloat(a.cpa || 0);
                    valueB = parseFloat(b.cpa || 0);
                    break;
                case 'spend':
                    valueA = parseFloat(a.spend || 0);
                    valueB = parseFloat(b.spend || 0);
                    break;
                case 'conversions':
                    valueA = parseInt(a.conversions || 0);
                    valueB = parseInt(b.conversions || 0);
                    break;
                default:
                    valueA = parseFloat(a.roas || 0);
                    valueB = parseFloat(b.roas || 0);
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
     * Render the ranking cards
     */
    renderRanking() {
        // Clear existing ranking
        const existingRanking = this.container.querySelector('#campaign-grid');
        if (existingRanking) {
            existingRanking.remove();
        }
        
        // Create the campaign grid
        const campaignGrid = document.createElement('div');
        campaignGrid.id = 'campaign-grid';
        campaignGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        
        // Add campaign cards
        this.data.forEach((campaign, index) => {
            // Determine medal position elements
            let medalPosition = '';
            let medalClass = '';
            
            if (index === 0) {
                medalPosition = '🥇';
                medalClass = 'bg-yellow-400';
            } else if (index === 1) {
                medalPosition = '🥈';
                medalClass = 'bg-gray-300';
            } else if (index === 2) {
                medalPosition = '🥉';
                medalClass = 'bg-orange-300';
            }
            
            // Create campaign card
            const card = document.createElement('div');
            card.id = `campaign-${index+1}`;
            card.className = 'bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-shadow';
            card.setAttribute('data-id', campaign.id || index);
            
            // Status badge class
            const statusClass = campaign.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';
            const statusText = campaign.status ? 'Ativo' : 'Pausado';
            
            // ROAS arrow
            const roasChange = (campaign.roas_change || 0);
            const roasArrow = roasChange > 0 
                ? '<i class="fa-solid fa-arrow-up text-green-500"></i>' 
                : roasChange < 0 
                    ? '<i class="fa-solid fa-arrow-down text-red-500"></i>' 
                    : '';
            
            // Card HTML
            let cardHTML = `
                ${medalPosition ? `<div class="absolute -top-3 -right-3 ${medalClass} text-2xl p-2 rounded-full">${medalPosition}</div>` : ''}
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-semibold">${campaign.campaign_name}</h3>
                        <span class="text-sm ${statusClass} px-2 py-1 rounded-full">${statusText}</span>
                    </div>
                    <button class="text-gray-400 hover:text-gray-600">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                        <p class="text-sm text-gray-500">ROAS</p>
                        <p class="text-xl font-semibold">${campaign.roas}x ${roasArrow}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-gray-500">CPA</p>
                        <p class="text-xl font-semibold">R$ ${parseFloat(campaign.cpa || 0).toFixed(2)}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-gray-500">Gasto</p>
                        <p class="text-xl font-semibold">R$ ${formatCurrency(campaign.spend)}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-sm text-gray-500">Conversões</p>
                        <p class="text-xl font-semibold">${campaign.conversions || 0}</p>
                    </div>
                </div>
            `;
            
            card.innerHTML = cardHTML;
            campaignGrid.appendChild(card);
        });
        
        this.container.appendChild(campaignGrid);
    }
    
    /**
     * Open campaign details modal
     * @param {string|number} campaignId - ID of the campaign to show details for
     */
    openCampaignDetails(campaignId) {
        const campaign = this.data.find(c => (c.id || '').toString() === campaignId.toString());
        
        if (!campaign) return;
        
        const modal = document.getElementById('campaign-modal');
        if (!modal) return;
        
        // Fill in campaign details
        const modalTitle = modal.querySelector('h2');
        const modalDate = modal.querySelector('p.text-gray-500');
        
        // Replace problematic selectors with compatible DOM traversal
        // Find ROAS elements
        const roasValue = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('ROAS'))?.parentElement.querySelector('.text-3xl');
        const roasChange = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('ROAS'))?.parentElement.querySelector('.text-sm:not(.text-gray-500)');
        
        // Find CPA elements
        const cpaValue = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('CPA'))?.parentElement.querySelector('.text-3xl');
        const cpaChange = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('CPA'))?.parentElement.querySelector('.text-sm:not(.text-gray-500)');
        
        // Find Spend elements
        const spendValue = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('Gasto'))?.parentElement.querySelector('.text-3xl');
        const spendBudget = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('Gasto'))?.parentElement.querySelector('.text-sm.text-gray-500');
        
        // Find Conversions elements
        const conversionsValue = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('Conversões'))?.parentElement.querySelector('.text-3xl');
        const conversionsChange = Array.from(modal.querySelectorAll('.text-sm'))
            .find(el => el.textContent.includes('Conversões'))?.parentElement.querySelector('.text-sm:not(.text-gray-500)');
        
        // Update modal content with campaign data
        if (modalTitle) modalTitle.textContent = campaign.campaign_name;
        if (modalDate) modalDate.textContent = `Iniciada em ${campaign.start_date || 'N/A'}`;
        if (roasValue) roasValue.textContent = `${campaign.roas || '0.0'}x`;
        if (roasChange) {
            const change = campaign.roas_change || 0;
            roasChange.textContent = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
            roasChange.className = change >= 0 ? 'text-sm text-green-500' : 'text-sm text-red-500';
        }
        if (cpaValue) cpaValue.textContent = `R$ ${parseFloat(campaign.cpa || 0).toFixed(2)}`;
        if (cpaChange) {
            const change = campaign.cpa_change || 0;
            cpaChange.textContent = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
            cpaChange.className = change <= 0 ? 'text-sm text-green-500' : 'text-sm text-red-500';
        }
        if (spendValue) spendValue.textContent = `R$ ${formatCurrency(campaign.spend)}`;
        if (spendBudget) spendBudget.textContent = `Budget: R$ ${formatCurrency(campaign.budget || (campaign.spend * 1.5))}`;
        if (conversionsValue) conversionsValue.textContent = campaign.conversions || '0';
        if (conversionsChange) {
            const change = campaign.conversions_change || 0;
            conversionsChange.textContent = `${change > 0 ? '+' : ''}${change}% vs período anterior`;
            conversionsChange.className = change >= 0 ? 'text-sm text-green-500' : 'text-sm text-red-500';
        }
        
        // Update button states based on campaign status
        const pauseButtons = Array.from(modal.querySelectorAll('button'));
        const pauseButton = pauseButtons.find(btn => btn.innerHTML.includes('fa-pause') || btn.innerHTML.includes('fa-play'));
        
        if (pauseButton) {
            if (!campaign.status) {
                pauseButton.innerHTML = '<i class="fa-solid fa-play mr-2"></i> Ativar Campanha';
                pauseButton.className = 'px-6 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100';
            } else {
                pauseButton.innerHTML = '<i class="fa-solid fa-pause mr-2"></i> Pausar Campanha';
                pauseButton.className = 'px-6 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100';
            }
        }
        
        // Show modal
        modal.classList.remove('hidden');
    }
    
    /**
     * Close campaign details modal
     */
    closeCampaignModal() {
        const modal = document.getElementById('campaign-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    /**
     * Get performance color based on metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @returns {string} - Color code
     */
    getPerformanceColor(metric, value) {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Default colors
        const colors = {
            good: isDarkMode ? '#4cd964' : '#10b981',
            medium: isDarkMode ? '#4193ff' : '#3b82f6',
            poor: isDarkMode ? '#ff453a' : '#ef4444'
        };
        
        // Determine color based on metric and value
        switch(metric) {
            case 'roas':
                return value >= 3 ? colors.good : value >= 2 ? colors.medium : colors.poor;
            case 'cpa':
                return value <= 30 ? colors.good : value <= 50 ? colors.medium : colors.poor;
            case 'conversions':
                return value >= 300 ? colors.good : value >= 100 ? colors.medium : colors.poor;
            default:
                return colors.medium;
        }
    }
    
    /**
     * Render the view with data
     * @param {Array} data - Array of campaign data
     */
    render(data) {
        // Enrich data with ROAS values if not present
        const enrichedData = data.map(campaign => {
            // Add ROAS if not present (calculated as conversions value / spend)
            if (!campaign.roas) {
                const conversionValue = parseFloat(campaign.conversion_value || 0) || 
                                      parseFloat(campaign.conversions || 0) * 50; // Assume 50 per conversion if no value
                const spend = parseFloat(campaign.spend || 0);
                campaign.roas = spend > 0 ? ((conversionValue / spend) || 0).toFixed(1) : '0.0';
            }
            
            // Add CPA if not present (calculated as spend / conversions)
            if (!campaign.cpa) {
                const spend = parseFloat(campaign.spend || 0);
                const conversions = parseInt(campaign.conversions || 0);
                campaign.cpa = conversions > 0 ? (spend / conversions).toFixed(2) : '0.00';
            }
            
            // Add sample changes for demo
            campaign.roas_change = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 20);
            campaign.cpa_change = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 15);
            campaign.conversions_change = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 25);
            
            return campaign;
        });
        
        this.data = enrichedData;
        
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