/**
 * Report Model Class
 * Represents a report with its data, metrics, and operations
 */
import { Campaign } from './Campaign.js';
import { calculateSummaryMetrics } from '../utils/DataHelpers.js';

export class Report {
    /**
     * Create a new Report instance
     * @param {Array} data - Raw report data from API
     * @param {Array} selectedMetrics - Metrics selected by the user
     */
    constructor(data, selectedMetrics) {
        this.data = data || [];
        this.selectedMetrics = selectedMetrics || [];
        this.campaigns = Campaign.fromDataArray(data);
        this.summary = calculateSummaryMetrics(data);
    }
    
    /**
     * Check if a metric is selected
     * @param {string} metricName - Name of the metric to check
     * @returns {boolean} - True if the metric is selected, false otherwise
     */
    isMetricSelected(metricName) {
        return this.selectedMetrics.includes(metricName);
    }
    
    /**
     * Get the names of all campaigns in the report
     * @returns {Array} - Array of campaign names
     */
    getCampaignNames() {
        return this.campaigns.map(campaign => campaign.getFormattedName());
    }
    
    /**
     * Get data for a specific metric across all campaigns
     * @param {string} metricName - Name of the metric
     * @returns {Array} - Array of metric values
     */
    getMetricData(metricName) {
        return this.campaigns.map(campaign => campaign.getMetric(metricName));
    }
    
    /**
     * Get summary metrics
     * @returns {Object} - Object with summary metrics
     */
    getSummary() {
        return this.summary;
    }
    
    /**
     * Get all the selected metrics
     * @returns {Array} - Array of selected metric names
     */
    getSelectedMetrics() {
        return this.selectedMetrics;
    }
    
    /**
     * Add a metric to the selected metrics
     * @param {string} metricName - Name of the metric to add
     */
    addMetric(metricName) {
        if (!this.isMetricSelected(metricName)) {
            this.selectedMetrics.push(metricName);
        }
    }
    
    /**
     * Remove a metric from the selected metrics
     * @param {string} metricName - Name of the metric to remove
     */
    removeMetric(metricName) {
        this.selectedMetrics = this.selectedMetrics.filter(metric => metric !== metricName);
    }
    
    /**
     * Set the selected metrics
     * @param {Array} metrics - Array of metric names
     */
    setSelectedMetrics(metrics) {
        this.selectedMetrics = metrics || [];
    }
    
    /**
     * Get the metric labels (for display purposes)
     * @returns {Object} - Object mapping metric names to display labels
     */
    static getMetricLabels() {
        return {
            spend: 'Gastos (R$)',
            impressions: 'Impressões',
            reach: 'Alcance',
            clicks: 'Cliques',
            ctr: 'CTR (%)',
            cpc: 'CPC (R$)',
            campaign_name: 'Nome da Campanha',
            date_start: 'Data Início',
            date_stop: 'Data Fim'
        };
    }
    
    /**
     * Get the metric chart titles
     * @returns {Object} - Object mapping metric names to chart titles
     */
    static getMetricChartTitles() {
        return {
            spend: 'Gastos por Campanha',
            impressions: 'Impressões por Campanha',
            reach: 'Alcance por Campanha',
            clicks: 'Cliques por Campanha',
            ctr: 'CTR por Campanha',
            cpc: 'CPC por Campanha'
        };
    }
    
    /**
     * Create a Report instance from raw data and selected metrics
     * @param {Array} data - Raw report data
     * @param {Array} selectedMetrics - Metrics selected by the user
     * @returns {Report} - New Report instance
     */
    static fromData(data, selectedMetrics) {
        return new Report(data, selectedMetrics);
    }
} 