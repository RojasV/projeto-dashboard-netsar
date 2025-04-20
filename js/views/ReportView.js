/**
 * ReportView class
 * Handles rendering of the Report section
 */
import { Report } from '../models/Report.js';
import { generateColorPalette, formatCurrency, formatNumber, formatPercentage } from '../utils/DataHelpers.js';

export class ReportView {
    /**
     * Create a new ReportView instance
     */
    constructor() {
        this.reportForm = document.getElementById('reportForm');
        this.reportResults = document.getElementById('reportResults');
        this.selectAllCheckbox = document.getElementById('selectAll');
        this.metricCheckboxes = document.querySelectorAll('#reportForm input[name="metrics"]');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
        this.pdfModal = document.getElementById('pdfModal');
        this.confirmPdfBtn = document.getElementById('confirmPdfBtn');
        this.cancelPdfBtn = document.getElementById('cancelPdfBtn');
        this.modalSpinner = document.getElementById('modalSpinner');
        
        this.charts = {};
        this.colorPalette = generateColorPalette(10);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const relatoriosSection = document.getElementById('relatorios');
        relatoriosSection.classList.add('loading');
        this.reportResults.classList.add('hidden');
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const relatoriosSection = document.getElementById('relatorios');
        relatoriosSection.classList.remove('loading');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const relatoriosSection = document.getElementById('relatorios');
        
        // Add error message if it doesn't exist yet
        if (!relatoriosSection.querySelector('.error-message')) {
            relatoriosSection.innerHTML += `
                <div class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                    <strong class="font-bold">Erro!</strong>
                    <span class="block sm:inline">${message}</span>
                </div>
            `;
        }
    }
    
    /**
     * Get the selected metrics from the form
     * @returns {Array} - Array of selected metric names
     */
    getSelectedMetrics() {
        const formData = new FormData(this.reportForm);
        return formData.getAll('metrics');
    }
    
    /**
     * Update the form UI state based on selected metrics
     * @param {Array} [metrics=[]] - Metrics to select
     */
    updateFormState(metrics = []) {
        // Update checkboxes based on the metrics array
        this.metricCheckboxes.forEach(checkbox => {
            checkbox.checked = metrics.includes(checkbox.value);
        });
        
        // Update the "Select All" checkbox state
        const allChecked = Array.from(this.metricCheckboxes).every(cb => cb.checked);
        const anyChecked = Array.from(this.metricCheckboxes).some(cb => cb.checked);
        
        this.selectAllCheckbox.checked = allChecked;
        this.selectAllCheckbox.indeterminate = anyChecked && !allChecked;
    }
    
    /**
     * Render KPI cards based on selected metrics
     * @param {Report} report - Report model instance
     */
    renderKPICards(report) {
        const kpiContainer = document.createElement('div');
        kpiContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8';
        
        const summary = report.getSummary();
        const selectedMetrics = report.getSelectedMetrics();
        
        // Show spend KPI card if selected
        if (selectedMetrics.includes('spend')) {
            kpiContainer.innerHTML += `
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-gray-500 text-sm font-medium">Total Gasto</h3>
                            <p class="text-2xl font-bold text-gray-800">R$ ${summary.totalSpend.toFixed(2)}</p>
                        </div>
                        <div class="bg-indigo-100 p-3 rounded-full">
                            <i class="fas fa-hand-holding-usd text-indigo-500"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show clicks KPI card if selected
        if (selectedMetrics.includes('clicks')) {
            kpiContainer.innerHTML += `
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-gray-500 text-sm font-medium">Total Cliques</h3>
                            <p class="text-2xl font-bold text-gray-800">${summary.totalClicks.toLocaleString()}</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-mouse-pointer text-green-500"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show impressions KPI card if selected
        if (selectedMetrics.includes('impressions')) {
            kpiContainer.innerHTML += `
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-gray-500 text-sm font-medium">Total Impressões</h3>
                            <p class="text-2xl font-bold text-gray-800">${summary.totalImpressions.toLocaleString()}</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-eye text-blue-500"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show CTR KPI card if selected
        if (selectedMetrics.includes('ctr')) {
            kpiContainer.innerHTML += `
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-gray-500 text-sm font-medium">Média CTR</h3>
                            <p class="text-2xl font-bold text-gray-800">${summary.avgCTR.toFixed(2)}%</p>
                        </div>
                        <div class="bg-amber-100 p-3 rounded-full">
                            <i class="fas fa-percentage text-amber-500"></i>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return kpiContainer;
    }
    
    /**
     * Render charts based on selected metrics
     * @param {Report} report - Report model instance
     */
    renderCharts(report) {
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'grid grid-cols-1 md:grid-cols-1 gap-6';
        
        const selectedMetrics = report.getSelectedMetrics();
        const chartLabels = Report.getMetricChartTitles();
        
        // Create chart containers for selected metrics
        selectedMetrics.forEach(metric => {
            if (chartLabels[metric]) {
                chartsContainer.innerHTML += `
                    <div class="chart-container bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold mb-4 text-gray-700">${chartLabels[metric]}</h3>
                        <canvas id="${metric}Chart"></canvas>
                    </div>
                `;
            }
        });
        
        // Return the container, charts will be populated later
        return chartsContainer;
    }
    
    /**
     * Render table with report data
     * @param {Report} report - Report model instance
     */
    renderTable(report) {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'hide-on-pdf bg-white rounded-lg shadow-md p-6';
        
        // Add table header and export button
        tableContainer.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold text-gray-700">Resultados Detalhados</h3>
                <button id="exportPdfBtn" class="hide-on-pdf bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200 flex items-center">
                    <i class="fas fa-file-pdf mr-2"></i> Exportar PDF
                </button>
            </div>
            <div class="overflow-x-auto">
                <table id="resultsTable" class="min-w-full bg-white">
                    <thead class="bg-gray-100 text-gray-700">
                        <tr></tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        
        // Get the table header row
        const tableHeader = tableContainer.querySelector('thead tr');
        const selectedMetrics = report.getSelectedMetrics();
        
        // Always include campaign name column
        tableHeader.innerHTML = `<th class="py-3 px-4 text-left">Campanha</th>`;
        
        // Add date columns if selected
        if (selectedMetrics.includes('date_start')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-left">Data Início</th>`;
        }
        
        if (selectedMetrics.includes('date_stop')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-left">Data Fim</th>`;
        }
        
        // Add metric columns based on selection
        if (selectedMetrics.includes('impressions')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Impressões</th>`;
        }
        
        if (selectedMetrics.includes('reach')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Alcance</th>`;
        }
        
        if (selectedMetrics.includes('clicks')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Cliques</th>`;
        }
        
        if (selectedMetrics.includes('ctr')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">CTR</th>`;
        }
        
        if (selectedMetrics.includes('cpc')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">CPC</th>`;
        }
        
        if (selectedMetrics.includes('spend')) {
            tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Gasto</th>`;
        }
        
        // Populate table data
        const tableBody = tableContainer.querySelector('tbody');
        report.campaigns.forEach(campaign => {
            const row = document.createElement('tr');
            let rowHTML = `<td class="py-3 px-4 text-left">${campaign.getFormattedName()}</td>`;
            
            // Add date cells if selected
            if (selectedMetrics.includes('date_start')) {
                rowHTML += `<td class="py-3 px-4 text-left">${campaign.getFormattedStartDate()}</td>`;
            }
            
            if (selectedMetrics.includes('date_stop')) {
                rowHTML += `<td class="py-3 px-4 text-left">${campaign.getFormattedEndDate()}</td>`;
            }
            
            // Add metric cells based on selection
            if (selectedMetrics.includes('impressions')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatNumber(campaign.impressions)}</td>`;
            }
            
            if (selectedMetrics.includes('reach')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatNumber(campaign.reach)}</td>`;
            }
            
            if (selectedMetrics.includes('clicks')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatNumber(campaign.clicks)}</td>`;
            }
            
            if (selectedMetrics.includes('ctr')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatPercentage(campaign.ctr)}</td>`;
            }
            
            if (selectedMetrics.includes('cpc')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatCurrency(campaign.cpc)}</td>`;
            }
            
            if (selectedMetrics.includes('spend')) {
                rowHTML += `<td class="py-3 px-4 text-right">${formatCurrency(campaign.spend)}</td>`;
            }
            
            row.innerHTML = rowHTML;
            tableBody.appendChild(row);
        });
        
        return tableContainer;
    }
    
    /**
     * Create charts for the report
     * @param {Report} report - Report model instance
     */
    createCharts(report) {
        const selectedMetrics = report.getSelectedMetrics();
        const metricTitles = Report.getMetricLabels();
        
        // Create charts for each selected metric
        selectedMetrics.forEach(metric => {
            if (['spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc'].includes(metric)) {
                this.createMetricChart(metric, report, metricTitles[metric]);
            }
        });
    }
    
    /**
     * Create a chart for a specific metric
     * @param {string} metric - Name of the metric
     * @param {Report} report - Report model instance
     * @param {string} label - Display label for the metric
     */
    createMetricChart(metric, report, label) {
        const canvas = document.getElementById(`${metric}Chart`);
        if (!canvas) {
            console.warn(`Canvas for metric "${metric}" not found.`);
            return;
        }
        
        // Adjust chart height based on number of campaigns
        const rowHeight = 30; // Approximate height per campaign
        const minHeight = 300;
        const height = Math.max(minHeight, report.campaigns.length * rowHeight);
        canvas.style.maxHeight = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if any
        if (this.charts[metric]) {
            this.charts[metric].destroy();
        }
        
        // Get campaign names and metric values
        const campaignNames = report.getCampaignNames().map(name => 
            name.length > 25 ? name.slice(0, 25) + '...' : name
        );
        
        const metricValues = report.getMetricData(metric);
        
        // Create chart
        this.charts[metric] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: campaignNames,
                datasets: [{
                    label: label,
                    data: metricValues,
                    backgroundColor: this.colorPalette,
                    borderColor: this.colorPalette.map(color => color.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                if (['spend', 'cpc'].includes(metric)) {
                                    return 'R$ ' + value.toFixed(2);
                                } else if (metric === 'ctr') {
                                    return value.toFixed(2) + '%';
                                } else {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                const val = context.parsed.x;
                                if (label) label += ': ';
                                
                                if (['spend', 'cpc'].includes(metric)) {
                                    return label + 'R$ ' + val.toFixed(2);
                                } else if (metric === 'ctr') {
                                    return label + val.toFixed(2) + '%';
                                } else {
                                    return label + val.toLocaleString();
                                }
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    /**
     * Show PDF generation modal
     * @param {Function} onConfirm - Callback for when user confirms
     * @param {Function} onCancel - Callback for when user cancels
     */
    showPdfModal(onConfirm, onCancel) {
        this.pdfModal.classList.remove('hidden');
        
        this.confirmPdfBtn.onclick = () => {
            this.modalSpinner.classList.remove('hidden');
            this.confirmPdfBtn.disabled = true;
            this.cancelPdfBtn.disabled = true;
            
            onConfirm();
        };
        
        this.cancelPdfBtn.onclick = () => {
            this.pdfModal.classList.add('hidden');
            onCancel();
        };
    }
    
    /**
     * Hide PDF generation modal
     */
    hidePdfModal() {
        this.modalSpinner.classList.add('hidden');
        this.confirmPdfBtn.disabled = false;
        this.cancelPdfBtn.disabled = false;
        this.pdfModal.classList.add('hidden');
    }
    
    /**
     * Show PDF generation in progress
     */
    showPdfGenerating() {
        document.body.classList.add('pdf-generating');
    }
    
    /**
     * Hide PDF generation in progress
     */
    hidePdfGenerating() {
        document.body.classList.remove('pdf-generating');
    }
    
    /**
     * Render the report with data
     * @param {Report} report - Report model instance
     */
    render(report) {
        if (!report) {
            console.error('No report data provided');
            return;
        }
        
        // Clear previous results
        this.reportResults.innerHTML = '';
        
        // Render KPI cards
        const kpiCards = this.renderKPICards(report);
        this.reportResults.appendChild(kpiCards);
        
        // Render charts
        const charts = this.renderCharts(report);
        this.reportResults.appendChild(charts);
        
        // Render table
        const table = this.renderTable(report);
        this.reportResults.appendChild(table);
        
        // Show the results container
        this.reportResults.classList.remove('hidden');
        
        // Add event listener to export PDF button
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            // We'll add the event listener in the controller
        }
        
        // Create charts
        this.createCharts(report);
        
        // Scroll to results
        this.reportResults.scrollIntoView({ behavior: 'smooth' });
    }
} 