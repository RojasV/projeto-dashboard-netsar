/**
 * Main Application Entry Point
 * Orchestrates the initialization of all components
 */
import { NavigationController } from './controllers/NavigationController.js';
import { DashboardController } from './controllers/DashboardController.js';
import { CampaignController } from './controllers/CampaignController.js';
import { ReportController } from './controllers/ReportController.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { ThemeController } from './controllers/ThemeController.js';
import { CampaignRankingView } from './views/CampaignRankingView.js';

class App {
    constructor() {
        // Initialize error handling
        this.errorHandler = new ErrorHandler();
        
        // Initialize controllers
        this.navigationController = new NavigationController();
        this.dashboardController = new DashboardController();
        this.campaignController = new CampaignController();
        this.reportController = new ReportController();
        this.themeController = new ThemeController();
        
        // Initialize the application
        this.init();
    }
    
    init() {
        // Set up event listeners and initialize components
        document.addEventListener('DOMContentLoaded', () => {
            this.navigationController.init();
            this.dashboardController.init();
            this.campaignController.init();
            this.reportController.init();
            this.themeController.init();
            
            // Set dashboard as active by default
            this.navigationController.activateSection('dashboard');
            
            // Setup additional global event listeners
            this.setupGlobalEventListeners();
            this.setupCreateCampaignModal(); // Chamar o novo método aqui
        });
    }
    
    setupGlobalEventListeners() {
        // Backup modal close handlers in case the component-specific ones don't catch all scenarios
        document.addEventListener('click', (e) => {
            const campaignModal = document.getElementById('campaign-modal');
            if (campaignModal && !campaignModal.classList.contains('hidden')) {
                // Close if clicking the modal background (not its content)
                if (e.target === campaignModal) {
                    campaignModal.classList.add('hidden');
                }
                
                // Close if clicking the X button - replace :has() selector
                const closeButton = e.target.closest('#campaign-modal button');
                if (closeButton && closeButton.querySelector('.fa-xmark')) {
                    campaignModal.classList.add('hidden');
                }
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const campaignModal = document.getElementById('campaign-modal');
                if (campaignModal && !campaignModal.classList.contains('hidden')) {
                    campaignModal.classList.add('hidden');
                }
            }
        });
    }

    setupCreateCampaignModal() {
        const openBtn = document.getElementById('createCampaignBtn');
        const modal = document.getElementById('createCampaignModal');
        if (!openBtn || !modal) return;

        const closeBtn = document.getElementById('closeCreateCampaignModal');
        const cancelBtn = document.getElementById('stepFormCancelBtn');
        const backBtn = document.getElementById('stepFormBackBtn');
        const nextBtn = document.getElementById('stepFormNextBtn');
        const createBtn = document.getElementById('stepFormCreateBtn');
        const form = document.getElementById('createCampaignStepForm');
        const steps = Array.from(form.querySelectorAll('.step-form-step'));
        const progress = document.getElementById('stepFormProgress').querySelectorAll('.step-indicator');
        
        let currentStep = 1;
        const totalSteps = 3; // Hardcoded to 3 steps
        let createdCampaignId = null;

        const showStep = (step) => {
            steps.forEach((el, idx) => el.classList.toggle('hidden', idx !== step - 1));
            progress.forEach((el, idx) => el.classList.toggle('active', idx === step - 1));
            backBtn.disabled = step === 1;
            nextBtn.classList.toggle('hidden', step === totalSteps);
            createBtn.classList.toggle('hidden', step !== totalSteps);
        };

        const resetForm = () => {
            form.reset();
            currentStep = 1;
            createdCampaignId = null;
            showStep(currentStep);
        };

        const openModal = () => {
            modal.classList.remove('hidden');
            resetForm();
        };
        
        const closeModal = () => {
            modal.classList.add('hidden');
        };

        openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('hidden') && e.key === 'Escape') closeModal();
        });

        backBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });

        nextBtn.addEventListener('click', async () => {
            console.log(`Botão 'Próximo' clicado na Etapa: ${currentStep}`); // Log para depuração

            if (currentStep === 1) {
                const campaignNameInput = form.querySelector('[name="campaignName"]');
                if (!campaignNameInput.value.trim()) {
                    this.errorHandler.showErrorToast('O nome da campanha é obrigatório.');
                    return;
                }

                const originalBtnHTML = nextBtn.innerHTML;
                nextBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Criando...`;
                nextBtn.disabled = true;

                try {
                    const response = await fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/criar_campanha', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: form.querySelector('[name="campaignName"]').value,
                            objective: form.querySelector('[name="campaignObjective"]').value,
                            status: form.querySelector('[name="campaignStatus"]').value,
                            special_ad_categories: []
                        })
                    });

                    const responseData = await response.json();
                    if (!response.ok || !responseData.id) throw new Error('Falha ao obter o ID da campanha.');
                    
                    createdCampaignId = responseData.id;
                    this.errorHandler.showSuccessToast('Campanha criada! Prossiga para o conjunto de anúncios.');
                    currentStep++;
                    showStep(currentStep);

                } catch (error) {
                    this.errorHandler.showErrorToast(error.message);
                } finally {
                    nextBtn.innerHTML = originalBtnHTML;
                    nextBtn.disabled = false;
                }
            } else if (currentStep === 2) {
                const originalBtnHTML = nextBtn.innerHTML;
                nextBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Criando...`;
                nextBtn.disabled = true;

                try {
                    // Validação simples
                    const adSetName = form.querySelector('[name="adSetName"]').value;
                    if (!adSetName.trim()) {
                        throw new Error('O nome do conjunto de anúncios é obrigatório.');
                    }
                    if (!createdCampaignId) {
                        throw new Error('ID da campanha não encontrado. Volte para a Etapa 1.');
                    }

                    // Montar o objeto do conjunto de anúncios
                    const adSetData = {
                        name: adSetName,
                        campaign_id: createdCampaignId,
                        daily_budget: parseInt(form.querySelector('[name="dailyBudget"]').value) * 100, // Em centavos
                        billing_event: "IMPRESSIONS",
                        optimization_goal: "REACH",
                        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
                        start_time: new Date(form.querySelector('[name="startTime"]').value).toISOString(),
                        end_time: form.querySelector('[name="endTime"]').value ? new Date(form.querySelector('[name="endTime"]').value).toISOString() : undefined,
                        targeting: {
                            geo_locations: { countries: ["BR"] },
                            flexible_spec: [{
                                interests: Array.from(form.querySelector('[name="interests"]').selectedOptions).map(option => ({ id: option.value, name: option.text }))
                            }],
                            age_min: parseInt(form.querySelector('[name="ageMin"]').value),
                            age_max: parseInt(form.querySelector('[name="ageMax"]').value),
                            instagram_positions: ["stream", "ig_search", "profile_reels", "story", "explore", "reels", "explore_home", "profile_feed"],
                            publisher_platforms: ["instagram"],
                            device_platforms: ["mobile", "desktop"]
                        },
                        status: "PAUSED"
                    };

                    console.log('Enviando para o webhook de Conjunto de Anúncios:', adSetData);

                    const response = await fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/criar_conjunto_de_anuncios', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(adSetData)
                    });
                    
                    if (!response.ok) {
                         const errorData = await response.json().catch(() => ({ message: 'Resposta inválida do servidor.' }));
                         throw new Error(errorData.message || 'Falha ao criar o conjunto de anúncios.');
                    }

                    this.errorHandler.showSuccessToast('Conjunto de anúncios criado!');
                    currentStep++;
                    showStep(currentStep);

                } catch (error) {
                    this.errorHandler.showErrorToast(error.message);
                } finally {
                    nextBtn.innerHTML = originalBtnHTML;
                    nextBtn.disabled = false;
                }
            } else if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Lógica final de criação aqui...
            closeModal();
        });
    }
}

// Create and start the application
const app = new App();

// Export for potential testing or extension
export default app; 