/**
 * ThemeController class
 * Controls the theme functionality (dark/light mode)
 */
export class ThemeController {
    /**
     * Create a new ThemeController instance
     */
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.isDarkMode = false;
        this.storageKey = 'meta-ads-theme-preference';
        this.chartContainers = [];
    }
    
    /**
     * Initialize the controller
     */
    init() {
        // Load saved theme preference
        this.loadThemePreference();
        
        // Setup event listeners
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Listen for system preference changes
        this.setupSystemPreferenceListener();
    }
    
    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        const savedPreference = localStorage.getItem(this.storageKey);
        
        if (savedPreference === 'dark') {
            this.enableDarkMode();
        } else if (savedPreference === 'light') {
            this.enableLightMode();
        } else {
            // Check system preference if no saved preference
            this.checkSystemPreference();
        }
    }
    
    /**
     * Check system preference for dark/light mode
     */
    checkSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }
    }
    
    /**
     * Setup listener for system preference changes
     */
    setupSystemPreferenceListener() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                // Only apply if user hasn't set a preference explicitly
                if (!localStorage.getItem(this.storageKey)) {
                    if (e.matches) {
                        this.enableDarkMode(false); // Don't save to storage
                    } else {
                        this.enableLightMode(false); // Don't save to storage
                    }
                }
            });
        }
    }
    
    /**
     * Toggle between dark and light mode
     */
    toggleTheme() {
        if (this.isDarkMode) {
            this.enableLightMode();
        } else {
            this.enableDarkMode();
        }
    }
    
    /**
     * Enable dark mode
     * @param {boolean} [savePreference=true] - Whether to save preference to localStorage
     */
    enableDarkMode(savePreference = true) {
        document.body.classList.add('dark-mode');
        this.isDarkMode = true;
        
        // Update toggle icon
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
        }
        
        // Save preference if requested
        if (savePreference) {
            localStorage.setItem(this.storageKey, 'dark');
        }
        
        // Apply high contrast to any charts that use CSS vars
        this.updateChartsForHighContrast(true);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: 'dark' } }));
    }
    
    /**
     * Enable light mode
     * @param {boolean} [savePreference=true] - Whether to save preference to localStorage
     */
    enableLightMode(savePreference = true) {
        document.body.classList.remove('dark-mode');
        this.isDarkMode = false;
        
        // Update toggle icon
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-moon';
            }
        }
        
        // Save preference if requested
        if (savePreference) {
            localStorage.setItem(this.storageKey, 'light');
        }
        
        // Update any charts that use CSS vars
        this.updateChartsForHighContrast(false);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: 'light' } }));
    }
    
    /**
     * Update charts for high contrast
     * @param {boolean} isDarkMode - Whether dark mode is enabled
     */
    updateChartsForHighContrast(isDarkMode) {
        // Apply high contrast styles to any Chart.js instances that might be present
        if (window.Chart) {
            Chart.defaults.color = isDarkMode ? '#ffffff' : '#303338';
            Chart.defaults.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        }
    }
    
    /**
     * Get current theme
     * @returns {string} - Current theme ('dark' or 'light')
     */
    getCurrentTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }
} 