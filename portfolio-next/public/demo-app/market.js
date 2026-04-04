// market.js
import { fetchAllAvailableCommodities } from './api.js';

// --- État ---
let allCommodities = [];
let marketChartInstances = {}; // Pour stocker les instances des graphiques

// --- Logique de tri ---
const monthOrder = {
    'JAN': 1, 'FEV': 2, 'MAR': 3, 'AVR': 4, 'MAI': 5, 'JUN': 6,
    'JUL': 7, 'AOU': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
};

const agriculturalMonthOrder = {
    'SEP': 1, 'OCT': 2, 'NOV': 3, 'DEC': 4, 'JAN': 5, 'FEV': 6, 
    'MAR': 7, 'AVR': 8, 'MAI': 9, 'JUN': 10, 'JUL': 11, 'AOU': 12
};

/**
 * Fonction de comparaison pour trier les échéances.
 * @param {object} a - Premier contrat.
 * @param {object} b - Deuxième contrat.
 * @returns {number} - Résultat de la comparaison pour le tri.
 */
function compareEcheances(a, b) {
    const monthA = a.echeance.substring(0, 3).toUpperCase();
    const monthB = b.echeance.substring(0, 3).toUpperCase();
    
    const yearA = parseInt('20' + a.echeance.substring(3), 10);
    const yearB = parseInt('20' + b.echeance.substring(3), 10);

    if (yearA !== yearB) {
        return yearA - yearB;
    }

    const orderA = agriculturalMonthOrder[monthA] || monthOrder[monthA] || 99;
    const orderB = agriculturalMonthOrder[monthB] || monthOrder[monthB] || 99;

    return orderA - orderB;
}

/**
 * Détruit toutes les instances de graphiques existantes pour éviter les fuites de mémoire.
 */
function destroyMarketCharts() {
    Object.values(marketChartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    marketChartInstances = {};
}


/**
 * Récupère et affiche les données du marché dans un conteneur donné.
 * @param {HTMLElement} containerElement - L'élément DOM où afficher les données.
 */
export async function displayMarketData(containerElement) {
    if (!containerElement) return;

    renderLoadingState(containerElement, "Chargement des indices du marché...");

    try {
        // Met en cache les données pour éviter des lectures Firestore répétées.
        if (allCommodities.length === 0) {
            // MODIFICATION : Ajout des tickers pour le Maïs (ZC) et le Soja (ZS) à exclure
            const tickersToExclude = ['CL', 'ZW', 'ZC', 'ZS'];
            const fetchedCommodities = await fetchAllAvailableCommodities();
            // Filtre les produits indésirables
            allCommodities = fetchedCommodities.filter(commodity => !tickersToExclude.includes(commodity.ticker));
            allCommodities.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (allCommodities.length > 0) {
            renderMarketList(containerElement, allCommodities);
        } else {
            renderEmptyState(containerElement, "Aucun indice de marché disponible pour le moment.");
        }
    } catch (error) {
        console.error("Erreur de chargement des données du marché :", error);
        renderErrorState(containerElement, "Impossible de charger les indices du marché.");
    }
}

/**
 * Affiche la liste des prix du marché dans le DOM en utilisant une grille.
 * @param {HTMLElement} container - L'élément DOM conteneur.
 * @param {Array} data - Les données à afficher.
 */
function renderMarketList(container, data) {
    destroyMarketCharts();

    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = [];
        }
        acc[item.name].push(item);
        return acc;
    }, {});

    container.innerHTML = Object.keys(groupedData).map(productName => {
        const items = groupedData[productName];
        items.sort(compareEcheances);

        if (items.length === 0) return '';

        const latestContract = items[0];
        const price = latestContract.price || 0;
        const change = latestContract.change || 0;
        const changeColor = change > 0 ? 'text-green-600' : (change < 0 ? 'text-red-600' : 'text-slate-500');
        const changeIcon = change > 0 ? 'trending-up' : (change < 0 ? 'trending-down' : 'minus');
        const changeSign = change > 0 ? '+' : '';
        const changePercentage = price !== 0 ? (change / price * 100).toFixed(2) : '0.00';

        const canvasId = `market-chart-${latestContract.ticker.replace(/[^a-zA-Z0-9]/g, '')}`;

        const contractsHTML = items.map(item => {
            const itemChange = item.change || 0;
            const itemPrice = item.price || 0;
            const itemChangeColor = itemChange > 0 ? 'text-green-600' : (itemChange < 0 ? 'text-red-600' : 'text-slate-500');
            const itemChangeSign = itemChange > 0 ? '+' : '';

            return `
                <div class="flex justify-between items-center text-sm py-2 border-b border-slate-100 last:border-b-0">
                    <span class="font-medium text-slate-600">${item.echeance} <span class="text-slate-400">(${item.date})</span></span>
                    <div class="text-right">
                        <span class="font-semibold text-slate-800">${itemPrice.toFixed(2)}€</span>
                        <span class="ml-2 w-16 inline-block text-right ${itemChangeColor}">${itemChangeSign}${itemChange.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div class="p-4 border-b border-slate-100">
                    <h4 class="font-bold text-lg text-slate-800">${productName}</h4>
                    <p class="text-xs text-slate-400 font-mono">${latestContract.ticker}</p>
                </div>
                <div class="p-4 flex-grow">
                    <div class="flex justify-between items-center">
                        <div class="text-left">
                            <p class="font-extrabold text-3xl text-slate-900">${price.toFixed(2)}€</p>
                            <div class="flex items-center text-sm font-semibold mt-1 ${changeColor}">
                                <i data-lucide="${changeIcon}" class="w-4 h-4 mr-1"></i>
                                <span>${changeSign}${change.toFixed(2)} (${changePercentage}%)</span>
                            </div>
                        </div>
                        <div class="w-2/5 h-16">
                            <canvas id="${canvasId}"></canvas>
                        </div>
                    </div>
                </div>
                <div class="border-t border-slate-100 p-2">
                    <details>
                        <summary class="text-sm font-medium text-blue-600 cursor-pointer list-none flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                            <span>Détail des échéances</span>
                            <i data-lucide="chevron-down" class="transition-transform details-arrow"></i>
                        </summary>
                        <div class="mt-2 px-2 pb-2 space-y-1">
                            ${contractsHTML}
                        </div>
                    </details>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();

    // Crée les graphiques après avoir généré le HTML
    Object.keys(groupedData).forEach(productName => {
        const items = groupedData[productName];
        items.sort(compareEcheances);
        if (items.length === 0) return;

        const latestContract = items[0];
        const canvasId = `market-chart-${latestContract.ticker.replace(/[^a-zA-Z0-9]/g, '')}`;
        const chartLabels = items.slice(0, 7).reverse().map(item => item.echeance.substring(0, 3));
        const chartData = items.slice(0, 7).reverse().map(item => item.price);
        const change = latestContract.change || 0;
        const chartBorderColor = change >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
        const chartBgColor = change >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (ctx) {
            marketChartInstances[canvasId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Prix (€)',
                        data: chartData,
                        borderColor: chartBorderColor,
                        backgroundColor: chartBgColor,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHitRadius: 10,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (context) => `${context.raw.toFixed(2)}€`
                            }
                        }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
    });
}


function renderLoadingState(container, message) {
    container.innerHTML = `<div class="col-span-full text-center text-slate-500 mt-8 p-4"><p>${message}</p></div>`;
}

function renderEmptyState(container, title, subtitle = '') {
    container.innerHTML = `<div class="col-span-full text-center text-slate-500 mt-8 p-4">
        <p class="font-semibold">${title}</p>
        ${subtitle ? `<p class="text-sm mt-1">${subtitle}</p>` : ''}
    </div>`;
}

function renderErrorState(container, message) {
    container.innerHTML = `<div class="col-span-full text-center text-red-500 mt-8 p-4 bg-red-50 rounded-lg"><p>${message}</p></div>`;
}