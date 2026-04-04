// sales.js

import { db, doc, onSnapshot, collection, addDoc, query, deleteDoc, getDocs, Timestamp, where, updateDoc } from './firebase-config.js';
import { getOwnFieldsData, showToast, openModal, closeModal, showConfirmationModal, navigateToPage } from './harvest.js';
import { displayMarketData } from './market.js';
import { getContacts } from './contacts.js';

// --- DOM Element Selection ---
const pageSalesManagement = document.getElementById('page-sales-management');
const salesSummaryContainer = document.getElementById('sales-summary-container');
const salesYearTabs = document.getElementById('sales-year-tabs');
const salesListContainer = document.getElementById('sales-list-container');
const addSaleBtn = document.getElementById('add-sale-btn');

// --- Global State ---
let currentUser = null;
let allSales = [];
let unsubscribeSales = null;
let isSalesInitialized = false;

let currentSalesYear = new Date().getFullYear();

/**
 * Initialise la page Marché et la page de gestion des ventes.
 * @param {object} user - L'objet utilisateur Firebase actuel.
 */
export function initMarketPage(user) {
    currentUser = user;
    
    if (!isSalesInitialized) {
        addSaleBtn?.addEventListener('click', showAddSaleModal);
        
        // --- CORRECTION : La ligne ci-dessous est supprimée car elle est appelée trop tôt ---
        // initializeSalesEventListeners('sales-list-container'); 

        const goToMySalesBtn = document.getElementById('go-to-my-sales-btn');
        goToMySalesBtn?.addEventListener('click', () => {
            navigateToPage('page-sales-management');
            displaySalesPage();
        });

        const backToMarketBtn = document.getElementById('back-to-market-btn');
        backToMarketBtn?.addEventListener('click', () => {
            navigateToPage('page-market');
            displayMarketPage();
        });

        isSalesInitialized = true;
    }
}

/**
 * Affiche la page principale du Marché (uniquement les indices).
 */
export async function displayMarketPage() {
    const marketContainer = document.getElementById('market-list-container');
    await displayMarketData(marketContainer);
}

/**
 * Affiche la page de gestion des ventes, incluant le résumé et la liste.
 */
export async function displaySalesPage() {
    if (unsubscribeSales) unsubscribeSales();
    
    const salesCollectionRef = collection(db, 'users', currentUser.uid, 'sales');
    unsubscribeSales = onSnapshot(query(salesCollectionRef), (snapshot) => {
        allSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSalesPageContent();
    }, (error) => {
        console.error("Erreur de chargement des ventes:", error);
    });
}

/**
 * Rend le contenu complet de la page des ventes (résumé, onglets, liste).
 */
async function renderSalesPageContent() {
    renderYearTabs();
    await renderSalesSummary();
    renderMySalesList();
}

/**
 * Affiche la liste des ventes pour l'année sélectionnée, en adaptant l'affichage pour mobile ou ordinateur.
 */
function renderMySalesList() {
    if (!salesListContainer) return;

    const salesForYear = allSales.filter(sale => {
        const saleYear = sale.harvestYear || (sale.saleDate?.toDate() ? sale.saleDate.toDate().getFullYear() : null);
        return saleYear === currentSalesYear;
    });

    if (salesForYear.length === 0) {
        salesListContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg">
            <h3 class="font-semibold text-slate-700">Aucune vente enregistrée</h3>
            <p class="text-sm mt-1">Aucune vente n'a été enregistrée pour la récolte de ${currentSalesYear}.</p>
        </div>`;
        return;
    }

    const salesByCrop = salesForYear.reduce((acc, sale) => {
        if (!acc[sale.crop]) acc[sale.crop] = [];
        acc[sale.crop].push(sale);
        return acc;
    }, {});

    const sortedCrops = Object.keys(salesByCrop).sort();
    
    // Détecte la taille de l'écran pour choisir le bon affichage
    const isMobile = window.innerWidth < 1024;

    salesListContainer.innerHTML = sortedCrops.map(crop => {
        const sales = salesByCrop[crop].sort((a, b) => (b.saleDate?.toDate() || 0) - (a.saleDate?.toDate() || 0));
        
        if (isMobile) {
            const cardsHTML = sales.map(sale => createSaleCardHTML(sale)).join('');
            return `
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-slate-800 mb-3">${crop}</h3>
                    <div class="space-y-3">
                        ${cardsHTML}
                    </div>
                </div>
            `;
        } 
        else {
            const tableRowsHTML = sales.map(sale => createSaleRowHTML(sale)).join('');
            return `
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-slate-800 mb-3">${crop}</h3>
                    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-50 text-slate-600">
                                <tr>
                                    <th class="p-3 text-left font-semibold">Date</th>
                                    <th class="p-3 text-left font-semibold">Client / Destination</th>
                                    <th class="p-3 text-right font-semibold">Quantité</th>
                                    <th class="p-3 text-right font-semibold">Prix</th>
                                    <th class="p-3 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    }).join('');

    lucide.createIcons();
    // --- CORRECTION : L'appel est déplacé ici, après que l'HTML a été généré ---
    initializeSalesEventListeners('sales-list-container');
}

/**
 * Crée et affiche le sélecteur d'année interactif.
 */
function renderYearTabs() {
    if (!salesYearTabs) return;

    salesYearTabs.className = "flex justify-center items-center gap-4 p-2";

    salesYearTabs.innerHTML = `
        <button id="sales-prev-year-btn" class="p-2 rounded-full hover:bg-slate-200 transition" aria-label="Année précédente">
            <i data-lucide="chevron-left"></i>
        </button>
        <span id="sales-current-year-display" class="text-2xl font-bold text-slate-800 text-center whitespace-nowrap px-2">Récolte ${currentSalesYear}</span>
        <button id="sales-next-year-btn" class="p-2 rounded-full hover:bg-slate-200 transition" aria-label="Année suivante">
            <i data-lucide="chevron-right"></i>
        </button>
    `;

    document.getElementById('sales-prev-year-btn').addEventListener('click', () => {
        currentSalesYear--;
        renderSalesPageContent();
    });

    document.getElementById('sales-next-year-btn').addEventListener('click', () => {
        currentSalesYear++;
        renderSalesPageContent();
    });

    lucide.createIcons();
}

/**
 * Calcule et affiche le résumé du stock "à vendre".
 */
async function renderSalesSummary() {
    if (!salesSummaryContainer || !currentUser) return;
    salesSummaryContainer.innerHTML = `<p class="text-center text-slate-500">Calcul du stock à vendre...</p>`;

    const userFields = Object.values(getOwnFieldsData());

    const harvestedByCrop = {};
    userFields.forEach(field => {
        if (field.year === currentSalesYear) {
            const crop = field.crop || 'Inconnue';
            if (!harvestedByCrop[crop]) harvestedByCrop[crop] = { totalWeight: 0 };
            const netWeight = (field.trailers || []).reduce((sum, t) => {
                if (t.addToStock !== false) {
                    const weight = t.isEstimate ? (t.full || 0) : ((typeof t.full === 'number' && typeof t.empty === 'number') ? t.full - t.empty : 0);
                    return sum + weight;
                }
                return sum;
            }, 0);
            harvestedByCrop[crop].totalWeight += netWeight;
        }
    });

    const soldByCrop = {};
    const salesForYear = allSales.filter(sale => sale.harvestYear === currentSalesYear);
    salesForYear.forEach(sale => {
        const crop = sale.crop;
        if (!soldByCrop[crop]) soldByCrop[crop] = { soldWeight: 0 };
        soldByCrop[crop].soldWeight += sale.quantityKg || 0;
    });

    const allCropsForYear = [...new Set([...Object.keys(harvestedByCrop), ...Object.keys(soldByCrop)])].sort();

    if (allCropsForYear.length === 0) {
        salesSummaryContainer.innerHTML = `<div class="text-center text-slate-500 p-4 col-span-full"><p>Aucune culture plantée ou vendue pour la récolte ${currentSalesYear}.</p></div>`;
        return;
    }
    
    const summaryHTML = allCropsForYear.map(crop => {
        const harvested = harvestedByCrop[crop]?.totalWeight || 0;
        const sold = soldByCrop[crop]?.soldWeight || 0;
        const toSell = harvested - sold;
        return `
            <div class="bg-white p-3 rounded-xl shadow-sm border text-center">
                <h4 class="font-bold text-slate-800">${crop}</h4>
                <p class="text-xl font-semibold ${toSell >= 0 ? 'text-green-600' : 'text-red-600'} mt-1">${(toSell / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2})} T</p>
                <p class="text-xs text-slate-400">à vendre</p>
            </div>
        `;
    }).join('');

    salesSummaryContainer.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">${summaryHTML}</div>`;
}

/**
 * NOUVEAU: Crée le HTML pour une carte de vente (affichage mobile).
 * @param {object} sale - L'objet contenant les données de la vente.
 * @returns {string} La chaîne de caractères HTML pour la carte.
 */
function createSaleCardHTML(sale) {
    const saleDate = sale.saleDate?.toDate() ? sale.saleDate.toDate().toLocaleDateString('fr-FR') : 'N/A';
    const saleDataString = JSON.stringify({
        id: sale.id,
        date: sale.saleDate?.toDate().toISOString() || new Date().toISOString(),
        client: sale.client || '',
        quantity: (sale.quantityKg / 1000) || 0,
        price: sale.pricePerTonne || 0,
        crop: sale.crop || ''
    });

    return `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-slate-800">${sale.client}</p>
                    <p class="text-sm text-slate-500">${saleDate}</p>
                </div>
                <div class="flex items-center gap-1">
                    <button class="edit-sale-btn p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" data-sale='${saleDataString}' title="Modifier">
                        <i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                    <button class="delete-sale-btn p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" data-id="${sale.id}" data-crop="${sale.crop}" data-quantity="${sale.quantityKg}" title="Supprimer">
                        <i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
            </div>
            <div class="mt-3 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                    <p class="text-sm text-slate-500">Quantité</p>
                    <p class="font-semibold text-slate-800">${((sale.quantityKg || 0) / 1000).toLocaleString('fr-FR')} T</p>
                </div>
                <div class="text-right">
                    <p class="text-sm text-slate-500">Prix</p>
                    <p class="font-bold text-lg text-green-600">${(sale.pricePerTonne || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/T</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Crée le code HTML pour une seule ligne de vente dans le tableau (affichage ordinateur).
 * @param {object} sale - L'objet contenant les données de la vente.
 * @returns {string} La chaîne de caractères HTML pour la ligne du tableau (<tr>).
 */
function createSaleRowHTML(sale) {
    const saleDate = sale.saleDate?.toDate() ? sale.saleDate.toDate().toLocaleDateString('fr-FR') : 'N/A';
    const saleDataString = JSON.stringify({
        id: sale.id,
        date: sale.saleDate?.toDate().toISOString() || new Date().toISOString(),
        client: sale.client || '',
        quantity: (sale.quantityKg / 1000) || 0,
        price: sale.pricePerTonne || 0,
        crop: sale.crop || ''
    });

    return `
        <tr class="border-t border-slate-200">
            <td class="p-3 text-sm text-slate-700">${saleDate}</td>
            <td class="p-3 font-medium text-slate-800">${sale.client}</td>
            <td class="p-3 text-right font-medium text-slate-700">${((sale.quantityKg || 0) / 1000).toLocaleString('fr-FR')} T</td>
            <td class="p-3 text-right font-semibold text-green-600">${(sale.pricePerTonne || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/T</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button class="edit-sale-btn p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" data-sale='${saleDataString}' title="Modifier">
                        <i data-lucide="file-pen-line" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button class="delete-sale-btn p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" data-id="${sale.id}" data-crop="${sale.crop}" data-quantity="${sale.quantityKg}" title="Supprimer">
                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Affiche la modale pour ajouter une nouvelle vente.
 */
function showAddSaleModal() {
    const fields = Object.values(getOwnFieldsData());
    const availableCrops = [...new Set(fields.map(f => f.crop))].sort();
    const contacts = getContacts();

    if (availableCrops.length === 0) {
        showToast("Aucune culture disponible. Créez une parcelle d'abord.");
        return;
    }

    const cropOptions = availableCrops.map(c => `<option value="${c}">${c}</option>`).join('');
    const contactOptions = contacts.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    const years = [currentSalesYear, currentSalesYear + 1, currentSalesYear + 2, currentSalesYear - 1].sort();
    const yearOptions = years.map(y => `<option value="${y}" ${y === currentSalesYear ? 'selected' : ''}>Récolte ${y}</option>`).join('');

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Enregistrer une Vente / Contrat</h3>
        <form id="add-sale-form" class="space-y-4">
            <div>
                <label for="sale-harvest-year" class="block text-sm font-medium text-slate-700 mb-1">Année de Récolte</label>
                <select id="sale-harvest-year" class="w-full p-3 border-2 rounded-lg">${yearOptions}</select>
            </div>
            <div>
                <label for="sale-crop-select" class="block text-sm font-medium text-slate-700 mb-1">Culture</label>
                <select id="sale-crop-select" class="w-full p-3 border-2 rounded-lg">${cropOptions}</select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="sale-quantity-tonne" class="block text-sm font-medium text-slate-700 mb-1">Quantité (T)</label>
                    <input type="number" step="0.001" id="sale-quantity-tonne" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 28.5">
                </div>
                <div>
                    <label for="sale-price-tonne" class="block text-sm font-medium text-slate-700 mb-1">Prix (€/T)</label>
                    <input type="number" step="0.01" id="sale-price-tonne" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 210.50">
                </div>
            </div>
            <div>
                <label for="sale-client" class="block text-sm font-medium text-slate-700 mb-1">Client / Destination</label>
                <input type="text" id="sale-client" list="contacts-list" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Coopérative Agricole">
                <datalist id="contacts-list">${contactOptions}</datalist>
            </div>
            <div>
                <label for="sale-date" class="block text-sm font-medium text-slate-700 mb-1">Date de la vente/contrat</label>
                <input type="date" id="sale-date" value="${today}" class="w-full p-3 border-2 rounded-lg">
            </div>
            <p id="sale-modal-error" class="text-red-500 text-sm hidden text-center pt-2"></p>
            <div class="mt-4 grid grid-cols-2 gap-4">
                <button type="button" id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
                <button type="submit" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Enregistrer</button>
            </div>
        </form>
    `;

    openModal(content);
    document.getElementById('add-sale-form').addEventListener('submit', handleSaveSale);
}

/**
 * Gère la sauvegarde d'une nouvelle vente dans Firestore.
 */
async function handleSaveSale(e) {
    e.preventDefault();
    const harvestYear = parseInt(document.getElementById('sale-harvest-year').value);
    const crop = document.getElementById('sale-crop-select').value;
    const quantityTonne = parseFloat(document.getElementById('sale-quantity-tonne').value);
    const pricePerTonne = parseFloat(document.getElementById('sale-price-tonne').value);
    const client = document.getElementById('sale-client').value.trim();
    const saleDateStr = document.getElementById('sale-date').value;
    const errorEl = document.getElementById('sale-modal-error');

    if (!harvestYear || !crop || isNaN(quantityTonne) || quantityTonne <= 0 || isNaN(pricePerTonne) || pricePerTonne < 0 || !saleDateStr) {
        errorEl.textContent = "Veuillez remplir tous les champs obligatoires avec des valeurs valides.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const saleData = {
        harvestYear,
        crop,
        quantityKg: quantityTonne * 1000,
        pricePerTonne,
        client,
        saleDate: Timestamp.fromDate(new Date(saleDateStr)),
        createdAt: Timestamp.now()
    };

    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'sales'), saleData);
        showToast("Vente enregistrée avec succès !");
        closeModal();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de la vente:", error);
        showToast("Une erreur est survenue lors de l'enregistrement.");
    }
}

/**
 * Gère la suppression d'une vente.
 */
function handleDeleteSale(saleId, crop, quantity) {
    const quantityT = (parseFloat(quantity) / 1000).toFixed(2);
    const message = `Êtes-vous sûr de vouloir supprimer cette vente de <strong>${quantityT} T</strong> de <strong>${crop}</strong> ?`;

    showConfirmationModal(message, async () => {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'sales', saleId));
            showToast("La vente a été supprimée.");
        } catch (error) {
            console.error("Erreur de suppression de la vente:", error);
            showToast("La suppression a échoué.");
        }
    });
}

/**
 * Affiche la fenêtre modale pour modifier une vente existante.
 * @param {object} sale - L'objet de la vente à modifier.
 */
function showEditSaleModal(sale) {
    const saleDate = new Date(sale.date).toISOString().split('T')[0];

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Modifier une Vente</h3>
        <div class="space-y-4">
            <div>
                <label for="edit-sale-crop" class="block text-sm font-medium text-slate-700 mb-1">Culture</label>
                <input type="text" id="edit-sale-crop" value="${sale.crop}" class="w-full p-3 border-2 rounded-lg bg-slate-100" readonly>
            </div>
            <div>
                <label for="edit-sale-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" id="edit-sale-date" value="${saleDate}" class="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
            </div>
            <div>
                <label for="edit-sale-client" class="block text-sm font-medium text-slate-700 mb-1">Client / Destination</label>
                <input type="text" id="edit-sale-client" value="${sale.client}" class="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Ex: Client Dupont">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="edit-sale-quantity" class="block text-sm font-medium text-slate-700 mb-1">Quantité (T)</label>
                    <input type="number" step="0.01" id="edit-sale-quantity" value="${sale.quantity}" class="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="50.5">
                </div>
                <div>
                    <label for="edit-sale-price" class="block text-sm font-medium text-slate-700 mb-1">Prix (€/T)</label>
                    <input type="number" step="0.01" id="edit-sale-price" value="${sale.price}" class="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="200.00">
                </div>
            </div>
        </div>
        <p id="edit-sale-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">Annuler</button>
            <button id="modal-confirm-edit-sale-btn" data-sale-id="${sale.id}" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow transition">Enregistrer</button>
        </div>
    `;

    openModal(content);
    document.getElementById('modal-confirm-edit-sale-btn').addEventListener('click', (e) => {
        const saleId = e.target.dataset.saleId;
        handleUpdateSale(saleId);
    });
}

/**
 * Gère la mise à jour d'une vente dans la base de données.
 * @param {string} saleId - L'ID de la vente à mettre à jour.
 */
async function handleUpdateSale(saleId) {
    const errorEl = document.getElementById('edit-sale-modal-error');
    const date = document.getElementById('edit-sale-date').value;
    const client = document.getElementById('edit-sale-client').value.trim();
    const quantity = parseFloat(document.getElementById('edit-sale-quantity').value);
    const price = parseFloat(document.getElementById('edit-sale-price').value);

    if (!date || !client || isNaN(quantity) || quantity <= 0 || isNaN(price) || price < 0) {
        errorEl.textContent = "Veuillez remplir tous les champs avec des valeurs valides.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const updatedSaleData = {
        saleDate: Timestamp.fromDate(new Date(date)),
        client,
        quantityKg: quantity * 1000,
        pricePerTonne: price
    };

    const saleDocRef = doc(db, "users", currentUser.uid, "sales", saleId);

    try {
        await updateDoc(saleDocRef, updatedSaleData);
        showToast("Vente modifiée avec succès !");
        closeModal();
    } catch (error) {
        console.error("Erreur lors de la modification de la vente :", error);
        errorEl.textContent = "Une erreur est survenue. Veuillez réessayer.";
        errorEl.classList.remove('hidden');
    }
}

/**
 * Initialise les écouteurs d'événements pour les boutons de la liste des ventes.
 * @param {string} containerId - L'ID de l'élément qui contient la liste des ventes.
 */
function initializeSalesEventListeners(containerId) {
    const salesContainer = document.getElementById(containerId);
    if (!salesContainer) {
        console.error(`Le conteneur de ventes avec l'ID '${containerId}' n'a pas été trouvé. L'écouteur ne sera pas attaché.`);
        return;
    }

    salesContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-sale-btn');
        const deleteBtn = e.target.closest('.delete-sale-btn');

        if (editBtn) {
            const saleData = JSON.parse(editBtn.dataset.sale);
            showEditSaleModal(saleData); 
        }

        if (deleteBtn) {
            const { id, crop, quantity } = deleteBtn.dataset;
            handleDeleteSale(id, crop, quantity);
        }
    });
}

/**
 * Fournit les données de ventes agrégées pour d'autres modules.
 */
export async function getSalesData() {
    if (!currentUser) return {};

    const salesCollectionRef = collection(db, 'users', currentUser.uid, 'sales');
    const salesSnapshot = await getDocs(salesCollectionRef);
    const salesByCrop = {};

    salesSnapshot.forEach(doc => {
        const sale = doc.data();
        const cropName = sale.crop;
        if (!salesByCrop[cropName]) {
            salesByCrop[cropName] = { 
                soldWeight: 0,
                totalRevenue: 0,
                sales: []
            };
        }
        salesByCrop[cropName].soldWeight += sale.quantityKg || 0;
        salesByCrop[cropName].totalRevenue += (sale.quantityKg / 1000) * (sale.pricePerTonne || 0);
        salesByCrop[cropName].sales.push(sale);
    });

    for (const crop in salesByCrop) {
        if (salesByCrop[crop].soldWeight > 0) {
            salesByCrop[crop].avgPrice = salesByCrop[crop].totalRevenue / (salesByCrop[crop].soldWeight / 1000);
        } else {
            salesByCrop[crop].avgPrice = 0;
        }
    }

    return salesByCrop;
}