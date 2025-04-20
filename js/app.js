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
            this.reportController.init();
            this.themeController.init();
            
            // Set dashboard as active by default
            this.navigationController.activateSection('dashboard');
        });
    }
}

// Create and start the application
const app = new App();

// Export for potential testing or extension
export default app; 