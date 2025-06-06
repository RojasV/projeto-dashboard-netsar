/**
 * Campaign Model Class
 * Represents a Meta Ads campaign with its data and operations
 */
import { formatDate, getStatusClass, getStatusText } from '../utils/DataHelpers.js';

export class Campaign {
    /**
     * Create a new Campaign instance
     * @param {Object} data - Raw campaign data from API
     * @param {number} index - Index of the campaign in the array
     */
    constructor(data, index) {
        this.id = data.campaign_id || `campaign-${index}`;
        this.name = data.campaign_name || `Campaign ${index + 1}`;
        this.startDate = data.date_start || null;
        this.endDate = data.date_stop || null;
        this.spend = parseFloat(data.spend || 0);
        this.impressions = parseInt(data.impressions || 0);
        this.reach = parseInt(data.reach || 0);
        this.clicks = parseInt(data.clicks || 0);
        this.ctr = parseFloat(data.ctr || 0);
        this.cpc = parseFloat(data.cpc || 0);
        this.index = index;
        
        // Preservar o status original da API
        this.status = data.status;
        
        // Store the raw data for advanced usages
        this.rawData = data;
        
        console.log(`Campaign model criado para ${this.name} com status: ${this.status} (tipo: ${typeof this.status})`);
    }
    
    /**
     * Get formatted campaign name
     * @returns {string} - Formatted campaign name
     */
    getFormattedName() {
        if (this.name) return this.name;
        
        if (this.startDate && this.endDate) {
            return `Campanha ${formatDate(this.startDate)} - ${formatDate(this.endDate)}`;
        }
        
        return `Campanha ${this.index + 1}`;
    }
    
    /**
     * Get the status of the campaign (active or finished)
     * @returns {boolean} - True if campaign is active, false otherwise
     */
    isActive() {
        // Para compatibilidade com código existente, retornar baseado no status original,
        // não apenas na data de término
        if (this.status === "ACTIVE") return true;
        
        // Fallback para o comportamento original baseado em data
        if (!this.endDate) return false;
        return new Date(this.endDate) >= new Date();
    }
    
    /**
     * Get the status text
     * @returns {string} - Status text
     */
    getStatusText() {
        // Texto baseado no status real da API
        if (this.status === "ACTIVE") return "Ativa";
        if (this.status === "PAUSED") return "Pausada";
        
        // Fallback para o comportamento original
        return this.isActive() ? 'Ativa' : 'Finalizada';
    }
    
    /**
     * Get the CSS class for the status
     * @returns {string} - CSS class name
     */
    getStatusClass() {
        // Classes baseadas no status real da API
        if (this.status === "ACTIVE") return 'bg-green-100 text-green-800';
        if (this.status === "PAUSED") return 'bg-red-100 text-red-800';
        
        // Fallback para o comportamento original
        return this.isActive() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    }
    
    /**
     * Get formatted start date
     * @returns {string} - Formatted date
     */
    getFormattedStartDate() {
        return formatDate(this.startDate);
    }
    
    /**
     * Get formatted end date
     * @returns {string} - Formatted date
     */
    getFormattedEndDate() {
        return formatDate(this.endDate);
    }
    
    /**
     * Get all the metrics of the campaign as an object
     * @returns {Object} - Object with all the metrics
     */
    getMetrics() {
        return {
            spend: this.spend,
            impressions: this.impressions,
            reach: this.reach,
            clicks: this.clicks,
            ctr: this.ctr,
            cpc: this.cpc
        };
    }
    
    /**
     * Get a specific metric value
     * @param {string} metricName - Name of the metric
     * @returns {number} - Metric value
     */
    getMetric(metricName) {
        const metrics = this.getMetrics();
        return metrics[metricName] || 0;
    }
    
    /**
     * Create a Campaign instance from raw data
     * @param {Object} data - Raw campaign data
     * @param {number} index - Index of the campaign
     * @returns {Campaign} - New Campaign instance
     */
    static fromData(data, index) {
        return new Campaign(data, index);
    }
    
    /**
     * Create multiple Campaign instances from an array of raw data
     * @param {Array} dataArray - Array of raw campaign data
     * @returns {Array} - Array of Campaign instances
     */
    static fromDataArray(dataArray) {
        if (!Array.isArray(dataArray)) return [];
        return dataArray.map((data, index) => Campaign.fromData(data, index));
    }
} 