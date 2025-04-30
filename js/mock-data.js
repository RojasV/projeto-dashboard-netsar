/**
 * Mock Data for Campaigns
 * Used for development and demonstration purposes
 */

export const mockCampaigns = [
    {
        id: 1,
        campaign_name: "Campanha Black Friday",
        status: true, // Ativo
        start_date: "2025-11-15",
        end_date: "2025-11-30",
        spend: 15280,
        conversions: 359,
        roas: "3.8",
        cpa: 42.50,
        budget: 20000,
        roas_change: 12,
        cpa_change: 5,
        conversions_change: 18
    },
    {
        id: 2,
        campaign_name: "Campanha Natal",
        status: true, // Ativo
        start_date: "2025-12-01",
        end_date: "2025-12-25",
        spend: 12450,
        conversions: 255,
        roas: "3.2",
        cpa: 48.90,
        budget: 15000,
        roas_change: -8,
        cpa_change: 3,
        conversions_change: 5
    },
    {
        id: 3,
        campaign_name: "Campanha Verão",
        status: false, // Pausado
        start_date: "2025-01-10",
        end_date: "2025-02-28",
        spend: 9840,
        conversions: 188,
        roas: "2.9",
        cpa: 52.30,
        budget: 12000,
        roas_change: 0,
        cpa_change: -2,
        conversions_change: 10
    },
    {
        id: 4,
        campaign_name: "Campanha Dia das Mães",
        status: true, // Ativo
        start_date: "2025-04-15",
        end_date: "2025-05-12",
        spend: 8560,
        conversions: 176,
        roas: "3.1",
        cpa: 48.64,
        budget: 10000,
        roas_change: 5,
        cpa_change: -3,
        conversions_change: 7
    },
    {
        id: 5,
        campaign_name: "Campanha Volta às Aulas",
        status: false, // Pausado
        start_date: "2025-01-15",
        end_date: "2025-02-15",
        spend: 7250,
        conversions: 132,
        roas: "2.7",
        cpa: 54.92,
        budget: 9000,
        roas_change: -4,
        cpa_change: 6,
        conversions_change: -2
    },
    {
        id: 6,
        campaign_name: "Campanha Dia dos Namorados",
        status: true, // Ativo
        start_date: "2025-06-01",
        end_date: "2025-06-12",
        spend: 5120,
        conversions: 98,
        roas: "2.8",
        cpa: 52.24,
        budget: 7500,
        roas_change: 2,
        cpa_change: 0,
        conversions_change: 12
    }
];

// Helper function to format dates for display
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Helper function to format currency values
export function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
} 