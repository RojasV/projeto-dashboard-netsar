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
        const totalSteps = 4; // Agora são 4 etapas
        let createdCampaignId = null;
        let creationData = {
            campaign: null,
            adSet: null,
            uploads: []
        };
        const DRAFT_KEY = 'campaignCreationDraft';

        const showStep = (step) => {
            steps.forEach((el, idx) => el.classList.toggle('hidden', idx !== step - 1));
            progress.forEach((el, idx) => el.classList.toggle('active', idx === step - 1));
            backBtn.disabled = step === 1;
            nextBtn.classList.toggle('hidden', step === totalSteps);
            createBtn.classList.toggle('hidden', step !== totalSteps);

            // Atualizar painel lateral de status (sempre visível, mas só resumo)
            const sidebar = document.querySelector('.step-form-sidebar');
            if (sidebar) {
                let sidebarHtml = '<h3 class="text-lg font-semibold mb-6">Revisão Final</h3>';
                const statusBlock = (label, ok, msg) => `
                  <div class="mb-4 p-3 rounded-lg border border-gray-700 bg-gray-900 flex flex-col">
                    <div class="flex items-center mb-1">
                      <span class="font-semibold text-base mr-2">${label}</span>
                      <i class="fa ${ok ? 'fa-check-circle text-green-500' : 'fa-minus-circle text-gray-500'} ml-1"></i>
                    </div>
                    <span class="text-xs text-gray-300">${msg}</span>
                  </div>
                `;
                sidebarHtml += statusBlock(
                  'Campanha',
                  creationData.campaign && creationData.campaign.id,
                  creationData.campaign && creationData.campaign.id ? 'Criada.' : 'Não criada.'
                );
                sidebarHtml += statusBlock(
                  'Conjunto de Anúncios',
                  creationData.adSet && (creationData.adSet.id || creationData.adSet.name),
                  creationData.adSet && (creationData.adSet.id || creationData.adSet.name) ? 'Criado.' : 'Não criado.'
                );
                sidebarHtml += statusBlock(
                  'Arquivos Enviados',
                  creationData.uploads && creationData.uploads.some(u => u.status === 'fulfilled'),
                  creationData.uploads && creationData.uploads.some(u => u.status === 'fulfilled') ? 'Enviados.' : 'Nenhum arquivo enviado.'
                );
                sidebar.innerHTML = sidebarHtml;
            }

            // Renderizar conteúdo detalhado da revisão SOMENTE na etapa 4
            const reviewContainer = document.querySelector('[data-step="4"] .step-form-review-content');
            if (reviewContainer) {
                if (step === 4) {
                    let html = '';
                    // Campanha
                    html += '<div class="mb-6 p-4 rounded-lg border border-gray-700 bg-gray-900">';
                    html += '<div class="flex items-center mb-2"><span class="font-semibold text-base mr-2">Campanha</span>';
                    if (creationData.campaign && creationData.campaign.id) {
                        html += '<i class="fa fa-check-circle text-green-500 ml-1"></i>';
                    } else {
                        html += '<i class="fa fa-minus-circle text-gray-500 ml-1"></i>';
                    }
                    html += '</div>';
                    if (creationData.campaign && creationData.campaign.id) {
                        html += `<div class="text-sm text-gray-200"><b>Nome:</b> ${creationData.campaign.name || '-'}<br>`;
                        html += `<b>Objetivo:</b> ${creationData.campaign.objective || '-'}<br>`;
                        html += `<b>Status:</b> ${creationData.campaign.status || '-'}<br>`;
                        html += `<b>ID:</b> ${creationData.campaign.id || '-'}</div>`;
                    } else {
                        html += '<div class="text-gray-500 text-sm">Não criada.</div>';
                    }
                    html += '</div>';
                    // Conjunto de Anúncios
                    html += '<div class="mb-6 p-4 rounded-lg border border-gray-700 bg-gray-900">';
                    html += '<div class="flex items-center mb-2"><span class="font-semibold text-base mr-2">Conjunto de Anúncios</span>';
                    if (creationData.adSet && (creationData.adSet.id || creationData.adSet.name)) {
                        html += '<i class="fa fa-check-circle text-green-500 ml-1"></i>';
                    } else {
                        html += '<i class="fa fa-minus-circle text-gray-500 ml-1"></i>';
                    }
                    html += '</div>';
                    if (creationData.adSet && (creationData.adSet.id || creationData.adSet.name)) {
                        html += `<div class="text-sm text-gray-200"><b>Nome:</b> ${creationData.adSet.name || '-'}<br>`;
                        html += `<b>ID:</b> ${creationData.adSet.id || '-'}<br>`;
                        html += `<b>Orçamento Diário:</b> ${creationData.adSet.daily_budget ? 'R$ ' + (parseInt(creationData.adSet.daily_budget)/100).toLocaleString('pt-BR') : '-'}<br>`;
                        html += `<b>Status:</b> ${creationData.adSet.status || '-'}<br>`;
                        html += `<b>Início:</b> ${creationData.adSet.start_time ? new Date(creationData.adSet.start_time).toLocaleString('pt-BR') : '-'}<br>`;
                        html += `<b>Fim:</b> ${creationData.adSet.end_time ? new Date(creationData.adSet.end_time).toLocaleString('pt-BR') : '-'}`;
                        // Targeting
                        if (creationData.adSet.targeting) {
                            html += '<div class="mt-2"><b>Segmentação:</b>';
                            html += `<div class="ml-2 text-xs text-gray-400">Idade: ${creationData.adSet.targeting.age_min || '-'} - ${creationData.adSet.targeting.age_max || '-'}<br>`;
                            if (creationData.adSet.targeting.flexible_spec && creationData.adSet.targeting.flexible_spec[0] && creationData.adSet.targeting.flexible_spec[0].interests) {
                                const interests = creationData.adSet.targeting.flexible_spec[0].interests;
                                html += 'Interesses: ' + (interests.length ? interests.map(i => i.name).join(', ') : '-') + '<br>';
                            }
                            html += `Plataformas: ${(creationData.adSet.targeting.publisher_platforms || []).join(', ') || '-'}`;
                            html += '</div></div>';
                        }
                        html += '</div>';
                    } else {
                        html += '<div class="text-gray-500 text-sm">Não criado.</div>';
                    }
                    html += '</div>';
                    // Arquivos Enviados
                    html += '<div class="mb-2 p-4 rounded-lg border border-gray-700 bg-gray-900">';
                    html += '<div class="flex items-center mb-2"><span class="font-semibold text-base mr-2">Arquivos Enviados</span>';
                    if (creationData.uploads && creationData.uploads.length && creationData.uploads.some(u => u.status === 'fulfilled')) {
                        html += '<i class="fa fa-check-circle text-green-500 ml-1"></i>';
                    } else {
                        html += '<i class="fa fa-minus-circle text-gray-500 ml-1"></i>';
                    }
                    html += '</div>';
                    if (creationData.uploads && creationData.uploads.length && creationData.uploads.some(u => u.status === 'fulfilled')) {
                        html += '<div class="flex flex-wrap gap-4">';
                        creationData.uploads.forEach((result, idx) => {
                            if (result.status === 'fulfilled') {
                                const file = result.value.file;
                                let thumb = '';
                                if (file.type && file.type.startsWith('image/')) {
                                    thumb = `<img src="${file.url}" class="w-16 h-16 object-cover rounded mb-1 cursor-pointer preview-upload" data-url="${file.url}" alt="${file.name}">`;
                                } else if (file.type && file.type.startsWith('video/')) {
                                    thumb = `<video src="${file.url}" class="w-16 h-16 object-cover rounded mb-1 cursor-pointer preview-upload" data-url="${file.url}" controls muted preload="metadata"></video>`;
                                }
                                html += `<div class="flex flex-col items-center text-xs">${thumb}<span class="mt-1 break-all max-w-[4rem]">${file.name}</span></div>`;
                            } else {
                                html += `<div class="flex flex-col items-center text-xs text-red-600">Falha no upload</div>`;
                            }
                        });
                        html += '</div>';
                    } else {
                        html += '<div class="text-gray-500 text-sm">Nenhum arquivo enviado.</div>';
                    }
                    html += '</div>';
                    reviewContainer.innerHTML = html;
                } else {
                    reviewContainer.innerHTML = '';
                }
            }

            if (step === 4) {
                nextBtn.textContent = 'Próximo';
                nextBtn.onclick = null;
                createBtn.classList.remove('hidden');
            } else {
                nextBtn.textContent = 'Próximo';
                nextBtn.onclick = null;
                createBtn.classList.add('hidden');
            }
        };

        // Navegação livre entre etapas ao clicar nos indicadores
        progress.forEach((el, idx) => {
            el.addEventListener('click', () => {
                currentStep = idx + 1;
                showStep(currentStep);
            });
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    currentStep = idx + 1;
                    showStep(currentStep);
                }
            });
        });

        const resetForm = () => {
            form.reset();
            currentStep = 1;
            createdCampaignId = null;
            creationData = { campaign: null, adSet: null, uploads: [] };
            localStorage.removeItem(DRAFT_KEY);
            showStep(currentStep);
        };

        const openModal = () => {
            modal.classList.remove('hidden');
            resetForm();
        };
        
        const closeModal = () => {
            modal.classList.add('hidden');
        };

        openBtn.addEventListener('click', () => {
            const draft = localStorage.getItem(DRAFT_KEY);
            let shouldOpen = true;
            if (draft) {
                if (confirm('Você tem um rascunho de campanha em andamento. Deseja continuar de onde parou?')) {
                    try {
                        const draftData = JSON.parse(draft);
                        creationData = draftData;
                        // Restaurar campos do formulário (exceto arquivos binários)
                        if (draftData.campaign) {
                            form.querySelector('[name="campaignName"]').value = draftData.campaign.name || '';
                            form.querySelector('[name="campaignObjective"]').value = draftData.campaign.objective || '';
                            form.querySelector('[name="campaignStatus"]').value = draftData.campaign.status || '';
                        }
                        if (draftData.adSet) {
                            form.querySelector('[name="adSetName"]').value = draftData.adSet.name || '';
                            form.querySelector('[name="dailyBudget"]').value = draftData.adSet.daily_budget ? (parseInt(draftData.adSet.daily_budget)/100) : '';
                            form.querySelector('[name="startTime"]').value = draftData.adSet.start_time ? draftData.adSet.start_time.slice(0,16) : '';
                            form.querySelector('[name="endTime"]').value = draftData.adSet.end_time ? draftData.adSet.end_time.slice(0,16) : '';
                            form.querySelector('[name="ageMin"]').value = draftData.adSet.targeting?.age_min || '';
                            form.querySelector('[name="ageMax"]').value = draftData.adSet.targeting?.age_max || '';
                            // Restaurar interesses
                            const interestsSel = form.querySelector('[name="interests"]');
                            if (interestsSel && draftData.adSet.targeting?.flexible_spec?.[0]?.interests) {
                                const ids = draftData.adSet.targeting.flexible_spec[0].interests.map(i => i.id);
                                Array.from(interestsSel.options).forEach(opt => {
                                    opt.selected = ids.includes(opt.value);
                                });
                            }
                        }
                        // Não restaurar arquivos binários (uploads)
                    } catch (e) { /* ignore erro de parse */ }
                } else {
                    localStorage.removeItem(DRAFT_KEY);
                }
            }
            // Sempre abrir o modal após tratar o rascunho
            openModal();
        });
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (confirm('Deseja realmente fechar o formulário de criação de campanha? Os dados não salvos podem ser perdidos.')) {
                    closeModal();
                }
            }
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

        // Botão CRIAR CAMPANHA (finalização real)
        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            // Só deve funcionar se estivermos na etapa 4
            if (currentStep !== totalSteps) return;
            if (!creationData.adSet || !creationData.adSet.id) {
                this.errorHandler.showErrorToast('ID do conjunto de anúncios não encontrado.');
                return;
            }
            const originalBtnHTML = createBtn.innerHTML;
            createBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Enviando...`;
            createBtn.disabled = true;
            try {
                const response = await fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/criar-anuncio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adset_id: creationData.adSet.id })
                });
                const respData = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(respData.message || 'Erro ao criar anúncio.');
                document.getElementById('createCampaignModal').classList.add('hidden');
                this.errorHandler.showSuccessToast('Processo concluído com sucesso!');
                localStorage.removeItem(DRAFT_KEY);
            } catch (err) {
                this.errorHandler.showErrorToast(err.message);
            } finally {
                createBtn.innerHTML = originalBtnHTML;
                createBtn.disabled = false;
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
                    creationData.campaign = responseData;
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(creationData));
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
                    
                    const adSetResponse = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(adSetResponse.message || 'Falha ao criar o conjunto de anúncios.');
                    creationData.adSet = adSetResponse;
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(creationData));
                    this.errorHandler.showSuccessToast('Conjunto de anúncios criado!');
                    currentStep++;
                    showStep(currentStep);

                } catch (error) {
                    this.errorHandler.showErrorToast(error.message);
                } finally {
                    nextBtn.innerHTML = originalBtnHTML;
                    nextBtn.disabled = false;
                }
            } else if (currentStep === 3) {
                // Upload de arquivos sequencial
                const uploadInput = document.getElementById('uploadInput');
                const uploadFileList = document.getElementById('uploadFileList');
                const uploadError = document.getElementById('uploadError');
                const uploadProgress = document.getElementById('uploadProgress');
                const uploadProgressBar = document.getElementById('uploadProgressBar');
                const uploadProgressText = document.getElementById('uploadProgressText');

                uploadError.textContent = '';
                if (!uploadInput.files.length) {
                    uploadError.textContent = 'Selecione ao menos um arquivo de imagem ou vídeo.';
                    return;
                }

                // Validar tipos
                const validFiles = Array.from(uploadInput.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
                if (!validFiles.length) {
                    uploadError.textContent = 'Apenas arquivos de imagem ou vídeo são permitidos.';
                    return;
                }

                // Feedback visual: resetar status
                renderFileList([], true); // true = reset status

                nextBtn.disabled = true;
                uploadProgress.classList.remove('hidden');
                uploadProgressBar.style.width = '0%';
                uploadProgressText.textContent = 'Enviando arquivos...';

                // Função para upload sequencial
                async function uploadFilesSequentially(files) {
                    let results = [];
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        // Atualizar status visual para loading
                        setFileStatus(i, 'loading');
                        const formData = new FormData();
                        formData.append('files', file);
                        try {
                            const response = await fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/upload_de_arquivos', {
                                method: 'POST',
                                body: formData
                            });
                            let uploadResp = await response.json().catch(() => ({}));
                            if (!response.ok) throw new Error(uploadResp.message || 'Erro no upload');
                            setFileStatus(i, 'success');
                            // Salvar dados essenciais do arquivo + url do backend se houver
                            const fileMeta = {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                // Preferencialmente use a URL do backend, senão use blob local
                                url: uploadResp.url || URL.createObjectURL(file)
                            };
                            results.push({ status: 'fulfilled', value: { file: fileMeta, response: uploadResp } });
                        } catch (err) {
                            setFileStatus(i, 'error');
                            results.push({ status: 'rejected', reason: err, file: { name: file.name, type: file.type, size: file.size } });
                        }
                        uploadProgressBar.style.width = `${Math.round(((i+1)/files.length)*100)}%`;
                        uploadProgressText.textContent = `Enviando arquivos... (${i+1}/${files.length})`;
                    }
                    return results;
                }

                // Helper para atualizar status visual
                function setFileStatus(idx, status) {
                    const item = uploadFileList.querySelector(`[data-file-idx="${idx}"]`);
                    if (!item) return;
                    const statusIcon = item.querySelector('.upload-status');
                    statusIcon.innerHTML = '';
                    if (status === 'loading') {
                        statusIcon.innerHTML = '<i class="fa fa-spinner fa-spin text-blue-500"></i>';
                    } else if (status === 'success') {
                        statusIcon.innerHTML = '<i class="fa fa-check-circle text-green-600"></i>';
                    } else if (status === 'error') {
                        statusIcon.innerHTML = '<i class="fa fa-times-circle text-red-600"></i>';
                    }
                }

                uploadFilesSequentially(validFiles).then(results => {
                    uploadProgressBar.style.width = '100%';
                    uploadProgressText.textContent = 'Upload finalizado!';
                    creationData.uploads = results;
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(creationData));
                    if (results.every(r => r.status === 'fulfilled')) {
                        setTimeout(() => {
                            uploadProgress.classList.add('hidden');
                            uploadProgressBar.style.width = '0%';
                            uploadProgressText.textContent = '';
                        }, 1000);
                        this.errorHandler.showSuccessToast('Todos os arquivos enviados com sucesso!');
                        currentStep++;
                        showStep(currentStep);
                    } else {
                        uploadError.textContent = 'Alguns arquivos não foram enviados. Tente novamente.';
                    }
                }).finally(() => {
                    nextBtn.disabled = false;
                });
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

        // Upload de arquivos: drag-and-drop e seleção
        const uploadDropArea = document.getElementById('uploadDropArea');
        const uploadInput = document.getElementById('uploadInput');
        const uploadSelectBtn = document.getElementById('uploadSelectBtn');
        const uploadFileList = document.getElementById('uploadFileList');
        const uploadError = document.getElementById('uploadError');
        let uploadFiles = [];

        if (uploadDropArea && uploadInput && uploadSelectBtn && uploadFileList) {
            // Drag events
            uploadDropArea.addEventListener('dragover', e => {
                e.preventDefault();
                uploadDropArea.classList.add('dragover');
            });
            uploadDropArea.addEventListener('dragleave', e => {
                e.preventDefault();
                uploadDropArea.classList.remove('dragover');
            });
            uploadDropArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadDropArea.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });
            uploadSelectBtn.addEventListener('click', () => uploadInput.click());
            uploadInput.addEventListener('change', e => handleFiles(e.target.files));
        }

        function handleFiles(fileList) {
            uploadError.textContent = '';
            const files = Array.from(fileList);
            // Filtrar apenas imagens e vídeos
            const valid = files.filter(f => (f.type.startsWith('image/') || f.type.startsWith('video/')));
            if (!valid.length) {
                uploadError.textContent = 'Apenas arquivos de imagem ou vídeo são permitidos.';
                return;
            }
            // Adicionar incrementalmente, sem duplicados (nome + size)
            valid.forEach(newFile => {
                const alreadyExists = uploadFiles.some(f => f.name === newFile.name && f.size === newFile.size);
                if (!alreadyExists) {
                    uploadFiles.push(newFile);
                }
            });
            // Atualizar input.files
            const dataTransfer = new DataTransfer();
            uploadFiles.forEach(f => dataTransfer.items.add(f));
            uploadInput.files = dataTransfer.files;
            renderFileList();
        }

        function renderFileList(_, resetStatus) {
            uploadFileList.innerHTML = '';
            if (!uploadFiles.length) return;
            uploadFiles.forEach((file, idx) => {
                const item = document.createElement('div');
                item.className = 'upload-file-item';
                item.setAttribute('data-file-idx', idx);
                let preview = '';
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.className = 'w-12 h-12 object-cover rounded mr-2';
                    img.alt = file.name;
                    img.style.display = 'inline-block';
                    const reader = new FileReader();
                    reader.onload = e => { img.src = e.target.result; };
                    reader.readAsDataURL(file);
                    preview = img;
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.className = 'w-12 h-12 object-cover rounded mr-2';
                    video.src = URL.createObjectURL(file);
                    video.controls = false;
                    video.muted = true;
                    video.playsInline = true;
                    video.preload = 'metadata';
                    preview = video;
                }
                const statusIcon = document.createElement('span');
                statusIcon.className = 'upload-status ml-2';
                if (resetStatus) statusIcon.innerHTML = '';
                const info = document.createElement('span');
                info.innerHTML = `${file.name} <span class="text-xs text-gray-400">(${Math.round(file.size/1024)} KB)</span>`;
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-file';
                removeBtn.title = 'Remover';
                removeBtn.setAttribute('data-idx', idx);
                removeBtn.innerHTML = '&times;';
                item.appendChild(preview);
                item.appendChild(info);
                item.appendChild(statusIcon);
                item.appendChild(removeBtn);
                uploadFileList.appendChild(item);
            });
            // Remover arquivo
            uploadFileList.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', e => {
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    uploadFiles.splice(idx, 1);
                    // Atualizar input.files
                    const dataTransfer = new DataTransfer();
                    uploadFiles.forEach(f => dataTransfer.items.add(f));
                    uploadInput.files = dataTransfer.files;
                    renderFileList();
                });
            });
        }
    }
}

// Create and start the application
const app = new App();

// Export for potential testing or extension
export default app; 