// storage.js (Fichier complet avec débogage intégré)

import { db, collection, onSnapshot, addDoc, doc, getDoc, updateDoc, query, where, getDocs, deleteDoc, writeBatch, collectionGroup } from './firebase-config.js';
import { getOwnFieldsData, showToast, openModal, closeModal, navigateToPage, showConfirmationModal, getCurrentFarmName } from './harvest.js';
import { getContacts } from './contacts.js';
import { getSalesData } from './sales.js';

// --- DOM Element Selection ---
const storageSummaryContainer = document.getElementById('storage-summary-container');
const cropExportsPage = document.getElementById('page-crop-exports');
const cropExportsTitle = document.getElementById('crop-exports-title');
const cropExportsListContainer = document.getElementById('crop-exports-list-container');
const addExportBtn = document.getElementById('add-export-btn');
const backToStorageBtn = document.getElementById('back-to-storage-btn');
const resetStockBtn = document.getElementById('reset-stock-btn');
const storageNavContainer = document.getElementById('storage-nav-container');

// --- Global State ---
let currentUser = null;
let allExports = [];
let truckNames = [];
let unsubscribeExports = null;
let unsubscribeTruckNames = null;
let isStorageInitialized = false;
let storageView = 'personal'; // 'personal', 'shared', or 'manure'
let currentCropList = [];
let currentGroupName = '';
let currentOwnerIdForExports = null; // To track owner for shared exports
let allSharedFieldsData = []; // To cache shared fields data for permission checks


/**
 * Initializes the storage module.
 * @param {object} user - The current Firebase user object.
 */
export function initStorage(user) {
    currentUser = user;
    if (unsubscribeTruckNames) unsubscribeTruckNames();

    const truckNamesCollectionRef = collection(db, 'users', currentUser.uid, 'truckNames');
    unsubscribeTruckNames = onSnapshot(truckNamesCollectionRef, (snapshot) => {
        truckNames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        truckNames.sort((a, b) => a.name.localeCompare(b.name));
    }, (error) => {
        console.error("Error loading truck names:", error);
        showToast("Erreur de chargement des noms de camions.");
    });
    
    if (!isStorageInitialized) {
        setupStorageEventListeners();
        isStorageInitialized = true;
    }
}

/**
 * Updates the UI of the storage navigation buttons.
 */
function updateStorageNavUI() {
    const buttons = storageNavContainer.querySelectorAll('.storage-nav-btn');
    buttons.forEach(button => {
        if (button.dataset.view === storageView) {
            button.classList.add('bg-green-600', 'text-white', 'shadow');
            button.classList.remove('bg-slate-200', 'text-slate-600');
        } else {
            button.classList.add('text-slate-600');
            button.classList.remove('bg-green-600', 'text-white', 'shadow');
        }
    });
}

/**
 * Handles clicks on the storage navigation buttons.
 * @param {string} view - The view to switch to ('personal', 'shared', 'manure').
 */
function handleStorageNavClick(view) {
    if (storageView === view) return;
    storageView = view;
    displayStockPage();
}

/**
 * Sets up event listeners for the storage pages.
 */
function setupStorageEventListeners() {
    const pageStorage = document.getElementById('page-storage');
    if (pageStorage) {
        pageStorage.addEventListener('click', (e) => {
            const cropCard = e.target.closest('.crop-storage-card');
            const ownerCard = e.target.closest('.owner-storage-card');
            const navButton = e.target.closest('.storage-nav-btn');

            if (cropCard) {
                const crops = cropCard.dataset.crops.split(',');
                const groupName = cropCard.dataset.cropGroup;
                const ownerId = cropCard.dataset.ownerId || currentUser.uid;
                displayCropExportPage(groupName, crops, ownerId);
            } else if (ownerCard) {
                const { ownerId, ownerName } = ownerCard.dataset;
                displayStockForOwner(ownerId, ownerName);
            } else if (navButton && navButton.dataset.view) {
                handleStorageNavClick(navButton.dataset.view);
            }
        });
    }

    const addExportButton = document.getElementById('add-export-btn');
    if (addExportButton) {
        addExportButton.addEventListener('click', () => showAddExportModal());
    }

    const backToStorageButton = document.getElementById('back-to-storage-btn');
    if (backToStorageButton) {
        backToStorageButton.addEventListener('click', () => {
            navigateToPage('page-storage');
            displayStockPage();
        });
    }

    const resetStockButton = document.getElementById('reset-stock-btn');
    if (resetStockButton) {
        resetStockButton.addEventListener('click', handleResetStockForCrop);
    }
    
    const exportsListContainer = document.getElementById('crop-exports-list-container');
    if (exportsListContainer) {
        exportsListContainer.addEventListener('click', (e) => {
            const finalizeBtn = e.target.closest('.finalize-export-btn');
            const deleteBtn = e.target.closest('.delete-export-btn');

            if (finalizeBtn) {
                const { id, truckName, emptyWeight } = finalizeBtn.dataset;
                showFinalizeExportModal(id, truckName, emptyWeight);
            }
            if (deleteBtn) {
                const exportId = deleteBtn.dataset.id;
                handleDeleteExport(exportId);
            }
        });
    }
}

/**
 * Displays the main storage summary page based on the current view.
 * VERSION AVEC DÉBOGAGE AMÉLIORÉ.
 */
export async function displayStockPage() {
    // --- Début du groupe de débogage ---
    console.groupCollapsed(`[DÉBOGAGE STOCK] Calcul pour la vue : ${storageView}`);

    if (!storageSummaryContainer || !currentUser) {
        console.error("[DÉBOGAGE STOCK] Erreur critique : conteneur de stockage ou utilisateur manquant. Arrêt.");
        console.groupEnd();
        return;
    }

    const pageStorage = document.getElementById('page-storage');
    const storageHeader = pageStorage?.querySelector('header');

    if (storageHeader) {
        storageHeader.querySelector('#back-to-owners-btn')?.remove();
    }
    storageNavContainer.classList.remove('hidden');

    updateStorageNavUI();

    storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg shadow-sm col-span-full">
        <h3 class="font-semibold text-slate-700">Calcul du stockage... (Voir console F12 pour le détail)</h3>
    </div>`;

    if (storageView === 'manure') {
        storageSummaryContainer.innerHTML = `
            <div class="text-center text-slate-500 mt-8 p-10 bg-white rounded-lg col-span-full flex flex-col items-center justify-center min-h-[300px] border border-slate-200">
                <i data-lucide="construction" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                <h3 class="font-semibold text-lg text-slate-700">Fonctionnalité en cours de développement</h3>
                <p class="text-sm mt-2">La gestion du stockage de fumier sera bientôt disponible.</p>
            </div>`;
        lucide.createIcons();
        console.log("[DÉBOGAGE STOCK] Vue 'Fumier' sélectionnée. Aucun calcul nécessaire.");
        console.groupEnd();
        return;
    }
    
    if (storageView === 'shared') {
        console.log("[DÉBOGAGE STOCK] Vue 'Partagé' sélectionnée. Délégation à displaySharedOwnersList.");
        await displaySharedOwnersList();
        console.groupEnd();
        return;
    }

    // --- CALCUL DU STOCK PERSONNEL ---
    console.log(`[DÉBOGAGE STOCK] Démarrage du calcul du stock PERSONNEL.`);

    const fieldsToDisplay = Object.values(getOwnFieldsData());
    const salesData = await getSalesData();
    const farmName = getCurrentFarmName();
    const emptyMessage = `Aucun stock à afficher pour la ferme "${farmName}". Ajoutez des pesées pour commencer.`;

    console.log(`[DÉBOGAGE STOCK] Ferme actuelle : "${farmName}"`);
    console.log("[DÉBOGAGE STOCK] Nombre total de parcelles disponibles pour l'utilisateur :", fieldsToDisplay.length);
    console.log("[DÉBOGAGE STOCK] Données de ventes (depuis getSalesData) :", JSON.parse(JSON.stringify(salesData)));

    // --- 1. Calcul des totaux récoltés ---
    console.groupCollapsed("[DÉBOGAGE STOCK] Étape 1 : Calcul des totaux récoltés");
    const harvestedTotals = {};
    fieldsToDisplay.forEach(field => {
        console.log(`[RÉCOLTE] Vérification de la parcelle : "${field.name}" (Culture: ${field.crop || 'N/A'})`);
        if (field.crop && field.trailers) {
            const cropName = field.crop;
            if (!harvestedTotals[cropName]) {
                harvestedTotals[cropName] = { totalWeight: 0, totalBales: 0 };
            }
            console.log(`[RÉCOLTE] La parcelle a ${field.trailers.length} bennes (grain).`);
            field.trailers.forEach((trailer, index) => {
                const netWeight = (trailer.full != null && trailer.empty != null) ? (trailer.full - trailer.empty) : (trailer.isEstimate ? (trailer.full || 0) : 0);
                if (trailer.addToStock !== false) {
                    harvestedTotals[cropName].totalWeight += netWeight;
                    harvestedTotals[cropName].totalBales += Number(trailer.baleCount) || 0;
                    console.log(`  -> Benne #${index+1} ("${trailer.trailerName}") AJOUTÉE au stock. Poids: ${netWeight} kg. addToStock: ${trailer.addToStock}`);
                } else {
                    console.log(`  -> Benne #${index+1} ("${trailer.trailerName}") IGNORÉE. Poids: ${netWeight} kg. addToStock: ${trailer.addToStock}`);
                }
            });
        }
        if (field.collectsStraw && field.strawTrailers && field.crop) {
            const strawCropName = `Paille de ${field.crop}`;
            if (!harvestedTotals[strawCropName]) {
                harvestedTotals[strawCropName] = { totalWeight: 0, totalBales: 0 };
            }
            console.log(`[RÉCOLTE] La parcelle a ${field.strawTrailers.length} remorques (paille).`);
            field.strawTrailers.forEach(trailer => {
                const netWeight = (trailer.full != null && trailer.empty != null) ? (trailer.full - trailer.empty) : 0;
                harvestedTotals[strawCropName].totalWeight += netWeight;
                harvestedTotals[strawCropName].totalBales += Number(trailer.baleCount) || 0;
                console.log(`  -> Remorque paille ("${trailer.trailerName}") AJOUTÉE au stock. Poids: ${netWeight} kg.`);
            });
        }
    });
    console.log("[DÉBOGAGE STOCK] Totaux récoltés finaux :", JSON.parse(JSON.stringify(harvestedTotals)));
    console.groupEnd();

    // --- 2. Calcul des totaux expédiés (Exports) ---
    console.groupCollapsed("[DÉBOGAGE STOCK] Étape 2 : Calcul des totaux expédiés (Exports)");
    const shippedTotals = {};
    const exportsQuery = query(collection(db, 'users', currentUser.uid, 'exports'));
    const exportsSnapshot = await getDocs(exportsQuery);
    console.log(`[EXPORTS] Trouvé ${exportsSnapshot.docs.length} documents d'export.`);
    exportsSnapshot.forEach(doc => {
        const exp = doc.data();
        const cropName = exp.crop;
        if (!shippedTotals[cropName]) {
            shippedTotals[cropName] = { shippedWeight: 0, shippedBales: 0 };
        }
        if (exp.status === 'completed') {
            const netWeight = (exp.fullWeight != null && exp.emptyWeight != null) ? exp.fullWeight - exp.emptyWeight : 0;
            shippedTotals[cropName].shippedWeight += netWeight;
            if (exp.baleCount) {
                shippedTotals[cropName].shippedBales += Number(exp.baleCount) || 0;
            }
            console.log(`  -> Export pour "${cropName}" COMPTÉ. Poids: ${netWeight} kg. Statut: ${exp.status}`);
        } else {
            console.log(`  -> Export pour "${cropName}" IGNORÉ. Statut: ${exp.status}`);
        }
    });
    console.log("[DÉBOGAGE STOCK] Totaux expédiés finaux :", JSON.parse(JSON.stringify(shippedTotals)));
    console.groupEnd();

    // --- 3. Calcul final et affichage ---
    console.groupCollapsed("[DÉBOGAGE STOCK] Étape 3 : Calcul final et affichage");
    const allCropNames = [...new Set([...Object.keys(harvestedTotals), ...Object.keys(shippedTotals)])].sort((a, b) => a.localeCompare(b));
    console.log("[FINAL] Toutes les cultures à afficher :", allCropNames);
    let contentHTML = '';

    allCropNames.forEach(cropName => {
        console.groupCollapsed(`[FINAL] Calcul pour la culture : ${cropName}`);
        const harvestedData = harvestedTotals[cropName] || { totalWeight: 0, totalBales: 0 };
        const shippedData = shippedTotals[cropName] || { shippedWeight: 0, shippedBales: 0 };
        // Note : Les données de ventes sont pour affichage info, non utilisées dans le calcul du stock (Récolté - Expédié).
        const salesForCrop = salesData[cropName] || { soldWeight: 0 };

        console.log("  - Données récoltées :", harvestedData);
        console.log("  - Données expédiées :", shippedData);
        console.log("  - Données de ventes (pour info) :", salesForCrop);

        const remainingWeight = harvestedData.totalWeight - shippedData.shippedWeight;
        console.log(`  - Calcul du stock restant : ${harvestedData.totalWeight} (récolté) - ${shippedData.shippedWeight} (expédié) = ${remainingWeight} kg`);

        if (harvestedData.totalWeight > 0 || shippedData.shippedWeight > 0) {
            console.log("  - Résultat : La culture sera affichée.");
            contentHTML += createStorageCardHTML(cropName, harvestedData, shippedData, salesForCrop, currentUser.uid);
        } else {
            console.log("  - Résultat : La culture sera ignorée (pas de données récoltées ou expédiées).");
        }
        console.groupEnd();
    });

    if (contentHTML === '') {
        console.log("[FINAL] Aucun contenu n'a été généré. Affichage du message vide.");
        storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <h3 class="font-semibold text-slate-700">Aucun stock disponible</h3>
            <p class="text-sm mt-1">${emptyMessage}</p>
        </div>`;
    } else {
        console.log("[FINAL] Contenu généré. Mise à jour de l'interface.");
        storageSummaryContainer.innerHTML = contentHTML;
    }
    console.groupEnd(); // Fin de l'Étape 3
    
    lucide.createIcons();
    console.groupEnd(); // Fin du groupe de débogage principal
}

/**
 * Displays a list of owners who have shared fields with the current user.
 */
async function displaySharedOwnersList() {
    storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 p-4">Chargement des partages...</div>`;

    let fieldsToDisplay = [];
    try {
        const q = query(collectionGroup(db, 'fields'), where('accessControlUids', 'array-contains', currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            if (doc.data().ownerId !== currentUser.uid) {
                fieldsToDisplay.push({ id: doc.id, ...doc.data() });
            }
        });
    } catch (error) {
        console.error("Error loading shared fields for storage:", error);
        storageSummaryContainer.innerHTML = `<p class="text-red-500 text-center">Erreur de chargement du stockage partagé.</p>`;
        return;
    }
    
    allSharedFieldsData = fieldsToDisplay; // Cache for permissions

    if (fieldsToDisplay.length === 0) {
        storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <h3 class="font-semibold text-slate-700">Aucun stock partagé</h3>
            <p class="text-sm mt-1">Aucune parcelle n'est partagée avec vous pour le moment.</p>
        </div>`;
        return;
    }

    const sharedByOwner = fieldsToDisplay.reduce((acc, field) => {
        acc[field.ownerId] = (acc[field.ownerId] || 0) + 1;
        return acc;
    }, {});

    const ownerIds = Object.keys(sharedByOwner);
    const userPromises = ownerIds.map(uid => getDoc(doc(db, "users", uid)));
    const userDocs = await Promise.all(userPromises);
    const ownerNames = {};
    userDocs.forEach(userDoc => {
        if (userDoc.exists()) {
            ownerNames[userDoc.id] = userDoc.data().name || 'Propriétaire inconnu';
        }
    });

    const ownerCardsHTML = ownerIds.map(ownerId => {
        const ownerName = ownerNames[ownerId] || 'Propriétaire inconnu';
        const fieldCount = sharedByOwner[ownerId];
        return `
            <div class="owner-storage-card bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:bg-slate-50 transition" data-owner-id="${ownerId}" data-owner-name="${ownerName}">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-lg text-slate-800">${ownerName}</h3>
                        <p class="text-sm text-slate-500">${fieldCount} parcelle(s) partagée(s)</p>
                    </div>
                    <i data-lucide="chevron-right" class="w-6 h-6 text-slate-400"></i>
                </div>
            </div>
        `;
    }).join('');

    storageSummaryContainer.innerHTML = ownerCardsHTML;
    lucide.createIcons();
}

/**
 * Displays the stock summary for a specific owner's shared fields.
 * @param {string} ownerId - The UID of the field owner.
 * @param {string} ownerName - The name of the field owner.
 */
async function displayStockForOwner(ownerId, ownerName) {
    storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 p-4">Chargement du stock de ${ownerName}...</div>`;
    
    const pageStorage = document.getElementById('page-storage');
    const storageHeader = pageStorage?.querySelector('header');

    if (storageHeader) {
        const storageNavContainer = storageHeader.querySelector('#storage-nav-container');
        storageHeader.querySelector('#back-to-owners-btn')?.remove();
        
        const backBtn = document.createElement('button');
        backBtn.id = 'back-to-owners-btn';
        backBtn.className = 'flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 p-2 rounded-lg mb-4';
        backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-5 h-5"></i> Retour aux propriétaires';
        backBtn.onclick = () => displayStockPage();
        
        if (storageNavContainer) {
            storageNavContainer.classList.add('hidden');
        }
        storageHeader.prepend(backBtn);
        lucide.createIcons();
    } else {
        console.error("L'élément header de la page de stockage est introuvable dans le DOM.");
    }

    const ownerFields = allSharedFieldsData.filter(f => f.ownerId === ownerId);
    const salesData = await getSalesData(); // Note: This gets the current user's sales, not the owner's. This is a limitation for now.

    const harvestedTotals = {};
    ownerFields.forEach(field => {
        if (field.crop && field.trailers) {
            const cropName = field.crop;
            if (!harvestedTotals[cropName]) harvestedTotals[cropName] = { totalWeight: 0, totalBales: 0 };
            field.trailers.forEach(trailer => {
                if (trailer.addToStock !== false) {
                    const netWeight = (trailer.full != null && trailer.empty != null) ? (trailer.full - trailer.empty) : (trailer.isEstimate ? trailer.full : 0);
                    harvestedTotals[cropName].totalWeight += netWeight;
                    harvestedTotals[cropName].totalBales += Number(trailer.baleCount) || 0;
                }
            });
        }
    });

    const shippedTotals = {};
    const exportsQuery = query(collection(db, 'users', ownerId, 'exports'));
    const exportsSnapshot = await getDocs(exportsQuery);
    exportsSnapshot.forEach(doc => {
        const exp = doc.data();
        const cropName = exp.crop;
        if (!shippedTotals[cropName]) shippedTotals[cropName] = { shippedWeight: 0, shippedBales: 0 };
        if (exp.status === 'completed') {
            const netWeight = (exp.fullWeight != null && exp.emptyWeight != null) ? exp.fullWeight - exp.emptyWeight : 0;
            shippedTotals[cropName].shippedWeight += netWeight;
            if (exp.baleCount) {
                shippedTotals[cropName].shippedBales += Number(exp.baleCount) || 0;
            }
        }
    });

    const allCropNames = [...new Set([...Object.keys(harvestedTotals), ...Object.keys(shippedTotals)])].sort();
    let contentHTML = '';

    allCropNames.forEach(cropName => {
        const harvestedData = harvestedTotals[cropName] || { totalWeight: 0, totalBales: 0 };
        const shippedData = shippedTotals[cropName] || { shippedWeight: 0, shippedBales: 0 };
        const salesForCrop = salesData[cropName] || { soldWeight: 0 }; // Using current user's sales data as a placeholder

        if (harvestedData.totalWeight > 0 || shippedData.shippedWeight > 0) {
            contentHTML += createStorageCardHTML(cropName, harvestedData, shippedData, salesForCrop, ownerId);
        }
    });

    if (contentHTML === '') {
        storageSummaryContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <p>Aucun stock à afficher pour ${ownerName}.</p>
        </div>`;
    } else {
        storageSummaryContainer.innerHTML = contentHTML;
    }
    lucide.createIcons();
}

/**
 * Creates the HTML for a single crop storage card.
 * @param {string} cropName - The name of the crop.
 * @param {object} harvestedData - Aggregated harvest data.
 * @param {object} shippedData - Aggregated export data.
 * @param {object} salesForCrop - Aggregated sales data.
 * @param {string} ownerId - The UID of the stock owner.
 * @returns {string} The HTML string for the card.
 */
function createStorageCardHTML(cropName, harvestedData, shippedData, salesForCrop, ownerId) {
    const remainingWeight = harvestedData.totalWeight - shippedData.shippedWeight;
    const isBaleCrop = cropName.toLowerCase().includes('lin') || cropName.toLowerCase().includes('paille');
    const remainingBales = harvestedData.totalBales - shippedData.shippedBales;

    // Progression bar
    const totalCapacity = harvestedData.totalWeight > 0 ? harvestedData.totalWeight : 1;
    const stockPercent = (remainingWeight / totalCapacity) * 100;
    const shippedPercent = (shippedData.shippedWeight / totalCapacity) * 100;

    const canManageExports = ownerId === currentUser.uid || allSharedFieldsData.some(f => 
        f.ownerId === ownerId && f.crop === cropName && f.accessControlMap?.[currentUser.uid] === 'edit'
    );

    return `
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full ${canManageExports ? 'crop-storage-card cursor-pointer transform transition-transform hover:scale-105' : ''}" 
             data-crop-group="${cropName}" data-crops="${cropName}" data-owner-id="${ownerId}">
            
            <div class="p-4">
                <h3 class="font-bold text-lg text-slate-800">${cropName}</h3>
                <div class="mt-2 text-center">
                    <p class="text-sm text-slate-500">Stock restant</p>
                    <p class="font-bold text-3xl text-green-600">${(remainingWeight / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2})} T</p>
                    ${isBaleCrop ? `<p class="text-sm text-slate-500">${remainingBales.toLocaleString('fr-FR')} bottes</p>` : ''}
                </div>
            </div>

            <div class="px-4 pb-4">
                <div class="w-full bg-slate-200 rounded-full h-4 flex overflow-hidden">
                    <div class="bg-blue-500 h-4" style="width: ${shippedPercent}%" title="Exporté: ${(shippedData.shippedWeight / 1000).toLocaleString('fr-FR')} T"></div>
                </div>
                <div class="flex justify-between text-xs mt-1 text-slate-500">
                    <span>Récolté: ${(harvestedData.totalWeight / 1000).toLocaleString('fr-FR')} T</span>
                    <span>Stock: ${stockPercent.toFixed(0)}%</span>
                </div>
            </div>

            ${canManageExports ? `
            <div class="border-t border-slate-100 bg-slate-50 p-3 text-center text-sm font-semibold text-blue-600 hover:bg-slate-100 rounded-b-xl">
                Gérer les exports
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Displays the page for managing exports of a specific crop group.
 * @param {string} groupName - The name of the crop group.
 * @param {string[]} crops - The list of specific crops in the group.
 * @param {string} ownerId - The UID of the stock owner.
 */
function displayCropExportPage(groupName, crops, ownerId) {
    currentGroupName = groupName;
    currentCropList = crops;
    currentOwnerIdForExports = ownerId;
    navigateToPage('page-crop-exports');
    cropExportsTitle.textContent = `Exports de ${groupName}`;

    if (unsubscribeExports) unsubscribeExports();
    const exportsQuery = query(collection(db, 'users', ownerId, 'exports'), where('crop', 'in', crops));
    
    unsubscribeExports = onSnapshot(exportsQuery, (snapshot) => {
        allExports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCropExportsList();
    }, (error) => {
        console.error(`Error loading exports for ${groupName}:`, error);
        cropExportsListContainer.innerHTML = `<p class="text-red-500 text-center">Erreur de chargement des exports.</p>`;
    });
}

/**
 * Renders the list of exports for the current crop.
 */
function renderCropExportsList() {
    cropExportsListContainer.className = 'p-4 lg:mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';

    const isOwner = currentOwnerIdForExports === currentUser.uid;
    const fieldsForCrop = (isOwner ? Object.values(getOwnFieldsData()) : allSharedFieldsData)
        .filter(f => f.ownerId === currentOwnerIdForExports && currentCropList.includes(f.crop));
    
    const canManageExports = isOwner || fieldsForCrop.some(f => f.accessControlMap?.[currentUser.uid] === 'edit');
    
    addExportBtn.style.display = canManageExports ? 'flex' : 'none';
    resetStockBtn.style.display = isOwner ? 'flex' : 'none'; // Only owner can reset

    if (allExports.length === 0) {
        cropExportsListContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <h3 class="font-semibold text-slate-700">Aucun export</h3>
            <p class="text-sm mt-1">Ajoutez votre premier export pour cette culture.</p>
        </div>`;
        return;
    }

    let exportsHTML = allExports
        .sort((a, b) => (b.date?.toDate() || 0) - (a.date?.toDate() || 0))
        .map(exp => createExportCardHTML(exp, canManageExports))
        .join('');

    if (allExports.length === 1) {
        exportsHTML += '<div style="display: none;"></div>';
    }

    cropExportsListContainer.innerHTML = exportsHTML;
    lucide.createIcons();
}

/**
 * Creates the HTML for a single export card.
 * @param {object} exp - The export object from Firestore.
 * @param {boolean} canManage - If the current user has rights to manage the export.
 * @returns {string} The HTML string for the card.
 */
function createExportCardHTML(exp, canManage) {
    const netWeight = (exp.fullWeight != null && exp.emptyWeight != null) ? exp.fullWeight - exp.emptyWeight : null;
    const isFinalized = exp.status === 'completed';
    const date = exp.date?.toDate() ? exp.date.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

    const cropNameLower = exp.crop ? exp.crop.toLowerCase() : '';
    const showBales = cropNameLower.includes('lin') || cropNameLower.includes('paille');
    
    let baleCountHTML = '';
    if (showBales && typeof exp.baleCount === 'number' && exp.baleCount > 0) {
        baleCountHTML = `<div class="mt-3 pt-3 border-t border-slate-100 text-center">
            <p class="text-sm text-slate-500">Nombre de bottes</p>
            <p class="font-bold text-lg text-slate-800">${exp.baleCount.toLocaleString('fr-FR')}</p>
        </div>`;
    }

    const finalizeButton = !isFinalized && canManage ? `<button class="finalize-export-btn w-full bg-blue-500 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-600 transition" data-id="${exp.id}" data-truck-name="${exp.truckName}" data-empty-weight="${exp.emptyWeight}">Finaliser l'export</button>` : '';
    const finalizedBadge = isFinalized ? `<div class="w-full flex items-center justify-center gap-2 text-sm font-semibold text-green-600 bg-green-50 p-2 rounded-lg"><i data-lucide="check-circle-2" class="w-5 h-5"></i>Terminé</div>` : '';

    const editControls = canManage ? `
        <div class="flex items-center">
            <button class="delete-export-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" data-id="${exp.id}" title="Supprimer l'export" aria-label="Supprimer l'export">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>
    ` : '';

    return `
    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full transition-transform hover:scale-[1.02]">
        <div class="flex-grow">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-lg text-slate-800">${exp.truckName || 'Camion'}</h4>
                    <p class="text-xs text-slate-400">${date} - ${exp.crop}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="font-extrabold text-2xl text-green-600">${netWeight !== null ? netWeight.toLocaleString('fr-FR') : '---'}<span class="text-base font-semibold text-slate-500 ml-1">kg</span></p>
                </div>
            </div>

            <div class="mt-4 space-y-2">
                <div class="grid grid-cols-2 gap-2 text-center">
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500">Poids Plein</p>
                        <p class="font-semibold text-slate-700">${exp.fullWeight != null ? exp.fullWeight.toLocaleString('fr-FR') : '---'} kg</p>
                    </div>
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500">Poids Vide</p>
                        <p class="font-semibold text-slate-700">${exp.emptyWeight != null ? exp.emptyWeight.toLocaleString('fr-FR') : '---'} kg</p>
                    </div>
                </div>
                ${baleCountHTML}
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            <div class="flex-grow">
                ${finalizeButton}
                ${finalizedBadge}
            </div>
            ${editControls}
        </div>
    </div>
    `;
}

// --- Modals and Actions for Exports ---

async function handleResetStockForCrop() {
    if (!currentGroupName || currentCropList.length === 0) return;
    if (currentOwnerIdForExports !== currentUser.uid) {
        showToast("Cette action est réservée au propriétaire du stock.");
        return;
    }

    const cropNameLower = currentGroupName.toLowerCase();
    const isBaleCrop = cropNameLower.includes('lin') || cropNameLower.includes('paille');
    const isStrawReset = cropNameLower.startsWith('paille');

    const message = `Êtes-vous sûr de vouloir remettre à zéro le stock de <strong>${currentGroupName}</strong> ? Tous les exports pour ce groupe seront <strong>définitivement supprimés</strong>.`;
    showConfirmationModal(message, async () => {
        const fieldsToProcess = Object.values(getOwnFieldsData());
        let totalHarvestedWeight = 0;
        let totalHarvestedBales = 0;

        fieldsToProcess.forEach(field => {
            if (isStrawReset) {
                if (currentGroupName === `Paille de ${field.crop}` && field.strawTrailers) {
                    field.strawTrailers.forEach(trailer => {
                        totalHarvestedBales += Number(trailer.baleCount) || 0;
                        const netWeight = (trailer.full != null && trailer.empty != null) ? (trailer.full - trailer.empty) : 0;
                        totalHarvestedWeight += netWeight;
                    });
                }
            } else {
                if (currentCropList.includes(field.crop) && field.trailers) {
                    field.trailers.forEach(trailer => {
                        if (trailer.addToStock !== false) {
                            totalHarvestedBales += Number(trailer.baleCount) || 0;
                            const netWeight = (trailer.full != null && trailer.empty != null) ? (trailer.full - trailer.empty) : (trailer.isEstimate ? trailer.full : 0);
                            totalHarvestedWeight += netWeight;
                        }
                    });
                }
            }
        });

        const exportsCollectionRef = collection(db, 'users', currentUser.uid, 'exports');
        const q = query(exportsCollectionRef, where('crop', 'in', currentCropList));

        try {
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);

            querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            if ((isBaleCrop && (totalHarvestedBales > 0 || totalHarvestedWeight > 0)) || (!isBaleCrop && totalHarvestedWeight > 0)) {
                const newExportRef = doc(collection(db, 'users', currentUser.uid, 'exports'));
                const resetExportData = {
                    crop: currentCropList[0],
                    status: 'completed',
                    date: new Date(),
                    truckName: `Remise à zéro du stock (${currentGroupName})`,
                    unit: 'kg'
                };

                if (isBaleCrop) {
                    resetExportData.baleCount = totalHarvestedBales;
                }
                resetExportData.fullWeight = totalHarvestedWeight;
                resetExportData.emptyWeight = 0;
                
                batch.set(newExportRef, resetExportData);
            }

            await batch.commit();

            showToast(`Le stock de ${currentGroupName} a été remis à zéro.`);
        } catch (error) {
            console.error("Error resetting stock:", error);
            showToast("Erreur lors de la remise à zéro du stock.");
        }
    }, true);
}

function showAddExportModal() {
    const contacts = getContacts();
    const contactOptions = contacts.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    const truckOptions = truckNames.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    const cropNameLower = currentGroupName.toLowerCase();
    const isBaleCrop = cropNameLower.includes('lin') || cropNameLower.includes('paille');
    
    let cropSelectorHTML = '';
    if (currentCropList.length > 1) {
        const cropOptionsHTML = currentCropList.map(c => `<option value="${c}">${c}</option>`).join('');
        cropSelectorHTML = `
            <div>
                <label for="export-crop-select" class="block text-sm font-medium text-slate-700 mb-1">Culture exacte</label>
                <select id="export-crop-select" class="w-full p-3 border-2 border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 transition">
                    ${cropOptionsHTML}
                </select>
            </div>`;
    }

    let mainInputHTML = `
        <div>
            <label for="export-empty-weight-input" class="block text-sm font-medium text-slate-700 mb-1">Poids à vide (kg)</label>
            <input type="number" id="export-empty-weight-input" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0 kg">
        </div>
    `;

    if (isBaleCrop) {
        mainInputHTML += `
            <div class="mt-4">
                <label for="export-bale-count-input" class="block text-sm font-medium text-slate-700 mb-1">Nombre de bottes</label>
                <input type="number" id="export-bale-count-input" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0">
            </div>
        `;
    }

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Nouvel Export (${currentGroupName})</h3>
        <div class="space-y-4">
            ${cropSelectorHTML}
            <div>
                <label for="truck-name-input" class="block text-sm font-medium text-slate-700 mb-1">Camion / Client / Destination</label>
                <div class="flex items-center gap-2">
                    <input type="text" id="truck-name-input" list="truck-contacts-list" class="w-full p-3 border-2 border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 transition" placeholder="Sélectionner ou taper...">
                    <datalist id="truck-contacts-list">
                        ${truckOptions}
                        ${contactOptions}
                    </datalist>
                    <button id="manage-truck-names-btn" class="p-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition shrink-0 shadow-sm" title="Gérer les noms" aria-label="Gérer les noms">
                        <i data-lucide="pencil"></i>
                    </button>
                </div>
            </div>
            ${mainInputHTML}
        </div>
        <p id="export-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Valider</button>
        </div>
    `;
    openModal(content);
    document.getElementById('manage-truck-names-btn').addEventListener('click', showTruckNameManagementModal);
    document.getElementById('modal-confirm-btn').addEventListener('click', handleSaveNewExport);
}

async function handleSaveNewExport() {
    const truckName = document.getElementById('truck-name-input').value;
    const errorEl = document.getElementById('export-modal-error');
    
    let cropForExport = currentCropList[0];
    const cropSelect = document.getElementById('export-crop-select');
    if (cropSelect) {
        cropForExport = cropSelect.value;
    }

    if (!truckName || !cropForExport) {
        errorEl.textContent = "Veuillez sélectionner un nom et une culture.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const cropNameLower = currentGroupName.toLowerCase();
    const isBaleCrop = cropNameLower.includes('lin') || cropNameLower.includes('paille');
    
    const emptyWeight = parseFloat(document.getElementById('export-empty-weight-input').value);
    const baleCountInput = document.getElementById('export-bale-count-input');
    const baleCount = baleCountInput ? parseInt(baleCountInput.value) : 0;

    if (isNaN(emptyWeight) || emptyWeight < 0 || (isBaleCrop && (isNaN(baleCount) || baleCount <= 0))) {
        errorEl.textContent = "Veuillez remplir tous les champs obligatoires correctement.";
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        const exportData = {
            crop: cropForExport,
            truckName: truckName,
            emptyWeight: emptyWeight,
            fullWeight: null,
            unit: 'kg',
            status: 'in-progress',
            date: new Date(),
            exportedBy: currentUser.uid
        };
        if (isBaleCrop) {
            exportData.baleCount = baleCount;
        }

        await addDoc(collection(db, 'users', currentOwnerIdForExports, 'exports'), exportData);
        
        showToast("Export enregistré.");
        closeModal();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'export:", error);
        showToast("Erreur lors de la création de l'export.");
    }
}


function showFinalizeExportModal(exportId, truckName, emptyWeight) {
    const content = `
        <h3 class="text-xl font-semibold mb-2 text-center text-slate-800">Finaliser l'Export</h3>
        <p class="text-center text-sm text-slate-500 mb-6">${truckName} - Poids à vide: ${parseFloat(emptyWeight).toLocaleString('fr-FR')} kg</p>
        <div>
            <label for="export-full-weight-input" class="block text-sm font-medium text-slate-700 mb-1">Poids plein (kg)</label>
            <input type="number" id="export-full-weight-input" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0 kg">
        </div>
        <p id="export-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Valider</button>
        </div>
    `;
    openModal(content);
    document.getElementById('modal-confirm-btn').addEventListener('click', () => handleFinalizeExport(exportId));
}

async function handleFinalizeExport(exportId) {
    const fullWeight = parseFloat(document.getElementById('export-full-weight-input').value);
    const errorEl = document.getElementById('export-modal-error');

    if (isNaN(fullWeight) || fullWeight < 0) {
        errorEl.textContent = "Veuillez entrer un poids plein valide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    try {
        const exportDocRef = doc(db, 'users', currentOwnerIdForExports, 'exports', exportId);
        await updateDoc(exportDocRef, {
            fullWeight: fullWeight,
            status: 'completed'
        });
        showToast("Export finalisé.");
        closeModal();
    } catch (error) {
        console.error("Error finalizing export:", error);
        showToast("Erreur lors de la finalisation.");
    }
}

function handleDeleteExport(exportId) {
    showConfirmationModal("Êtes-vous sûr de vouloir supprimer cet export ? Cette action est irréversible.", async () => {
        try {
            await deleteDoc(doc(db, 'users', currentOwnerIdForExports, 'exports', exportId));
            showToast("Export supprimé.");
        } catch (error) {
            console.error("Error deleting export:", error);
            showToast("Erreur lors de la suppression.");
        }
    });
}


// --- Truck Name Management ---
function showTruckNameManagementModal() {
    const truckListHTML = truckNames.map(truck => `
        <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span class="font-medium text-slate-800 text-sm">${truck.name}</span>
            <div class="flex items-center gap-1">
                <button class="edit-truck-name-btn p-2 text-slate-400 hover:text-blue-600" data-id="${truck.id}" data-name="${truck.name}"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button class="delete-truck-name-btn p-2 text-slate-400 hover:text-red-600" data-id="${truck.id}" data-name="${truck.name}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>
    `).join('') || '<p class="text-center text-sm text-slate-500 py-3">Aucun nom enregistré.</p>';

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center text-slate-800">Gérer les Noms (Camion/Client)</h3>
        <div id="truck-management-list" class="space-y-2 max-h-48 overflow-y-auto mb-4 p-1">${truckListHTML}</div>
        <div class="border-t border-slate-200 pt-4">
            <label for="new-truck-name-input" class="block text-sm font-medium text-slate-700 mb-1">Ajouter un nom</label>
            <div class="flex items-center gap-2">
                <input type="text" id="new-truck-name-input" class="w-full p-3 border-2 border-slate-300 rounded-lg" placeholder="Ex: Scania, Client Dupont">
                <button id="add-truck-name-confirm-btn" class="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shrink-0">Ajouter</button>
            </div>
            <p id="add-truck-name-error" class="text-red-500 text-sm hidden mt-1"></p>
        </div>
        <div class="mt-6">
            <button id="truck-management-back-btn" class="w-full px-6 py-3 bg-slate-200 rounded-lg">Retour</button>
        </div>
    `;
    openModal(content);
    document.getElementById('truck-management-back-btn').addEventListener('click', showAddExportModal);
    document.getElementById('add-truck-name-confirm-btn').addEventListener('click', handleAddNewTruckName);
    document.getElementById('truck-management-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-truck-name-btn');
        const deleteBtn = e.target.closest('.delete-truck-name-btn');
        if (editBtn) showEditTruckNameModal(editBtn.dataset.id, editBtn.dataset.name);
        if (deleteBtn) handleDeleteTruckName(deleteBtn.dataset.id, deleteBtn.dataset.name);
    });
    lucide.createIcons();
}

async function handleAddNewTruckName() {
    const input = document.getElementById('new-truck-name-input');
    const name = input.value.trim();
    const errorEl = document.getElementById('add-truck-name-error');
    if (!name) {
        errorEl.textContent = "Le nom ne peut pas être vide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'truckNames'), { name: name });
        showToast(`Nom "${name}" ajouté.`);
        showTruckNameManagementModal();
    } catch (error) {
        console.error("Error adding truck name:", error);
        showToast("Erreur lors de l'ajout du nom.");
    }
}

function showEditTruckNameModal(id, currentName) {
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">Modifier le nom</h3>
        <div>
            <label for="edit-truck-name-input" class="block text-sm font-medium text-slate-700 mb-1">Nouveau nom</label>
            <input type="text" id="edit-truck-name-input" class="w-full p-4 border-2 rounded-lg text-lg text-center" value="${currentName}">
        </div>
        <input type="hidden" id="edit-truck-name-id" value="${id}">
        <p id="edit-truck-name-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="edit-truck-name-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="edit-truck-name-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Enregistrer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('edit-truck-name-cancel-btn').addEventListener('click', showTruckNameManagementModal);
    document.getElementById('edit-truck-name-confirm-btn').addEventListener('click', handleUpdateTruckName);
}

async function handleUpdateTruckName() {
    const input = document.getElementById('edit-truck-name-input');
    const id = document.getElementById('edit-truck-name-id').value;
    const newName = input.value.trim();
    const errorEl = document.getElementById('edit-truck-name-error');

    if (!newName) {
        errorEl.textContent = "Le nom ne peut pas être vide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'truckNames', id), { name: newName });
        showToast(`Nom mis à jour.`);
        showTruckNameManagementModal();
    } catch (error) {
        console.error("Error updating truck name:", error);
        showToast("Erreur lors de la mise à jour.");
    }
}

function handleDeleteTruckName(id, name) {
    showConfirmationModal(`Êtes-vous sûr de vouloir supprimer le nom "${name}" ?`, async () => {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'truckNames', id));
            showToast(`Nom "${name}" supprimé.`);
            showTruckNameManagementModal();
        } catch (error) {
            console.error("Error deleting truck name:", error);
            showToast("Erreur lors de la suppression.");
        }
    });
}