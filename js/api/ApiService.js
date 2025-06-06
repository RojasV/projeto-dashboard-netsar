/**
 * ApiService class
 * Handles all API communication with the Meta Ads API
 */
import { EventEmitter } from '../utils/EventEmitter.js';

export class ApiService extends EventEmitter {
    constructor() {
        super();
        this.apiUrl = 'https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/relatorios';
        this.aiAnalysisUrl = 'https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/gerarRelatorioPDF';
        this.toggleStatusUrl = 'https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/gerenciarStatusDaCampanha';
    }

    /**
     * Extracts data from the nested API response
     * @param {Object} response - The API response
     * @returns {Array} - Extracted data array
     */
    extractDataFromResponse(response) {
        console.log('Raw response from API:', response);

        if (response.error) {
            console.error('Error in response:', response.error.status);
            this.emit('api:error', response.error);
            return [];
        }

        if (!response) {
            console.warn('Empty response received');
            return [];
        }

        try {
            if (Array.isArray(response) && response.length > 0 && response[0].data) {
                console.log('Found nested data array structure');
                return response[0].data;
            }

            if (!Array.isArray(response) && response.data) {
                console.log('Found single object with data property');
                return response.data;
            }

            if (Array.isArray(response)) {
                console.log('Response is already an array');
                return response;
            }

            console.log('Response is a single object, wrapping in array');
            return [response];
        } catch (error) {
            console.error('Error extracting data from response:', error);
            this.emit('api:error', {
                status: 'parse_error',
                message: 'Failed to parse API response'
            });
            return [];
        }
    }

    /**
     * Fetches dashboard data from the API
     * @returns {Promise} - A promise that resolves with the dashboard data
     */
    async fetchDashboardData() {
        const requestPayload = {
            level: 'campaign',
            limit: 300,
            metrics: ['campaign_id', 'campaign_name', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc']
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const extractedData = this.extractDataFromResponse(data);

            this.emit('dashboard:data', extractedData);
            return extractedData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            this.emit('api:error', {
                status: 'fetch_error',
                message: 'Failed to fetch dashboard data',
                error
            });
            return [];
        }
    }

    /**
     * Fetches campaigns data from the API
     * @returns {Promise} - A promise that resolves with the campaigns data
     */
    async fetchCampaignsData() {
        const requestPayload = {
            level: 'campaign',
            limit: 300,
            metrics: [
                'campaign_id',
                'campaign_name', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'date_start', 'date_stop'
            ]
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const extractedData = this.extractDataFromResponse(data);

            this.emit('campaigns:data', extractedData);
            return extractedData;
        } catch (error) {
            console.error('Error fetching campaigns data:', error);
            this.emit('api:error', {
                status: 'fetch_error',
                message: 'Failed to fetch campaigns data',
                error
            });
            return [];
        }
    }

    /**
     * Fetches report data from the API based on selected metrics
     * @param {Array} selectedMetrics - Array of metrics selected by the user
     * @returns {Promise} - A promise that resolves with the report data
     */
    async fetchReportData(selectedMetrics) {
        if (!selectedMetrics || selectedMetrics.length === 0) {
            this.emit('api:error', {
                status: 'validation_error',
                message: 'No metrics selected'
            });
            return [];
        }

        // Create API request metrics array
        let apiMetrics = [...selectedMetrics];

        // Always include required fields
        if (!apiMetrics.includes('campaign_id')) apiMetrics.push('campaign_id');
        if (!apiMetrics.includes('campaign_name')) apiMetrics.push('campaign_name');
        if (!apiMetrics.includes('date_start')) apiMetrics.push('date_start');
        if (!apiMetrics.includes('date_stop')) apiMetrics.push('date_stop');

        const requestPayload = {
            metrics: apiMetrics,
            level: 'campaign',
            limit: 300
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log('Data com erro:', data);

            const extractedData = this.extractDataFromResponse(data);

            if (!data.error) {
                // Attach the original metrics selection to the data
                extractedData.selectedMetrics = selectedMetrics;

                this.emit('report:data', extractedData);
                return extractedData;
            }

            return [];
        } catch (error) {
            console.error('Error generating report:', error);
            this.emit('api:error', {
                status: 'fetch_error',
                message: 'Failed to generate report',
                error
            });
            return [];
        }
    }

    /**
     * Requests AI analysis for the report data
     * @param {Object} reportData - The report data to analyze
     * @returns {Promise} - A promise that resolves with the AI analysis text
     */
    async getAIAnalysis(reportData) {
        try {
            const response = await fetch(this.aiAnalysisUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultados: reportData })
            });

            if (!response.ok) {
                throw new Error('Error calling AI agent');
            }

            const data = await response.json();
            return data.output;
        } catch (error) {
            console.error('Error generating AI analysis:', error);
            this.emit('api:error', {
                status: 'ai_error',
                message: 'Failed to generate AI analysis',
                error
            });
            return '';
        }
    }

    /**
     * Toggles the status of a campaign (active/inactive)
     * @param {string|number} campaignId - ID of the campaign to toggle
     * @param {string} newStatus - Novo status para a campanha ("ACTIVE" ou "PAUSED")
     * @returns {Promise} - A promise that resolves with the updated campaign data
     */
    async toggleCampaignStatus(campaignId, newStatus) {
        console.log(`API Service - Alterando status da campanha ${campaignId} para: ${newStatus}`);
        const requestPayload = {
            campaign_id: campaignId,
            status: newStatus // Novo status (ACTIVE ou PAUSED)
        };
        try {
            console.log('Enviando requisição para:', this.toggleStatusUrl);
            console.log('Payload:', requestPayload);
            const response = await fetch(this.toggleStatusUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Resposta da API de toggle:', data);
            // Pega o status real retornado pela API
            const statusFromApi = Array.isArray(data) && data[0] ? data[0].status : newStatus;
            // Emitir evento de sucesso
            this.emit('campaign:status_changed', {
                campaignId,
                success: true,
                new_status: statusFromApi
            });
            return data;
        } catch (error) {
            console.error('Error toggling campaign status:', error);
            // Emit error event
            this.emit('api:error', {
                status: 'toggle_error',
                message: 'Failed to toggle campaign status',
                error
            });
            // Emitir evento de falha
            this.emit('campaign:status_changed', {
                campaignId,
                success: false,
                new_status: null
            });
            throw error;
        }
    }
}