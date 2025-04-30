/**
 * DashboardController class
 * Controls the Dashboard section functionality
 */
import { ApiService } from '../api/ApiService.js';
import { DashboardView } from '../views/DashboardView.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';

export class DashboardController {
    /**
     * Create a new DashboardController instance
     */
    constructor() {
        this.apiService = new ApiService();
        this.view = new DashboardView();
        this.errorHandler = new ErrorHandler();
        this.data = [];
        this.refreshBtn = null;
        this.isLoading = false;
        
        // Handle API events
        this.apiService.on('dashboard:data', this.handleDashboardData.bind(this));
        this.apiService.on('api:error', this.handleApiError.bind(this));
    }
    
    /**
     * Initialize the controller
     */
    init() {
        // Setup refresh button
        this.refreshBtn = document.querySelector('#dashboard .refresh-btn');
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
        
        // Load dashboard data when the dashboard is shown
        document.querySelector('[data-section="dashboard"]').addEventListener('click', () => {
            this.loadDashboardData();
        });
        
        // Initial data load
        this.loadDashboardData();
        
        // Listen for window resize to redraw charts
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    /**
     * Load dashboard data from the API
     */
    loadDashboardData() {
        // Prevent multiple simultaneous requests
        if (this.isLoading) return;
        
        // Set loading state
        this.isLoading = true;
        
        // Show loading state
        this.view.showLoading();
        
        // Set loading state on refresh button if it exists
        this.setRefreshButtonLoading(true);
        
        // Fetch data from API
        this.apiService.fetchDashboardData()
            .catch(error => {
                // Ensure loading state is cleared on error
                this.isLoading = false;
                this.view.hideLoading();
                this.setRefreshButtonLoading(false);
                console.error('Error fetching dashboard data:', error);
            });
    }
    
    /**
     * Refresh dashboard data
     */
    refreshDashboard() {
        // Prevent multiple simultaneous requests
        if (this.isLoading) return;
        
        // Set loading state
        this.isLoading = true;
        
        // Show loading state on refresh button
        this.setRefreshButtonLoading(true);
        
        // Show loading spinner on charts
        this.view.showChartLoading();
        
        // Fetch fresh data
        this.apiService.fetchDashboardData()
            .catch(error => {
                // Ensure loading state is cleared on error
                this.isLoading = false;
                this.view.hideChartLoading();
                this.setRefreshButtonLoading(false);
                console.error('Error refreshing dashboard data:', error);
            });
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
     * Handle window resize event
     */
    handleResize() {
        // Redraw charts if data is available
        if (this.data && this.data.length > 0) {
            this.view.updateChartsSize();
        }
    }
    
    /**
     * Handle received dashboard data
     * @param {Array} data - Dashboard data
     */
    handleDashboardData(data) {
        // Reset loading state
        this.isLoading = false;
        
        this.data = data;
        this.view.render(data);
        
        // Reset refresh button state
        this.setRefreshButtonLoading(false);
        
        // Ensure loading indicators are hidden
        this.view.hideLoading();
        this.view.hideChartLoading();
        
        // Show success message
        this.showUpdateSuccessMessage();
    }
    
    /**
     * Show a success toast message when dashboard is updated
     */
    showUpdateSuccessMessage() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        message.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <div>
                <p class="font-medium">Dados atualizados com sucesso</p>
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
     * Handle API errors
     * @param {Object} error - Error object
     */
    handleApiError(error) {
        // Reset loading state
        this.isLoading = false;
        
        this.view.hideLoading();
        this.view.hideChartLoading();
        this.view.showError('Não foi possível carregar os dados do dashboard.');
        this.errorHandler.handleApiError(error);
        
        // Reset refresh button state
        this.setRefreshButtonLoading(false);
    }

    /**
     * Fetch data from the API
     * @param {boolean} [showLoadingState=true] Whether to show loading states
     */
    async fetchData(showLoadingState = true) {
        // Get the refresh button and disable it during the request
        const refreshBtn = document.getElementById('dashboardRefreshBtn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            
            // Show only the loading icon, no text
            const originalInnerHTML = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
            refreshBtn.classList.add('opacity-70');
        }
        
        // Show loading state on all charts
        if (showLoadingState) {
            const chartContainers = document.querySelectorAll('#dashboard .chart-container');
            chartContainers.forEach(container => {
                container.classList.add('loading');
            });
        }
        
        try {
            // Fetch data from API
            const response = await this.apiService.getDashboardData();
            this.data = response;
            
            // Update UI with the new data
            this.renderStats();
            this.renderCharts();
            
            // Return the data in case it's needed
            return this.data;
        } catch (error) {
            this.errorHandler.handleError('Error fetching dashboard data', error);
            return null;
        } finally {
            // Re-enable refresh button and restore original text
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.classList.remove('opacity-70');
            }
            
            // Remove loading state from all charts
            if (showLoadingState) {
                const chartContainers = document.querySelectorAll('#dashboard .chart-container');
                chartContainers.forEach(container => {
                    container.classList.remove('loading');
                });
            }
        }
    }
} 