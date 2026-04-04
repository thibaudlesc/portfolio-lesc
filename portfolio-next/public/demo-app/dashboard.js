// dashboard.js

import { db, doc, getDoc, setDoc, updateDoc, writeBatch } from './firebase-config.js';
import { getOwnFieldsData, showToast, openModal, closeModal, showConfirmationModal, displayAddFieldPage, navigateToPage, calculateTotals } from './harvest.js';
// L'action d'ajout de vente redirigera vers la page des ventes.
import { getSalesData } from './sales.js';
import { fetchAllAvailableCommodities } from './api.js';

// --- Global State ---
let currentUser = null;
let chartInstances = {};
let sortableInstance = null;
let isPersonalizationMode = false;
let userDashboardLayout = null;
let weatherData = null;

// harvest.js

// REMPLACEZ VOTRE ANCIEN OBJET CROP_DATA PAR CELUI-CI :
const CROP_DATA = {
    'blé hiver': { density: 80, coeff: 0.95, marketPrice: 210 },
    'blé printemps': { density: 78, coeff: 0.95, marketPrice: 210 },
    'froment': { density: 80, coeff: 0.95, marketPrice: 210 },
    'orge hiver': { density: 65, coeff: 0.92, marketPrice: 190 },
    'orge printemps': { density: 62, coeff: 0.92, marketPrice: 190 },
    'maïs': { density: 75, coeff: 0.85, marketPrice: 180 },
    'colza': { density: 66, coeff: 0.98, marketPrice: 420 },
    'tournesol': { density: 45, coeff: 0.80, marketPrice: 400 },
    'foin': { density: 8, coeff: 1.0, marketPrice: 100 },
    // --- DÉBUT DE LA CORRECTION DÉFINITIVE POUR LE LIN ---
    'lin': { 
        density: 15, 
        coeff: 1.0, 
        isFiberCrop: true, // L'indicateur clé
        fiberYieldPercent: 20, // Pourcentage de filasse
        fiberPricePerKg: 3.50 // Prix au kg
    },
    'lin hiver': { 
        density: 15, 
        coeff: 1.0, 
        isFiberCrop: true,
        fiberYieldPercent: 20,
        fiberPricePerKg: 3.50 
    },
    'lin printemps': { 
        density: 15, 
        coeff: 1.0, 
        isFiberCrop: true,
        fiberYieldPercent: 20,
        fiberPricePerKg: 3.50 
    },
    // --- FIN DE LA CORRECTION DÉFINITIVE POUR LE LIN ---
    'féverole': { density: 80, coeff: 0.88, marketPrice: 250 },
    'pois': { density: 80, coeff: 0.90, marketPrice: 250 },
    'avoine': { density: 55, coeff: 0.82, marketPrice: 200 }
};

// --- Widget Configuration ---
// Le widget marketPrices a été supprimé
// ▼▼▼ MODIFICATION : Remplacement du widget 'expenses' par 'cropFinancialSummary' ▼▼▼
const ALL_WIDGETS = {
    kpis: { id: 'kpis', title: "Indicateurs Clés", defaultSize: 'lg:col-span-3', sizes: ['lg:col-span-3'], render: renderKpisWidget, preview: 'https://i.imgur.com/8z9Z2aD.png' },
    stockPie: { id: 'stockPie', title: "Répartition du Stock", defaultSize: 'lg:col-span-1', sizes: ['lg:col-span-1', 'lg:col-span-2'], render: renderChartWidget, preview: 'https://i.imgur.com/gaaG3tM.png' },
    revenueCostChart: { id: 'revenueCostChart', title: "Chiffre d'Affaires vs Coûts", defaultSize: 'lg:col-span-2', sizes: ['lg:col-span-2', 'lg:col-span-3'], render: renderChartWidget, preview: 'https://i.imgur.com/s1g7jJk.png' },
    performanceTable: { id: 'performanceTable', title: "Performance par Culture", defaultSize: 'lg:col-span-3', sizes: ['lg:col-span-3'], render: renderPerformanceTableWidget, preview: 'https://i.imgur.com/O1w4q1e.png' },
    weather: { id: 'weather', title: "Météo", defaultSize: 'lg:col-span-1', sizes: ['lg:col-span-1', 'lg:col-span-2'], render: renderWeatherWidget, preview: 'https://i.imgur.com/4a1e1tS.png' },
    quickActions: { id: 'quickActions', title: "Actions Rapides", defaultSize: 'lg:col-span-2', sizes: ['lg:col-span-2', 'lg:col-span-3'], render: renderQuickActionsWidget, preview: 'https://i.imgur.com/bQ9d8f3.png' }
};
// ▲▲▲ FIN DE LA MODIFICATION ▲▲▲

const DEFAULT_LAYOUT = {
    // ▼▼▼ MODIFICATION : 'expenses' remplacé par 'cropFinancialSummary' ▼▼▼
    visible: ['kpis', 'stockPie', 'revenueCostChart', 'performanceTable'],
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲
    widgetConfigs: {}
};

export function initDashboard(user) {
    currentUser = user;
}

async function loadDashboardLayout() {
    if (userDashboardLayout) return userDashboardLayout;
    try {
        const layoutDocRef = doc(db, 'users', currentUser.uid, 'config', 'dashboardLayout');
        const docSnap = await getDoc(layoutDocRef);
        if (docSnap.exists()) {
            userDashboardLayout = docSnap.data();
            if (!userDashboardLayout.widgetConfigs) userDashboardLayout.widgetConfigs = {};
            return userDashboardLayout;
        } else {
            await saveDashboardLayout(DEFAULT_LAYOUT);
            userDashboardLayout = DEFAULT_LAYOUT;
            return DEFAULT_LAYOUT;
        }
    } catch (error) {
        console.error("Erreur de chargement de la disposition:", error);
        return DEFAULT_LAYOUT;
    }
}

async function saveDashboardLayout(layout) {
    try {
        const layoutDocRef = doc(db, 'users', currentUser.uid, 'config', 'dashboardLayout');
        await setDoc(layoutDocRef, layout, { merge: true });
        userDashboardLayout = layout;
    } catch (error) {
        console.error("Erreur de sauvegarde de la disposition:", error);
        showToast("La sauvegarde de la disposition a échoué.");
    }
}

export async function displayDashboard() {
    if (!currentUser) return;
    const dashboardContainer = document.getElementById('page-dashboard');
    if (!dashboardContainer) return;

    // ▼▼▼ NOUVELLE STRUCTURE INJECTÉE ▼▼▼
    dashboardContainer.innerHTML = `
        <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <header class="flex justify-between items-center pb-4 border-b border-slate-200">
                <h1 class="text-3xl font-bold text-slate-800">Tableau de Bord</h1>
                <div class="flex items-center gap-2">
                     <button id="dashboard-prev-year-btn" class="p-2 rounded-full hover:bg-slate-200 transition"><i data-lucide="chevron-left"></i></button>
                     <span id="dashboard-current-year" class="text-xl font-bold text-slate-800 w-24 text-center"></span>
                     <button id="dashboard-next-year-btn" class="p-2 rounded-full hover:bg-slate-200 transition"><i data-lucide="chevron-right"></i></button>
                     <div class="hidden lg:flex items-center">
                        <div class="border-l h-6 mx-2"></div>
                        <button id="personalize-dashboard-btn" class="p-2 rounded-lg hover:bg-slate-200 transition" aria-label="Personnaliser"><i data-lucide="layout-template"></i></button>
                     </div>
                </div>
            </header>
            <div id="dashboard-grid" class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6"></div>
        </div>
    `;
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲
    
    lucide.createIcons();
    
    let currentDashboardYear = new Date().getFullYear();
    const yearDisplay = document.getElementById('dashboard-current-year');

    const updateDashboardForYear = async () => {
        yearDisplay.textContent = currentDashboardYear;
        await renderCustomDashboard(currentDashboardYear);
    };
    
    document.getElementById('personalize-dashboard-btn')?.addEventListener('click', togglePersonalizationMode);
    document.getElementById('dashboard-prev-year-btn').addEventListener('click', () => { currentDashboardYear--; updateDashboardForYear(); });
    document.getElementById('dashboard-next-year-btn').addEventListener('click', () => { currentDashboardYear++; updateDashboardForYear(); });

    await updateDashboardForYear();
}

async function renderCustomDashboard(year) {
    const layout = await loadDashboardLayout();
    const grid = document.getElementById('dashboard-grid');
    grid.innerHTML = '';

    layout.visible.forEach(widgetId => {
        const widgetConfig = ALL_WIDGETS[widgetId];
        if (widgetConfig) {
            const widgetElement = widgetConfig.render(widgetConfig, layout);
            grid.appendChild(widgetElement);
        }
    });
    
    lucide.createIcons();
    await renderDashboardData(year);
}

function createWidgetBase(config, layout) {
    const widget = document.createElement('div');
    const widgetSize = layout.widgetConfigs[config.id]?.size || config.defaultSize;
    
    widget.id = `widget-${config.id}`;
    widget.dataset.widgetId = config.id;
    widget.className = `dashboard-widget bg-white p-4 rounded-xl shadow-sm border relative ${widgetSize}`;
    
    widget.innerHTML = `
        <div class="personalize-overlay hidden absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none z-10">
            <span class="personalize-overlay-text">${config.title}</span>
        </div>
        <div class="personalize-controls hidden absolute top-2 right-2 flex items-center gap-1 z-20">
            <button class="resize-widget-btn p-1.5 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300" title="Redimensionner"><i data-lucide="move-horizontal" class="w-4 h-4 pointer-events-none"></i></button>
            <button class="remove-widget-btn p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200" title="Supprimer"><i data-lucide="x" class="w-4 h-4 pointer-events-none"></i></button>
            <button class="drag-handle p-1.5 bg-slate-200 text-slate-600 rounded-full cursor-move" title="Déplacer"><i data-lucide="grip-vertical" class="w-4 h-4 pointer-events-none"></i></button>
        </div>
    `;
    return widget;
}

function renderKpisWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    widget.classList.remove('p-4');
    
    // Nouvelle structure HTML pour séparer le chiffre et l'unité
    widget.innerHTML += `
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
            <div class="kpi-card">
                <h3 class="kpi-title">Récolte Totale</h3>
                <div class="kpi-value-container">
                    <p id="kpi-total-harvest" class="kpi-value text-green-600">...</p>
                    <span id="kpi-total-harvest-unit" class="kpi-unit text-green-700">T</span>
                </div>
            </div>
            <div class="kpi-card">
                <h3 class="kpi-title">Surface Cultivée</h3>
                <div class="kpi-value-container">
                    <p id="kpi-total-area" class="kpi-value text-blue-600">...</p>
                    <span id="kpi-total-area-unit" class="kpi-unit text-blue-700">ha</span>
                </div>
            </div>
            <div class="kpi-card">
                <h3 class="kpi-title">Chiffre d'Affaires</h3>
                <div class="kpi-value-container">
                    <p id="kpi-total-revenue" class="kpi-value text-purple-600">...</p>
                    <span id="kpi-total-revenue-unit" class="kpi-unit text-purple-700">€</span>
                </div>
            </div>
            <div class="kpi-card">
                <h3 class="kpi-title">Marge Brute</h3>
                <div class="kpi-value-container">
                    <p id="kpi-total-margin" class="kpi-value text-orange-600">...</p>
                    <span id="kpi-total-margin-unit" class="kpi-unit text-orange-700">€</span>
                </div>
            </div>
            <div class="kpi-card col-span-2 sm:col-span-1">
                <h3 class="kpi-title">Valeur du Stock</h3>
                <div class="kpi-value-container">
                    <p id="kpi-stock-value" class="kpi-value text-yellow-600">...</p>
                    <span id="kpi-stock-value-unit" class="kpi-unit text-yellow-700">€</span>
                </div>
            </div>
        </div>
    `;
    return widget;
}

function renderChartWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    widget.innerHTML += `
        <h3 class="text-lg font-semibold mb-4 text-center">${config.title}</h3>
        <div class="relative h-64 md:h-80 lg:h-96">
            <canvas id="${config.id}"></canvas>
        </div>
    `;
    return widget;
}


function renderPerformanceTableWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    widget.innerHTML += `
        <div class="flex flex-col h-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">${config.title}</h3>
                <div class="flex bg-slate-100 p-1 rounded-lg text-sm font-semibold">
                    <button class="performance-tab-btn active px-4 py-1.5 rounded-md" data-view="crop">Par Culture</button>
                    <button class="performance-tab-btn px-4 py-1.5 rounded-md" data-view="field">Par Parcelle</button>
                </div>
            </div>
            <div id="performance-table-container" class="overflow-x-auto flex-grow horizontal-scroll-container">
                <!-- Le contenu du tableau sera injecté ici -->
            </div>
        </div>
        <style>
            .performance-tab-btn { color: #475569; }
            .performance-tab-btn.active { background-color: white; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        </style>
    `;

    const tabs = widget.querySelectorAll('.performance-tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const yearEl = document.getElementById('dashboard-current-year');
            const year = yearEl ? parseInt(yearEl.textContent, 10) : new Date().getFullYear();
            renderDashboardData(year); 
        });
    });

    return widget;
}

function renderWeatherWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    widget.innerHTML += `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">${config.title}</h3>
            <button id="refresh-weather-btn" class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
        </div>
        <div id="weather-widget-content"><p class="text-center text-slate-500">Chargement...</p></div>
    `;
    return widget;
}

function renderQuickActionsWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    const year = document.getElementById('dashboard-current-year')?.textContent || new Date().getFullYear();
    widget.innerHTML += `
        <h3 class="text-lg font-semibold mb-4">${config.title}</h3>
        <div id="quick-actions-content" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button data-action="add-field" class="quick-action-btn"><i data-lucide="wheat"></i><span>Parcelle</span></button>
            <button data-action="add-sale" class="quick-action-btn"><i data-lucide="dollar-sign"></i><span>Vente</span></button>
            <button data-action="add-expense" class="quick-action-btn" data-year="${year}"><i data-lucide="receipt"></i><span>Dépense</span></button>
        </div>
    `;
    return widget;
}

function renderYearlySummaryWidget(config, layout) {
    const widget = createWidgetBase(config, layout);
    widget.innerHTML += `
        <h3 class="text-lg font-semibold mb-4">${config.title}</h3>
        <div id="yearly-summary-content"><p class="text-center text-slate-500">Calcul en cours...</p></div>
    `;
    return widget;
}

function getSuggestedCropData(cropName) {
    const defaults = { density: 75, coeff: 0.90, marketPrice: 200 };
    if (!cropName) return defaults;
    const name = cropName.toLowerCase();
    for (const key in CROP_DATA) {
        if (name.includes(key)) {
            return CROP_DATA[key];
        }
    }
    return defaults;
}

async function renderDashboardData(year) {
    const allFields = Object.values(getOwnFieldsData());
    const salesData = await getSalesData();
    const fieldsThisYear = allFields.filter(f => f.year === year);
    const salesThisYear = Object.values(salesData).flatMap(cropData => cropData.sales).filter(sale => sale.harvestYear === year);

    const performanceByCrop = {};
    let totalProductionCosts = 0;
    let totalCultivatedArea = 0;

    fieldsThisYear.forEach(field => {
        const crop = field.crop || 'Inconnue';
        if (!performanceByCrop[crop]) {
            performanceByCrop[crop] = { harvestedWeight: 0, area: 0, cost: 0, soldWeight: 0, revenue: 0, expensesByType: {} };
        }
        const { grainTotals } = calculateTotals(field);
        performanceByCrop[crop].harvestedWeight += grainTotals.totalWeight;
        performanceByCrop[crop].area += field.size || 0;
        
        // Agréger les dépenses par type et le coût total
        let fieldTotalCost = 0;
        (field.expenses || []).forEach(exp => {
            const type = exp.type || 'Autre';
            const amount = exp.amount || 0;
            let costForField = 0;
            if (exp.unit === 'per_ha') {
                costForField = amount * (field.size || 0);
            } else { // 'total'
                // Si la dépense est globale (partagée), on ne la compte qu'une fois par parcelle
                costForField = exp.id ? 0 : amount; 
            }
             fieldTotalCost += costForField;
             performanceByCrop[crop].expensesByType[type] = (performanceByCrop[crop].expensesByType[type] || 0) + costForField;
        });

        // Ajouter les dépenses globales (une seule fois par culture)
        const uniqueGlobalExpenses = new Map();
        (field.expenses || []).filter(e => e.id).forEach(e => uniqueGlobalExpenses.set(e.id, e));
        
        uniqueGlobalExpenses.forEach(exp => {
             const costForField = exp.unit === 'per_ha' ? (exp.amount || 0) * (field.size || 0) : (exp.amount || 0);
             fieldTotalCost += costForField;
             performanceByCrop[crop].expensesByType[exp.type] = (performanceByCrop[crop].expensesByType[exp.type] || 0) + costForField;
        });
        
        performanceByCrop[crop].cost += fieldTotalCost;
        totalProductionCosts += fieldTotalCost;
        totalCultivatedArea += field.size || 0;
    });
    
    // Correction pour ne compter qu'une fois les dépenses globales
    const globalExpensesByCrop = {};
    fieldsThisYear.forEach(field => {
        (field.expenses || []).forEach(exp => {
            if (exp.id) { // C'est une dépense globale
                if (!globalExpensesByCrop[field.crop]) globalExpensesByCrop[field.crop] = new Map();
                if (!globalExpensesByCrop[field.crop].has(exp.id)) {
                    const cost = exp.unit === 'total' ? exp.amount : exp.amount * (performanceByCrop[field.crop]?.area || 0);
                    globalExpensesByCrop[field.crop].set(exp.id, {cost: cost, type: exp.type});
                }
            }
        });
    });

    for (const crop in performanceByCrop) {
        performanceByCrop[crop].cost = 0;
        performanceByCrop[crop].expensesByType = {};
        fieldsThisYear.filter(f => f.crop === crop).forEach(field => {
            (field.expenses || []).filter(e => !e.id).forEach(localExp => {
                 const cost = localExp.unit === 'per_ha' ? localExp.amount * field.size : localExp.amount;
                 performanceByCrop[crop].cost += cost;
                 performanceByCrop[crop].expensesByType[localExp.type] = (performanceByCrop[crop].expensesByType[localExp.type] || 0) + cost;
            });
        });
        if (globalExpensesByCrop[crop]) {
            globalExpensesByCrop[crop].forEach((expData) => {
                performanceByCrop[crop].cost += expData.cost;
                performanceByCrop[crop].expensesByType[expData.type] = (performanceByCrop[crop].expensesByType[expData.type] || 0) + expData.cost;
            });
        }
    }


    salesThisYear.forEach(sale => {
        const crop = sale.crop;
        if (!performanceByCrop[crop]) performanceByCrop[crop] = { harvestedWeight: 0, area: 0, cost: 0, soldWeight: 0, revenue: 0, expensesByType: {} };
        performanceByCrop[crop].soldWeight += sale.quantityKg || 0;
        performanceByCrop[crop].revenue += (sale.quantityKg / 1000) * (sale.pricePerTonne || 0);
    });
    
    for (const crop in performanceByCrop) {
        const d = performanceByCrop[crop];
        const cropData = getSuggestedCropData(crop);

        const remainingStockKg = d.harvestedWeight - d.soldWeight;
        let remainingStockValue = 0;
        if (remainingStockKg > 0) {
            if (cropData.isFiberCrop) {
                const fiberWeightKg = remainingStockKg * (cropData.fiberYieldPercent / 100);
                remainingStockValue = fiberWeightKg * cropData.fiberPricePerKg;
            } else {
                remainingStockValue = (remainingStockKg / 1000) * (cropData.marketPrice || 0);
            }
        }
        const totalEstimatedRevenue = d.revenue + remainingStockValue;

        d.totalCostPerHa = d.area > 0 ? d.cost / d.area : 0;
        d.totalRevenuePerHa = d.area > 0 ? totalEstimatedRevenue / d.area : 0;
        d.marginPerHa = d.totalRevenuePerHa - d.totalCostPerHa;

        d.expensesByTypePerHa = {};
        for (const type in d.expensesByType) {
            d.expensesByTypePerHa[type] = d.area > 0 ? d.expensesByType[type] / d.area : 0;
        }
    }

    const totalHarvestedWeight = Object.values(performanceByCrop).reduce((sum, val) => sum + val.harvestedWeight, 0);
    const totalRealRevenue = Object.values(performanceByCrop).reduce((sum, val) => sum + val.revenue, 0);
    const totalRealMargin = totalRealRevenue - Object.values(performanceByCrop).reduce((sum, val) => sum + val.cost, 0);
    
    let totalStockValue = 0;
    const stockForChart = {};

    for(const crop in performanceByCrop) {
        const d = performanceByCrop[crop];
        const remainingStockKg = d.harvestedWeight - d.soldWeight;

        if (remainingStockKg > 0) {
            stockForChart[crop] = remainingStockKg;
            const cropData = getSuggestedCropData(crop);
            let valueForThisCrop = 0;
            
            if (cropData.isFiberCrop) {
                const fiberWeightKg = remainingStockKg * (cropData.fiberYieldPercent / 100);
                valueForThisCrop = fiberWeightKg * cropData.fiberPricePerKg;
            } else {
                const remainingStockTonne = remainingStockKg / 1000;
                valueForThisCrop = remainingStockTonne * (cropData.marketPrice || 0);
            }
            totalStockValue += valueForThisCrop;
        }
    }

    const kpiTotalHarvest = document.getElementById('kpi-total-harvest');
    if (kpiTotalHarvest) kpiTotalHarvest.textContent = (totalHarvestedWeight / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2});
    
    const kpiTotalArea = document.getElementById('kpi-total-area');
    if (kpiTotalArea) kpiTotalArea.textContent = totalCultivatedArea.toLocaleString('fr-FR', {maximumFractionDigits: 2});

    const kpiTotalRevenue = document.getElementById('kpi-total-revenue');
    if (kpiTotalRevenue) kpiTotalRevenue.textContent = totalRealRevenue.toLocaleString('fr-FR', {maximumFractionDigits: 2});
    
    const kpiTotalMargin = document.getElementById('kpi-total-margin');
    if(kpiTotalMargin) kpiTotalMargin.textContent = totalRealMargin.toLocaleString('fr-FR', {maximumFractionDigits: 2});

    const kpiStockValue = document.getElementById('kpi-stock-value');
    if(kpiStockValue) kpiStockValue.textContent = totalStockValue.toLocaleString('fr-FR', {maximumFractionDigits: 2});

    if (document.getElementById('stockPie')) createStockPieChart(stockForChart);
    if (document.getElementById('revenueCostChart')) createRevenueCostChart(performanceByCrop);
    
    const performanceWidget = document.getElementById('widget-performanceTable');
    if (performanceWidget) {
        const activeTab = performanceWidget.querySelector('.performance-tab-btn.active');
        const view = activeTab ? activeTab.dataset.view : 'crop';

        if (view === 'field') {
            const sortedFields = fieldsThisYear.sort((a, b) => a.name.localeCompare(b.name));
            renderPerformanceTableByField(sortedFields, salesThisYear);
        } else {
            renderPerformanceTableByCrop(performanceByCrop);
        }
    }
    
    const summaryContainer = document.getElementById('crop-financial-summary-container');
    if (summaryContainer) {
        const crops = Object.keys(performanceByCrop).sort();
        if (crops.length === 0) {
            summaryContainer.innerHTML = '<p class="text-slate-500 col-span-full text-center py-4">Aucune culture avec des données financières pour cette année.</p>';
        } else {
            summaryContainer.innerHTML = crops.map(crop => {
                const data = performanceByCrop[crop];
                const sortedExpenseTypes = Object.keys(data.expensesByTypePerHa).sort();

                const expenseRows = sortedExpenseTypes.map(type => `
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-600">${type}</span>
                        <span class="font-medium text-slate-700">${data.expensesByTypePerHa[type].toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</span>
                    </div>
                `).join('');

                const marginColor = data.marginPerHa >= 0 ? 'text-green-600' : 'text-red-600';

                return `
                    <div class="crop-summary-card bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 flex flex-col cursor-pointer hover:shadow-md hover:border-blue-400 transition" data-crop="${crop}">
                        <div class="text-center pb-2 border-b">
                            <h4 class="font-bold text-lg text-slate-800">${crop}</h4>
                            <p class="font-semibold text-slate-600">${data.totalCostPerHa.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €/ha</p>
                        </div>
                        <div class="space-y-1 flex-grow">
                            ${expenseRows || '<p class="text-sm text-slate-400 text-center py-2">Aucune dépense</p>'}
                        </div>
                        <div class="flex justify-between font-bold pt-2 border-t mt-auto">
                            <span>Marge/ha</span>
                            <span class="${marginColor}">${data.marginPerHa.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        const newSummaryContainer = summaryContainer.cloneNode(true);
        summaryContainer.parentNode.replaceChild(newSummaryContainer, summaryContainer);

        newSummaryContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.crop-summary-card');
            if (card) {
                const cropName = card.dataset.crop;
                const yearEl = document.getElementById('dashboard-current-year');
                const year = yearEl ? parseInt(yearEl.textContent, 10) : new Date().getFullYear();
                showCropFinancialDetailsModal(cropName, year);
            }
        });
    }
    
    if (document.getElementById('weather-widget-content')) await fetchAndRenderWeather();
    if (document.getElementById('quick-actions-content')) setupQuickActions(year);
    if (document.getElementById('yearly-summary-content')) renderYearlySummaryContent(year, totalCultivatedArea, totalHarvestedWeight, totalRealMargin);
}

async function showCropFinancialDetailsModal(cropName, year) {
    const allFields = Object.values(getOwnFieldsData());
    const salesData = await getSalesData();

    // 1. Filtrer les données pour la culture et l'année spécifiques
    const fieldsForCrop = allFields.filter(f => f.year === year && f.crop === cropName);
    const salesForCrop = (salesData[cropName]?.sales || []).filter(s => s.harvestYear === year);

    if (fieldsForCrop.length === 0) {
        showToast("Aucune donnée de parcelle pour cette culture.");
        return;
    }

    // 2. Agréger les données
    let totalArea = 0;
    let totalHarvestedWeight = 0;
    const uniqueExpensesMap = new Map();

    fieldsForCrop.forEach(field => {
        totalArea += field.size || 0;
        const { grainTotals } = calculateTotals(field);
        totalHarvestedWeight += grainTotals.totalWeight;
        
        (field.expenses || []).forEach(exp => {
            // On ne garde que les dépenses globales (avec un ID) car les dépenses locales n'ont pas de sens ici
            if (exp.id && !uniqueExpensesMap.has(exp.id)) {
                uniqueExpensesMap.set(exp.id, exp);
            }
        });
    });

    const uniqueExpenses = Array.from(uniqueExpensesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalCost = uniqueExpenses.reduce((sum, exp) => {
        const cost = exp.unit === 'per_ha' ? (exp.amount || 0) * totalArea : (exp.amount || 0);
        return sum + cost;
    }, 0);

    // 3. Calculer les métriques financières
    const soldWeight = salesForCrop.reduce((sum, sale) => sum + (sale.quantityKg || 0), 0);
    const realRevenue = salesForCrop.reduce((sum, sale) => sum + ((sale.quantityKg / 1000) * (sale.pricePerTonne || 0)), 0);
    
    const remainingStockKg = totalHarvestedWeight - soldWeight;
    const cropData = getSuggestedCropData(cropName);
    let estimatedStockValue = 0;
    if (remainingStockKg > 0) {
        estimatedStockValue = (remainingStockKg / 1000) * (cropData.marketPrice || 0);
    }
    
    const totalRevenue = realRevenue + estimatedStockValue;
    const totalMargin = totalRevenue - totalCost;
    const marginPerHa = totalArea > 0 ? totalMargin / totalArea : 0;

    // 4. Construire le HTML de la modale
    const expensesListHTML = uniqueExpenses.length > 0 ? uniqueExpenses.map(exp => {
        const expenseDataString = JSON.stringify(exp);
        const unitText = exp.unit === 'per_ha' ? '/ha' : ' (Total)';
        return `
            <div class="flex items-center justify-between p-2.5 border-b border-slate-100 last:border-b-0">
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-slate-800 truncate">${exp.type}</p>
                    <p class="text-xs text-slate-500">${new Date(exp.date).toLocaleDateString('fr-FR')} - ${exp.description || 'Pas de description'}</p>
                </div>
                <div class="text-right flex-shrink-0 ml-4">
                    <p class="font-semibold text-slate-900">${exp.amount.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}${unitText}</p>
                </div>
                <div class="ml-2 flex-shrink-0">
                    <button class="edit-expense-btn p-2 text-slate-400 hover:text-blue-600 rounded-full" data-expense='${expenseDataString}'><i data-lucide="pencil" class="w-4 h-4 pointer-events-none"></i></button>
                    <button class="delete-expense-btn p-2 text-slate-400 hover:text-red-600 rounded-full" data-expense='${expenseDataString}'><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button>
                </div>
            </div>
        `;
    }).join('') : '<p class="text-sm text-slate-500 text-center py-4">Aucune dépense enregistrée pour cette culture.</p>';

    const marginColor = marginPerHa >= 0 ? 'text-green-600' : 'text-red-600';
    
    const content = `
        <h3 class="text-2xl font-bold mb-1 text-center">${cropName}</h3>
        <p class="text-center text-slate-500 mb-6">Synthèse financière pour la récolte ${year}</p>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-50 p-3 rounded-lg text-center border">
                <h4 class="text-xs font-medium text-slate-500">Surface</h4>
                <p class="text-lg font-bold">${totalArea.toLocaleString('fr-FR')} ha</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg text-center border">
                <h4 class="text-xs font-medium text-slate-500">Coût Total</h4>
                <p class="text-lg font-bold">${totalCost.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</p>
            </div>
             <div class="bg-slate-50 p-3 rounded-lg text-center border">
                <h4 class="text-xs font-medium text-slate-500">Marge Totale</h4>
                <p class="text-lg font-bold ${marginColor}">${totalMargin.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</p>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg text-center border">
                <h4 class="text-xs font-medium text-slate-500">Marge / ha</h4>
                <p class="text-lg font-bold ${marginColor}">${marginPerHa.toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}</p>
            </div>
        </div>

        <div class="border-t pt-4">
            <div class="flex justify-between items-center mb-2">
                 <h4 class="text-lg font-semibold">Détail des Dépenses</h4>
                 <button id="add-expense-from-modal-btn" class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-200">Ajouter</button>
            </div>
            <div id="modal-expenses-list" class="max-h-64 overflow-y-auto bg-white rounded-lg border">
                ${expensesListHTML}
            </div>
        </div>

        <button id="modal-close-btn" class="mt-6 w-full py-2.5 bg-slate-200 rounded-lg font-semibold">Fermer</button>
    `;

    openModal(content);
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        modalContent.classList.remove('max-w-lg');
        modalContent.classList.add('max-w-3xl');
    }

    // 5. Attacher les écouteurs d'événements à l'intérieur de la modale
    const refreshAll = async () => {
        await renderDashboardData(year); 
        const newModalContent = document.getElementById('modal-content');
        if(newModalContent && newModalContent.querySelector('h3')?.textContent.includes(cropName)){
             await showCropFinancialDetailsModal(cropName, year);
        }
    };

    document.getElementById('add-expense-from-modal-btn').addEventListener('click', () => {
        showAddGlobalExpenseModal(year, 'new', { crop: cropName }, refreshAll);
    });

    document.getElementById('modal-expenses-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-expense-btn');
        if (editBtn) {
            const expenseData = JSON.parse(editBtn.dataset.expense);
            showAddGlobalExpenseModal(year, 'edit', expenseData, refreshAll);
        }
        const deleteBtn = e.target.closest('.delete-expense-btn');
        if (deleteBtn) {
            const expenseData = JSON.parse(deleteBtn.dataset.expense);
            handleDeleteGlobalExpense(year, expenseData, refreshAll);
        }
    });
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function createStockPieChart(data) {
    const ctx = document.getElementById('stockPie')?.getContext('2d');
    if (!ctx) return;

    destroyChart('stockPie');
    const labels = Object.keys(data);
    const values = Object.values(data).map(v => (v / 1000).toFixed(2));

    if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "16px Inter";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText("Aucun stock restant", ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    chartInstances['stockPie'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock (Tonnes)',
                data: values,
                backgroundColor: [
                    '#34d399', // emerald-400
                    '#60a5fa', // blue-400
                    '#a78bfa', // violet-400
                    '#fb923c', // orange-400
                    '#facc15', // yellow-400
                    '#f472b6', // pink-400
                ],
                borderColor: '#ffffff',
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 15, boxWidth: 12 } },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.raw} T` } }
            }
        }
    });
}

function createRevenueCostChart(data) {
    const ctx = document.getElementById('revenueCostChart')?.getContext('2d');
    if (!ctx) return;

    destroyChart('revenueCostChart');
    const labels = Object.keys(data).sort();
    
    if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = "16px Inter";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText("Aucune donnée de revenu ou de coût", ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const revenues = labels.map(crop => data[crop].revenue);
    const costs = labels.map(crop => data[crop].cost);

    chartInstances['revenueCostChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Chiffre d'Affaires (€)",
                    data: revenues,
                    backgroundColor: '#818cf8', // indigo-400
                    borderRadius: 6
                },
                {
                    label: 'Coûts de Production (€)',
                    data: costs,
                    backgroundColor: '#fca5a5', // red-300
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'top' },
                tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}` } }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    grid: { color: '#f1f5f9' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderPerformanceTableByCrop(data) {
    const container = document.getElementById('performance-table-container');
    if (!container) return;
    const crops = Object.keys(data).sort();
    if (crops.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 p-4">Aucune donnée de performance pour cette année.</div>`;
        return;
    }
    const tableRowsHTML = crops.map(crop => {
        const d = data[crop];
        const isFlax = crop.toLowerCase().includes('lin');
        const yieldValue = d.area > 0 ? ((d.harvestedWeight / d.area) / (isFlax ? 1000 : 100)).toFixed(2) : '0.00';
        const yieldUnit = isFlax ? 'T/ha' : 'qx/ha';
        const avgSellPrice = d.soldWeight > 0 ? (d.revenue / (d.soldWeight / 1000)).toFixed(2) : '0.00';
        const margin = d.revenue - d.cost;
        const marginColor = margin >= 0 ? 'text-green-600' : 'text-red-600';
        const percentSold = d.harvestedWeight > 0 ? (d.soldWeight / d.harvestedWeight) * 100 : 0;
        const marginPerHa = d.area > 0 ? margin / d.area : 0;
        const marginPerHaColor = marginPerHa >= 0 ? 'text-green-600' : 'text-red-600';
        return `
            <tr class="border-b border-slate-200 last:border-b-0">
                <td class="p-3 font-medium text-slate-800">${crop}</td>
                <td class="p-3 text-right">${yieldValue} ${yieldUnit}</td>
                <td class="p-3 text-right">${(d.harvestedWeight / 1000).toLocaleString('fr-FR')} T</td>
                <td class="p-3 text-right">${(d.soldWeight / 1000).toLocaleString('fr-FR')} T</td>
                <td class="p-3 text-right">${percentSold.toFixed(1)}%</td>
                <td class="p-3 text-right">${parseFloat(avgSellPrice).toLocaleString('fr-FR')} €/T</td>
                <td class="p-3 text-right font-semibold ${marginColor}">${margin.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</td>
                <td class="p-3 text-right font-semibold ${marginPerHaColor}">${marginPerHa.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</td>
            </tr>
        `;
    }).join('');
    container.innerHTML = `
        <table class="w-full text-sm text-left min-w-[800px]">
            <thead class="bg-slate-50 text-slate-600 uppercase">
                <tr>
                    <th class="p-3">Culture</th>
                    <th class="p-3 text-right">Rendement</th>
                    <th class="p-3 text-right">Récolté</th>
                    <th class="p-3 text-right">Vendu</th>
                    <th class="p-3 text-right">% Vendu</th>
                    <th class="p-3 text-right">Prix Vente Moyen</th>
                    <th class="p-3 text-right">Marge Brute</th>
                    <th class="p-3 text-right">Marge / ha</th>
                </tr>
            </thead>
            <tbody>${tableRowsHTML}</tbody>
        </table>
    `;
}

function renderPerformanceTableByField(fieldsData, salesData) {
    const container = document.getElementById('performance-table-container');
    if (!container) return;
    
    if (fieldsData.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 p-4">Aucune parcelle trouvée pour cette année.</div>`;
        return;
    }

    const tableRowsHTML = fieldsData.map(field => {
        const { grainTotals } = calculateTotals(field);
        const harvestedWeight = grainTotals.totalWeight || 0;
        
        let estimatedRevenue = 0;
        const cropData = getSuggestedCropData(field.crop);

        if (cropData.isFiberCrop) {
            const fiberWeightKg = harvestedWeight * (cropData.fiberYieldPercent / 100);
            estimatedRevenue = fiberWeightKg * cropData.fiberPricePerKg;
        } else {
            estimatedRevenue = (harvestedWeight / 1000) * (cropData.marketPrice || 0);
        }

        const estimatedMargin = estimatedRevenue - grainTotals.totalCost;
        const marginColor = estimatedMargin >= 0 ? 'text-green-600' : 'text-red-600';
        
        const estimatedMarginPerHa = field.size > 0 ? estimatedMargin / field.size : 0;
        const marginPerHaColor = estimatedMarginPerHa >= 0 ? 'text-green-600' : 'text-red-600';
        
        const yieldValue = grainTotals.yield || 0;
        const isLin = field.crop?.toLowerCase().includes('lin');
        const yieldUnit = isLin ? 'T/ha' : 'qx/ha';
        const displayYield = isLin ? (harvestedWeight / (field.size || 1) / 1000).toFixed(2) : yieldValue.toFixed(2);

        return `
            <tr class="border-b border-slate-200 last:border-b-0">
                <td class="p-3 font-medium text-slate-800">${field.name}</td>
                <td class="p-3">${field.crop}</td>
                <td class="p-3 text-right">${field.size.toLocaleString('fr-FR')} ha</td>
                <td class="p-3 text-right font-semibold">${(harvestedWeight / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2})} T</td>
                <td class="p-3 text-right">${displayYield} ${yieldUnit}</td>
                <td class="p-3 text-right font-semibold ${marginColor}">${estimatedMargin.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</td>
                <td class="p-3 text-right font-semibold ${marginPerHaColor}">${estimatedMarginPerHa.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <table class="w-full text-sm text-left min-w-[800px]">
            <thead class="bg-slate-50 text-slate-600 uppercase">
                <tr>
                    <th class="p-3">Parcelle</th>
                    <th class="p-3">Culture</th>
                    <th class="p-3 text-right">Surface</th>
                    <th class="p-3 text-right">Poids Récolté</th>
                    <th class="p-3 text-right">Rendement</th>
                    <th class="p-3 text-right">Marge Brute (estimée)</th>
                    <th class="p-3 text-right">Marge / ha (estimée)</th>
                </tr>
            </thead>
            <tbody>${tableRowsHTML}</tbody>
        </table>
    `;
}

function showAddGlobalExpenseModal(year, mode = 'new', expenseToEdit = null, onSaveCallback = null) {
    const isEdit = mode === 'edit';
    const allFields = Object.values(getOwnFieldsData());
    const cropsThisYear = [...new Set(allFields.filter(f => f.year === year && f.crop).map(f => f.crop))].sort();

    const isCropFixed = !isEdit && expenseToEdit && expenseToEdit.crop;

    if (cropsThisYear.length === 0 && !isEdit) {
        showToast("Aucune culture plantée cette année. Impossible d'ajouter une dépense.");
        return;
    }

    const cropOptions = isCropFixed 
        ? `<option value="${expenseToEdit.crop}" selected>${expenseToEdit.crop}</option>`
        : (isEdit 
            ? `<option value="${expenseToEdit.crop}" selected>${expenseToEdit.crop}</option>`
            : cropsThisYear.map(c => `<option value="${c}">${c}</option>`).join('')
        );

    const today = new Date().toISOString().split('T')[0];

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">${isEdit ? 'Modifier la dépense' : 'Ajouter une dépense globale'}</h3>
        <div class="space-y-4">
            <div>
                <label for="expense-crop" class="block text-sm font-medium text-slate-700 mb-1">Culture concernée</label>
                <select id="expense-crop" class="w-full p-3 border-2 rounded-lg" ${isEdit || isCropFixed ? 'disabled' : ''}>${cropOptions}</select>
            </div>
            <div>
                <label for="expense-type" class="block text-sm font-medium text-slate-700 mb-1">Type de dépense</label>
                <select id="expense-type" class="w-full p-3 border-2 rounded-lg">
                    <option>Semences</option><option>Engrais</option><option>Produits phytosanitaires</option>
                    <option>Carburant</option><option>Mécanisation</option><option>Main d'œuvre</option><option>Autre</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="expense-amount" class="block text-sm font-medium text-slate-700 mb-1">Montant (€)</label>
                    <input type="number" step="0.01" id="expense-amount" class="w-full p-3 border-2 rounded-lg" placeholder="150.50" value="${isEdit && expenseToEdit.amount ? expenseToEdit.amount : ''}">
                </div>
                <div>
                    <label for="expense-unit" class="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                    <select id="expense-unit" class="w-full p-3 border-2 rounded-lg">
                        <option value="per_ha" ${isEdit && expenseToEdit.unit === 'per_ha' ? 'selected' : ''}>Par hectare (€/ha)</option>
                        <option value="total" ${isEdit && expenseToEdit.unit === 'total' ? 'selected' : ''}>Total pour la culture</option>
                    </select>
                </div>
            </div>
            <div>
                <label for="expense-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" id="expense-date" value="${isEdit && expenseToEdit.date ? expenseToEdit.date : today}" class="w-full p-3 border-2 rounded-lg">
            </div>
            <div>
                <label for="expense-description" class="block text-sm font-medium text-slate-700 mb-1">Description (facultatif)</label>
                <input type="text" id="expense-description" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Achat fongicide" value="${isEdit && expenseToEdit.description ? expenseToEdit.description : ''}">
            </div>
        </div>
        <p id="expense-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">${isEdit ? 'Enregistrer' : 'Ajouter'}</button>
        </div>
    `;
    openModal(content);

    if (isEdit) {
        document.getElementById('expense-type').value = expenseToEdit.type;
    }

    document.getElementById('modal-confirm-btn').addEventListener('click', () => handleSaveGlobalExpense(year, mode, expenseToEdit, onSaveCallback));
}


async function handleSaveGlobalExpense(year, mode, expenseToEdit = null, onSaveCallback = null) {
    const crop = document.getElementById('expense-crop').value;
    const type = document.getElementById('expense-type').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const unit = document.getElementById('expense-unit').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();
    const errorEl = document.getElementById('expense-modal-error');

    if (!crop || !type || isNaN(amount) || amount <= 0 || !date || !unit) {
        errorEl.textContent = "Veuillez remplir tous les champs obligatoires.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const allFields = getOwnFieldsData();
    const fieldsToUpdate = Object.values(allFields).filter(f => f.year === year && f.crop === crop);

    if (fieldsToUpdate.length === 0) {
        showToast(`Aucune parcelle de ${crop} trouvée pour ${year}.`);
        return;
    }

    const batch = writeBatch(db);
    const newExpenseData = { type, amount, unit, date, description, crop };

    if (mode === 'new') {
        newExpenseData.id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else {
        newExpenseData.id = expenseToEdit.id;
    }

    fieldsToUpdate.forEach(field => {
        const fieldRef = doc(db, 'users', currentUser.uid, 'fields', field.id);
        let currentExpenses = field.expenses || [];

        if (mode === 'new') {
            currentExpenses.push(newExpenseData);
        } else {
            const index = currentExpenses.findIndex(exp => exp.id === expenseToEdit.id);
            if (index > -1) {
                currentExpenses[index] = { ...currentExpenses[index], ...newExpenseData };
            } else {
                currentExpenses.push({ ...expenseToEdit, ...newExpenseData });
            }
        }
        batch.update(fieldRef, { expenses: currentExpenses });
    });

    try {
        await batch.commit();
        showToast('Dépense enregistrée avec succès !');
        closeModal();
        if (onSaveCallback) {
            await onSaveCallback();
        } else {
            await renderDashboardData(year); 
        }
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la dépense globale:", error);
        showToast("Une erreur est survenue.");
    }
}

function handleDeleteGlobalExpense(year, expenseToDelete, onDeleteCallback = null) {
    const message = `Êtes-vous sûr de vouloir supprimer la dépense "${expenseToDelete.type}" pour la culture "${expenseToDelete.crop}" ? Cette action la supprimera de toutes les parcelles concernées.`;
    showConfirmationModal(message, async () => {
        const allFields = getOwnFieldsData();
        const fieldsToUpdate = Object.values(allFields).filter(f => f.year === year && f.crop === expenseToDelete.crop);

        if (fieldsToUpdate.length === 0) {
            showToast("Aucune parcelle concernée trouvée.");
            return;
        }

        const batch = writeBatch(db);
        fieldsToUpdate.forEach(field => {
            const fieldRef = doc(db, 'users', currentUser.uid, 'fields', field.id);
            const updatedExpenses = (field.expenses || []).filter(exp => exp.id !== expenseToDelete.id);
            batch.update(fieldRef, { expenses: updatedExpenses });
        });

        try {
            await batch.commit();
            showToast('Dépense supprimée de toutes les parcelles.');
            if (onDeleteCallback) {
                await onDeleteCallback();
            } else {
                await renderDashboardData(year); 
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de la dépense globale:", error);
            showToast("Une erreur est survenue lors de la suppression.");
        }
    });
}

function togglePersonalizationMode() {
    isPersonalizationMode = !isPersonalizationMode;
    const grid = document.getElementById('dashboard-grid');
    const personalizeBtn = document.getElementById('personalize-dashboard-btn');
    
    grid.classList.toggle('personalization-active', isPersonalizationMode);
    personalizeBtn.classList.toggle('bg-blue-200', isPersonalizationMode);

    if (isPersonalizationMode) {
        initSortable();
        addPersonalizationControls();
    } else {
        if (sortableInstance) {
            sortableInstance.destroy();
            sortableInstance = null;
        }
        removePersonalizationControls();
    }
}

function initSortable() {
    const grid = document.getElementById('dashboard-grid');
    if (grid && typeof Sortable !== 'undefined') {
        sortableInstance = Sortable.create(grid, {
            animation: 150,
            handle: '.drag-handle',
            filter: '#add-widget-placeholder',
            onEnd: async function(evt) {
                const visibleWidgets = Array.from(grid.children)
                    .map(child => child.dataset.widgetId)
                    .filter(id => id);
                const currentLayout = await loadDashboardLayout();
                currentLayout.visible = visibleWidgets;
                await saveDashboardLayout(currentLayout);
            }
        });
    } else if (typeof Sortable === 'undefined') {
        console.warn("SortableJS n'est pas chargé. La personnalisation est désactivée.");
        showToast("Erreur: La bibliothèque de tri n'est pas chargée.");
        const personalizeBtn = document.getElementById('personalize-dashboard-btn');
        isPersonalizationMode = false; 
        if(grid) grid.classList.remove('personalization-active');
        if(personalizeBtn) personalizeBtn.classList.remove('bg-blue-200');
    }
}

function addPersonalizationControls() {
    const grid = document.getElementById('dashboard-grid');
    
    const addWidgetButton = document.createElement('div');
    addWidgetButton.id = 'add-widget-placeholder';
    addWidgetButton.className = 'flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50 cursor-pointer transition-colors';
    addWidgetButton.innerHTML = `
        <div class="text-center text-slate-500">
            <i data-lucide="plus-circle" class="w-10 h-10 mx-auto"></i>
            <p class="mt-2 font-semibold">Ajouter un widget</p>
        </div>
    `;
    grid.appendChild(addWidgetButton);
    addWidgetButton.addEventListener('click', showAddWidgetModal);
    lucide.createIcons();

    grid.querySelectorAll('.personalize-controls, .personalize-overlay').forEach(el => el.classList.remove('hidden'));
    
    grid.querySelectorAll('.remove-widget-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const widgetElement = e.target.closest('.dashboard-widget');
            const widgetId = widgetElement.dataset.widgetId;
            const currentLayout = await loadDashboardLayout();
            currentLayout.visible = currentLayout.visible.filter(id => id !== widgetId);
            await saveDashboardLayout(currentLayout);
            widgetElement.remove();
        });
    });

    grid.querySelectorAll('.resize-widget-btn').forEach(btn => {
        btn.addEventListener('click', showResizeOptionsModal);
    });
}

function removePersonalizationControls() {
    document.getElementById('add-widget-placeholder')?.remove();
    document.querySelectorAll('.personalize-controls, .personalize-overlay').forEach(el => el.classList.add('hidden'));
}

async function showAddWidgetModal() {
    const currentLayout = await loadDashboardLayout();
    const hiddenWidgets = Object.values(ALL_WIDGETS).filter(widget => !currentLayout.visible.includes(widget.id));

    if (hiddenWidgets.length === 0) {
        showToast("Tous les widgets sont déjà affichés.");
        return;
    }

    const widgetsHTML = hiddenWidgets.map(widget => `
        <div class="bg-white rounded-lg p-3 border border-slate-200 shadow-sm flex flex-col">
            <div class="w-full h-32 bg-slate-100 rounded-md mb-3 flex items-center justify-center p-2 text-center relative border border-slate-200">
                <span class="text-sm font-medium text-slate-500">Aperçu de ${widget.title}</span>
            </div>
            <label class="flex items-center cursor-pointer mt-auto">
                <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" value="${widget.id}">
                <span class="ml-3 text-sm font-medium text-slate-700">${widget.title}</span>
            </label>
        </div>
    `).join('');

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Ajouter des Widgets</h3>
        <div id="add-widget-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">${widgetsHTML}</div>
        <div class="mt-6 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">Annuler</button>
            <button id="modal-confirm-add-widget-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Ajouter</button>
        </div>
    `;
    openModal(content);

    document.getElementById('modal-confirm-add-widget-btn').addEventListener('click', async () => {
        const selectedWidgets = Array.from(document.querySelectorAll('#add-widget-list input:checked')).map(input => input.value);
        if (selectedWidgets.length > 0) {
            const layout = await loadDashboardLayout();
            layout.visible.push(...selectedWidgets);
            await saveDashboardLayout(layout);
            const yearEl = document.getElementById('dashboard-current-year');
            const year = yearEl ? parseInt(yearEl.textContent, 10) : new Date().getFullYear();
            await renderCustomDashboard(year);
            togglePersonalizationMode();
        }
        closeModal();
    });
}

async function showResizeOptionsModal(e) {
    const widgetElement = e.target.closest('.dashboard-widget');
    const widgetId = widgetElement.dataset.widgetId;
    const widgetConfig = ALL_WIDGETS[widgetId];
    const currentLayout = await loadDashboardLayout();
    const currentSize = currentLayout.widgetConfigs[widgetId]?.size || widgetConfig.defaultSize;

    if (!widgetConfig.sizes || widgetConfig.sizes.length <= 1) {
        showToast("Ce widget n'a pas d'autres tailles disponibles.");
        return;
    }

    const sizeButtonsHTML = widgetConfig.sizes.map(size => {
        const isActive = size === currentSize;
        const sizeLabel = size.replace('lg:col-span-', '') + ' col.';
        return `
            <button 
                class="widget-size-btn w-full p-3 rounded-lg font-semibold transition ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}"
                data-size="${size}"
                ${isActive ? 'disabled' : ''}
            >
                ${sizeLabel}
            </button>
        `;
    }).join('');

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Taille de "${widgetConfig.title}"</h3>
        <div class="grid grid-cols-2 gap-3">
            ${sizeButtonsHTML}
        </div>
        <button id="modal-cancel-btn" class="mt-6 w-full px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
    `;
    openModal(content);

    document.querySelectorAll('.widget-size-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            const newSize = event.currentTarget.dataset.size;
            await handleUpdateWidgetSize(widgetId, newSize);
        });
    });
}

async function handleUpdateWidgetSize(widgetId, newSize) {
    const currentLayout = await loadDashboardLayout();
    if (!currentLayout.widgetConfigs[widgetId]) {
        currentLayout.widgetConfigs[widgetId] = {};
    }
    currentLayout.widgetConfigs[widgetId].size = newSize;
    
    await saveDashboardLayout(currentLayout);
    closeModal();
    
    const yearEl = document.getElementById('dashboard-current-year');
    const year = yearEl ? parseInt(yearEl.textContent, 10) : new Date().getFullYear();
    await renderCustomDashboard(year);
    
    isPersonalizationMode = false;
    togglePersonalizationMode();
}

async function fetchAndRenderWeather() {
    const container = document.getElementById('weather-widget-content');
    if (!container) return;

    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (userData && userData.weatherLocation) {
            const WEATHERAPI_KEY = '88c7d950706b408eb05160250250408'; 

            if (WEATHERAPI_KEY === 'VOTRE_CLÉ_API_ICI') {
                container.innerHTML = `<p class="text-center text-red-500 text-sm">Clé API manquante.</p>`;
                return;
            }

            const { latitude, longitude } = userData.weatherLocation.coordinates;
            const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${latitude},${longitude}&days=1&aqi=no&alerts=no&lang=fr`;
            const response = await fetch(url);
            weatherData = await response.json();
            
            renderWeatherContent(container, weatherData, userData.weatherLocation.name);
        } else {
            container.innerHTML = `<p class="text-center text-slate-500 text-sm">Aucun lieu météo défini.</p>`;
        }
    } catch (error) {
        console.error("Erreur de chargement de la météo pour le widget:", error);
        container.innerHTML = `<p class="text-center text-red-500 text-sm">Erreur de chargement.</p>`;
    }
}

function renderWeatherContent(container, data, locationName) {
    if (!data || !data.current || !data.forecast) {
        container.innerHTML = `<p class="text-center text-slate-500 text-sm">Données météo invalides.</p>`;
        return;
    }

    const { current, forecast } = data;
    const todayForecast = forecast.forecastday[0].hour;
    
    const currentHour = new Date().getHours();
    
    const hourlyForecastHTML = todayForecast.filter(h => new Date(h.time).getHours() >= currentHour).slice(0, 6).map(hour => {
        return `
            <div class="flex flex-col items-center p-2 rounded-lg bg-slate-50">
                <p class="font-semibold text-xs text-slate-700">${new Date(hour.time).getHours()}h</p>
                <img src="https:${hour.condition.icon}" class="w-7 h-7 my-1" alt="${hour.condition.text}">
                <p class="font-bold text-sm text-slate-900">${Math.round(hour.temp_c)}°</p>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <p class="font-semibold text-slate-800">${locationName}</p>
                <p class="text-3xl font-bold text-slate-900">${Math.round(current.temp_c)}°C</p>
                <p class="text-sm text-slate-500">${current.condition.text}</p>
            </div>
            <img src="https:${current.condition.icon}" class="w-12 h-12" alt="${current.condition.text}">
        </div>
        <div class="mt-4 grid grid-cols-6 gap-2">
            ${hourlyForecastHTML}
        </div>
    `;
    lucide.createIcons();
}

function setupQuickActions(year) {
    const container = document.getElementById('quick-actions-content');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (action === 'add-field') {
            displayAddFieldPage();
        } else if (action === 'add-sale') {
            navigateToPage('page-sales-management');
        } else if (action === 'add-expense') {
            showAddGlobalExpenseModal(parseInt(button.dataset.year, 10));
        }
    });
}

function renderYearlySummaryContent(year, area, weight, margin) {
    const container = document.getElementById('yearly-summary-content');
    if (!container) return;

    const marginPerHa = area > 0 ? margin / area : 0;
    const marginColor = margin >= 0 ? 'text-green-600' : 'text-red-600';
    
    container.innerHTML = `
        <p class="text-slate-600 leading-relaxed">
            Pour l'année de récolte <strong>${year}</strong>, vous avez cultivé 
            <strong class="text-blue-600">${area.toLocaleString('fr-FR', {maximumFractionDigits: 2})} hectares</strong>, 
            produisant un total de 
            <strong class="text-green-600">${(weight / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2})} tonnes</strong>. 
            Votre marge brute totale s'élève à 
            <strong class="${marginColor}">${margin.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</strong>, 
            soit une moyenne de 
            <strong class="${marginColor}">${marginPerHa.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})} par hectare</strong>.
        </p>
    `;
}