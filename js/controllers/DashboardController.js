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
        
        const icon = this.refreshBtn.querySelector('i');
        const text = this.refreshBtn.querySelector('span');
        
        if (isLoading) {
            this.refreshBtn.disabled = true;
            this.refreshBtn.classList.add('opacity-70', 'cursor-not-allowed');
            if (icon) {
                icon.classList.add('fa-spin');
            }
            if (text) {
                text.textContent = 'Atualizando...';
            }
        } else {
            this.refreshBtn.disabled = false;
            this.refreshBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            if (icon) {
                icon.classList.remove('fa-spin');
            }
            if (text) {
                text.textContent = 'Atualizar';
            }
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
} 