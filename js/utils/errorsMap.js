/**
 * Error code to user-friendly message mapping
 * Used by the ErrorHandler to display appropriate messages
 */
export const errorMap = {
    // HTTP Status Codes
    '400': {
        title: 'Requisição Inválida',
        message: 'Os parâmetros fornecidos são inválidos. Verifique os dados e tente novamente.'
    },
    '401': {
        title: 'Não Autorizado',
        message: 'Você não está autorizado a acessar este recurso. Verifique suas credenciais.'
    },
    '403': {
        title: "Limite de uso excedido",
        message: "Este aplicativo atingiu o número máximo de chamadas. Tente novamente mais tarde.",
    },
    '404': {
        title: 'Não Encontrado',
        message: 'O recurso solicitado não foi encontrado.'
    },
    '429': {
        title: 'Muitas Requisições',
        message: 'Você excedeu o limite de requisições. Aguarde um momento e tente novamente.'
    },
    '500': {
        title: 'Erro no Servidor',
        message: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.'
    },
    '503': {
        title: 'Serviço Indisponível',
        message: 'O serviço está temporariamente indisponível. Por favor, tente novamente mais tarde.'
    },

    // API-specific errors
    'validation_error': {
        title: 'Erro de Validação',
        message: 'Os dados fornecidos são inválidos. Verifique os campos e tente novamente.'
    },
    'parse_error': {
        title: 'Erro de Processamento',
        message: 'Não foi possível processar a resposta do servidor.'
    },
    'fetch_error': {
        title: 'Erro de Comunicação',
        message: 'Não foi possível obter os dados. Verifique sua conexão de internet.'
    },
    'ai_error': {
        title: 'Erro na Análise de IA',
        message: 'Não foi possível gerar a análise inteligente. O relatório será gerado sem a análise.'
    },

    // Meta API Error Codes
    '190': {
        title: 'Erro de Autenticação',
        message: 'Acesso expirado ou inválido. Será necessário realizar nova autenticação.'
    },
    '100': {
        title: 'Erro de Parâmetros',
        message: 'Um ou mais parâmetros da requisição estão ausentes ou são inválidos.'
    },
    '4': {
        title: 'Limite de Requisições Excedido',
        message: 'Você atingiu o limite de requisições para a API do Meta. Aguarde um momento e tente novamente.'
    },
    '200': {
        title: 'Permissão Negada',
        message: 'Você não tem permissão para acessar este recurso. Verifique as permissões da sua conta Meta.'
    },
    '2': {
        title: 'Serviço Temporariamente Indisponível',
        message: 'O serviço está temporariamente indisponível. Por favor, tente novamente mais tarde.'
    }
}; 