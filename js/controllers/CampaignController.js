/**
 * CampaignController class
 * Controls the Campaigns section functionality
 */
import { ApiService } from '../api/ApiService.js';
import { Campaign } from '../models/Campaign.js';
import { formatDate, getStatusClass, getStatusText } from '../utils/DataHelpers.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { CampaignRankingView } from '../views/CampaignRankingView.js';

export class CampaignController {
    /**
     * Create a new CampaignController instance
     */
    constructor() {
        this.apiService = new ApiService();
        this.errorHandler = new ErrorHandler();
        this.campaignsData = [];
        this.filteredCampaigns = [];
        this.tableBody = null;
        this.refreshBtn = null;
        this.searchInput = null;
        this.filterBtn = null;
        this.sortBtn = null;
        this.currentFilter = 'all'; // 'all', 'active', 'finished'
        this.currentSort = 'name-asc'; // 'name-asc', 'name-desc', 'spend-asc', 'spend-desc'
        
        // View elements
        this.listView = null;
        this.rankingView = null;
        this.tabButtons = null;
        
        // Ranking view
        this.campaignRankingView = new CampaignRankingView();
        
        // Handle API events
        this.apiService.on('campaigns:data', this.handleCampaignsData.bind(this));
        this.apiService.on('api:error', this.handleApiError.bind(this));
    }
    
    /**
     * Initialize the controller
     */
    init() {
        // Cache DOM elements
        this.tableBody = document.querySelector('#campanhasTable tbody');
        this.refreshBtn = document.querySelector('#campanhas .refresh-btn');
        this.searchInput = document.querySelector('#campanhas input[type="text"]');
        this.filterBtn = document.querySelector('#campanhas button:has(.fa-filter)');
        this.sortBtn = document.querySelector('#campanhas button:has(.fa-sort)');
        
        // Cache view elements
        this.listView = document.getElementById('campaignListView');
        this.rankingView = document.getElementById('campaignRankingView');
        this.tabButtons = document.querySelectorAll('.campaign-tab-btn');
        
        // Initialize ranking view
        this.campaignRankingView.init(this.rankingView);
        
        // Setup tab switching
        this.setupTabSwitching();
        
        // Setup other event listeners
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.refreshCampaigns();
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        if (this.filterBtn) {
            this.filterBtn.addEventListener('click', this.toggleFilterDropdown.bind(this));
        }
        
        if (this.sortBtn) {
            this.sortBtn.addEventListener('click', this.toggleSortDropdown.bind(this));
        }
        
        // Setup event listeners for section change
        document.addEventListener('section:change', (event) => {
            if (event.detail.section === 'campanhas' && this.campaignsData.length === 0) {
                this.loadCampaignsData();
            }
        });
    }
    
    /**
     * Set up tab switching functionality
     */
    setupTabSwitching() {
        const listTabBtn = document.getElementById('listTabBtn');
        const rankingTabBtn = document.getElementById('rankingTabBtn');
        
        if (listTabBtn && rankingTabBtn) {
            listTabBtn.addEventListener('click', () => {
                this.activateTab('list');
            });
            
            rankingTabBtn.addEventListener('click', () => {
                this.activateTab('ranking');
            });
        }
    }
    
    /**
     * Activate a tab
     * @param {string} tabName - Name of the tab to activate ('list' or 'ranking')
     */
    activateTab(tabName) {
        // Update tab buttons
        this.tabButtons.forEach(btn => {
            btn.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
            btn.classList.add('text-gray-500');
        });
        
        const activeButton = tabName === 'list' ? 
            document.getElementById('listTabBtn') : 
            document.getElementById('rankingTabBtn');
            
        if (activeButton) {
            activeButton.classList.add('active', 'border-indigo-500', 'text-indigo-600');
            activeButton.classList.remove('text-gray-500');
        }
        
        // Update views
        if (tabName === 'list') {
            this.listView.classList.add('active');
            this.rankingView.classList.remove('active');
        } else {
            this.listView.classList.remove('active');
            this.rankingView.classList.add('active');
            
            // Ensure ranking view is rendered
            if (this.campaignsData.length > 0) {
                this.renderRankingView();
            }
        }
    }
    
    /**
     * Load campaigns data from the API
     */
    loadCampaignsData() {
        // Show loading state
        this.showLoading();
        
        // Set refresh button to loading state
        this.setRefreshButtonLoading(true);
        
        // Fetch data from API
        this.apiService.fetchCampaignsData();
    }
    
    /**
     * Refresh campaigns data
     */
    refreshCampaigns() {
        // Show loading state on refresh button
        this.setRefreshButtonLoading(true);
        
        // Show loading spinner on table
        this.showTableLoading();
        
        // Fetch fresh data
        this.apiService.fetchCampaignsData();
    }
    
    /**
     * Set loading state on refresh button
     * @param {boolean} isLoading - Whether the button should show loading state
     */
    setRefreshButtonLoading(isLoading) {
        if (!this.refreshBtn) return;
        
        if (isLoading) {
            // Armazena o conteúdo original para restaurar mais tarde
            if (!this.refreshBtn.hasAttribute('data-original-html')) {
                this.refreshBtn.setAttribute('data-original-html', this.refreshBtn.innerHTML);
            }
            
            // Exibe apenas o ícone girando, sem texto
            this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            this.refreshBtn.disabled = true;
            this.refreshBtn.classList.add('opacity-70');
        } else {
            // Restaura o conteúdo original do botão
            if (this.refreshBtn.hasAttribute('data-original-html')) {
                this.refreshBtn.innerHTML = this.refreshBtn.getAttribute('data-original-html');
                this.refreshBtn.removeAttribute('data-original-html');
            } else {
                // Fallback caso não tenha o atributo data-original-html
                this.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> <span>Atualizar</span>';
            }
            this.refreshBtn.disabled = false;
            this.refreshBtn.classList.remove('opacity-70');
        }
    }
    
    /**
     * Show loading state specifically for the table
     */
    showTableLoading() {
        if (!this.tableBody) return;
        
        // Add a loading overlay to the table's parent
        const tableContainer = this.tableBody.closest('.overflow-x-auto');
        if (tableContainer) {
            tableContainer.classList.add('loading');
        }
    }
    
    /**
     * Hide table loading state
     */
    hideTableLoading() {
        if (!this.tableBody) return;
        
        // Remove loading overlay from table's parent
        const tableContainer = this.tableBody.closest('.overflow-x-auto');
        if (tableContainer) {
            tableContainer.classList.remove('loading');
        }
    }
    
    /**
     * Handle search input
     * @param {Event} event - Input event
     */
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase().trim();
        
        // Filter campaigns
        this.filteredCampaigns = this.campaignsData.filter(campaign => {
            const campaignName = campaign.getFormattedName().toLowerCase();
            return campaignName.includes(searchTerm);
        });
        
        // Render filtered campaigns
        this.renderCampaignsTable();
    }
    
    /**
     * Toggle filter dropdown
     * @param {Event} event - Click event
     */
    toggleFilterDropdown(event) {
        // Check if dropdown already exists
        let dropdown = document.getElementById('filter-dropdown');
        
        if (dropdown) {
            // If dropdown exists, remove it
            dropdown.remove();
            return;
        }
        
        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.id = 'filter-dropdown';
        dropdown.className = 'absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-10 w-40 py-1';
        
        // Add filter options
        dropdown.innerHTML = `
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentFilter === 'all' ? 'bg-blue-light text-blue-primary' : ''}" data-filter="all">
                Todas
            </button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentFilter === 'active' ? 'bg-blue-light text-blue-primary' : ''}" data-filter="active">
                Ativas
            </button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentFilter === 'finished' ? 'bg-blue-light text-blue-primary' : ''}" data-filter="finished">
                Finalizadas
            </button>
        `;
        
        // Position dropdown relative to filter button
        const filterBtnContainer = this.filterBtn.parentNode;
        filterBtnContainer.style.position = 'relative';
        filterBtnContainer.appendChild(dropdown);
        
        // Add click event to options
        dropdown.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.applyFilter(filter);
                dropdown.remove();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== this.filterBtn) {
                dropdown.remove();
            }
        }, { once: true });
    }
    
    /**
     * Apply filter to campaigns
     * @param {string} filter - Filter to apply ('all', 'active', 'finished')
     */
    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button text
        if (this.filterBtn) {
            const filterText = this.filterBtn.querySelector('span') || this.filterBtn;
            switch (filter) {
                case 'active':
                    filterText.textContent = 'Ativas';
                    break;
                case 'finished':
                    filterText.textContent = 'Finalizadas';
                    break;
                default:
                    filterText.textContent = 'Filtrar';
                    break;
            }
        }
        
        // Apply filter
        if (filter === 'all') {
            this.filteredCampaigns = [...this.campaignsData];
        } else {
            const isActive = filter === 'active';
            this.filteredCampaigns = this.campaignsData.filter(campaign => campaign.isActive() === isActive);
        }
        
        // Re-render table
        this.renderCampaignsTable();
    }
    
    /**
     * Toggle sort dropdown
     * @param {Event} event - Click event
     */
    toggleSortDropdown(event) {
        // Check if dropdown already exists
        let dropdown = document.getElementById('sort-dropdown');
        
        if (dropdown) {
            // If dropdown exists, remove it
            dropdown.remove();
            return;
        }
        
        // Create dropdown
        dropdown = document.createElement('div');
        dropdown.id = 'sort-dropdown';
        dropdown.className = 'absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg z-10 w-52 py-1';
        
        // Add sort options
        dropdown.innerHTML = `
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentSort === 'name-asc' ? 'bg-blue-light text-blue-primary' : ''}" data-sort="name-asc">
                Nome (A-Z)
            </button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentSort === 'name-desc' ? 'bg-blue-light text-blue-primary' : ''}" data-sort="name-desc">
                Nome (Z-A)
            </button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentSort === 'spend-asc' ? 'bg-blue-light text-blue-primary' : ''}" data-sort="spend-asc">
                Gasto (menor-maior)
            </button>
            <button class="w-full text-left px-4 py-2 hover:bg-gray-100 ${this.currentSort === 'spend-desc' ? 'bg-blue-light text-blue-primary' : ''}" data-sort="spend-desc">
                Gasto (maior-menor)
            </button>
        `;
        
        // Position dropdown relative to sort button
        const sortBtnContainer = this.sortBtn.parentNode;
        sortBtnContainer.style.position = 'relative';
        sortBtnContainer.appendChild(dropdown);
        
        // Add click event to options
        dropdown.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const sort = e.target.getAttribute('data-sort');
                this.applySort(sort);
                dropdown.remove();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== this.sortBtn) {
                dropdown.remove();
            }
        }, { once: true });
    }
    
    /**
     * Apply sort to campaigns
     * @param {string} sort - Sort to apply ('name-asc', 'name-desc', 'spend-asc', 'spend-desc')
     */
    applySort(sort) {
        this.currentSort = sort;
        
        // Update sort button text
        if (this.sortBtn) {
            const sortText = this.sortBtn.querySelector('span') || this.sortBtn;
            switch (sort) {
                case 'name-asc':
                    sortText.textContent = 'Nome (A-Z)';
                    break;
                case 'name-desc':
                    sortText.textContent = 'Nome (Z-A)';
                    break;
                case 'spend-asc':
                    sortText.textContent = 'Gasto ↑';
                    break;
                case 'spend-desc':
                    sortText.textContent = 'Gasto ↓';
                    break;
                default:
                    sortText.textContent = 'Ordenar';
                    break;
            }
        }
        
        // Apply sort
        this.filteredCampaigns.sort((a, b) => {
            switch (sort) {
                case 'name-asc':
                    return a.getFormattedName().localeCompare(b.getFormattedName());
                case 'name-desc':
                    return b.getFormattedName().localeCompare(a.getFormattedName());
                case 'spend-asc':
                    return a.spend - b.spend;
                case 'spend-desc':
                    return b.spend - a.spend;
                default:
                    return 0;
            }
        });
        
        // Re-render table
        this.renderCampaignsTable();
    }
    
    /**
     * Handle received campaigns data
     * @param {Array} data - Campaigns data
     */
    handleCampaignsData(data) {
        // Convert raw data to Campaign model instances
        this.campaignsData = Campaign.fromDataArray(data);
        this.filteredCampaigns = [...this.campaignsData];
        
        // Apply current filter if any
        if (this.currentFilter !== 'all') {
            this.applyFilter(this.currentFilter);
        } else {
            // Render the campaigns table
            this.renderCampaignsTable();
            // Render the ranking view
            this.renderRankingView();
        }
        
        // Hide loading indicator
        this.hideLoading();
        this.hideTableLoading();
        
        // Reset refresh button state
        this.setRefreshButtonLoading(false);
        
        // Show success message
        this.showUpdateSuccessMessage();
    }
    
    /**
     * Show a success toast message when campaigns are updated
     */
    showUpdateSuccessMessage() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        message.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <div>
                <p class="font-medium">Campanhas atualizadas com sucesso</p>
                <p class="text-sm">Última atualização: ${timeString}</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(message);
        
        // Add click event to close button
        const closeButton = message.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(message);
            });
        }
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 3000);
    }
    
    /**
     * Render campaigns table with data
     */
    renderCampaignsTable() {
        if (!this.tableBody) {
            console.error('Table body element not found');
            return;
        }
        
        this.tableBody.innerHTML = '';
        
        if (this.filteredCampaigns.length === 0) {
            // Show no data message
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="py-4 text-center text-gray-500">
                    <i class="fas fa-search fa-2x mb-2"></i>
                    <p>Nenhuma campanha encontrada</p>
                </td>
            `;
            this.tableBody.appendChild(row);
            return;
        }
        
        this.filteredCampaigns.forEach(campaign => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-blue-light transition-colors';
            row.innerHTML = `
                <td class="py-3 px-4 text-left">${campaign.getFormattedName()}</td>
                <td class="py-3 px-4 text-left">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${campaign.getStatusClass()}">${campaign.getStatusText()}</span>
                </td>
                <td class="py-3 px-4 text-left">${campaign.getFormattedStartDate()}</td>
                <td class="py-3 px-4 text-left">${campaign.getFormattedEndDate()}</td>
                <td class="py-3 px-4 text-right font-medium">R$ ${campaign.spend.toFixed(2)}</td>
            `;
            this.tableBody.appendChild(row);
        });
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const campanhasSection = document.getElementById('campanhas');
        campanhasSection.classList.add('loading');
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const campanhasSection = document.getElementById('campanhas');
        campanhasSection.classList.remove('loading');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const campanhasSection = document.getElementById('campanhas');
        
        // Add error message if it doesn't exist yet
        if (!campanhasSection.querySelector('.error-message')) {
            campanhasSection.innerHTML += `
                <div class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                    <strong class="font-bold">Erro!</strong>
                    <span class="block sm:inline">${message}</span>
                </div>
            `;
        }
    }
    
    /**
     * Handle API errors
     * @param {Object} error - Error object
     */
    handleApiError(error) {
        this.hideLoading();
        this.hideTableLoading();
        this.showError('Não foi possível carregar os dados das campanhas.');
        this.errorHandler.handleApiError(error);
        
        // Reset refresh button state
        this.setRefreshButtonLoading(false);
    }
    
    /**
     * Render the ranking view
     */
    renderRankingView() {
        // Convert Campaign models to plain objects for the ranking view
        const rankingData = this.campaignsData.map(campaign => ({
            id: campaign.id,
            campaign_name: campaign.getFormattedName(),
            spend: campaign.spend,
            clicks: campaign.clicks,
            impressions: campaign.impressions,
            ctr: parseFloat(campaign.ctr || 0),
            cpc: parseFloat(campaign.cpc || 0),
            status: campaign.isActive(),
            start_date: campaign.getFormattedStartDate(),
            end_date: campaign.getFormattedEndDate()
        }));
        
        // Render the ranking view
        this.campaignRankingView.render(rankingData);
    }
} 