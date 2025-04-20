/**
 * PdfService class
 * Handles PDF generation using html2canvas and jsPDF
 */
import { Report } from '../models/Report.js';

export class PdfService {
    /**
     * Create a new PdfService instance
     */
    constructor() {
        // Access the jsPDF constructor from the globally loaded library
        this.jsPDF = window.jspdf.jsPDF;
        this.pdfGeneratingOverlay = document.getElementById('pdfGeneratingOverlay');
    }
    
    /**
     * Generate a PDF from a report
     * @param {Report} report - Report model instance
     * @param {string} [aiAnalysis=''] - Optional AI analysis text
     * @returns {Promise<void>} - Promise that resolves when PDF is generated
     */
    async generatePDF(report, aiAnalysis = '') {
        // Add PDF generation in progress indicator
        document.body.classList.add('pdf-generating');
        
        // Show the generating overlay
        if (this.pdfGeneratingOverlay) {
            this.pdfGeneratingOverlay.classList.remove('hidden');
        }
        
        // Give the browser a chance to update the UI
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Scroll to top to ensure proper rendering
        window.scrollTo(0, 0);
        
        try {
            // Create a new PDF document
            const pdf = new this.jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const padding = 10;
            let yOffset = padding + 10; // Space reserved for header
            let pageNumber = 1;
            let isFirstPage = true;
            
            // Define colors for PDF text elements - ensure high contrast
            const colors = {
                title: '#000000',     // Black for titles
                text: '#333333',      // Dark gray for normal text
                highlight: '#1877f2', // Blue for highlighted text
                footer: '#666666'     // Medium gray for footer
            };
            
            // Define background color for the PDF (white)
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Helper function for drawing the header
            const drawHeader = () => {
                pdf.setTextColor(colors.title);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(14);
                pdf.text("Relatório De Métricas Das Campanhas - Meta Ads", padding, 10);
                
                // Add a subtle header line
                pdf.setDrawColor(colors.highlight);
                pdf.setLineWidth(0.5);
                pdf.line(padding, 12, pageWidth - padding, 12);
            };
            
            // Helper function for drawing the footer
            const drawFooter = () => {
                pdf.setTextColor(colors.footer);
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(10);
                pdf.text(`Relatório Meta Ads - Página ${pageNumber}`, pageWidth - padding - 50, pageHeight - 5);
                pdf.text(new Date().toLocaleDateString('pt-BR'), padding, pageHeight - 5);
                
                // Add a subtle footer line
                pdf.setDrawColor(colors.footer);
                pdf.setLineWidth(0.3);
                pdf.line(padding, pageHeight - 8, pageWidth - padding, pageHeight - 8);
            };
            
            // Get the report elements
            const reportElement = document.getElementById('reportResults');
            
            // Make a temporary copy with light mode styles for PDF rendering
            const tempReportContainer = document.createElement('div');
            tempReportContainer.style.position = 'absolute';
            tempReportContainer.style.left = '-9999px';
            tempReportContainer.style.backgroundColor = '#FFFFFF';
            tempReportContainer.style.color = '#333333';
            tempReportContainer.className = 'pdf-export-container';
            document.body.appendChild(tempReportContainer);
            
            // Clone the report for PDF rendering with light theme
            const tempReport = reportElement.cloneNode(true);
            tempReport.classList.remove('hidden');
            
            // Apply light theme styles to ensure proper rendering
            this.applyLightThemeStyles(tempReport);
            tempReportContainer.appendChild(tempReport);
            
            // Collect child elements for PDF generation
            const elements = [];
            tempReport.childNodes.forEach(node => {
                if (node.nodeType === 1 && !node.classList.contains('hide-on-pdf')) {
                    const chartContainers = node.querySelectorAll('.chart-container');
                    if (chartContainers.length > 0) {
                        chartContainers.forEach(c => elements.push(c));
                    } else {
                        elements.push(node);
                    }
                }
            });
            
            // Draw the header on the first page
            drawHeader();
            
            // Process each element
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                const style = getComputedStyle(element);
                
                // Skip hidden elements
                if (style.display === 'none' || style.visibility === 'hidden' || element.offsetHeight === 0) {
                    continue;
                }
                
                // Handle chart elements
                const canvas = element.querySelector('canvas');
                let imgData;
                
                // Try to use the Chart.js native image generation if possible
                if (canvas && window.Chart && window.Chart.getChart(canvas.id)) {
                    try {
                        const chart = window.Chart.getChart(canvas.id);
                        imgData = chart.toBase64Image();
                        
                        const titleEl = element.querySelector('h3');
                        const chartTitle = titleEl ? titleEl.innerText : '';
                        
                        const imgProps = pdf.getImageProperties(imgData);
                        const imgWidth = pageWidth - padding * 2;
                        let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                        
                        // Flatten charts on the first page
                        if (isFirstPage) {
                            imgHeight *= 0.85;
                        }
                        
                        // Check if we need a page break
                        const needsPageBreak = yOffset + imgHeight + 10 > (pageHeight - 20);
                        if (needsPageBreak && !isFirstPage) {
                            drawFooter();
                            pdf.addPage();
                            pageNumber++;
                            // Add white background to the new page
                            pdf.setFillColor(255, 255, 255);
                            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                            drawHeader();
                            yOffset = padding + 10;
                        } else if (isFirstPage) {
                            isFirstPage = false;
                        }
                        
                        // Add chart title
                        if (chartTitle) {
                            pdf.setTextColor(colors.title);
                            pdf.setFont("helvetica", "bold");
                            pdf.setFontSize(14);
                            pdf.text(chartTitle, padding, yOffset);
                            yOffset += 8;
                        }
                        
                        // Add chart image
                        pdf.addImage(imgData, 'PNG', padding, yOffset, imgWidth, imgHeight);
                        yOffset += imgHeight + 12;
                        continue;
                    } catch (e) {
                        console.warn(`[PDF] Error capturing chart ${canvas.id}, falling back to html2canvas`, e);
                    }
                }
                
                // Use html2canvas for elements that don't have Chart.js charts
                try {
                    const elementCanvas = await html2canvas(element, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: false,
                        backgroundColor: '#ffffff',
                        scrollY: -window.scrollY
                    });
                    
                    imgData = elementCanvas.toDataURL('image/png');
                    
                    const imgProps = pdf.getImageProperties(imgData);
                    const imgWidth = pageWidth - padding * 2;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                    
                    // Check if we need a page break
                    const maxAvailableHeight = pageHeight - padding - 30;
                    if (yOffset + imgHeight > maxAvailableHeight) {
                        drawFooter();
                        pdf.addPage();
                        pageNumber++;
                        // Add white background to the new page
                        pdf.setFillColor(255, 255, 255);
                        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                        drawHeader();
                        yOffset = padding + 10;
                        isFirstPage = false;
                    }
                    
                    // Add element image
                    pdf.addImage(imgData, 'PNG', padding, yOffset, imgWidth, imgHeight);
                    yOffset += imgHeight + 12;
                } catch (err) {
                    console.error(`[PDF] Error processing element ${i}:`, err);
                    continue;
                }
            }
            
            // Add AI analysis if provided
            if (aiAnalysis) {
                // Check if we need a page break
                if (yOffset + 50 > pageHeight - padding - 10) {
                    drawFooter();
                    pdf.addPage();
                    pageNumber++;
                    // Add white background to the new page
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                    drawHeader();
                    yOffset = padding + 10;
                }
                
                // Add title
                pdf.setTextColor(colors.highlight);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(16);
                pdf.text("Análise Inteligente por IA", padding, yOffset);
                yOffset += 10;
                
                // Add separator line
                pdf.setDrawColor(colors.highlight);
                pdf.line(padding, yOffset, pageWidth - padding, yOffset);
                yOffset += 5;
                
                // Add analysis text
                pdf.setTextColor(colors.text);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(12);
                const lines = pdf.splitTextToSize(aiAnalysis, pageWidth - padding * 2);
                
                for (let i = 0; i < lines.length; i++) {
                    if (yOffset > pageHeight - 20) {
                        drawFooter();
                        pdf.addPage();
                        pageNumber++;
                        // Add white background to the new page
                        pdf.setFillColor(255, 255, 255);
                        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                        drawHeader();
                        yOffset = padding + 10;
                    }
                    
                    pdf.text(lines[i], padding, yOffset);
                    yOffset += 7;
                }
            }
            
            // Add footer to the last page
            drawFooter();
            
            // Save the PDF with timestamp and formatted campaign name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const campaignNames = report.getCampaignNames();
            const pdfName = campaignNames.length > 0 
                ? `relatorio-meta-ads-${campaignNames[0]}-${timestamp}.pdf`.substring(0, 50) + '.pdf'
                : `relatorio-meta-ads-${timestamp}.pdf`;
            
            // Clean up temporary elements
            document.body.removeChild(tempReportContainer);
            
            pdf.save(pdfName);
            
            // Show success message
            this.showSuccessMessage(pdfName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showErrorMessage();
        } finally {
            // Remove PDF generation indicator
            document.body.classList.remove('pdf-generating');
            
            // Hide the generating overlay
            if (this.pdfGeneratingOverlay) {
                this.pdfGeneratingOverlay.classList.add('hidden');
            }
            
            // Remove any remaining temporary elements
            const tempContainer = document.querySelector('.pdf-export-container');
            if (tempContainer) {
                document.body.removeChild(tempContainer);
            }
        }
    }
    
    /**
     * Apply light theme styles to the report for PDF rendering
     * @param {HTMLElement} element - The element to apply styles to
     */
    applyLightThemeStyles(element) {
        // Apply light theme to the element
        element.style.backgroundColor = '#FFFFFF';
        element.style.color = '#333333';
        
        // Apply light theme to all KPI cards
        const kpiCards = element.querySelectorAll('.bg-white');
        kpiCards.forEach(card => {
            card.style.backgroundColor = '#FFFFFF';
            card.style.color = '#333333';
            card.style.borderColor = '#1877f2';
        });
        
        // Ensure contrast for headings
        const headings = element.querySelectorAll('h2, h3, h4');
        headings.forEach(heading => {
            heading.style.color = '#000000';
        });
        
        // Ensure proper styling for KPI values
        const kpiValues = element.querySelectorAll('.text-2xl.font-bold');
        kpiValues.forEach(value => {
            value.style.color = '#1877f2';
            value.style.fontWeight = 'bold';
        });
        
        // Ensure proper styling for tables
        const tables = element.querySelectorAll('table');
        tables.forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            
            // Table headers
            const ths = table.querySelectorAll('th');
            ths.forEach(th => {
                th.style.backgroundColor = '#f5f5f5';
                th.style.color = '#333333';
                th.style.fontWeight = 'bold';
                th.style.borderBottom = '2px solid #dddddd';
                th.style.padding = '8px';
                th.style.textAlign = 'left';
            });
            
            // Table cells
            const tds = table.querySelectorAll('td');
            tds.forEach(td => {
                td.style.padding = '8px';
                td.style.borderBottom = '1px solid #dddddd';
                td.style.color = '#333333';
            });
        });
        
        // Apply styles to chart containers
        const chartContainers = element.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            container.style.backgroundColor = '#FFFFFF';
            container.style.border = '1px solid #dddddd';
            container.style.borderRadius = '4px';
            container.style.padding = '16px';
            
            // Chart titles
            const chartTitles = container.querySelectorAll('h3');
            chartTitles.forEach(title => {
                title.style.color = '#000000';
                title.style.fontWeight = 'bold';
                title.style.marginBottom = '12px';
            });
        });
    }
    
    /**
     * Show a success message after PDF generation
     * @param {string} pdfName - Name of the generated PDF file
     */
    showSuccessMessage(pdfName) {
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <div>
                <p class="font-medium">PDF gerado com sucesso!</p>
                <p class="text-sm">${pdfName}</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(successMessage);
        
        // Add click event to close button
        const closeButton = successMessage.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(successMessage);
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
            }
        }, 5000);
    }
    
    /**
     * Show an error message if PDF generation fails
     */
    showErrorMessage() {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        errorMessage.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <div>
                <p class="font-medium">Erro ao gerar PDF</p>
                <p class="text-sm">Tente novamente mais tarde</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Add click event to close button
        const closeButton = errorMessage.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(errorMessage);
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorMessage)) {
                document.body.removeChild(errorMessage);
            }
        }, 5000);
    }
    
    /**
     * Request AI analysis for a report
     * @param {Report} report - Report model instance
     * @param {Function} apiService - API service instance
     * @returns {Promise<string>} - Promise that resolves with the AI analysis text
     */
    async getAIAnalysis(report, apiService) {
        try {
            return await apiService.getAIAnalysis(report.data);
        } catch (error) {
            console.error('Error getting AI analysis:', error);
            return '';
        }
    }
} 