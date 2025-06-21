/**
 * ErrorHandler class
 * Centralizes error handling across the application
 */
export class ErrorHandler {
    /**
     * Create a new ErrorHandler instance
     */
    constructor() {
        // Error message mapping
        this.errorMessages = {
            'fetch_error': 'Erro de conexão com a API',
            'parse_error': 'Erro ao processar a resposta da API',
            'validation_error': 'Erro de validação',
            'ai_error': 'Erro ao gerar análise de IA',
            'pdf_error': 'Erro ao gerar PDF',
            'default': 'Ocorreu um erro inesperado'
        };
    }
    
    /**
     * Handle an API error
     * @param {Object} error - Error object from API
     */
    handleApiError(error) {
        console.error('API Error:', error);
        
        // Show error toast
        this.showErrorToast(this.getErrorMessage(error));
        
        // You could also log to a service like Sentry here
    }
    
    /**
     * Get appropriate error message for the error type
     * @param {Object} error - Error object
     * @returns {string} - Human-readable error message
     */
    getErrorMessage(error) {
        if (!error) return this.errorMessages.default;
        
        // If it's an API error with status
        if (error.status && this.errorMessages[error.status]) {
            return this.errorMessages[error.status];
        }
        
        // If it has a message property
        if (error.message) {
            return error.message;
        }
        
        // Default error message
        return this.errorMessages.default;
    }
    
    /**
     * Show an error toast notification
     * @param {string} message - Error message to display
     */
    showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <div>
                <p class="font-medium">Erro</p>
                <p class="text-sm">${message}</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Add click event to close button
        const closeButton = toast.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(toast);
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 5000);
    }

    /**
     * Show a success toast notification
     * @param {string} message - Success message to display
     */
    showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 flex items-center';
        toast.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <div>
                <p class="font-medium">Sucesso</p>
                <p class="text-sm">${message}</p>
            </div>
            <button class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        const closeButton = toast.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(toast);
            });
        }
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
} 