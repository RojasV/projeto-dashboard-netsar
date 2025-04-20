/**
 * Data Helper Utility Functions
 * Common functions for data manipulation and formatting
 */

/**
 * Calculate summary metrics from campaign data
 * @param {Array} data - Array of campaign data objects
 * @returns {Object} - Object containing calculated summary metrics
 */
export function calculateSummaryMetrics(data) {
    if (!data || !Array.isArray(data)) {
        console.warn('calculateSummaryMetrics: received non-array data:', data);
        return { 
            totalSpend: 0, 
            totalClicks: 0, 
            totalImpressions: 0, 
            avgCTR: 0 
        };
    }
    
    const totalSpend = data.reduce((acc, curr) => acc + (parseFloat(curr.spend) || 0), 0);
    const totalClicks = data.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0);
    const totalImpressions = data.reduce((acc, curr) => acc + (parseInt(curr.impressions) || 0), 0);
    
    // Calculate average CTR - avoiding division by zero
    let avgCTR = 0;
    if (totalImpressions > 0) { 
        avgCTR = (totalClicks / totalImpressions) * 100; 
    }
    
    return { 
        totalSpend, 
        totalClicks, 
        totalImpressions, 
        avgCTR 
    };
}

/**
 * Format date to dd/mm/yyyy
 * @param {string} dateString - Date string to format
 * @returns {string} - Formatted date string
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}

/**
 * Get CSS class for campaign status
 * @param {boolean} isActive - Whether the campaign is active
 * @returns {string} - CSS classes for status badge
 */
export function getStatusClass(isActive) {
    return isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800';
}

/**
 * Get text for campaign status
 * @param {boolean} isActive - Whether the campaign is active
 * @returns {string} - Status text
 */
export function getStatusText(isActive) {
    return isActive ? 'Ativa' : 'Finalizada';
}

/**
 * Get campaign name or generate one if missing
 * @param {Object} campaign - Campaign data object
 * @param {number} index - Index of the campaign in the array
 * @returns {string} - Campaign name
 */
export function getCampaignName(campaign, index) {
    if (campaign.campaign_name) return campaign.campaign_name;
    
    if (campaign.date_start && campaign.date_stop) {
        return `Campanha ${formatDate(campaign.date_start)} - ${formatDate(campaign.date_stop)}`;
    }
    
    return `Campanha ${index + 1}`;
}

/**
 * Format currency to Brazilian Real
 * @param {number} value - Currency value
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(value) {
    if (value === undefined || value === null) return 'R$ 0,00';
    
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    });
}

/**
 * Helper function to format number values with thousands separators
 * @param {number} value - The value to format
 * @returns {string} - Formatted number string
 */
export function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Format percentage
 * @param {number} value - Percentage value (e.g., 0.1234 for 12.34%)
 * @returns {string} - Formatted percentage string
 */
export function formatPercentage(value) {
    if (value === undefined || value === null) return '0%';
    
    return (value * 100).toFixed(2) + '%';
}

/**
 * Generate a color palette for charts
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color strings
 */
export function generateColorPalette(count) {
    const baseColors = [
        'rgba(79, 70, 229, 0.8)',    // Indigo
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(236, 72, 153, 0.8)',   // Pink
        'rgba(249, 115, 22, 0.8)',   // Orange
        'rgba(6, 182, 212, 0.8)',    // Cyan
        'rgba(168, 85, 247, 0.8)'    // Violet
    ];
    
    // If we need more colors than in our base palette, generate them
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    // Generate additional colors by rotating hue
    const result = [...baseColors];
    const hueStep = 360 / (count - baseColors.length);
    
    for (let i = baseColors.length; i < count; i++) {
        const hue = (i - baseColors.length) * hueStep;
        result.push(`hsla(${hue}, 80%, 60%, 0.8)`);
    }
    
    return result;
}

/**
 * Create a debounced function that delays execution until after wait milliseconds
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate random RGBA color
 * @param {number} opacity - Color opacity (0-1)
 * @returns {string} - RGBA color string
 */
export function getRandomColor(opacity = 1) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Truncate text with ellipsis if it exceeds max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 25) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
}

/**
 * Calculate percentage change between two values
 * @param {number} oldValue - Old value
 * @param {number} newValue - New value
 * @returns {number} - Percentage change
 */
export function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
} 