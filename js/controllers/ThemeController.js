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
        this.controllerInstances = {};
        
        // Register theme color plugin for Chart.js
        this.registerThemeColorPlugin();
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
        
        // Find and store references to refresh buttons
        this.findRefreshButtons();
    }
    
    /**
     * Register a Chart.js plugin to handle theme color changes
     * This plugin forces color updates when theme changes
     */
    registerThemeColorPlugin() {
        if (!window.Chart) {
            // Chart.js not loaded yet, try again after a delay
            setTimeout(() => this.registerThemeColorPlugin(), 500);
            return;
        }
        
        // Define plugin ID
        const THEME_COLORS_PLUGIN_ID = 'themeColorsPlugin';
        
        // Unregister existing plugin if it exists (to prevent duplicates)
        if (window.Chart.registry && window.Chart.registry.plugins) {
            const existingPlugin = window.Chart.registry.plugins.get(THEME_COLORS_PLUGIN_ID);
            if (existingPlugin) {
                window.Chart.registry.plugins.remove(existingPlugin);
            }
        }
        
        // Create plugin for Chart.js
        const themeColorsPlugin = {
            id: THEME_COLORS_PLUGIN_ID,
            beforeInit: (chart) => {
                // Store reference to the theme controller
                chart.themeController = this;
            },
            beforeRender: (chart) => {
                const isDarkMode = document.body.classList.contains('dark-mode');
                
                // Apply correct colors based on theme
                if (chart.config && chart.config.data && chart.config.data.datasets) {
                    chart.config.data.datasets.forEach(dataset => {
                        // For bar/line charts
                        if (dataset.label && dataset.label.includes('Cliques')) {
                            dataset.backgroundColor = isDarkMode 
                                ? 'rgba(76, 217, 100, 0.7)'  // Green for dark mode
                                : 'rgba(16, 185, 129, 0.7)'; // Green for light mode
                            dataset.borderColor = isDarkMode 
                                ? 'rgba(76, 217, 100, 1)' 
                                : 'rgba(16, 185, 129, 1)';
                        } else if (dataset.label && dataset.label.includes('Impressões')) {
                            dataset.backgroundColor = isDarkMode 
                                ? 'rgba(65, 147, 255, 0.7)'  // Blue for dark mode
                                : 'rgba(59, 130, 246, 0.7)'; // Blue for light mode
                            dataset.borderColor = isDarkMode 
                                ? 'rgba(65, 147, 255, 1)' 
                                : 'rgba(59, 130, 246, 1)';
                        }
                    });
                }
                
                // Set theme-appropriate text colors
                if (chart.options) {
                    // Text color
                    chart.options.color = isDarkMode ? '#ffffff' : '#303338';
                    
                    // Grid lines
                    if (chart.options.scales) {
                        Object.values(chart.options.scales).forEach(scale => {
                            if (scale.grid) {
                                scale.grid.color = isDarkMode 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.1)';
                            }
                            if (scale.ticks) {
                                scale.ticks.color = isDarkMode ? '#ffffff' : '#303338';
                            }
                        });
                    }
                    
                    // Plugins like legend, tooltip
                    if (chart.options.plugins) {
                        if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                            chart.options.plugins.legend.labels.color = isDarkMode 
                                ? '#ffffff' 
                                : '#303338';
                        }
                        
                        if (chart.options.plugins.tooltip) {
                            chart.options.plugins.tooltip.backgroundColor = isDarkMode 
                                ? 'rgba(30, 30, 30, 0.9)' 
                                : 'rgba(255, 255, 255, 0.9)';
                            chart.options.plugins.tooltip.titleColor = isDarkMode 
                                ? '#ffffff' 
                                : '#303338';
                            chart.options.plugins.tooltip.bodyColor = isDarkMode 
                                ? '#cccccc' 
                                : '#606770';
                        }
                    }
                }
            }
        };
        
        // Register the plugin
        window.Chart.register(themeColorsPlugin);
        
        // Store plugin reference
        this.themeColorsPlugin = themeColorsPlugin;
        
        console.log('Theme colors plugin registered for Chart.js');
    }
    
    /**
     * Find and store references to all refresh buttons
     */
    findRefreshButtons() {
        // Store references to all refresh buttons for later use
        this.dashboardRefreshBtn = document.querySelector('#dashboard .refresh-btn');
        this.campaignsRefreshBtn = document.querySelector('#campanhas .refresh-btn');
        this.reportsRefreshBtn = document.querySelector('#relatorios .refresh-btn');
    }
    
    /**
     * Register a controller instance for theme-related updates
     * @param {string} name - Controller name (e.g., 'dashboard', 'campaigns')
     * @param {Object} instance - Controller instance
     */
    registerController(name, instance) {
        this.controllerInstances[name] = instance;
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
     * Force update of Chart.js instances
     * This method uses Chart.js's built-in update mechanism with a reset option
     * to force a complete redraw with new colors
     */
    forceChartUpdate() {
        // Find all charts in the document
        document.querySelectorAll('canvas').forEach(canvas => {
            try {
                // Access the chart instance directly if available
                const chart = canvas.chart || (window.Chart && window.Chart.getChart && window.Chart.getChart(canvas));
                
                if (chart) {
                    // Disable animations temporarily for instant update
                    const originalAnimation = chart.options.animation;
                    chart.options.animation = false;
                    
                    // Ensure chart data is still available
                    if (!chart.data || !chart.data.datasets || chart.data.datasets.length === 0) {
                        console.warn('Chart data missing, cannot update:', canvas.id);
                        return;
                    }
                    
                    // Explicitly apply colors based on current theme for each dataset
                    const isDarkMode = document.body.classList.contains('dark-mode');
                    const chartType = chart.config.type;
                    
                    chart.data.datasets.forEach(dataset => {
                        // Para gráficos de barras/linha com rótulos específicos
                        if (dataset.label && dataset.label.includes('Cliques')) {
                            dataset.backgroundColor = isDarkMode 
                                ? 'rgba(76, 217, 100, 0.7)'  // Verde no modo escuro
                                : 'rgba(16, 185, 129, 0.7)'; // Verde no modo claro
                            dataset.borderColor = isDarkMode 
                                ? 'rgba(76, 217, 100, 1)' 
                                : 'rgba(16, 185, 129, 1)';
                        } else if (dataset.label && dataset.label.includes('Impressões')) {
                            dataset.backgroundColor = isDarkMode 
                                ? 'rgba(65, 147, 255, 0.7)'  // Azul no modo escuro
                                : 'rgba(59, 130, 246, 0.7)'; // Azul no modo claro
                            dataset.borderColor = isDarkMode 
                                ? 'rgba(65, 147, 255, 1)' 
                                : 'rgba(59, 130, 246, 1)';
                        }
                        
                        // Tratamento especial para gráficos de pizza
                        if (chartType === 'pie' || chartType === 'doughnut') {
                            // Preservar cores originais para gráficos de pizza
                            if (Array.isArray(dataset.backgroundColor)) {
                                // Não modificamos as cores originais nos gráficos de pizza
                                // Apenas garantimos que as bordas sejam visíveis
                                if (!dataset.borderColor || !Array.isArray(dataset.borderColor)) {
                                    dataset.borderColor = isDarkMode ? '#333333' : '#ffffff';
                                }
                                
                                // Aumentamos ligeiramente a largura da borda no tema escuro
                                dataset.borderWidth = isDarkMode ? 2 : 1;
                                
                                // Para tema escuro, garantimos cores de preenchimento mais vívidas 
                                if (isDarkMode) {
                                    // Aumenta a opacidade/saturação no tema escuro
                                    dataset.backgroundColor = dataset.backgroundColor.map(color => {
                                        if (typeof color === 'string') {
                                            // Se for cor RGB/RGBA, aumenta a saturação
                                            if (color.startsWith('rgb')) {
                                                return color.replace(/rgba?\((.+?)(?:,\s*[0-9.]+)?\)/, 'rgba($1, 1)');
                                            }
                                            // Se for hex ou cor nomeada, deixa como está
                                            return color;
                                        }
                                        return color;
                                    });
                                }
                            }
                        }
                    });
                    
                    // Atualizar a cor dos elementos de texto
                    if (chart.options) {
                        chart.options.color = isDarkMode ? '#ffffff' : '#303338';
                        
                        // Atualizar escalas se presentes
                        if (chart.options.scales) {
                            Object.values(chart.options.scales).forEach(scale => {
                                if (scale.grid) {
                                    scale.grid.color = isDarkMode 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(0, 0, 0, 0.1)';
                                }
                                if (scale.ticks) {
                                    scale.ticks.color = isDarkMode ? '#ffffff' : '#303338';
                                }
                            });
                        }
                        
                        // Atualizar plugins se presentes
                        if (chart.options.plugins) {
                            if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                                chart.options.plugins.legend.labels.color = isDarkMode 
                                    ? '#ffffff' 
                                    : '#303338';
                            }
                            
                            if (chart.options.plugins.tooltip) {
                                chart.options.plugins.tooltip.backgroundColor = isDarkMode 
                                    ? 'rgba(30, 30, 30, 0.9)' 
                                    : 'rgba(255, 255, 255, 0.9)';
                                chart.options.plugins.tooltip.titleColor = isDarkMode 
                                    ? '#ffffff' 
                                    : '#303338';
                                chart.options.plugins.tooltip.bodyColor = isDarkMode 
                                    ? '#cccccc' 
                                    : '#606770';
                            }
                        }
                    }
                    
                    // Para gráficos de pizza/doughnut no modo escuro, garantir background adequado
                    if ((chartType === 'pie' || chartType === 'doughnut') && isDarkMode) {
                        if (!chart.options.plugins) chart.options.plugins = {};
                        
                        // Configura o canvas com uma cor de fundo clara
                        const canvasEl = chart.canvas;
                        if (canvasEl) {
                            canvasEl.style.backgroundColor = 'transparent';
                        }
                    }
                    
                    // Força uma atualização completa sem animações
                    chart.update('none');
                    
                    // Tenta uma segunda atualização com um pequeno atraso para melhor renderização
                    setTimeout(() => {
                        try {
                            chart.update('none');
                            // Restaura as configurações de animação
                            chart.options.animation = originalAnimation;
                        } catch (e) {
                            console.warn('Erro na atualização atrasada do gráfico:', e);
                        }
                    }, 50);
                }
            } catch (e) {
                // Ignora erros, apenas continua com outros gráficos
                console.warn('Erro ao atualizar gráfico:', e);
            }
        });
    }
    
    /**
     * Apply theme to existing chart instances
     */
    applyThemeToExistingCharts() {
        // Update theme for chart elements with direct DOM manipulation
        const chartElements = document.querySelectorAll('.chart-container');
        
        chartElements.forEach(container => {
            // Get chart title
            const titleElement = container.querySelector('h3');
            if (titleElement) {
                titleElement.style.color = this.isDarkMode ? '#FFFFFF' : '#303338';
            }
        });
        
        // Apply styles to chart text elements
        this.updateChartTextStyles();
        
        // Force update of all charts
        this.forceChartUpdate();
    }
    
    /**
     * Update chart text styles
     */
    updateChartTextStyles() {
        // Force all chart text elements to the right color based on theme
        // These are direct manipulations to work around Chart.js theming limitations
        const textElements = document.querySelectorAll('.text-gray-800, .text-gray-700, .text-gray-600, .text-gray-500, .text-3xl.font-bold, .text-lg.font-semibold');
        textElements.forEach(el => {
            if (this.isDarkMode) {
                // Set light text in dark mode
                if (!el.getAttribute('data-original-color')) {
                    el.setAttribute('data-original-color', el.style.color || '');
                }
                el.style.color = '#FFFFFF';
            } else {
                // Restore original color in light mode
                const originalColor = el.getAttribute('data-original-color');
                if (originalColor) {
                    el.style.color = originalColor;
                } else {
                    // Default color for light mode
                    el.style.color = '';
                }
            }
        });
        
        // Apply styles to legend elements which may be added dynamically
        const legendElements = document.querySelectorAll('.chartjs-legend-item, .chartjs-legend span, canvas + div span');
        legendElements.forEach(el => {
            el.style.color = this.isDarkMode ? '#FFFFFF' : '#303338';
            el.style.fontWeight = this.isDarkMode ? '600' : '500';
        });
        
        // Update section titles 
        const sectionTitles = document.querySelectorAll('h2, h3, .text-lg.font-semibold');
        sectionTitles.forEach(el => {
            el.style.color = this.isDarkMode ? '#FFFFFF' : '#303338';
        });
        
        // Update KPI values
        const kpiValues = document.querySelectorAll('.text-2xl.font-bold');
        kpiValues.forEach(el => {
            el.style.color = this.isDarkMode ? '#FFFFFF' : '#303338';
        });
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
        
        // First attempt with our standard methods
        setTimeout(() => {
            // Update chart text styles
            this.updateChartTextStyles();
            
            // Force chart update via Chart.js API
            this.forceChartUpdate();
        }, 50);
        
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
        
        // First attempt with our standard methods
        setTimeout(() => {
            // Update chart text styles
            this.updateChartTextStyles();
            
            // Force chart update via Chart.js API
            this.forceChartUpdate();
        }, 50);
        
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
            
            // Update any existing charts by triggering a resize event
            // This is a non-invasive way to get Chart.js to apply new theme colors
            setTimeout(() => {
                this.applyThemeToExistingCharts();
            }, 10);
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