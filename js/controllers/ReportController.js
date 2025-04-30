/**
 * ReportController class
 * Controls the Report section functionality
 */
import { ApiService } from '../api/ApiService.js';
import { Report } from '../models/Report.js';
import { ReportView } from '../views/ReportView.js';
import { PdfService } from '../services/PdfService.js';
import { ErrorHandler } from '../utils/ErrorHandler.js';
import { debounce } from '../utils/DataHelpers.js';

export class ReportController {
    /**
     * Create a new ReportController instance
     */
    constructor() {
        this.apiService = new ApiService();
        this.view = new ReportView();
        this.pdfService = new PdfService();
        this.errorHandler = new ErrorHandler();
        
        this.reportData = null;
        this.currentReport = null;
        this.refreshBtn = null;
        this.exportPdfBtn = null;
        
        // Handle API events
        this.apiService.on('report:data', this.handleReportData.bind(this));
        this.apiService.on('api:error', this.handleApiError.bind(this));
    }
    
    /**
     * Initialize the controller
     */
    init() {
        // Cache DOM elements
        this.refreshBtn = document.querySelector('#relatorios .refresh-btn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        
        // Setup auto-update for metrics
        this.setupAutoUpdate();
        
        // Setup refresh button
        if (this.refreshBtn) {
            this.refreshBtn.addEventListener('click', () => {
                this.refreshReport();
            });
        }
        
        // Setup PDF export events
        this.setupPdfExport();
    }
    
    /**
     * Set up automatic update when metrics change
     */
    setupAutoUpdate() {
        // "Select All" checkbox functionality
        this.view.selectAllCheckbox.addEventListener('change', () => {
            const isChecked = this.view.selectAllCheckbox.checked;
            
            this.view.metricCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            // Update report immediately
            this.updateReport();
        });
        
        // Individual checkbox change event
        this.view.metricCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Update "Select All" checkbox state
                const allChecked = Array.from(this.view.metricCheckboxes).every(cb => cb.checked);
                const anyChecked = Array.from(this.view.metricCheckboxes).some(cb => cb.checked);
                
                this.view.selectAllCheckbox.checked = allChecked;
                this.view.selectAllCheckbox.indeterminate = anyChecked && !allChecked;
                
                // Update report immediately
                this.updateReport();
            });
        });
    }
    
    /**
     * Set up PDF export button
     */
    setupPdfExport() {
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => {
                // Make export button visible only if we have data to export
                if (this.currentReport) {
                    this.showPdfModal();
                } else {
                    // If no data yet, show an informative message
                    this.errorHandler.showErrorToast('Selecione pelo menos uma métrica para exportar o relatório');
                }
            });
        }
    }
    
    /**
     * Refresh the report
     */
    refreshReport() {
        // Show loading state on refresh button
        this.setRefreshButtonLoading(true);
        
        // If we already have report data, just empty it to force a reload
        this.reportData = null;
        
        // Get the selected metrics
        const selectedMetrics = this.view.getSelectedMetrics();
        
        if (selectedMetrics.length === 0) {
            // Nothing to refresh
            this.setRefreshButtonLoading(false);
            return;
        }
        
        // Show loading state and fetch new data
        this.view.showLoading();
        this.apiService.fetchReportData(selectedMetrics);
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
     * Show PDF generation modal
     */
    showPdfModal() {
        if (!this.currentReport) {
            console.error('No report data available for PDF generation');
            return;
        }
        
        this.view.showPdfModal(
            // Confirm callback - with AI
            async () => {
                try {
                    const aiAnalysis = await this.pdfService.getAIAnalysis(this.currentReport, this.apiService);
                    await this.generatePdf(aiAnalysis);
                } catch (error) {
                    console.error('Error generating PDF with AI analysis:', error);
                    this.errorHandler.handleApiError({
                        status: 'ai_error',
                        message: 'Failed to generate AI analysis'
                    });
                    await this.generatePdf();
                } finally {
                    this.view.hidePdfModal();
                }
            },
            // Cancel callback - without AI
            async () => {
                await this.generatePdf();
            }
        );
    }
    
    /**
     * Generate a PDF
     * @param {string} [aiAnalysis=''] - Optional AI analysis text
     */
    async generatePdf(aiAnalysis = '') {
        try {
            this.view.showPdfGenerating();
            await this.pdfService.generatePDF(this.currentReport, aiAnalysis);
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.errorHandler.handleApiError({
                status: 'pdf_error',
                message: 'Failed to generate PDF'
            });
        } finally {
            this.view.hidePdfGenerating();
        }
    }
    
    /**
     * Update the report based on form data
     */
    updateReport() {
        const selectedMetrics = this.view.getSelectedMetrics();
        
        if (selectedMetrics.length === 0) {
            this.view.reportResults.classList.add('hidden');
            // Toggle export button state
            this.toggleExportButton(false);
            
            // Reset loading state on buttons
            this.setRefreshButtonLoading(false);
            return;
        }
        
        this.view.showLoading();
        
        // Toggle export button state based on selection
        this.toggleExportButton(true);
        
        // If we already have report data, update the report without making an API call
        if (this.reportData) {
            this.currentReport = new Report(this.reportData, selectedMetrics);
            this.view.render(this.currentReport);
            this.view.hideLoading();
            
            // Reset loading state on buttons
            this.setRefreshButtonLoading(false);
            
            // Show success message
            this.showUpdateSuccessMessage();
            
            return;
        }
        
        // Otherwise, fetch new report data
        this.apiService.fetchReportData(selectedMetrics);
    }
    
    /**
     * Toggle the export button state
     * @param {boolean} enabled - Whether to enable the export button
     */
    toggleExportButton(enabled) {
        if (this.exportPdfBtn) {
            if (enabled) {
                this.exportPdfBtn.removeAttribute('disabled');
                this.exportPdfBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                this.exportPdfBtn.setAttribute('disabled', 'disabled');
                this.exportPdfBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }
    
    /**
     * Show a success toast message when report is updated
     */
    showUpdateSuccessMessage() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        message.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <div>
                <p class="font-medium">Relatório gerado com sucesso</p>
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
     * Handle received report data
     * @param {Array} data - Report data
     */
    handleReportData(data) {
        // Store the raw data for later use
        this.reportData = data;
        
        // Get the selected metrics
        const selectedMetrics = data.selectedMetrics || this.view.getSelectedMetrics();
        
        // Create a new Report instance
        this.currentReport = new Report(data, selectedMetrics);
        
        // Render the report
        this.view.render(this.currentReport);
        this.view.hideLoading();
        
        // Reset loading state on buttons
        this.setRefreshButtonLoading(false);
        
        // Show success message
        this.showUpdateSuccessMessage();
    }
    
    /**
     * Handle API errors
     * @param {Object} error - Error object
     */
    handleApiError(error) {
        this.view.hideLoading();
        this.view.showError('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
        this.errorHandler.handleApiError(error);
        
        // Reset loading state on buttons
        this.setRefreshButtonLoading(false);
    }
} 