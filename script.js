// Meta Ads Dashboard JavaScript - Refatorado com Atualização Dinâmica e Nova Ordem (KPIs, Gráficos, Tabela)

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const reportForm = document.getElementById('reportForm');
const reportResults = document.getElementById('reportResults');
const exportPdfBtn = document.getElementById('exportPdfBtn');

// Chart Objects
let charts = {};

// Global Data Storage
let dashboardData = [];
let campaignsData = [];
let reportData = [];

// Color Palette for Charts
const colorPalette = [
    'rgba(79, 70, 229, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(168, 85, 247, 0.8)'
];

// Debounce helper (300ms)
function debounce(func, delay) {
    let debounceTimer;
    return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
}

// ==========================
//  INITIAL SETUP
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    fetchDashboardData();
    attachEventListeners();
});

// ==========================
//  NAVIGATION
// ==========================
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            const targetSection = link.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('active');
            if (targetSection === 'campanhas' && campaignsData.length === 0) {
                fetchCampaignsData();
            }
        });
    });
    navLinks[0].classList.add('active');
}

// ==========================
//  EVENT LISTENERS
// ==========================
function attachEventListeners() {
    // Atualiza o relatório dinamicamente ao submeter (fallback)
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateReport();
    });

    // Export PDF
    exportPdfBtn.addEventListener('click', generatePDF);

    // "Select All" Checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    const metricCheckboxes = document.querySelectorAll('#reportForm input[name="metrics"]');

    selectAllCheckbox.addEventListener('change', function () {
        const isChecked = this.checked;
        metricCheckboxes.forEach(checkbox => { checkbox.checked = isChecked; });
        debounceUpdateReport();
    });

    // Atualiza "Select All" e chama updateReport dinamicamente
    metricCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const allChecked = Array.from(metricCheckboxes).every(cb => cb.checked);
            const anyChecked = Array.from(metricCheckboxes).some(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = anyChecked && !allChecked;
            debounceUpdateReport();
        });
    });
}

// Versão debounced de updateReport
const debounceUpdateReport = debounce(updateReport, 300);

// ==========================
//  DATA FETCHING
// ==========================
function extractDataFromResponse(response) {
    console.log('Raw response from API:', response);
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
        return [];
    }
}

function fetchDashboardData() {
    const dashboardSection = document.getElementById('dashboard');
    dashboardSection.classList.add('loading');
    const requestPayload = {
        level: 'campaign',
        limit: 300,
        metrics: ['campaign_name', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc']
    };
    fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/relatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
    })
        .then(response => {
            console.log('Response:', response);
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.json();
        })
        .then(data => {
            const extractedData = extractDataFromResponse(data);
            dashboardData = extractedData;
            renderDashboard(extractedData);
            dashboardSection.classList.remove('loading');
        })
        .catch(error => {
            console.error('Error fetching dashboard data:', error);
            dashboardSection.classList.remove('loading');
            dashboardSection.innerHTML += `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                <strong class="font-bold">Erro!</strong>
                <span class="block sm:inline">Não foi possível carregar os dados do dashboard.</span>
            </div>
        `;
        });
}

function fetchCampaignsData() {
    const campanhasSection = document.getElementById('campanhas');
    campanhasSection.classList.add('loading');
    const requestPayload = {
        level: 'campaign',
        limit: 300,
        metrics: ['campaign_name', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'date_start', 'date_stop']
    };
    fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/relatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
    })
        .then(response => {
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.json();
        })
        .then(data => {
            const extractedData = extractDataFromResponse(data);
            campaignsData = extractedData;
            renderCampaignsTable(extractedData);
            campanhasSection.classList.remove('loading');
        })
        .catch(error => {
            console.error('Error fetching campaigns data:', error);
            campanhasSection.classList.remove('loading');
            campanhasSection.innerHTML += `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                <strong class="font-bold">Erro!</strong>
                <span class="block sm:inline">Não foi possível carregar os dados das campanhas.</span>
            </div>
        `;
        });
}

// ==========================
//  UPDATE REPORT (DYNAMIC)
// ==========================
function updateReport() {
    const formData = new FormData(reportForm);
    const selectedMetrics = formData.getAll('metrics');
    if (selectedMetrics.length === 0) {
        reportResults.classList.add('hidden');
        return;
    }
    let apiMetrics = [...selectedMetrics];
    if (!apiMetrics.includes('campaign_name')) { apiMetrics.push('campaign_name'); }
    if (!apiMetrics.includes('date_start')) { apiMetrics.push('date_start'); }
    if (!apiMetrics.includes('date_stop')) { apiMetrics.push('date_stop'); }
    const requestPayload = {
        metrics: apiMetrics,
        level: 'campaign',
        limit: 300
    };
    const relatoriosSection = document.getElementById('relatorios');
    relatoriosSection.classList.add('loading');
    reportResults.classList.add('hidden');
    fetch('https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/relatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
    })
        .then(response => {
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.json();
        })
        .then(data => {
            const extractedData = extractDataFromResponse(data);
            reportData = extractedData;
            reportData.selectedMetrics = selectedMetrics;
            renderReportResults(extractedData);
            relatoriosSection.classList.remove('loading');
            reportResults.classList.remove('hidden');
            reportResults.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error generating report:', error);
            relatoriosSection.classList.remove('loading');
            alert('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
        });
}

// ==========================
//  RENDER DASHBOARD
// ==========================
function renderDashboard(data) {
    console.log('Rendering dashboard with data:', data);
    const summary = calculateSummaryMetrics(data);
    console.log('Summary metrics:', summary);
    const kpiCardsContainer = document.querySelector('#dashboard .grid');
    kpiCardsContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Total Gasto</h3>
                    <p class="text-2xl font-bold text-gray-800">R$ ${summary.totalSpend.toFixed(2)}</p>
                </div>
                <div class="bg-indigo-100 p-3 rounded-full">
                    <i class="fas fa-hand-holding-usd text-indigo-500"></i>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Total Cliques</h3>
                    <p class="text-2xl font-bold text-gray-800">${summary.totalClicks.toLocaleString()}</p>
                </div>
                <div class="bg-green-100 p-3 rounded-full">
                    <i class="fas fa-mouse-pointer text-green-500"></i>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Total Impressões</h3>
                    <p class="text-2xl font-bold text-gray-800">${summary.totalImpressions.toLocaleString()}</p>
                </div>
                <div class="bg-blue-100 p-3 rounded-full">
                    <i class="fas fa-eye text-blue-500"></i>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-gray-500 text-sm font-medium">Média CTR</h3>
                    <p class="text-2xl font-bold text-gray-800">${summary.avgCTR.toFixed(2)}%</p>
                </div>
                <div class="bg-amber-100 p-3 rounded-full">
                    <i class="fas fa-percentage text-amber-500"></i>
                </div>
            </div>
        </div>
    `;
    const chartsContainer = document.querySelector('#dashboard .grid:last-child');
    chartsContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-700">Performance por Campanha</h3>
            <canvas id="campaignPerformanceChart"></canvas>
        </div>
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-700">Distribuição de Gastos</h3>
            <canvas id="spendDistributionChart"></canvas>
        </div>
    `;
    try {
        renderCampaignPerformanceChart(data);
        renderSpendDistributionChart(data);
    } catch (error) {
        console.error('Error rendering dashboard charts:', error);
        chartsContainer.innerHTML += `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                <strong class="font-bold">Erro!</strong>
                <span class="block sm:inline">Não foi possível renderizar os gráficos.</span>
            </div>
        `;
    }
}

// ==========================
//  RENDER CAMPAIGNS TABLE
// ==========================
function renderCampaignsTable(data) {
    const tableBody = document.querySelector('#campanhasTable tbody');
    tableBody.innerHTML = '';
    data.forEach((campaign, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4 text-left">${getCampaignName(campaign, index)}</td>
            <td class="py-3 px-4 text-left">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(campaign)}">${getStatusText(campaign)}</span>
            </td>
            <td class="py-3 px-4 text-left">${formatDate(campaign.date_start)}</td>
            <td class="py-3 px-4 text-left">${formatDate(campaign.date_stop)}</td>
            <td class="py-3 px-4 text-right">R$ ${parseFloat(campaign.spend || 0).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================
//  RENDER REPORT RESULTS (NEW ORDER: KPIs, CHARTS, TABLE)
// ==========================
function renderReportResults(data) {
    if (!data || data.length === 0) {
        alert('Nenhum dado encontrado para os critérios selecionados.');
        return;
    }
    const selectedMetrics = data.selectedMetrics ||
        Array.from(document.querySelectorAll('#reportForm input[name="metrics"]:checked')).map(cb => cb.value);
    const summary = calculateSummaryMetrics(data);

    // Rebuild #reportResults in desired order: KPIs, then Charts, then Table.
    const reportContainer = document.getElementById('reportResults');
    reportContainer.innerHTML = '';

    // KPIs Container
    const kpiContainer = document.createElement('div');
    kpiContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8';
    reportContainer.appendChild(kpiContainer);

    if (selectedMetrics.includes('spend')) {
        kpiContainer.innerHTML += `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Gasto</h3>
                        <p class="text-2xl font-bold text-gray-800">R$ ${summary.totalSpend.toFixed(2)}</p>
                    </div>
                    <div class="bg-indigo-100 p-3 rounded-full">
                        <i class="fas fa-hand-holding-usd text-indigo-500"></i>
                    </div>
                </div>
            </div>
        `;
    }
    if (selectedMetrics.includes('clicks')) {
        kpiContainer.innerHTML += `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Cliques</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.totalClicks.toLocaleString()}</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-mouse-pointer text-green-500"></i>
                    </div>
                </div>
            </div>
        `;
    }
    if (selectedMetrics.includes('impressions')) {
        kpiContainer.innerHTML += `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Total Impressões</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.totalImpressions.toLocaleString()}</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-eye text-blue-500"></i>
                    </div>
                </div>
            </div>
        `;
    }
    if (selectedMetrics.includes('ctr')) {
        kpiContainer.innerHTML += `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-500 text-sm font-medium">Média CTR</h3>
                        <p class="text-2xl font-bold text-gray-800">${summary.avgCTR.toFixed(2)}%</p>
                    </div>
                    <div class="bg-amber-100 p-3 rounded-full">
                        <i class="fas fa-percentage text-amber-500"></i>
                    </div>
                </div>
            </div>
        `;
    }

    // Charts Container
    const chartsContainer = document.createElement('div');
    chartsContainer.className = 'grid grid-cols-1 md:grid-cols-1 gap-6';
    reportContainer.appendChild(chartsContainer);

    const chartLabels = {
        spend: 'Gastos por Campanha',
        impressions: 'Impressões por Campanha',
        reach: 'Alcance por Campanha',
        clicks: 'Cliques por Campanha',
        ctr: 'CTR por Campanha',
        cpc: 'CPC por Campanha'
    };
    const chartTitles = {
        spend: 'Gastos (R$)',
        impressions: 'Impressões',
        reach: 'Alcance',
        clicks: 'Cliques',
        ctr: 'CTR (%)',
        cpc: 'CPC (R$)'
    };

    selectedMetrics.forEach(metric => {
        if (chartLabels[metric]) {
            chartsContainer.innerHTML += `
            <div class="chart-container bg-white rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-700">${chartLabels[metric]}</h3>
              <canvas id="${metric}Chart"></canvas>
            </div>
          `;
        }
    });
    selectedMetrics.forEach(metric => {
        if (chartTitles[metric]) {
            createMetricChart(metric, data, chartTitles[metric]);
        }
    });

    // Table Container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'hide-on-pdf bg-white rounded-lg shadow-md p-6';
    tableContainer.innerHTML = `
    <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-semibold text-gray-700">Resultados Detalhados</h3>
        <button id="exportPdfBtn" class="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition duration-200 flex items-center">
            <i class="fas fa-file-pdf mr-2"></i> Exportar PDF
        </button>
    </div>
    <div class="overflow-x-auto">
        <table id="resultsTable" class="min-w-full bg-white">
            <thead class="bg-gray-100 text-gray-700">
                <tr></tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
`;
    reportContainer.appendChild(tableContainer);

    // Após criar o botão, anexe o event listener:
    document.getElementById('exportPdfBtn').addEventListener('click', generatePDF);

    // Render Table Header
    const tableHeader = tableContainer.querySelector('#resultsTable thead tr');
    tableHeader.innerHTML = `<th class="py-3 px-4 text-left">Campanha</th>`;
    if (selectedMetrics.includes('date_start')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-left">Data Início</th>`;
    }
    if (selectedMetrics.includes('date_stop')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-left">Data Fim</th>`;
    }
    if (selectedMetrics.includes('impressions')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Impressões</th>`;
    }
    if (selectedMetrics.includes('reach')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Alcance</th>`;
    }
    if (selectedMetrics.includes('clicks')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Cliques</th>`;
    }
    if (selectedMetrics.includes('ctr')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">CTR</th>`;
    }
    if (selectedMetrics.includes('cpc')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">CPC</th>`;
    }
    if (selectedMetrics.includes('spend')) {
        tableHeader.innerHTML += `<th class="py-3 px-4 text-right">Gasto</th>`;
    }
    const tableBody = tableContainer.querySelector('#resultsTable tbody');
    tableBody.innerHTML = '';
    data.forEach((campaign, index) => {
        let rowHTML = `<td class="py-3 px-4 text-left">${getCampaignName(campaign, index)}</td>`;
        if (selectedMetrics.includes('date_start')) {
            rowHTML += `<td class="py-3 px-4 text-left">${formatDate(campaign.date_start)}</td>`;
        }
        if (selectedMetrics.includes('date_stop')) {
            rowHTML += `<td class="py-3 px-4 text-left">${formatDate(campaign.date_stop)}</td>`;
        }
        if (selectedMetrics.includes('impressions')) {
            rowHTML += `<td class="py-3 px-4 text-right">${parseInt(campaign.impressions || 0).toLocaleString()}</td>`;
        }
        if (selectedMetrics.includes('reach')) {
            rowHTML += `<td class="py-3 px-4 text-right">${parseInt(campaign.reach || 0).toLocaleString()}</td>`;
        }
        if (selectedMetrics.includes('clicks')) {
            rowHTML += `<td class="py-3 px-4 text-right">${parseInt(campaign.clicks || 0).toLocaleString()}</td>`;
        }
        if (selectedMetrics.includes('ctr')) {
            rowHTML += `<td class="py-3 px-4 text-right">${parseFloat(campaign.ctr || 0).toFixed(2)}%</td>`;
        }
        if (selectedMetrics.includes('cpc')) {
            rowHTML += `<td class="py-3 px-4 text-right">R$ ${parseFloat(campaign.cpc || 0).toFixed(2)}</td>`;
        }
        if (selectedMetrics.includes('spend')) {
            rowHTML += `<td class="py-3 px-4 text-right">R$ ${parseFloat(campaign.spend || 0).toFixed(2)}</td>`;
        }
        const row = document.createElement('tr');
        row.innerHTML = rowHTML;
        tableBody.appendChild(row);
    });
}

// ==========================
//  CREATE CHART
// ==========================
function createMetricChart(metric, data, label) {
    const canvas = document.getElementById(`${metric}Chart`);
    if (!canvas) {
        console.warn(`Canvas para a métrica "${metric}" não foi encontrado.`);
        return;
    }

    // 🔁 Ajuste automático de altura do gráfico
    const rowHeight = 30; // altura aproximada por campanha
    const minHeight = 300;
    const height = Math.max(minHeight, data.length * rowHeight);
    canvas.maxHeight = height;

    const ctx = canvas.getContext('2d');
    if (charts[metric]) charts[metric].destroy();

    const campaignNames = data.map((item, index) => {
        const name = getCampaignName(item, index);
        return name.length > 25 ? name.slice(0, 25) + '...' : name;
    });

    const metricValues = data.map(item => {
        if (['spend', 'cpc', 'ctr'].includes(metric)) {
            return parseFloat(item[metric] || 0);
        } else {
            return parseInt(item[metric] || 0);
        }
    });

    charts[metric] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: campaignNames,
            datasets: [{
                label: label,
                data: metricValues,
                backgroundColor: colorPalette,
                borderColor: colorPalette.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            if (['spend', 'cpc'].includes(metric)) {
                                return 'R$ ' + value.toFixed(2);
                            } else if (metric === 'ctr') {
                                return value.toFixed(2) + '%';
                            } else {
                                return value;
                            }
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            const val = context.parsed.x;
                            if (label) label += ': ';
                            if (['spend', 'cpc'].includes(metric)) {
                                return label + 'R$ ' + val.toFixed(2);
                            } else if (metric === 'ctr') {
                                return label + val.toFixed(2) + '%';
                            } else {
                                return label + val.toLocaleString();
                            }
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}


// ==========================
//  DASHBOARD CHARTS
// ==========================
function renderCampaignPerformanceChart(data) {
    const ctx = document.getElementById('campaignPerformanceChart').getContext('2d');
    const campaigns = data.map((item, index) => getCampaignName(item, index));
    const clicks = data.map(item => parseInt(item.clicks || 0));
    const impressions = data.map(item => parseInt(item.impressions || 0));
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: campaigns,
            datasets: [
                {
                    label: 'Cliques',
                    data: clicks,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Impressões (÷100)',
                    data: impressions.map(value => value / 100),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.dataset.label.includes('Impressões')) {
                                return label + (context.parsed.y * 100).toLocaleString();
                            } else {
                                return label + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        }
    });
}

function renderSpendDistributionChart(data) {
    const ctx = document.getElementById('spendDistributionChart').getContext('2d');
    const campaigns = data.map((item, index) => getCampaignName(item, index));
    const spends = data.map(item => parseFloat(item.spend || 0));
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: campaigns,
            datasets: [{
                data: spends,
                backgroundColor: colorPalette,
                borderColor: colorPalette.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ==========================
//  GENERATE PDF
// ==========================
function generatePDF() {
    const modal = document.getElementById('pdfModal');
    modal.classList.remove('hidden');

    const spinner = document.getElementById('modalSpinner');
    const confirmBtn = document.getElementById('confirmPdfBtn');
    const cancelBtn = document.getElementById('cancelPdfBtn');

    // Botão "Não"
    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
        generateFinalPDF(); // Gera o PDF direto sem IA
    };

    // Botão "Sim"
    confirmBtn.onclick = () => {
        // Mostrar loading
        spinner.classList.remove('hidden');
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;

        fetch("https://n8nultraintelligentv3webhook.ultraintelligentv3.com/webhook/gerarRelatorioPDF", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultados: reportData })
        })
            .then(response => {
                console.log("[IA] Resposta bruta do webhook:", response);
                if (!response.ok) throw new Error("Erro ao chamar o agente de IA");
                return response.json();
            })
            .then(data => {
                console.log("[IA] JSON recebido:", data);
                const textoAnalise = data.output;
                console.log("[IA] Texto final para incluir no PDF:", textoAnalise);
                generateFinalPDF(textoAnalise);
            })
            .catch(error => {
                console.error("[IA] Erro ao gerar análise inteligente:", error);
                alert("Erro ao gerar análise inteligente. O PDF será gerado sem a análise.");
                generateFinalPDF(); // Gera mesmo assim
            })
            .finally(() => {
                // Ocultar loading e fechar modal
                spinner.classList.add('hidden');
                confirmBtn.disabled = false;
                cancelBtn.disabled = false;
                modal.classList.add('hidden');
            });
    };
}


async function generateFinalPDF(analiseIA = "") {
    const { jsPDF } = window.jspdf;
    const reportEl = document.getElementById('reportResults');
    document.body.classList.add('pdf-generating');

    await new Promise(resolve => setTimeout(resolve, 1000));
    window.scrollTo(0, 0);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const padding = 10;
    let yOffset = padding + 10; // espaço reservado para cabeçalho
    let pageNumber = 1;
    let isFirstPage = true;

    function drawHeader() {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text("Relatório De Métricas Das Campanhas - Reinado de NETSAR", padding, 10);
    }

    function drawFooter() {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.text(`Relatório Meta Ads - Página ${pageNumber}`, pageWidth - padding - 50, pageHeight - 5);
    }

    // Coleta todos os blocos filhos + charts internos
    const children = [];
    reportEl.childNodes.forEach(node => {
        if (node.nodeType === 1) {
            const chartContainers = node.querySelectorAll('.chart-container');
            if (chartContainers.length > 0) {
                chartContainers.forEach(c => children.push(c));
            } else {
                children.push(node);
            }
        }
    });

    drawHeader(); // desenha cabeçalho na primeira página

    for (let i = 0; i < children.length; i++) {
        const block = children[i];
        const style = getComputedStyle(block);
        if (style.display === 'none' || style.visibility === 'hidden' || block.offsetHeight === 0) continue;

        const canvas = block.querySelector('canvas');
        let imgData;

        if (canvas && Chart.getChart(canvas.id)) {
            try {
                const chart = Chart.getChart(canvas.id);
                imgData = chart.toBase64Image();

                const titleEl = block.querySelector('h3');
                const chartTitle = titleEl ? titleEl.innerText : '';

                const imgProps = pdf.getImageProperties(imgData);
                const imgWidth = pageWidth - padding * 2;
                let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                // 📏 Achata apenas os gráficos da primeira página
                if (isFirstPage) {
                    imgHeight *= 0.85;
                }

                const needsPageBreak = yOffset + imgHeight + 10 > (pageHeight - 20);
                if (needsPageBreak && !isFirstPage) {
                    drawFooter();
                    pdf.addPage();
                    pageNumber++;
                    drawHeader();
                    yOffset = padding + 10;
                } else if (isFirstPage) {
                    isFirstPage = false;
                }

                if (chartTitle) {
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(14);
                    pdf.text(chartTitle, padding, yOffset);
                    yOffset += 8;
                }

                pdf.addImage(imgData, 'PNG', padding, yOffset, imgWidth, imgHeight);
                yOffset += imgHeight + 12;
                continue;

            } catch (e) {
                console.warn(`[PDF] Erro ao capturar gráfico ${canvas.id}, fallback para html2canvas`);
            }
        }

        try {
            const blockCanvas = await html2canvas(block, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                scrollY: -window.scrollY
            });

            imgData = blockCanvas.toDataURL('image/png');

            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pageWidth - padding * 2;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            const maxAvailableHeight = pageHeight - padding - 30;
            if (yOffset + imgHeight > maxAvailableHeight) {
                drawFooter();
                pdf.addPage();
                pageNumber++;
                drawHeader();
                yOffset = padding + 10;
                isFirstPage = false;
            }

            pdf.addImage(imgData, 'PNG', padding, yOffset, imgWidth, imgHeight);
            yOffset += imgHeight + 12;

        } catch (err) {
            console.error(`[PDF] Erro ao processar bloco ${i}:`, err);
            continue;
        }
    }

    if (analiseIA) {
        if (yOffset + 50 > pageHeight - padding - 10) {
            drawFooter();
            pdf.addPage();
            pageNumber++;
            drawHeader();
            yOffset = padding + 10;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.text("Análise Inteligente por IA", padding, yOffset);
        yOffset += 10;

        pdf.setDrawColor(200);
        pdf.line(padding, yOffset, pageWidth - padding, yOffset);
        yOffset += 5;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        const lines = pdf.splitTextToSize(analiseIA, pageWidth - padding * 2);

        for (let i = 0; i < lines.length; i++) {
            if (yOffset > pageHeight - 20) {
                drawFooter();
                pdf.addPage();
                pageNumber++;
                drawHeader();
                yOffset = padding + 10;
            }
            pdf.text(lines[i], padding, yOffset);
            yOffset += 7;
        }
    }

    drawFooter();
    pdf.save('relatorio-meta-ads.pdf');
    document.body.classList.remove('pdf-generating');
}








// ==========================
//  HELPER FUNCTIONS
// ==========================
function calculateSummaryMetrics(data) {
    if (!data || !Array.isArray(data)) {
        console.warn('calculateSummaryMetrics: received non-array data:', data);
        return { totalSpend: 0, totalClicks: 0, totalImpressions: 0, avgCTR: 0 };
    }
    const totalSpend = data.reduce((acc, curr) => acc + (parseFloat(curr.spend) || 0), 0);
    const totalClicks = data.reduce((acc, curr) => acc + (parseInt(curr.clicks) || 0), 0);
    const totalImpressions = data.reduce((acc, curr) => acc + (parseInt(curr.impressions) || 0), 0);
    let avgCTR = 0;
    if (totalImpressions > 0) { avgCTR = (totalClicks / totalImpressions) * 100; }
    return { totalSpend, totalClicks, totalImpressions, avgCTR };
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getStatusClass(campaign) {
    const isActive = new Date(campaign.date_stop) >= new Date();
    return !isActive ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800';
}

function getStatusText(campaign) {
    const isActive = new Date(campaign.date_stop) >= new Date();
    return !isActive ? 'Finalizada' : 'Ativa';
}

function getCampaignName(campaign, index) {
    if (campaign.campaign_name) return campaign.campaign_name;
    if (campaign.date_start && campaign.date_stop) {
        return `Campanha ${formatDate(campaign.date_start)} - ${formatDate(campaign.date_stop)}`;
    }
    return `Campanha ${index + 1}`;
}
