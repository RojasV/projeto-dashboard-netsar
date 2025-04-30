/**
 * Main Application Entry Point
 * Orchestrates the initialization of all components
 */
import { NavigationController } from './controllers/NavigationController.js';
import { DashboardController } from './controllers/DashboardController.js';
import { CampaignController } from './controllers/CampaignController.js';
import { ReportController } from './controllers/ReportController.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { ThemeController } from './controllers/ThemeController.js';

class App {
    constructor() {
        // Initialize error handling
        this.errorHandler = new ErrorHandler();
        
        // Initialize controllers
        this.navigationController = new NavigationController();
        this.dashboardController = new DashboardController();
        this.campaignController = new CampaignController();
        this.reportController = new ReportController();
        this.themeController = new ThemeController();
        
        // Initialize the application
        this.init();
    }
    
    init() {
        // Set up event listeners and initialize components
        document.addEventListener('DOMContentLoaded', () => {
            this.navigationController.init();
            this.dashboardController.init();
            this.campaignController.init();
            this.reportController.init();
            this.themeController.init();
            
            // Set dashboard as active by default
            this.navigationController.activateSection('dashboard');
            
            // Setup additional global event listeners
            this.setupGlobalEventListeners();
        });
    }
    
    setupGlobalEventListeners() {
        // Backup modal close handlers in case the component-specific ones don't catch all scenarios
        document.addEventListener('click', (e) => {
            const campaignModal = document.getElementById('campaign-modal');
            if (campaignModal && !campaignModal.classList.contains('hidden')) {
                // Close if clicking the modal background (not its content)
                if (e.target === campaignModal) {
                    campaignModal.classList.add('hidden');
                }
                
                // Close if clicking the X button - replace :has() selector
                const closeButton = e.target.closest('#campaign-modal button');
                if (closeButton && closeButton.querySelector('.fa-xmark')) {
                    campaignModal.classList.add('hidden');
                }
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const campaignModal = document.getElementById('campaign-modal');
                if (campaignModal && !campaignModal.classList.contains('hidden')) {
                    campaignModal.classList.add('hidden');
                }
            }
        });
    }
}

// Create and start the application
const app = new App();

// Export for potential testing or extension
export default app; 