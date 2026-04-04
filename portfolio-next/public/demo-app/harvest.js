// harvest.js

import {
    db, doc, getDoc, updateDoc, onSnapshot, collection, addDoc, query, where, deleteDoc,
    arrayUnion, arrayRemove, collectionGroup, getDocs, setDoc, writeBatch, deleteField,
    storage, ref, uploadBytesResumable, getDownloadURL, deleteObject
} from './firebase-config.js';

// ▼▼▼ NOUVEAU : Imports pour le partage natif et la détection de plateforme ▼▼▼
import { Capacitor } from 'https://unpkg.com/@capacitor/core?module';
import { Share } from 'https://unpkg.com/@capacitor/share?module';
import { Filesystem, Directory } from 'https://unpkg.com/@capacitor/filesystem?module';
// ▲▲▲ FIN DES IMPORTS ▲▲▲

import { generateShareLink, showMultiShareOptionsModal } from './sharing.js';
import { getSalesData } from './sales.js';


// --- DOM Element Selection ---
const pageFieldList = document.getElementById('page-field-list');
const pageSharedFieldList = document.getElementById('page-shared-field-list');
const pageMyShares = document.getElementById('page-my-shares');
const pageFieldDetails = document.getElementById('page-field-details');
const pageStrawDetails = document.getElementById('page-straw-details');
const pageExpenses = document.getElementById('page-expenses');

const cropFiltersContainer = document.getElementById('crop-filters-container');
const openFilterModalBtn = document.getElementById('open-filter-modal-btn');
const fieldListContainer = document.getElementById('field-list-container');
const detailsHeaderTitle = document.getElementById('details-header-title');
const backToListBtn = document.getElementById('back-to-list-btn');
const fieldInfoCards = document.getElementById('field-info-cards');
const trailersListContainer = document.getElementById('trailers-list');
const addTrailerBtnDesktop = document.getElementById('add-trailer-btn-desktop');
const addTrailerBtnMobile = document.getElementById('add-trailer-btn-mobile');
const navExportBtn = document.getElementById('nav-export');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const addFieldBtn = document.getElementById('add-field-btn');
const shareFilteredBtn = document.getElementById('share-filtered-btn');
const statsBtn = document.getElementById('stats-btn');
const shareFieldDetailsBtn = document.getElementById('share-field-details-btn');
const qualityDetailsSection = document.getElementById('quality-details-section');
const qualityInfoToggleContainer = document.getElementById('quality-info-toggle-container');
const qualityInfoCards = document.getElementById('quality-info-cards');
const prevYearBtn = document.getElementById('prev-year-btn');
const nextYearBtn = document.getElementById('next-year-btn');
const currentYearDisplay = document.getElementById('current-year-display');

// Farm Management DOM Elements
const currentFarmDisplay = document.getElementById('current-farm-display');
const changeFarmBtn = document.getElementById('change-farm-btn');


// --- Global State ---
let currentUser = null;
let userProfile = {};
let harvestData = {};
let allFields = {};
let trailerNames = [];
// NOUVEAU : Liste pour les noms de chariots de paille
let strawTrailerNames = [];
let userFarms = [];
let currentFarmId = null;
let currentFarmName = 'Toutes les fermes';
let currentFieldKey = null;
let currentFieldOwnerId = null;
let currentFieldAccessControl = {};
let selectedCrop = null;
let unsubscribeFields;
let unsubscribeTrailerNames;
// NOUVEAU : Unsubscribe pour les noms de chariots de paille
let unsubscribeStrawTrailerNames;
let unsubscribeSharedFieldsListener;
let unsubscribeFarms;
let onConfirmAction = null;
let currentView = 'fields';
let areNavListenersInitialized = false;
let currentYear = new Date().getFullYear();
let userNamesCache = {};
let lastListPage = 'page-field-list';
let hideFinishedOwnFields = false;
const HIDE_FINISHED_OWN_KEY = 'recoltiq_hide_finished_own';

const CEREAL_CROPS = ['blé hiver', 'blé printemps', 'froment', 'orge hiver', 'orge printemps', 'avoine'];
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
let userCropData = {};

function isCerealCrop(cropName) {
    if (!cropName) return false;
    return CEREAL_CROPS.includes(cropName.toLowerCase());
}

function toggleStrawOptionVisibility(selectedCrop, containerId, isChecked = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isCerealCrop(selectedCrop)) {
        container.innerHTML = `
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <label for="collects-straw-toggle" class="font-medium text-slate-700">Ramassage de paille ?</label>
                <input type="checkbox" id="collects-straw-toggle" class="toggle-switch" ${isChecked ? 'checked' : ''}>
            </div>
        `;
        container.classList.remove('hidden');
    } else {
        container.innerHTML = '';
        container.classList.add('hidden');
    }
}

// --- Data Access ---
export function getFieldsData() {
    return allFields;
}

export function getCurrentFarmName() {
    return currentFarmName;
}

export function getOwnFieldsData() {
    // Crée un nouvel objet simple à partir de la structure complexe interne.
    // Pour chaque entrée dans harvestData, on prend la clé et on lui associe
    // uniquement la valeur de la propriété "field".
    return Object.fromEntries(
        Object.entries(harvestData).map(([key, value]) => [key, value.field])
    );
}

/**
 * Fetches user names from a list of UIDs and caches them.
 * @param {string[]} uids - An array of user UIDs.
 * @returns {Promise<Object>} A map of UID to user name.
 */
async function getUserNames(uids) {
    const uidsToFetch = [...new Set(uids.filter(uid => uid && !userNamesCache[uid]))];
    if (uidsToFetch.length === 0) return userNamesCache;

    try {
        const userPromises = uidsToFetch.map(uid => getDoc(doc(db, "users", uid)));
        const userDocs = await Promise.all(userPromises);
        userDocs.forEach((userDoc, index) => {
            const uid = uidsToFetch[index];
            if (userDoc.exists()) {
                userNamesCache[uid] = userDoc.data().name || 'Utilisateur inconnu';
            } else {
                userNamesCache[uid] = 'Utilisateur inconnu';
            }
        });
    } catch (error) {
        console.error("Error fetching user names:", error);
    }
    return userNamesCache;
}

// --- Modal Management ---
export function closeModal() {
    if (!modalContainer || !modalContent) return;
    document.body.classList.remove('overflow-hidden');
    modalContainer.classList.remove('items-start', 'overflow-y-auto');
    modalContainer.classList.add('lg:items-center');
    modalContainer.classList.add('hidden');
    modalContent.innerHTML = '';
    modalContent.classList.add('max-w-lg', 'p-6', 'mt-auto');
    modalContent.classList.remove('max-w-7xl', 'w-full', 'p-0');
    modalContent.style.maxWidth = '';
}

export function openModal(content) {
    if (!modalContainer || !modalContent) return;
    modalContent.innerHTML = content;
    lucide.createIcons();
    document.body.classList.add('overflow-hidden');
    modalContainer.classList.remove('hidden');
    
    if (modalContent.scrollHeight > window.innerHeight) {
        modalContainer.classList.add('items-start', 'overflow-y-auto');
        modalContainer.classList.remove('lg:items-center');
        modalContent.classList.remove('mt-auto');
    } else {
        modalContainer.classList.add('lg:items-center');
        modalContainer.classList.remove('items-start', 'overflow-y-auto');
        modalContent.classList.add('mt-auto');
    }

    const allCloseButtons = '#modal-cancel-btn, #modal-close-btn, #stats-modal-close-btn, #close-account-modal-btn, #close-share-modal-btn, #edit-trailer-name-cancel-btn, #trailer-management-back-btn, #confirmation-cancel-btn, #edit-modal-cancel-btn, #farm-management-back-btn';
    const closeBtn = modalContent.querySelector(allCloseButtons);
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal, { once: true });
    }
}
// --- Initialization ---
export async function initHarvestApp(user, profile) {
    currentUser = user;
    userProfile = profile;

    // On lit la préférence depuis le profil utilisateur, avec 'false' comme valeur par défaut.
    hideFinishedOwnFields = userProfile.hideFinishedOwnFields || false;

    // Nettoyage des anciens écouteurs
    if (unsubscribeFields) unsubscribeFields();
    if (unsubscribeTrailerNames) unsubscribeTrailerNames();
    if (unsubscribeStrawTrailerNames) unsubscribeStrawTrailerNames();
    if (unsubscribeFarms) unsubscribeFarms();

    try {
        const customCropsSnapshot = await getDocs(collection(db, 'users', user.uid, 'customCrops'));
        const customCrops = {};
        customCropsSnapshot.forEach(doc => { customCrops[doc.id] = doc.data(); });
        userCropData = { ...CROP_DATA, ...customCrops };
    } catch (error) {
        console.error("Erreur de chargement des cultures personnalisées:", error);
        userCropData = { ...CROP_DATA };
    }

    updateYearDisplay();
    // La fonction setupEventListeners est déjà robuste, on peut l'appeler ici
    if (!areNavListenersInitialized) {
        setupEventListeners();
    }

    // Écouteur pour les noms de bennes
    const trailerNamesCollectionRef = collection(db, 'users', currentUser.uid, 'trailerNames');
    unsubscribeTrailerNames = onSnapshot(query(trailerNamesCollectionRef), (snapshot) => {
        trailerNames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        trailerNames.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Écouteur pour les fermes
    const farmsCollectionRef = collection(db, 'users', currentUser.uid, 'farms');
    unsubscribeFarms = onSnapshot(query(farmsCollectionRef), (snapshot) => {
        userFarms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        userFarms.sort((a, b) => a.name.localeCompare(b.name));
    });

    const fieldsCollectionRef = collection(db, 'users', currentUser.uid, 'fields');
    unsubscribeFields = onSnapshot(query(fieldsCollectionRef), { includeMetadataChanges: true }, (snapshot) => {
        harvestData = {}; // On réinitialise les données globales
        snapshot.forEach(doc => {
            harvestData[doc.id] = { 
                field: { id: doc.id, ownerId: currentUser.uid, ...doc.data() },
                snapshot: doc // On stocke le snapshot avec ses métadonnées
            };
        });
        
        if (document.getElementById('page-field-list')?.offsetParent !== null) {
            displayFieldList();
        }
    });

    // Configuration initiale de la ferme
    const lastSelectedId = userProfile.lastSelectedFarmId;
    if (lastSelectedId === null || (lastSelectedId && userFarms.some(f => f.id === lastSelectedId))) {
         currentFarmId = lastSelectedId;
         currentFarmName = lastSelectedId === null ? 'Toutes les fermes' : (userFarms.find(f => f.id === lastSelectedId)?.name || 'Toutes les fermes');
    } else {
        currentFarmId = null;
        currentFarmName = 'Toutes les fermes';
    }
    updateCurrentFarmDisplay();
}

async function updateAllFieldsData() {
    allFields = {};
    Object.values(harvestData).forEach(field => {
        if (currentFarmId === null || field.farmId === currentFarmId) {
            allFields[field.id] = field;
        }
    });

    if (currentUser && currentFarmId === null) {
        const q = query(collectionGroup(db, 'fields'), where('accessControlUids', 'array-contains', currentUser.uid));
        try {
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                if (doc.data().ownerId !== currentUser.uid) {
                    allFields[doc.id] = { id: doc.id, ...doc.data() };
                }
            });
        } catch (error) {
            console.error("Error loading shared fields:", error);
        }
    }
    
    // Rafraîchir l'affichage si la page est visible
    if (document.getElementById('page-field-list')?.offsetParent !== null) {
        displayCropFilters();
        displayFieldList();
    }
}

export function navigateToPage(pageId) {
    document.querySelectorAll('#app-content-wrapper > div[id^="page-"]').forEach(p => {
        p.classList.add('hidden');
    });

    const pageToShow = document.getElementById(pageId);
    if (!pageToShow) {
        console.error(`Page with id ${pageId} not found.`);
        return;
    }
    pageToShow.classList.remove('hidden');

    const viewMap = {
        'page-field-list': 'fields',
        'page-shared-field-list': 'shared-fields',
        'page-my-shares': 'my-shares',
        'page-storage': 'storage',
        'page-market': 'sales',
        'page-sales-management': 'sales',
        'page-landing-clone': 'landing',
        'page-maintenance': 'maintenance'
    };
    
    currentView = viewMap[pageId] || null;

    if (pageId === 'page-field-list' || pageId === 'page-shared-field-list') {
        lastListPage = pageId;
    }

    updateActiveNav(currentView);

    // ▼▼▼ CORRECTION APPLIQUÉE ICI ▼▼▼
    // L'appel à l'ancienne fonction displayCropFilters() est supprimé.
    // displayFieldList() gère désormais l'affichage des filtres et de la liste.
    if (pageId === 'page-field-list') {
        displayFieldList();
    }
    // ▲▲▲ FIN DE LA CORRECTION ▲▲▲
    
    const contentContainer = document.querySelector('main.flex-1');
    if (contentContainer) {
        contentContainer.scrollTo(0, 0);
    } else {
        window.scrollTo(0, 0);
    }
}

export function updateActiveNav(activeView) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-green-600', 'bg-green-50', 'font-semibold');
        btn.classList.add('text-slate-500');
    });

    if (!activeView) return;

    const buttonIdMap = {
        'dashboard': 'nav-dashboard',
        'fields': 'nav-fields',
        'storage': 'nav-storage',
        'sales': 'nav-sales',
        'shared-fields': 'nav-shared-fields',
        'my-shares': 'nav-my-shares',
        'services': 'nav-services',
        'maintenance': 'nav-maintenance'
    };
    
    const buttonId = buttonIdMap[activeView];
    if (!buttonId) return;

    const buttonsToActivate = document.querySelectorAll(`#${buttonId}`);
    
    buttonsToActivate.forEach(button => {
        button.classList.add('active', 'text-green-600');
        button.classList.remove('text-slate-500');
        
        if (button.closest('#app-nav')) {
            button.classList.add('bg-green-50', 'font-semibold');
        }
    });
}


function updateCurrentFarmDisplay() {
    if (currentFarmDisplay) {
        currentFarmDisplay.textContent = currentFarmName;
    }
}

function displayMyFieldsFilters() {
    const myCropFiltersContainer = document.getElementById('my-crop-filters-container');
    if (!myCropFiltersContainer) return;

    // Vider le conteneur des filtres de culture
    myCropFiltersContainer.innerHTML = '';
    myCropFiltersContainer.classList.add('flex-wrap'); // Permet le retour à la ligne

    // Ajouter le label "Culture :"
    const cropLabel = document.createElement('span');
    cropLabel.className = 'font-semibold text-sm text-slate-600 mr-2 shrink-0 self-center';
    cropLabel.textContent = myCropFiltersContainer.dataset.label;
    myCropFiltersContainer.appendChild(cropLabel);

    // Récupérer les cultures de l'année et de la ferme actuelle
    const myFields = Object.values(getOwnFieldsData()).filter(field => field.year === currentYear && (currentFarmId === null || field.farmId === currentFarmId));
    const crops = [...new Set(myFields.map(field => field.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    // Créer le bouton "Toutes"
    const allCropsBtn = createFilterButton('Toutes', 'all-crops', selectedCrop === null);
    allCropsBtn.addEventListener('click', () => {
        selectedCrop = null;
        displayFieldList(); // Rafraîchit la liste
    });
    myCropFiltersContainer.appendChild(allCropsBtn);

    // Créer les boutons pour chaque culture
    crops.forEach(crop => {
        const button = createFilterButton(crop, crop, selectedCrop === crop);
        button.addEventListener('click', () => {
            selectedCrop = crop;
            displayFieldList(); // Rafraîchit la liste
        });
        myCropFiltersContainer.appendChild(button);
    });
}

async function displayFieldList() {
    if (!fieldListContainer) return;

    displayMyFieldsFilters();

    let myFields = Object.values(harvestData).filter(({ field }) => 
        field.year === currentYear && (currentFarmId === null || field.farmId === currentFarmId)
    );

    if (hideFinishedOwnFields) {
        myFields = myFields.filter(({ field }) => field.status !== 'finished');
    }
    
    const filteredFields = (selectedCrop === null)
        ? myFields
        : myFields.filter(({ field }) => field.crop === selectedCrop);
    
    filteredFields.sort((a, b) => {
        const dateA = a.field.lastModified ? a.field.lastModified.toDate() : 0;
        const dateB = b.field.lastModified ? b.field.lastModified.toDate() : 0;
        return dateB - dateA;
    });
    
    if (filteredFields.length === 0) {
        fieldListContainer.innerHTML = `<div class="text-center text-slate-500 p-10 bg-white rounded-lg col-span-full flex flex-col items-center justify-center min-h-[300px]">
            <i data-lucide="folder-search" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
            <h3 class="font-semibold text-lg text-slate-700">Aucune parcelle ne correspond à vos filtres</h3>
            <p class="text-sm mt-2">Changez d'année, de ferme ou ajoutez une nouvelle parcelle.</p>
        </div>`;
    } else {
        fieldListContainer.innerHTML = filteredFields.map(({ field, snapshot }) => createFieldCardHTML(field, snapshot)).join('');
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

export async function displayFieldDetails(fieldKey, ownerId) {
    if (!fieldKey || !ownerId) {
        showToast("Erreur : Données de parcelle invalides.");
        return;
    }

    navigateToPage('page-field-details');
    currentFieldKey = fieldKey;
    currentFieldOwnerId = ownerId;

    const fieldDocRef = doc(db, "users", ownerId, "fields", fieldKey);
    onSnapshot(fieldDocRef, async (fieldDocSnap) => {
        if (!fieldDocSnap.exists()) {
            showToast("Impossible de charger les détails de cette parcelle.");
            navigateToPage(lastListPage);
            return;
        }

        const field = { id: fieldDocSnap.id, ...fieldDocSnap.data() };
        
        currentFieldAccessControl = field.accessControlMap || {};
        
        const canEdit = ownerId === currentUser.uid || (field.accessControlMap && field.accessControlMap[currentUser.uid] === 'edit');
        const isOwner = ownerId === currentUser.uid;
        const isFinished = field.status === 'finished';

        detailsHeaderTitle.textContent = field.name;
        
        const header = document.querySelector('#page-field-details header');
        if (header) {
            header.querySelector('#open-gps-btn')?.remove();
            header.querySelector('#finish-field-btn')?.remove();
            header.querySelector('#reopen-field-btn')?.remove();
            header.querySelector('#finished-badge')?.remove();

            if (field.gpsLink) {
                const gpsButtonHTML = `<button id="open-gps-btn" class="p-2 text-blue-600 hover:bg-blue-100 rounded-full" title="Ouvrir dans Google Maps" data-link="${field.gpsLink}"><i data-lucide="map-pin" class="h-6 w-6"></i></button>`;
                shareFieldDetailsBtn.insertAdjacentHTML('beforebegin', gpsButtonHTML);
                header.querySelector('#open-gps-btn')?.addEventListener('click', (e) => window.open(e.currentTarget.dataset.link, '_blank'));
            }

            if (canEdit) {
                if (isFinished) {
                    const reopenButtonHTML = `<button id="reopen-field-btn" class="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200"><i data-lucide="unlock" class="w-5 h-5"></i>Ré-ouvrir</button>`;
                    shareFieldDetailsBtn.insertAdjacentHTML('beforebegin', reopenButtonHTML);
                    header.querySelector('#reopen-field-btn')?.addEventListener('click', () => handleReopenField(fieldKey, ownerId));
                } else {
                    const finishButtonHTML = `<button id="finish-field-btn" class="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Marquer la récolte comme terminée"><i data-lucide="check-circle-2" class="h-6 w-6"></i></button>`;
                    shareFieldDetailsBtn.insertAdjacentHTML('beforebegin', finishButtonHTML);
                    header.querySelector('#finish-field-btn')?.addEventListener('click', () => handleMarkFieldAsFinished(fieldKey, ownerId));
                }
            } else if (isFinished) {
                 const finishedBadgeHTML = `<div id="finished-badge" class="flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-100 px-3 py-1.5 rounded-lg"><i data-lucide="check-circle-2" class="w-5 h-5"></i>Terminé</div>`;
                 shareFieldDetailsBtn.insertAdjacentHTML('beforebegin', finishedBadgeHTML);
            }
        }

        const { grainTotals, baleTotals } = calculateTotals(field);
        
        addTrailerBtnMobile?.classList.toggle('hidden', !canEdit || isFinished);
        shareFieldDetailsBtn.classList.toggle('hidden', !isOwner);

        const cropType = field.crop?.toLowerCase() || '';
        let summaryCardsHTML = '';

        if (cropType.includes('lin') || cropType.includes('foin')) {
            summaryCardsHTML = `
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Culture</h3><p class="mt-1 text-lg font-semibold">${field.crop || 'N/A'}</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Surface</h3><p class="mt-1 text-lg font-semibold">${(field.size || 0).toLocaleString('fr-FR')} ha</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Total Bottes</h3><p class="mt-1 text-lg font-semibold">${baleTotals.totalBaleCount.toLocaleString('fr-FR')}</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Rendement</h3><p class="mt-1 text-lg font-semibold">${baleTotals.yieldInTonsPerHa.toFixed(2)} T/ha</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Poids moyen / botte</h3><p class="mt-1 text-lg font-semibold">${baleTotals.avgBaleWeight.toFixed(2)} kg</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Bottes / ha</h3><p class="mt-1 text-lg font-semibold">${baleTotals.baleYieldPerHa.toFixed(2)}</p></div>
            `;
            fieldInfoCards.className = 'grid grid-cols-2 lg:grid-cols-3 gap-3';
        } else {
            summaryCardsHTML = `
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Culture</h3><p class="mt-1 text-lg font-semibold">${field.crop || 'N/A'}</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Surface</h3><p class="mt-1 text-lg font-semibold">${(field.size || 0).toLocaleString('fr-FR')} ha</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Poids Total (Grain)</h3><p class="mt-1 text-lg font-semibold">${grainTotals.totalWeight.toLocaleString('fr-FR')} kg</p></div>
                <div class="bg-white p-3 rounded-xl shadow-sm text-center border"><h3 class="text-xs font-medium text-slate-500">Rendement (Grain)</h3><p class="mt-1 text-lg font-semibold">${(grainTotals.yield || 0).toFixed(2)} qx/ha</p></div>
            `;
            fieldInfoCards.className = 'grid grid-cols-2 lg:grid-cols-4 gap-3';
        }
        
        fieldInfoCards.innerHTML = summaryCardsHTML;
        
        const trailersSection = document.getElementById('trailers-section');
        if (trailersSection) {
            const manageStrawButtonHTML = (field.collectsStraw) 
                ? `<button id="manage-straw-btn" title="Gérer la paille" class="flex items-center gap-2 text-sm bg-yellow-400 text-yellow-900 font-semibold p-2 lg:px-3 lg:py-1.5 rounded-lg hover:bg-yellow-500 transition shadow-sm"><i data-lucide="wind" class="w-5 h-5"></i><span class="hidden lg:inline">Gérer la paille</span></button>` 
                : '';
            
            const manageExpensesButtonHTML = (isOwner) 
                ? `<button id="manage-expenses-btn" title="Gérer les dépenses" class="flex items-center gap-2 text-sm bg-red-100 text-red-700 font-semibold p-2 lg:px-3 lg:py-1.5 rounded-lg hover:bg-red-200 transition shadow-sm"><i data-lucide="receipt" class="w-5 h-5"></i><span class="hidden lg:inline">Dépenses</span></button>`
                : '';
            
            const addFileButtonHTML = (isOwner && !isFinished) ? `<button id="add-file-btn" title="Ajouter un fichier" class="flex items-center gap-2 text-sm bg-indigo-100 text-indigo-700 font-semibold p-2 lg:px-3 lg:py-1.5 rounded-lg hover:bg-indigo-200 transition shadow-sm"><i data-lucide="paperclip" class="w-5 h-5"></i><span class="hidden lg:inline">Fichier</span></button>` : '';
            
            const hasFiles = field.files && field.files.length > 0;
            const viewFilesButtonHTML = (isOwner && hasFiles)
                ? `<button id="view-files-btn" title="Voir les fichiers" class="flex items-center gap-2 text-sm bg-slate-100 text-slate-700 font-semibold p-2 lg:px-3 lg:py-1.5 rounded-lg hover:bg-slate-200 transition shadow-sm">
                       <i data-lucide="folder-open" class="w-5 h-5"></i>
                       <span class="hidden lg:inline">Fichiers</span>
                   </button>`
                : '';

            trailersSection.querySelector('.flex.justify-between').innerHTML = `
                <h2 class="text-lg font-semibold text-slate-700">Bennes (Grain)</h2>
                <div class="flex items-center gap-2">
                    ${manageStrawButtonHTML}
                    ${manageExpensesButtonHTML}
                    <button id="yield-calculator-btn" title="Calculer le rendement" class="flex items-center gap-2 text-sm bg-green-100 text-green-700 font-semibold p-2 lg:px-3 lg:py-1.5 rounded-lg hover:bg-green-200 transition shadow-sm">
                        <i data-lucide="calculator" class="w-5 h-5"></i>
                        <span class="hidden lg:inline">Rendement</span>
                    </button>
                    ${addFileButtonHTML}
                    ${viewFilesButtonHTML}
                </div>
            `;
             if (field.collectsStraw) {
                document.getElementById('manage-straw-btn')?.addEventListener('click', () => displayStrawDetailsPage(fieldKey, ownerId));
            }
            if(isOwner){
                document.getElementById('manage-expenses-btn')?.addEventListener('click', () => displayExpensesPage(fieldKey, ownerId));
            }
        }
        
        const trailersRaw = field.trailers || [];
        const nameOccurrences = {};
        trailersRaw.forEach(t => {
            const name = t.trailerName || 'Benne';
            nameOccurrences[name] = (nameOccurrences[name] || 0) + 1;
        });

        const allUids = trailersRaw.map(t => t.addedBy).filter(Boolean);
        const names = await getUserNames(allUids);

        const nameRenderCount = {};
        const trailersForDisplay = trailersRaw.map((trailer, index) => {
            const originalName = trailer.trailerName || 'Benne';
            let displayName = originalName;

            if (nameOccurrences[originalName] > 1) {
                nameRenderCount[originalName] = (nameRenderCount[originalName] || 0) + 1;
                displayName = `${originalName} #${nameRenderCount[originalName]}`;
            }

            return { ...trailer, displayName, originalIndex: index };
        }).reverse();

        const addTrailerButtonHTML_Desktop = (canEdit && !isFinished) ? `
            <div class="hidden lg:flex justify-end mt-4">
                <button id="add-trailer-btn-desktop" class="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm w-auto">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    <span>Ajouter une benne</span>
                </button>
            </div>
        ` : '';
        
        const parentOfList = trailersListContainer.parentElement;
        parentOfList.querySelectorAll('.hidden.lg\\:flex.justify-end.mt-4').forEach(el => el.remove());


        if (trailersForDisplay.length === 0) {
            trailersListContainer.innerHTML = `
                <div class="text-center p-8 bg-slate-50 rounded-lg mt-4 col-span-full flex flex-col items-center justify-center min-h-[200px]">
                    <i data-lucide="tractor" class="w-20 h-20 text-slate-300 mx-auto"></i>
                    <h3 class="text-xl font-semibold text-slate-700 mt-4">Aucune benne enregistrée</h3>
                    <p class="text-slate-500 mt-1">Cliquez sur "Ajouter une benne" pour commencer.</p>
                </div>
            `;
        } else {
            trailersListContainer.innerHTML = trailersForDisplay.map(trailer => createTrailerCardHTML(trailer, canEdit, names[trailer.addedBy], 'grain', trailer.originalIndex)).join('');
        }
        
        trailersListContainer.insertAdjacentHTML('afterend', addTrailerButtonHTML_Desktop);

        lucide.createIcons();
    });
}

/**
 * Affiche la page de gestion des dépenses pour une parcelle spécifique.
 * @param {string} fieldKey - L'ID de la parcelle.
 * @param {string} ownerId - L'UID du propriétaire de la parcelle.
 */
async function displayExpensesPage(fieldKey, ownerId) {
    navigateToPage('page-expenses');
    const container = document.getElementById('page-expenses');
    if (!container) return;

    const fieldDocRef = doc(db, "users", ownerId, "fields", fieldKey);

    onSnapshot(fieldDocRef, async (fieldDocSnap) => {
        if (!fieldDocSnap.exists()) {
            showToast("Parcelle introuvable.");
            navigateToPage('page-field-details');
            return;
        }

        const field = { id: fieldDocSnap.id, ...fieldDocSnap.data() };
        const { grainTotals } = calculateTotals(field);
        const canEdit = ownerId === currentUser.uid; // Seul le propriétaire peut gérer les dépenses
        const isFinished = field.status === 'finished';

        const summaryHTML = `
            <div class="bg-white p-3 rounded-xl shadow-sm text-center border">
                <h3 class="text-xs font-medium text-slate-500">Total Dépenses</h3>
                <p class="mt-1 text-lg font-semibold">${grainTotals.totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div class="bg-white p-3 rounded-xl shadow-sm text-center border">
                <h3 class="text-xs font-medium text-slate-500">Marge Brute / ha</h3>
                <p class="mt-1 text-lg font-semibold text-${grainTotals.margin >= 0 ? 'green' : 'red'}-600">${(grainTotals.margin / (field.size || 1)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
        `;

        const expenses = (field.expenses || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        const expensesListHTML = expenses.length > 0
            ? expenses.map(expense => createExpenseCardHTML(expense, canEdit)).join('')
            : `<div class="text-center p-8 bg-slate-50 rounded-lg col-span-full"><p>Aucune dépense enregistrée pour cette parcelle.</p></div>`;

        const addExpenseButtonHTML_Desktop = (canEdit && !isFinished) ? `
            <div class="hidden lg:flex justify-end mt-4">
                <button id="add-expense-btn-desktop" class="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm w-auto">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    <span>Ajouter une dépense</span>
                </button>
            </div>
        ` : '';

        container.innerHTML = `
            <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-30 p-4 border-b border-slate-200 flex items-center lg:static lg:bg-transparent lg:p-0">
                <button id="back-to-details-from-expenses" class="p-2 -ml-2 rounded-full hover:bg-slate-200" aria-label="Retour aux détails">
                    <i data-lucide="arrow-left"></i>
                </button>
                <h1 class="text-xl font-bold text-slate-800 text-center flex-grow">Dépenses - ${field.name}</h1>
            </header>
            <div class="p-4 space-y-6 lg:p-0 lg:mt-6">
                <section class="grid grid-cols-2 gap-3">${summaryHTML}</section>
                <section>
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold text-slate-700">Liste des dépenses</h2>
                    </div>
                    <div id="expenses-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${expensesListHTML}</div>
                    ${addExpenseButtonHTML_Desktop}
                </section>
            </div>
            <button id="add-expense-btn-mobile" class="lg:hidden fixed bottom-20 right-5 z-20 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <i data-lucide="plus" class="w-7 h-7"></i>
            </button>
        `;

        document.getElementById('back-to-details-from-expenses').addEventListener('click', () => displayFieldDetails(fieldKey, ownerId));

        if (canEdit && !isFinished) {
            document.getElementById('add-expense-btn-mobile')?.addEventListener('click', () => showAddExpenseModal());
            document.getElementById('add-expense-btn-desktop')?.addEventListener('click', () => showAddExpenseModal());
        } else {
             document.getElementById('add-expense-btn-mobile')?.classList.add('hidden');
        }

        document.getElementById('expenses-list').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-expense-btn');
            const deleteBtn = e.target.closest('.delete-expense-btn');
            if (editBtn) {
                const expenseData = JSON.parse(editBtn.dataset.expense);
                showAddExpenseModal('edit', expenseData);
            }
            if (deleteBtn) handleDeleteExpense(deleteBtn.dataset.id);
        });

        lucide.createIcons();
    });
}

/**
 * Crée le HTML pour une carte de dépense.
 * @param {object} expense - L'objet dépense.
 * @param {boolean} canEdit - Si l'utilisateur peut modifier/supprimer.
 * @returns {string} Le HTML de la carte.
 */
function createExpenseCardHTML(expense, canEdit) {
    const expenseDate = new Date(expense.date).toLocaleDateString('fr-FR');
    const expenseDataString = JSON.stringify(expense);

    const editControls = canEdit ? `
        <div class="flex items-center">
            <button class="edit-expense-btn p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors" data-expense='${expenseDataString}' title="Modifier"><i data-lucide="file-pen-line" class="w-5 h-5 pointer-events-none"></i></button>
            <button class="delete-expense-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" data-id="${expense.id}" title="Supprimer"><i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i></button>
        </div>
    ` : '';

    return `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div class="flex-grow">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-slate-800">${expense.type}</h4>
                    <p class="text-xs text-slate-400">${expenseDate}</p>
                </div>
                <p class="font-extrabold text-xl text-red-600">${expense.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}<span class="text-sm font-normal text-slate-500">${expense.unit === 'per_ha' ? '/ha' : ''}</span></p>
            </div>
            ${expense.description ? `<p class="text-sm text-slate-600 mt-2 italic bg-slate-50 p-2 rounded-md">${expense.description}</p>` : ''}
        </div>
        <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
            ${editControls}
        </div>
    </div>
    `;
}

/**
 * Affiche la modale pour ajouter ou modifier une dépense.
 * @param {string} mode - 'new' ou 'edit'.
 * @param {object|null} expenseToEdit - L'objet dépense à modifier (si en mode edit).
 */
function showAddExpenseModal(mode = 'new', expenseToEdit = null) {
    const isEdit = mode === 'edit';
    const today = new Date().toISOString().split('T')[0];
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">${isEdit ? 'Modifier la dépense' : 'Ajouter une dépense'}</h3>
        <div class="space-y-4">
            <div>
                <label for="expense-type" class="block text-sm font-medium text-slate-700 mb-1">Type de dépense</label>
                <select id="expense-type" class="w-full p-3 border-2 rounded-lg">
                    <option>Semences</option><option>Engrais</option><option>Produits phytosanitaires</option>
                    <option>Carburant</option><option>Mécanisation</option><option>Main d'œuvre</option><option>Autre</option>
                </select>
            </div>
            <div>
                <label for="expense-amount" class="block text-sm font-medium text-slate-700 mb-1">Montant (€)</label>
                <input type="number" step="0.01" id="expense-amount" class="w-full p-3 border-2 rounded-lg" placeholder="150.50" value="${isEdit ? expenseToEdit.amount : ''}">
            </div>
             <div>
                <label for="expense-unit" class="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                <select id="expense-unit" class="w-full p-3 border-2 rounded-lg">
                    <option value="total" ${isEdit && expenseToEdit.unit === 'total' ? 'selected' : ''}>Total pour la parcelle</option>
                    <option value="per_ha" ${isEdit && expenseToEdit.unit === 'per_ha' ? 'selected' : ''}>Par hectare (€/ha)</option>
                </select>
            </div>
            <div>
                <label for="expense-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" id="expense-date" value="${isEdit ? expenseToEdit.date : today}" class="w-full p-3 border-2 rounded-lg">
            </div>
            <div>
                <label for="expense-description" class="block text-sm font-medium text-slate-700 mb-1">Description (facultatif)</label>
                <input type="text" id="expense-description" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Achat engrais NPK" value="${isEdit ? expenseToEdit.description || '' : ''}">
            </div>
        </div>
        <p id="expense-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Enregistrer</button>
        </div>
    `;
    openModal(content);

    if (isEdit) {
        document.getElementById('expense-type').value = expenseToEdit.type;
    }

    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => handleSaveExpense(mode, expenseToEdit ? expenseToEdit.id : null));
}

async function handleSaveExpense(mode = 'new', expenseId = null) {
    const type = document.getElementById('expense-type').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const unit = document.getElementById('expense-unit').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();
    const errorEl = document.getElementById('expense-modal-error');

    if (!type || isNaN(amount) || amount <= 0 || !date || !unit) {
        errorEl.textContent = "Veuillez remplir tous les champs obligatoires.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    try {
        const fieldDoc = await getDoc(fieldDocRef);
        if (!fieldDoc.exists()) throw new Error("Parcelle introuvable");

        let currentExpenses = fieldDoc.data().expenses || [];

        // --- DÉBUT DE LA CORRECTION CLÉ ---
        // Les dépenses créées ici sont "locales" à la parcelle.
        // Pour les différencier, elles n'auront PAS d'ID global.
        // On utilise un identifiant simple basé sur la date pour les modifications.
        if (mode === 'edit') {
            const expenseIndex = currentExpenses.findIndex(exp => exp.id === expenseId);
            if (expenseIndex > -1) {
                // On met à jour l'entrée existante en gardant son ancien "id local"
                currentExpenses[expenseIndex] = { ...currentExpenses[expenseIndex], type, amount, unit, date, description };
            }
        } else {
            const newExpense = {
                // id local unique à la parcelle pour permettre la modification/suppression
                id: `local_${Date.now()}`, 
                type, amount, unit, date, description
            };
            currentExpenses.push(newExpense);
        }
        // --- FIN DE LA CORRECTION CLÉ ---
        
        await updateDoc(fieldDocRef, {
            expenses: currentExpenses
        });
        showToast(`Dépense ${mode === 'edit' ? 'modifiée' : 'ajoutée'}.`);
        closeModal();
    } catch (error) {
        console.error("Erreur d'ajout/modification de la dépense:", error);
        showToast("Une erreur est survenue.");
    }
}

/**
 * Supprime une dépense de Firestore.
 * @param {string} expenseId - L'ID de la dépense à supprimer.
 */
async function handleDeleteExpense(expenseId) {
    const message = `Êtes-vous sûr de vouloir supprimer cette dépense ?`;
    showConfirmationModal(message, async () => {
        const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
        try {
            const fieldDoc = await getDoc(fieldDocRef);
            if (fieldDoc.exists()) {
                const currentExpenses = fieldDoc.data().expenses || [];
                const updatedExpenses = currentExpenses.filter(exp => exp.id !== expenseId);
                
                await updateDoc(fieldDocRef, {
                    expenses: updatedExpenses
                });
                showToast("Dépense supprimée.");
            }
        } catch (error) {
            console.error("Erreur de suppression de la dépense:", error);
            showToast("La suppression a échoué.");
        }
    });
}

async function displayStrawDetailsPage(fieldKey, ownerId) {
    navigateToPage('page-straw-details');
    const container = document.getElementById('page-straw-details');
    if (!container) return;

    const fieldDocRef = doc(db, "users", ownerId, "fields", fieldKey);
    
    onSnapshot(fieldDocRef, async (fieldDocSnap) => {
        if (!fieldDocSnap.exists()) {
            showToast("Parcelle introuvable.");
            navigateToPage('page-field-details');
            return;
        }

        const field = { id: fieldDocSnap.id, ...fieldDocSnap.data() };
        const { strawTotals } = calculateTotals(field);
        const canEdit = ownerId === currentUser.uid || (field.accessControlMap && field.accessControlMap[currentUser.uid] === 'edit');
        const isFinished = field.status === 'finished';

        const summaryHTML = `
            <div class="bg-white p-3 rounded-xl shadow-sm text-center border">
                <h3 class="text-xs font-medium text-slate-500">Total Bottes</h3>
                <p class="mt-1 text-lg font-semibold">${strawTotals.totalBaleCount.toLocaleString('fr-FR')}</p>
            </div>
            <div class="bg-white p-3 rounded-xl shadow-sm text-center border">
                <h3 class="text-xs font-medium text-slate-500">Poids Total Paille</h3>
                <p class="mt-1 text-lg font-semibold">${(strawTotals.totalWeight / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 2})} T</p>
            </div>
            <div class="bg-white p-3 rounded-xl shadow-sm text-center border col-span-2 lg:col-span-1">
                <h3 class="text-xs font-medium text-slate-500">Rendement Paille</h3>
                <p class="mt-1 text-lg font-semibold">${strawTotals.yieldInTonsPerHa.toFixed(2)} <span class="text-sm font-normal">T/ha</span></p>
            </div>
        `;
        
        const allUids = (field.strawTrailers || []).map(t => t.addedBy).filter(Boolean);
        const names = await getUserNames(allUids);

        const strawTrailers = (field.strawTrailers || []).map((t, i) => ({...t, originalIndex: i})).reverse();
        const strawListHTML = strawTrailers.length > 0 
            ? strawTrailers.map(trailer => createTrailerCardHTML(trailer, canEdit, names[trailer.addedBy], 'straw', trailer.originalIndex)).join('')
            : `<div class="text-center p-8 bg-slate-50 rounded-lg col-span-full"><p>Aucun ramassage de paille enregistré.</p></div>`;
        
        const addStrawButtonHTML_Desktop = (canEdit && !isFinished) ? `
            <div class="hidden lg:flex justify-end mt-4">
                <button id="add-straw-trailer-btn-desktop" class="flex items-center justify-center gap-2 bg-yellow-500 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-yellow-600 transition shadow-sm w-auto">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    <span>Ajouter un ramassage</span>
                </button>
            </div>
        ` : '';

        container.innerHTML = `
            <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-30 p-4 border-b border-slate-200 flex items-center lg:static lg:bg-transparent lg:p-0">
                <button id="back-to-details-from-straw" class="p-2 -ml-2 rounded-full hover:bg-slate-200" aria-label="Retour aux détails">
                    <i data-lucide="arrow-left"></i>
                </button>
                <h1 class="text-xl font-bold text-slate-800 text-center flex-grow">Gestion Paille - ${field.name}</h1>
            </header>
            <div class="p-4 space-y-6 lg:p-0 lg:mt-6">
                <section class="grid grid-cols-2 lg:grid-cols-3 gap-3">${summaryHTML}</section>
                <section>
                    <div class="flex justify-between items-center mb-2">
                        <h2 class="text-lg font-semibold text-slate-700">Ramassages</h2>
                    </div>
                    <div id="straw-trailers-list" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${strawListHTML}</div>
                    ${addStrawButtonHTML_Desktop}
                </section>
            </div>
            <button id="add-straw-trailer-btn-mobile" class="lg:hidden fixed bottom-20 right-5 z-20 h-14 w-14 bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <i data-lucide="plus" class="w-7 h-7"></i>
            </button>
        `;

        document.getElementById('back-to-details-from-straw').addEventListener('click', () => displayFieldDetails(fieldKey, ownerId));
        
        if (canEdit && !isFinished) {
            document.getElementById('add-straw-trailer-btn-mobile')?.addEventListener('click', () => showAddStrawModal());
            document.getElementById('add-straw-trailer-btn-desktop')?.addEventListener('click', () => showAddStrawModal());
        } else {
             document.getElementById('add-straw-trailer-btn-mobile')?.classList.add('hidden');
        }
        
        document.getElementById('straw-trailers-list').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            const finalizeBtn = e.target.closest('.finalize-btn');
            if (editBtn) showAddStrawModal('edit', parseInt(editBtn.dataset.index));
            if (deleteBtn) handleDeleteStrawTrailer(parseInt(deleteBtn.dataset.index));
            if (finalizeBtn) showFinalizeStrawModal(parseInt(finalizeBtn.dataset.index));
        });

        lucide.createIcons();
    });
}

async function showAddStrawModal(mode = 'new', index = -1) {
    const isEdit = mode === 'edit';
    let trailerToEdit = null;

    if (isEdit) {
        const fieldDoc = await getDoc(doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey));
        trailerToEdit = fieldDoc.data().strawTrailers[index];
    }
    
    const trailerOptions = strawTrailerNames.map(t => `<option value="${t.name}" ${trailerToEdit && trailerToEdit.trailerName === t.name ? 'selected' : ''}>${t.name}</option>`).join('');

    const weightInputsHTML = isEdit ? `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="straw-weight-full" class="block text-sm font-medium text-slate-700">Poids Plein (kg)</label>
                <input type="number" id="straw-weight-full" value="${trailerToEdit.full || ''}" class="mt-1 w-full p-3 border-2 rounded-lg text-lg text-center">
            </div>
            <div>
                <label for="straw-weight-empty" class="block text-sm font-medium text-slate-700">Poids Vide (kg)</label>
                <input type="number" id="straw-weight-empty" value="${trailerToEdit.empty || ''}" class="mt-1 w-full p-3 border-2 rounded-lg text-lg text-center">
            </div>
        </div>
    ` : `
        <div>
            <div class="flex justify-between items-center mb-1">
                <label for="straw-weight-input" id="straw-weight-label" class="block text-sm font-medium text-slate-700">Poids plein (kg)</label>
                <button id="invert-straw-weight-btn" class="p-1.5 bg-slate-200 text-slate-600 rounded-md text-xs flex items-center gap-1">
                    <i data-lucide="repeat" class="w-4 h-4"></i> Inverser
                </button>
            </div>
            <input type="number" inputmode="numeric" id="straw-weight-input" data-inverted="false" class="w-full p-4 border-2 rounded-lg text-xl text-center" placeholder="0 kg">
        </div>
    `;

    const content = `
        <h3 id="straw-modal-title" class="text-xl font-semibold mb-6 text-center">${isEdit ? 'Modifier le ramassage' : 'Nouveau ramassage de paille'}</h3>
        <div class="space-y-4">
            <div>
                <!-- MODIFIÉ : Libellé changé -->
                <label for="straw-trailer-name-select" class="block text-sm font-medium text-slate-700 mb-1">Nom du chariot</label>
                <div class="flex items-center gap-2">
                    <select id="straw-trailer-name-select" class="w-full p-3 border-2 rounded-lg text-lg">
                        <option value="">Sélectionner...</option>
                        ${trailerOptions}
                    </select>
                    <button id="manage-straw-trailer-names-btn" class="p-3 bg-slate-200 rounded-lg shrink-0" title="Gérer les noms de chariots">
                        <i data-lucide="pencil"></i>
                    </button>
                </div>
            </div>
            ${weightInputsHTML}
            <div>
                <label for="straw-bale-count-input" class="block text-sm font-medium text-slate-700 mb-1">Nombre de bottes</label>
                <input type="number" inputmode="numeric" id="straw-bale-count-input" value="${isEdit && trailerToEdit.baleCount ? trailerToEdit.baleCount : ''}" class="w-full p-4 border-2 rounded-lg text-xl text-center" placeholder="0">
            </div>
            <div>
                <label for="straw-details-input" class="block text-sm font-medium text-slate-700 mb-1">Détails (facultatif)</label>
                <!-- MODIFIÉ : Placeholder changé -->
                <input type="text" id="straw-details-input" value="${isEdit && trailerToEdit.details ? trailerToEdit.details : ''}" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Chariot bleu, paille humide...">
            </div>
        </div>
        <p id="straw-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-straw-btn" class="px-6 py-3 bg-yellow-500 text-white font-bold rounded-lg">Enregistrer</button>
        </div>
    `;
    openModal(content);

    if (!isEdit) {
        const invertBtn = document.getElementById('invert-straw-weight-btn');
        if (invertBtn) {
            invertBtn.addEventListener('click', () => {
                const weightInput = document.getElementById('straw-weight-input');
                const weightLabel = document.getElementById('straw-weight-label');
                const modalTitle = document.getElementById('straw-modal-title');
                const isInverted = weightInput.dataset.inverted === 'true';

                if (!isInverted) {
                    weightInput.dataset.inverted = 'true';
                    weightLabel.textContent = 'Poids vide (kg)';
                    modalTitle.textContent = 'Nouveau chariot vide';
                } else {
                    weightInput.dataset.inverted = 'false';
                    weightLabel.textContent = 'Poids plein (kg)';
                    modalTitle.textContent = 'Nouveau chariot plein';
                }
            });
        }
    }

    document.getElementById('modal-confirm-straw-btn').addEventListener('click', () => handleSaveStrawTrailer(mode, index));
    document.getElementById('manage-straw-trailer-names-btn').addEventListener('click', () => showStrawTrailerNameManagementModal(() => showAddStrawModal(mode, index)));
    lucide.createIcons();
}

async function showFinalizeStrawModal(index) {
    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDoc = await getDoc(fieldDocRef);
    if (!fieldDoc.exists()) {
        showToast("Erreur: parcelle introuvable.");
        return;
    }
    const trailer = fieldDoc.data().strawTrailers[index];
    if (!trailer) {
        showToast("Erreur: chariot introuvable.");
        return;
    }

    const isFullWeightMissing = trailer.full === null || trailer.full === undefined;
    const title = isFullWeightMissing ? "Finaliser : Poids plein" : "Finaliser : Poids à vide";
    const label = isFullWeightMissing ? "Poids plein (kg)" : "Poids vide (kg)";
    const weightType = isFullWeightMissing ? "full" : "empty";

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">${title}</h3>
        <div>
            <label for="finalize-straw-weight-input" class="block text-sm font-medium text-slate-700 mb-1">${label}</label>
            <input type="number" inputmode="numeric" id="finalize-straw-weight-input" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center" placeholder="0 kg">
        </div>
        <p id="finalize-straw-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-finalize-straw-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Valider</button>
        </div>
    `;
    openModal(content);
    document.getElementById('modal-confirm-finalize-straw-btn').addEventListener('click', () => handleConfirmStrawFinalization(index, weightType));
}

async function handleConfirmStrawFinalization(index, weightType) {
    const weightInput = document.getElementById('finalize-straw-weight-input');
    const errorEl = document.getElementById('finalize-straw-error');
    const weight = parseFloat(weightInput.value);

    if (isNaN(weight) || weight < 0) {
        errorEl.textContent = "Veuillez entrer un poids valide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDoc = await getDoc(fieldDocRef);
    const strawTrailers = fieldDoc.data().strawTrailers || [];
    
    if (strawTrailers[index]) {
        strawTrailers[index][weightType] = weight;
    } else {
        showToast("Erreur lors de la mise à jour.");
        return;
    }

    try {
        await updateDoc(fieldDocRef, { strawTrailers: strawTrailers, lastModified: new Date() });
        showToast('Pesée finalisée.');
        closeModal();
    } catch (error) {
        console.error("Erreur de finalisation de la pesée de paille:", error);
        showToast("Une erreur est survenue.");
    }
}


async function handleSaveStrawTrailer(mode, index) {
    const trailerName = document.getElementById('straw-trailer-name-select').value;
    const baleCount = parseInt(document.getElementById('straw-bale-count-input').value);
    const details = document.getElementById('straw-details-input').value.trim();
    const errorEl = document.getElementById('straw-modal-error');

    if (!trailerName) {
        errorEl.textContent = "Veuillez sélectionner un nom de chariot.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDoc = await getDoc(fieldDocRef);
    const strawTrailers = fieldDoc.data().strawTrailers || [];

    const dataToSave = {
        trailerName,
        baleCount: isNaN(baleCount) ? 0 : baleCount,
        details: details || null,
    };

    if (mode === 'edit') {
        const full = parseFloat(document.getElementById('straw-weight-full').value);
        const empty = parseFloat(document.getElementById('straw-weight-empty').value);
        dataToSave.full = !isNaN(full) ? full : null;
        dataToSave.empty = !isNaN(empty) ? empty : null;
        strawTrailers[index] = { ...strawTrailers[index], ...dataToSave };
    } else {
        const weight = parseFloat(document.getElementById('straw-weight-input').value);
        const isInverted = document.getElementById('straw-weight-input').dataset.inverted === 'true';
        dataToSave.full = isInverted ? null : (isNaN(weight) ? null : weight);
        dataToSave.empty = isInverted ? (isNaN(weight) ? null : weight) : null;
        dataToSave.addedBy = currentUser.uid;
        dataToSave.addedAt = new Date();
        strawTrailers.push(dataToSave);
    }

    try {
        await updateDoc(fieldDocRef, { strawTrailers: strawTrailers, lastModified: new Date() });
        showToast("Ramassage de paille enregistré.");
        closeModal();
    } catch (error) {
        console.error("Erreur de sauvegarde de la paille:", error);
        showToast("Une erreur est survenue.");
    }
}

async function handleDeleteStrawTrailer(index) {
    const message = `Êtes-vous sûr de vouloir supprimer cet enregistrement de ramassage ?`;
    showConfirmationModal(message, async () => {
        const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
        const fieldDoc = await getDoc(fieldDocRef);
        const strawTrailers = fieldDoc.data().strawTrailers || [];
        
        // On utilise l'index original stocké sur l'élément pour éviter les erreurs dues à l'inversion du tableau
        const trailerToDelete = strawTrailers[index];
        if (!trailerToDelete) {
            showToast("Erreur: impossible de trouver l'enregistrement à supprimer.");
            return;
        }
        
        const updatedStrawTrailers = strawTrailers.filter((_, i) => i !== index);

        try {
            await updateDoc(fieldDocRef, { strawTrailers: updatedStrawTrailers, lastModified: new Date() });
            showToast('Enregistrement supprimé.');
            // Le onSnapshot sur la page paille se chargera de rafraîchir
        } catch (error) {
            console.error("Erreur de suppression de la paille:", error);
            showToast("La suppression a échoué.");
        }
    });
}

function showStrawTrailerNameManagementModal(callbackOnClose) {
    const trailerListHTML = strawTrailerNames.map(trailer => `
        <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border">
            <span class="font-medium text-slate-800">${trailer.name}</span>
            <div>
                <button class="edit-straw-trailer-name-btn p-2 text-slate-400 hover:text-blue-600" data-id="${trailer.id}" data-name="${trailer.name}"><i data-lucide="pencil"></i></button>
                <button class="delete-straw-trailer-name-btn p-2 text-slate-400 hover:text-red-600" data-id="${trailer.id}" data-name="${trailer.name}"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('') || '<p class="text-center text-sm text-slate-500 py-3">Aucun chariot enregistré.</p>';

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Gérer les chariots</h3>
        <div id="straw-trailer-management-list" class="space-y-2 max-h-48 overflow-y-auto mb-4 p-1">${trailerListHTML}</div>
        <div class="border-t pt-4">
            <label for="new-straw-trailer-name-input" class="block text-sm font-medium text-slate-700 mb-1">Ajouter un chariot</label>
            <div class="flex items-center gap-2">
                <!-- MODIFIÉ : Placeholder changé -->
                <input type="text" id="new-straw-trailer-name-input" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Chariot bleu">
                <button id="add-straw-trailer-name-btn" class="px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shrink-0">Ajouter</button>
            </div>
        </div>
        <div class="mt-6">
            <button id="straw-trailer-management-back-btn" class="w-full px-6 py-3 bg-slate-200 rounded-lg">Retour</button>
        </div>
    `;
    openModal(content);
    lucide.createIcons();
    document.getElementById('straw-trailer-management-back-btn')?.addEventListener('click', callbackOnClose);
    document.getElementById('add-straw-trailer-name-btn')?.addEventListener('click', handleAddNewStrawTrailerName);
    document.getElementById('straw-trailer-management-list')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-straw-trailer-name-btn');
        const deleteBtn = e.target.closest('.delete-straw-trailer-name-btn');
        if (editBtn) showEditStrawTrailerNameModal(editBtn.dataset.id, editBtn.dataset.name, callbackOnClose);
        if (deleteBtn) handleDeleteStrawTrailerName(deleteBtn.dataset.id, deleteBtn.dataset.name);
    });
}

async function handleAddNewStrawTrailerName() {
    const input = document.getElementById('new-straw-trailer-name-input');
    const name = input.value.trim();
    if (!name) return;

    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'strawTrailerNames'), { name });
        showToast(`Chariot "${name}" ajouté.`);
        input.value = '';
    } catch (error) {
        console.error("Error adding straw trailer name:", error);
    }
}

function createFieldCardHTML(field) {
    // La paille n'est plus calculée ici pour alléger l'affichage principal
    const { grainTotals } = calculateTotals(field);
    const farm = userFarms.find(f => f.id === field.farmId);
    const farmName = farm ? farm.name : 'Non assignée';
    const isFinished = field.status === 'finished';
    const hasCrop = field.crop && field.crop.trim() !== '';

    let borderColorClass = 'border-slate-200';
    if (grainTotals.totalCost > 0 && grainTotals.totalWeight > 0) {
        if (grainTotals.margin > 0) borderColorClass = 'border-green-400';
        else if (grainTotals.margin < 0) borderColorClass = 'border-red-400';
        else borderColorClass = 'border-yellow-400';
    }

    // ▼▼▼ CORRECTION APPLIQUÉE ICI (gap-0 -> gap-1) ▼▼▼
    const actionButtonsHTML = isFinished ? `
        <div class="mt-2 pt-2 border-t border-slate-100 text-center">
            <span class="inline-flex items-center gap-2 text-sm font-bold text-green-600">
                <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                Terminé
            </span>
        </div>
    ` : (hasCrop ? `
        <div class="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-slate-100">
            <button class="edit-field-btn p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors" data-key="${field.id}" data-owner-id="${field.ownerId}" title="Modifier" aria-label="Modifier la parcelle">
                <i data-lucide="file-pen-line" class="w-5 h-5"></i>
            </button>
            <button class="delete-field-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" data-key="${field.id}" data-owner-id="${field.ownerId}" title="Supprimer" aria-label="Supprimer la parcelle">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>
    ` : `
        <div class="mt-2 pt-2 border-t border-slate-100 text-center">
            <button class="select-crop-btn w-full text-center bg-green-100 text-green-700 font-bold py-2 rounded-lg hover:bg-green-200 transition-all duration-300 shadow-sm" data-key="${field.id}" data-owner-id="${field.ownerId}">
                Sélectionner une culture
            </button>
        </div>
    `);
    // ▲▲▲ FIN DE LA CORRECTION ▲▲▲

    return `
    <div class="relative bg-white p-4 rounded-xl shadow-sm border-2 ${borderColorClass} flex flex-col h-full justify-between">
        <div class="field-card-content cursor-pointer" data-key="${field.id}" data-owner-id="${field.ownerId}">
            <div class="flex justify-between items-start gap-4">
                <div class="min-w-0">
                    <h3 class="font-bold text-lg text-slate-800 truncate">${field.name}</h3>
                    <p class="text-sm text-slate-500">${field.crop || 'N/A'}</p>
                    <p class="text-xs text-slate-400 mt-1">Ferme: ${farmName}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="font-bold text-lg text-green-600 whitespace-nowrap">${grainTotals.totalWeight.toLocaleString('fr-FR')} kg</p>
                    <p class="text-sm text-slate-500">${(field.size || 0).toLocaleString('fr-FR')} ha</p>
                </div>
            </div>
        </div>
        ${actionButtonsHTML}
    </div>`;
}

function createTrailerCardHTML(trailer, canEdit, addedByName, cropType = 'grain', originalIndex) {
    const isStrawType = cropType === 'straw';
    const isEstimate = trailer.isEstimate === true;
    const displayName = trailer.trailerName || (isStrawType ? 'Chariot' : 'Benne');

    const netWeight = (trailer.full != null && trailer.empty != null) ? trailer.full - trailer.empty : null;
    const isFinalized = trailer.full != null && trailer.empty != null;

    let addedByHTML = '';
    if (addedByName) {
        let dateString = '';
        if (trailer.addedAt && trailer.addedAt.toDate) {
            const date = trailer.addedAt.toDate();
            dateString = ` le ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        addedByHTML = `<p class="text-xs text-slate-400">Ajouté par ${addedByName}${dateString}</p>`;
    }

    const detailsHTML = trailer.details ? `<p class="text-xs text-slate-500 mt-3 italic bg-slate-50 p-2 rounded-md">Note: ${trailer.details}</p>` : '';

    const editControls = canEdit ? `
        <div class="flex items-center">
            <button class="edit-btn p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors" data-index="${originalIndex}" title="Modifier">
                <i data-lucide="file-pen-line" class="w-5 h-5"></i>
            </button>
            <button class="delete-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" data-index="${originalIndex}" title="Supprimer">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
        </div>
    ` : '';

    const weightBreakdownHTML = `
        <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-slate-50 p-2 rounded-lg">
                <p class="text-xs text-slate-500">Poids Plein</p>
                <p class="font-semibold text-slate-700">${trailer.full != null ? trailer.full.toLocaleString('fr-FR') : '---'} kg</p>
            </div>
            <div class="bg-slate-50 p-2 rounded-lg">
                <p class="text-xs text-slate-500">Poids Vide</p>
                <p class="font-semibold text-slate-700">${trailer.empty != null ? trailer.empty.toLocaleString('fr-FR') : '---'} kg</p>
            </div>
        </div>
    `;
    
    // MODIFIÉ : Logique pour afficher le nombre de bottes sous le poids net
    let baleCountHTML = '';
    if (typeof trailer.baleCount === 'number' && trailer.baleCount > 0) {
        baleCountHTML = `<p class="text-sm text-slate-500 mt-1">${trailer.baleCount} bottes</p>`;
    }


    const finalizeButton = canEdit && !isFinalized ? `<button class="finalize-btn w-full bg-blue-500 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-600 transition" data-index="${originalIndex}">Finaliser la pesée</button>` : '';
    const finalizedBadge = isFinalized ? `<div class="w-full flex items-center justify-center gap-2 text-sm font-semibold text-green-600 bg-green-50 p-2 rounded-lg"><i data-lucide="check-circle-2" class="w-5 h-5"></i>Terminé</div>` : '';

    return `
    <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full transition-transform hover:scale-[1.02]">
        <div class="flex-grow">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-lg text-slate-800">${displayName}</h4>
                    ${addedByHTML}
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="font-extrabold text-2xl text-green-600">${netWeight != null ? netWeight.toLocaleString('fr-FR') : '---'}<span class="text-base font-semibold text-slate-500 ml-1">kg</span></p>
                    ${baleCountHTML}
                </div>
            </div>
            <div class="mt-4 space-y-2">
                ${weightBreakdownHTML}
                ${detailsHTML}
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

export function showPaymentModal() {
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Activer toutes les fonctionnalités</h3>
        <p class="text-center text-slate-600 mb-6">L'application Recolt'IQ est désormais entièrement gratuite. Cliquez ci-dessous pour débloquer toutes les fonctionnalités Pro gratuitement et de façon permanente.</p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
            <button id="modal-confirm-upgrade-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow transition">Activer gratuitement</button>
        </div>
    `;
    openModal(content);
    document.getElementById('modal-confirm-upgrade-btn')?.addEventListener('click', async () => {
        // Logique d'upgrade déplacée ici pour être autonome
        if (!currentUser) {
            showToast("Veuillez vous connecter pour activer la version Pro.");
            return;
        }
        try {
            await updateDoc(doc(db, "users", currentUser.uid), { plan: 'pro' });
            showToast("Version Pro activée !");
            window.location.reload(); // Recharger pour appliquer les changements
        } catch (error) {
            showToast("Erreur lors de l'activation.");
        }
        closeModal();
    }, { once: true });
}

export function displayAddFieldPage() {

    navigateToPage('page-add-field');
    const container = document.getElementById('page-add-field');
    if (!container) return;

    const farmOptions = userFarms.map(farm => `<option value="${farm.id}" ${farm.id === currentFarmId ? 'selected' : ''}>${farm.name}</option>`).join('');
    const farmSelectHtml = userFarms.length > 0 ? `
        <div>
            <label for="field-farm-select" class="block text-sm font-medium text-slate-700 mb-1">Ferme associée</label>
            <select id="field-farm-select" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                ${farmOptions}
            </select>
        </div>
    ` : `<p class="text-sm text-red-500 text-center p-3 bg-red-50 rounded-lg">Veuillez d'abord <button id="add-farm-shortcut-btn" class="font-bold underline">créer une ferme</button> pour pouvoir ajouter des parcelles.</p>`;

    const cropOptions = Object.keys(userCropData)
        .sort((a, b) => a.localeCompare(b))
        .map(cropName => `<option value="${cropName}">${cropName.charAt(0).toUpperCase() + cropName.slice(1)}</option>`)
        .join('');

    container.innerHTML = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b border-slate-200 flex items-center lg:static lg:bg-transparent lg:p-0 lg:mb-6">
            <button id="back-from-add-field-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200" aria-label="Retour">
                <i data-lucide="arrow-left"></i>
            </button>
            <h1 class="text-xl font-bold text-slate-800 text-center flex-grow">Ajouter une parcelle pour ${currentYear}</h1>
        </header>
        <div class="p-4 lg:p-0 flex-grow overflow-y-auto">
            <div class="space-y-4">
                ${farmSelectHtml}
                <div>
                    <label for="field-name-input" class="block text-sm font-medium text-slate-700 mb-1">Nom de la parcelle</label>
                    <input type="text" id="field-name-input" placeholder="Ex: Grand Champ" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                </div>
                
                <div>
                    <label for="field-crop-select" class="block text-sm font-medium text-slate-700 mb-1">Culture</label>
                    <select id="field-crop-select" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                        <option value="">Sélectionner une culture...</option>
                        ${cropOptions}
                        <option value="other">Autre (spécifier)...</option>
                    </select>
                </div>

                <div id="straw-collection-container" class="hidden"></div>

                <div id="custom-crop-form" class="hidden space-y-4 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                     <h4 class="text-md font-semibold text-slate-700 text-center">Définir une nouvelle culture</h4>
                     <div>
                        <label for="custom-crop-name" class="block text-sm font-medium text-slate-700 mb-1">Nom de la nouvelle culture</label>
                        <input type="text" id="custom-crop-name" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Sarrasin">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="custom-crop-density" class="block text-sm font-medium text-slate-700 mb-1">Poids Spécifique (PS)</label>
                            <input type="number" id="custom-crop-density" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 78">
                        </div>
                        <div>
                            <label for="custom-crop-coeff" class="block text-sm font-medium text-slate-700 mb-1">Coeff. Tassement</label>
                            <input type="number" step="0.01" id="custom-crop-coeff" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 0.92">
                        </div>
                    </div>
                </div>

                <div>
                    <label for="field-size-input" class="block text-sm font-medium text-slate-700 mb-1">Surface (ha)</label>
                    <input type="number" step="0.01" id="field-size-input" placeholder="Ex: 10.5" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                </div>
                
                <div>
                    <label for="field-replicate-years" class="block text-sm font-medium text-slate-700 mb-1">Dupliquer la parcelle (sans la culture)</label>
                    <select id="field-replicate-years" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition">
                        <option value="0">Ne pas dupliquer</option>
                        <option value="1">Pour les 1 prochaines années</option>
                        <option value="2">Pour les 2 prochaines années</option>
                        <option value="3">Pour les 3 prochaines années</option>
                        <option value="4">Pour les 4 prochaines années</option>
                        <option value="5">Pour les 5 prochaines années</option>
                    </select>
                </div>

                <div>
                    <label for="field-gps-link-input" class="block text-sm font-medium text-slate-700 mb-1">Lien Google Maps (facultatif)</label>
                    <input type="text" id="field-gps-link-input" placeholder="https://maps.app.goo.gl/..." class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                </div>

                <div>
                    <label for="field-notes-input" class="block text-sm font-medium text-slate-700 mb-1">Notes (facultatif)</label>
                    <textarea id="field-notes-input" rows="3" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition" placeholder="Ex: Semis le 15/10, variété..."></textarea>
                </div>
            </div>
            <p id="add-field-page-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
            <div class="mt-8">
                <button id="page-confirm-btn" class="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow transition" ${userFarms.length === 0 ? 'disabled' : ''}>Enregistrer la parcelle</button>
            </div>
        </div>
    `;
    lucide.createIcons();
    
    document.getElementById('back-from-add-field-btn')?.addEventListener('click', () => navigateToPage('page-field-list'));
    document.getElementById('page-confirm-btn')?.addEventListener('click', handleSaveNewField);
    
    const addFarmShortcutBtn = document.getElementById('add-farm-shortcut-btn');
    if (addFarmShortcutBtn) {
        addFarmShortcutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showFarmManagementModal();
        });
    }

    const cropSelect = document.getElementById('field-crop-select');
    const customCropForm = document.getElementById('custom-crop-form');
    if (cropSelect) {
        cropSelect.addEventListener('change', () => {
            customCropForm.classList.toggle('hidden', cropSelect.value !== 'other');
            toggleStrawOptionVisibility(cropSelect.value, 'straw-collection-container');
        });
    }
}

async function handleSaveNewField() {
    const name = document.getElementById('field-name-input').value.trim();
    const size = parseFloat(document.getElementById('field-size-input').value);
    const farmSelect = document.getElementById('field-farm-select');
    const farmId = farmSelect ? farmSelect.value : null;
    const notes = document.getElementById('field-notes-input').value.trim();
    const errorEl = document.getElementById('add-field-page-error');
    let crop = document.getElementById('field-crop-select').value;
    const gpsLink = document.getElementById('field-gps-link-input').value.trim() || null;
    const replicateYears = parseInt(document.getElementById('field-replicate-years').value, 10);
    const collectsStrawToggle = document.getElementById('collects-straw-toggle');
    const collectsStraw = collectsStrawToggle ? collectsStrawToggle.checked : false;

    if (crop === 'other') {
        const customCropName = document.getElementById('custom-crop-name').value.trim();
        const customDensity = parseFloat(document.getElementById('custom-crop-density').value);
        const customCoeff = parseFloat(document.getElementById('custom-crop-coeff').value);

        if (!customCropName || isNaN(customDensity) || isNaN(customCoeff)) {
            if (errorEl) {
                errorEl.textContent = "Veuillez définir correctement la nouvelle culture (nom, PS, coeff).";
                errorEl.classList.remove('hidden');
            }
            return;
        }
        
        crop = customCropName.toLowerCase();
        const newCropData = { density: customDensity, coeff: customCoeff };

        try {
            const customCropDocRef = doc(db, 'users', currentUser.uid, 'customCrops', crop);
            await setDoc(customCropDocRef, newCropData);
            userCropData[crop] = newCropData;
            showToast(`Nouvelle culture "${customCropName}" enregistrée !`);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la culture personnalisée:", error);
            showToast("Erreur de sauvegarde de la nouvelle culture.");
            return;
        }
    }

    if (!name || !crop || isNaN(size) || size <= 0 || !farmId) {
        if (errorEl) {
            errorEl.textContent = "Veuillez remplir tous les champs obligatoires.";
            errorEl.classList.remove('hidden');
        }
        return;
    }
    
    if (errorEl) errorEl.classList.add('hidden');

    try {
        const batch = writeBatch(db);
        const totalYears = 1 + replicateYears;

        for (let i = 0; i < totalYears; i++) {
            const yearForField = currentYear + i;
            
            const fieldData = {
                name,
                size,
                trailers: [],
                ownerId: currentUser.uid,
                accessControlUids: [],
                accessControlMap: {},
                lastModified: new Date(),
                farmId: farmId,
                notes: notes,
                expenses: [],
                gpsLink: gpsLink,
                year: yearForField,
                crop: i === 0 ? crop : '', 
                collectsStraw: i === 0 && isCerealCrop(crop) ? collectsStraw : false
            };
            if (fieldData.collectsStraw) {
                fieldData.strawTrailers = [];
            }

            const newFieldRef = doc(collection(db, 'users', currentUser.uid, 'fields'));
            batch.set(newFieldRef, fieldData);
        }

        await batch.commit();
        showToast(`Parcelle "${name}" ajoutée !`);
        navigateToPage('page-field-list');

    } catch (error) {
        console.error("Error adding field(s):", error);
        showToast("Erreur lors de l'ajout de la ou des parcelle(s).");
    }
}

function showEditStrawTrailerNameModal(id, currentName, callbackOnClose) {
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">Modifier le nom du chariot</h3>
        <input type="text" id="edit-straw-trailer-name-input" class="w-full p-4 border-2 rounded-lg text-lg text-center" value="${currentName}">
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="edit-straw-trailer-name-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="edit-straw-trailer-name-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Enregistrer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('edit-straw-trailer-name-cancel-btn').addEventListener('click', () => showStrawTrailerNameManagementModal(callbackOnClose));
    document.getElementById('edit-straw-trailer-name-confirm-btn').addEventListener('click', async () => {
        const newName = document.getElementById('edit-straw-trailer-name-input').value.trim();
        if (newName) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'strawTrailerNames', id), { name: newName });
            showToast('Nom du chariot mis à jour.');
            showStrawTrailerNameManagementModal(callbackOnClose);
        }
    });
}

function handleDeleteStrawTrailerName(id, name) {
    showConfirmationModal(`Supprimer le chariot "${name}" ?`, async () => {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'strawTrailerNames', id));
        showToast(`Chariot "${name}" supprimé.`);
    });
}

function showEditFieldModal(fieldKey) {
    const field = harvestData[fieldKey];
    if (!field) {
        showToast("Parcelle introuvable pour modification.");
        return;
    }

    const farmOptions = userFarms.map(farm => `<option value="${farm.id}" ${farm.id === field.farmId ? 'selected' : ''}>${farm.name}</option>`).join('');
    const cropOptions = Object.keys(userCropData)
        .sort((a, b) => a.localeCompare(b))
        .map(cropName => `<option value="${cropName}" ${field.crop === cropName ? 'selected' : ''}>${cropName.charAt(0).toUpperCase() + cropName.slice(1)}</option>`)
        .join('');

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Modifier : ${field.name}</h3>
        <div class="space-y-4">
            <div>
                <label for="field-farm-select" class="block text-sm font-medium text-slate-700 mb-1">Ferme associée</label>
                <select id="field-farm-select" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    ${farmOptions}
                </select>
            </div>
             <div>
                <label for="field-name-input" class="block text-sm font-medium text-slate-700 mb-1">Nom de la parcelle</label>
                <input type="text" id="field-name-input" value="${field.name}" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            </div>
            <div>
                <label for="field-crop-select-edit" class="block text-sm font-medium text-slate-700 mb-1">Culture</label>
                <select id="field-crop-select-edit" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                    <option value="">Sélectionner une culture...</option>
                    ${cropOptions}
                    <option value="other">Autre (spécifier)...</option>
                </select>
            </div>
            <div id="custom-crop-form-edit" class="hidden space-y-4 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                 <h4 class="text-md font-semibold text-slate-700 text-center">Définir une nouvelle culture</h4>
                 <div>
                    <label for="custom-crop-name-edit" class="block text-sm font-medium text-slate-700 mb-1">Nom de la nouvelle culture</label>
                    <input type="text" id="custom-crop-name-edit" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Sarrasin">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="custom-crop-density-edit" class="block text-sm font-medium text-slate-700 mb-1">Poids Spécifique (PS)</label>
                        <input type="number" id="custom-crop-density-edit" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 78">
                    </div>
                    <div>
                        <label for="custom-crop-coeff-edit" class="block text-sm font-medium text-slate-700 mb-1">Coeff. Tassement</label>
                        <input type="number" step="0.01" id="custom-crop-coeff-edit" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: 0.92">
                    </div>
                </div>
            </div>
            <div id="straw-collection-container-edit" class="hidden"></div>
            <div>
                <label for="field-size-input" class="block text-sm font-medium text-slate-700 mb-1">Surface (ha)</label>
                <input type="number" step="0.01" id="field-size-input" value="${field.size || ''}" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            </div>
            <div>
                <label for="field-gps-link-input" class="block text-sm font-medium text-slate-700 mb-1">Lien Google Maps (facultatif)</label>
                <input type="text" id="field-gps-link-input" value="${field.gpsLink || ''}" placeholder="https://maps.app.goo.gl/..." class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
            </div>
            <div>
                <label for="field-notes-input" class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea id="field-notes-input" rows="3" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">${field.notes || ''}</textarea>
            </div>
        </div>
        <input type="hidden" id="field-key-input" value="${fieldKey}">
        <p id="add-field-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
            <button id="modal-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow transition">Enregistrer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('modal-confirm-btn')?.addEventListener('click', handleSaveFieldEdit);

    const cropSelectEdit = document.getElementById('field-crop-select-edit');
    const customCropFormEdit = document.getElementById('custom-crop-form-edit');
    if (cropSelectEdit) {
        // Afficher l'option paille au chargement si nécessaire
        toggleStrawOptionVisibility(field.crop, 'straw-collection-container-edit', field.collectsStraw);
        
        // Mettre à jour l'affichage quand la culture change
        cropSelectEdit.addEventListener('change', () => {
            customCropFormEdit.classList.toggle('hidden', cropSelectEdit.value !== 'other');
            toggleStrawOptionVisibility(cropSelectEdit.value, 'straw-collection-container-edit', field.collectsStraw);
        });
    }
}

function showFieldFilesModal(field, isOwner) {
    const files = field.files || [];

    const fileListHTML = files.length > 0 
        ? files.map(file => createFileCardHTML(file, isOwner)).join('')
        : '<p class="text-center text-slate-500 py-4">Aucun fichier pour cette parcelle.</p>';

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Fichiers Associés</h3>
        <div id="modal-file-list" class="space-y-2 max-h-[60vh] overflow-y-auto p-1 no-scrollbar">
            ${fileListHTML}
        </div>
        <button id="modal-close-btn" class="mt-6 w-full px-6 py-3 bg-slate-200 rounded-lg font-semibold">Fermer</button>
    `;

    openModal(content);

    const modalFileList = document.getElementById('modal-file-list');
    if (modalFileList) {
        modalFileList.addEventListener('click', (e) => {
            const fileCard = e.target.closest('.file-card');
            const deleteBtn = e.target.closest('.delete-file-btn');

            // On utilise 'isOwner' pour autoriser la suppression
            if (deleteBtn && isOwner) {
                e.stopPropagation(); 
                handleDeleteFile(deleteBtn);
            } else if (fileCard) {
                handleViewFile(fileCard);
            }
        });
    }
}


function createFileCardHTML(file, isOwner) {
    let iconName = 'file';
    if (file.type.startsWith('image/')) iconName = 'image';
    if (file.type.startsWith('video/')) iconName = 'video';
    if (file.type === 'application/pdf') iconName = 'file-text';

    // Le bouton de suppression n'est créé que si l'utilisateur est le propriétaire
    const deleteButtonHTML = isOwner ? `
        <button class="delete-file-btn absolute top-1 right-1 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                data-path="${file.path}" data-name="${file.name}" title="Supprimer le fichier">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    ` : '';

    return `
        <div class="file-card relative group bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-pointer" 
             data-path="${file.path}" data-type="${file.type}" data-name="${file.name}">
            <div class="flex items-center gap-3">
                <div class="bg-slate-100 p-2 rounded-lg">
                    <i data-lucide="${iconName}" class="w-6 h-6 text-slate-600"></i>
                </div>
                <p class="text-sm font-medium text-slate-800 truncate flex-1">${file.name}</p>
            </div>
            ${deleteButtonHTML}
        </div>
    `;
}


function showUploadFileModal() {
    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Ajouter un Fichier</h3>
        <p class="text-center text-slate-500 text-sm mb-6">Taille maximale : 50 Mo. Formats acceptés : images, vidéos, PDF.</p>
        <div id="upload-form-container">
            <input type="file" id="file-input" class="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100
            "/>
            <p id="upload-error" class="text-red-500 text-sm hidden mt-2"></p>
        </div>
        <div id="upload-progress-container" class="hidden mt-4">
            <p id="upload-progress-label" class="text-sm font-medium text-slate-700 mb-1">Téléchargement...</p>
            <div class="w-full bg-slate-200 rounded-full h-2.5">
                <div id="upload-progress-bar" class="bg-green-600 h-2.5 rounded-full" style="width: 0%"></div>
            </div>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="modal-confirm-upload-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Envoyer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('modal-confirm-upload-btn').addEventListener('click', handleFileUpload);
}

async function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const errorEl = document.getElementById('upload-error');
    const confirmBtn = document.getElementById('modal-confirm-upload-btn');

    if (!file) {
        errorEl.textContent = 'Veuillez sélectionner un fichier.';
        errorEl.classList.remove('hidden');
        return;
    }
    if (file.size > 50 * 1024 * 1024) { // 50 Mo
        errorEl.textContent = 'Le fichier est trop volumineux (max 50 Mo).';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Envoi...';
    
    document.getElementById('upload-form-container').classList.add('hidden');
    document.getElementById('upload-progress-container').classList.remove('hidden');

    // Log values for debugging
    console.log("Current User ID (request.auth.uid):", currentUser.uid);
    console.log("Current Field Owner ID (ownerId):", currentFieldOwnerId);
    console.log("Current Field Key (fieldId):", currentFieldKey);

    const filePath = `field_files/${currentFieldOwnerId}/${currentFieldKey}/${Date.now()}_${file.name}`;
    console.log("Constructed Storage Path:", filePath); // Log the full path

    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const progressBar = document.getElementById('upload-progress-bar');
            progressBar.style.width = progress + '%';
        }, 
        (error) => {
            console.error("Erreur d'upload:", error);
            showToast("Échec de l'envoi du fichier.");
            closeModal();
        }, 
        async () => {
            // MODIFICATION: Do NOT get download URL immediately. Store only the path.
            const fileData = {
                name: file.name,
                // url: downloadURL, // Removed this line
                type: file.type,
                path: filePath, // Store the path
                uploadedAt: new Date().toISOString()
            };
            
            const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
            await updateDoc(fieldDocRef, {
                files: arrayUnion(fileData)
            });
            
            showToast('Fichier ajouté avec succès !');
            closeModal();
        }
    );
}

function showFilterModal() {
    const myFields = Object.values(getOwnFieldsData()).filter(field => field.year === currentYear && (currentFarmId === null || field.farmId === currentFarmId));
    const crops = [...new Set(myFields.map(field => field.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    let filtersHTML = '';
    const allButton = createFilterButton('Toutes', 'all', selectedCrop === null);
    allButton.classList.add('w-full', 'justify-center');
    filtersHTML += allButton.outerHTML;

    crops.forEach(crop => {
        const button = createFilterButton(crop, crop, selectedCrop === crop);
        button.classList.add('w-full', 'justify-center');
        filtersHTML += button.outerHTML;
    });

    // NOUVEAU : Ajout du toggle pour masquer les champs terminés dans la modale
    const hideFinishedToggleHTML = `
        <div class="border-t border-slate-200 pt-4 mt-4">
            <div class="flex items-center justify-between">
                <label for="modal-hide-finished-own-toggle" class="font-medium text-slate-700">Masquer les parcelles terminées</label>
                <input type="checkbox" id="modal-hide-finished-own-toggle" class="toggle-switch" ${hideFinishedOwnFields ? 'checked' : ''}>
            </div>
        </div>
    `;

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Filtrer par culture</h3>
        <div id="modal-filter-options" class="space-y-2">
            ${filtersHTML}
        </div>
        ${hideFinishedToggleHTML}
        <button id="modal-cancel-btn" class="mt-6 w-full px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Fermer</button>
    `;
    openModal(content);
    
    document.getElementById('modal-filter-options')?.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-btn');
        if (!button) return;
        const crop = button.dataset.crop;
        
        selectedCrop = (crop === 'all') ? null : crop;
        // On rafraîchit la modale pour voir la sélection
        showFilterModal(); 
    });

    // NOUVEAU : Ajout de l'écouteur pour le toggle dans la modale
    document.getElementById('modal-hide-finished-own-toggle')?.addEventListener('change', (e) => {
        hideFinishedOwnFields = e.target.checked;
        const desktopToggle = document.getElementById('hide-finished-own-toggle');
        if (desktopToggle) desktopToggle.checked = hideFinishedOwnFields;
        localStorage.setItem(HIDE_FINISHED_OWN_KEY, hideFinishedOwnFields);
    });

    document.getElementById('modal-container').addEventListener('click', function applyFiltersOnClose(e) {
        if (e.target.id === 'modal-backdrop' || e.target.closest('#modal-cancel-btn')) {
            // ▼▼▼ CORRECTION APPLIQUÉE ICI ▼▼▼
            // On appelle directement displayFieldList(), qui se charge de mettre à jour
            // les filtres ET la liste des parcelles.
            displayFieldList();
            // ▲▲▲ FIN DE LA CORRECTION ▲▲▲
            this.removeEventListener('click', applyFiltersOnClose);
        }
    });
}

function showWeightModal(mode, index = -1) {
    const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
    if (!canEdit) {
        showToast("Permission de modification requise pour ajouter une benne.");
        return;
    }

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    getDoc(fieldDocRef).then(fieldDocSnap => {
        if (!fieldDocSnap.exists()) {
            showToast("Erreur : parcelle introuvable.");
            return;
        }
        const field = fieldDocSnap.data();
        const cropName = field.crop ? field.crop.toLowerCase() : '';
        const showBaleCountInput = cropName.includes('lin') || cropName.includes('paille');

        let content = '';
        if (mode === 'full') {
            const trailerOptions = trailerNames.map(t => `<option value="${t.name}" data-weight="${t.defaultEmptyWeight || ''}">${t.name}</option>`).join('');
            const baleInputHTML = showBaleCountInput ? `
                <div>
                    <label for="bale-count-input" class="block text-sm font-medium text-slate-700 mb-1">Nombre de bottes</label>
                    <input type="number" inputmode="numeric" id="bale-count-input" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0">
                </div>` : '';
            
            const addToStockToggleHTML = `
                <div class="flex items-center justify-between mt-4">
                    <span class="text-sm font-medium text-slate-700">Ajouter au stock global</span>
                    <label for="add-to-stock-toggle" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="add-to-stock-toggle" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
            `;

            content = `
                <h3 id="weight-modal-title" class="text-xl font-semibold mb-6 text-center text-slate-800">Nouvelle benne pleine</h3>
                <div class="space-y-4">
                    <div>
                        <label for="trailer-name-select" class="block text-sm font-medium text-slate-700 mb-1">Nom de la benne</label>
                        <div class="flex items-center gap-2">
                            <select id="trailer-name-select" class="w-full p-3 border-2 border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 transition">
                                <option value="" data-weight="">Sélectionner...</option>
                                ${trailerOptions}
                            </select>
                            <button id="manage-trailer-names-btn" class="p-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition shrink-0 shadow-sm" title="Gérer les noms de bennes" aria-label="Gérer les noms de bennes">
                                <i data-lucide="pencil"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="default-weight-container" class="hidden bg-slate-50 p-3 rounded-lg border flex items-center justify-between">
                        <label for="use-default-weight-toggle" class="text-sm font-medium text-slate-700">Utiliser le poids à vide par défaut</label>
                        <input type="checkbox" id="use-default-weight-toggle" class="toggle-switch">
                    </div>
                    <input type="hidden" id="default-empty-weight-value">

                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label for="weight-input" id="weight-label" class="block text-sm font-medium text-slate-700">Poids plein (kg)</label>
                            <button id="invert-weight-btn" class="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition text-xs flex items-center gap-1">
                                <i data-lucide="repeat" class="w-4 h-4"></i> Inverser
                            </button>
                        </div>
                        <input type="number" inputmode="numeric" id="weight-input" data-mode="full" data-inverted="false" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0 kg">
                    </div>
                    ${baleInputHTML}
                    <div>
                        <label for="trailer-details-input" class="block text-sm font-medium text-slate-700 mb-1">Détails (facultatif)</label>
                        <input type="text" id="trailer-details-input" placeholder="Ex: Benne n°1, problème de chargement" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label for="trailer-humidity-input" class="block text-sm font-medium text-slate-700 mb-1">Humidité (%)</label>
                            <input type="number" step="0.01" id="trailer-humidity-input" placeholder="0.00" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                        </div>
                        <div>
                            <label for="trailer-protein-input" class="block text-sm font-medium text-slate-700 mb-1">Protéine (%)</label>
                            <input type="number" step="0.01" id="trailer-protein-input" placeholder="0.00" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                        </div>
                        <div>
                            <label for="trailer-specific-weight-input" class="block text-sm font-medium text-slate-700 mb-1">PS</label>
                            <input type="number" step="0.01" id="trailer-specific-weight-input" placeholder="0.00" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                        </div>
                    </div>
                    ${addToStockToggleHTML}
                </div>
                <p id="weight-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
                <div class="mt-8 grid grid-cols-2 gap-4">
                    <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
                    <button id="modal-confirm-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow transition">Valider</button>
                </div>`;
        } else { // Handles 'empty' or 'finalize' mode
            const trailer = field.trailers[index];
            if (!trailer) {
                showToast("Erreur: benne introuvable.");
                closeModal();
                return;
            }

            const isFullWeightMissing = trailer.full === null || trailer.full === undefined;
            const title = isFullWeightMissing ? "Finaliser : Poids plein" : "Finaliser : Poids à vide";
            const label = isFullWeightMissing ? "Poids plein (kg)" : "Poids vide (kg)";
            const weightType = isFullWeightMissing ? "full" : "empty";

            content = `
                <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">${title}</h3>
                <div>
                    <label for="weight-input" class="block text-sm font-medium text-slate-700 mb-1">${label}</label>
                    <input type="number" inputmode="numeric" id="weight-input" data-mode="update" data-index="${index}" data-weight-type="${weightType}" class="w-full p-4 border-2 border-slate-300 rounded-lg text-xl text-center focus:ring-2 focus:ring-green-500 transition" placeholder="0 kg">
                </div>
                <p id="weight-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
                <div class="mt-8 grid grid-cols-2 gap-4">
                    <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
                    <button id="modal-confirm-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow transition">Valider</button>
                </div>`;
        }
        openModal(content);

        const trailerSelect = document.getElementById('trailer-name-select');
        const defaultWeightContainer = document.getElementById('default-weight-container');
        const defaultWeightToggle = document.getElementById('use-default-weight-toggle');
        const defaultWeightValueInput = document.getElementById('default-empty-weight-value');
        const invertBtn = document.getElementById('invert-weight-btn');

        if (trailerSelect) {
            trailerSelect.addEventListener('change', () => {
                const selectedOption = trailerSelect.options[trailerSelect.selectedIndex];
                const weight = selectedOption.dataset.weight;

                if (weight) {
                    defaultWeightContainer.classList.remove('hidden');
                    defaultWeightValueInput.value = weight;
                    defaultWeightToggle.checked = true;
                } else {
                    defaultWeightContainer.classList.add('hidden');
                    defaultWeightValueInput.value = '';
                    defaultWeightToggle.checked = false;
                }
            });
        }

        if (invertBtn) {
            invertBtn.addEventListener('click', () => {
                const weightInput = document.getElementById('weight-input');
                const weightLabel = document.getElementById('weight-label');
                const modalTitle = document.getElementById('weight-modal-title');
                const isInverted = weightInput.dataset.inverted === 'true';

                if (!isInverted) {
                    weightInput.dataset.inverted = 'true';
                    weightLabel.textContent = 'Poids vide (kg)';
                    modalTitle.textContent = 'Nouvelle benne vide';
                } else {
                    weightInput.dataset.inverted = 'false';
                    weightLabel.textContent = 'Poids plein (kg)';
                    modalTitle.textContent = 'Nouvelle benne pleine';
                }
                lucide.createIcons();
            });
        }

        document.getElementById('manage-trailer-names-btn')?.addEventListener('click', showTrailerNameManagementModal);
        document.getElementById('modal-confirm-btn')?.addEventListener('click', handleConfirmWeight);
    }).catch(error => {
        console.error("Error fetching field for weight modal:", error);
        showToast("Erreur lors de l'ouverture de la modale de pesée.");
    });
}

function showEditModal(index) {
    const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
    if (!canEdit) {
        showToast("Vous n'avez pas les permissions pour modifier cette benne.");
        return;
    }

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    getDoc(fieldDocRef).then(fieldDocSnap => {
        if (!fieldDocSnap.exists()) {
            showToast("Erreur : parcelle introuvable.");
            return;
        }
        const field = fieldDocSnap.data();
        const trailer = field.trailers[index];
        if (!trailer) {
            showToast("Benne introuvable pour modification.");
            return;
        }

        // NOUVEAU: Si la benne est une estimation, ouvrir la modale d'estimation en mode édition
        if (trailer.isEstimate) {
            showEstimationModal('edit', index);
            return;
        }
        
        const cropName = field.crop ? field.crop.toLowerCase() : '';
        const showBaleCountInput = cropName.includes('lin') || cropName.includes('paille');

        const baleCountInputHTML = showBaleCountInput ? `
            <div>
                <label for="edit-bale-count-input" class="block text-sm font-medium text-slate-700">Nombre de bottes</label>
                <input type="number" inputmode="numeric" id="edit-bale-count-input" value="${trailer.baleCount || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 transition">
            </div>
        ` : '';

        const isAddToStockChecked = trailer.addToStock !== false;
        const addToStockToggleHTML = `
            <div class="flex items-center justify-between mt-4">
                <span class="text-sm font-medium text-slate-700">Ajouter au stock global</span>
                <label for="edit-add-to-stock-toggle" class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="edit-add-to-stock-toggle" class="sr-only peer" ${isAddToStockChecked ? 'checked' : ''}>
                    <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>
        `;

        const content = `
            <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Modifier la pesée</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="edit-weight-full" class="block text-sm font-medium text-slate-700">Poids Plein (kg)</label>
                        <input type="number" inputmode="numeric" id="edit-weight-full" data-index="${index}" value="${trailer.full || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 transition">
                    </div>
                    <div>
                        <label for="edit-weight-empty" class="block text-sm font-medium text-slate-700">Poids Vide (kg)</label>
                        <input type="number" inputmode="numeric" id="edit-weight-empty" value="${trailer.empty || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 transition">
                    </div>
                </div>
                ${baleCountInputHTML}
                <div>
                    <label for="edit-trailer-details-input" class="block text-sm font-medium text-slate-700">Détails (facultatif)</label>
                    <input type="text" id="edit-trailer-details-input" value="${trailer.details || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label for="edit-trailer-humidity-input" class="block text-sm font-medium text-slate-700">Humidité (%)</label>
                        <input type="number" step="0.01" id="edit-trailer-humidity-input" value="${trailer.humidity || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                    </div>
                    <div>
                        <label for="edit-trailer-protein-input" class="block text-sm font-medium text-slate-700">Protéine (%)</label>
                        <input type="number" step="0.01" id="edit-trailer-protein-input" value="${trailer.protein || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                    </div>
                    <div>
                        <label for="edit-trailer-specific-weight-input" class="block text-sm font-medium text-slate-700">PS</label>
                        <input type="number" step="0.01" id="edit-trailer-specific-weight-input" value="${trailer.specificWeight || ''}" class="mt-1 w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
                    </div>
                </div>
                ${addToStockToggleHTML}
            </div>
            <div class="mt-8 grid grid-cols-2 gap-4">
                <button id="edit-modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
                <button id="edit-modal-save-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow transition">Enregistrer</button>
            </div>
        `;
        openModal(content);
        document.getElementById('edit-modal-save-btn')?.addEventListener('click', () => handleSaveEdit(index));
    }).catch(error => {
        console.error("Error fetching field for edit modal:", error);
        showToast("Erreur lors de l'ouverture de la modale de modification.");
    });
}

function showTrailerNameManagementModal(callbackOnClose = () => showWeightModal('full')) {
    const trailerListHTML = trailerNames.map(trailer => `
        <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div>
                <span class="font-medium text-slate-800 text-sm">${trailer.name}</span>
                <!-- AFFICHE LE POIDS PAR DÉFAUT SI DÉFINI -->
                <p class="text-xs text-slate-500">${trailer.defaultEmptyWeight ? `Poids à vide : ${trailer.defaultEmptyWeight} kg` : 'Aucun poids par défaut'}</p>
            </div>
            <div class="flex items-center gap-1">
                <button class="edit-trailer-name-btn p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors" data-id="${trailer.id}" data-name="${trailer.name}" data-weight="${trailer.defaultEmptyWeight || ''}" title="Modifier">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
                <button class="delete-trailer-name-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" data-id="${trailer.id}" data-name="${trailer.name}" title="Supprimer">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `).join('') || '<p class="text-center text-sm text-slate-500 py-3">Aucune benne enregistrée.</p>';

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center text-slate-800">Gérer les bennes</h3>
        <div id="trailer-management-list" class="space-y-2 max-h-48 overflow-y-auto mb-4 p-1">${trailerListHTML}</div>
        <div class="border-t border-slate-200 pt-4">
            <h4 class="text-base font-semibold text-slate-700 mb-2">Ajouter une benne</h4>
            <div class="space-y-2">
                 <input type="text" id="new-trailer-name-input" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Ex: Benne Rouge">
                 <!-- NOUVEAU CHAMP POUR LE POIDS À VIDE -->
                 <input type="number" id="new-trailer-weight-input" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Poids à vide par défaut (kg, facultatif)">
            </div>
            <p id="add-trailer-name-error" class="text-red-500 text-sm hidden mt-1"></p>
            <div class="mt-3">
                 <button id="add-trailer-name-confirm-btn" class="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow transition">Ajouter</button>
            </div>
        </div>
        <div class="mt-6">
            <button id="trailer-management-back-btn" class="w-full px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Retour</button>
        </div>
    `;
    openModal(content);
    document.getElementById('trailer-management-back-btn')?.addEventListener('click', callbackOnClose);
    document.getElementById('add-trailer-name-confirm-btn')?.addEventListener('click', handleAddNewTrailerName);
    document.getElementById('trailer-management-list')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-trailer-name-btn');
        const deleteBtn = e.target.closest('.delete-trailer-name-btn');
        if (editBtn) {
            showEditTrailerNameModal(editBtn.dataset.id, editBtn.dataset.name, editBtn.dataset.weight);
        }
        if (deleteBtn) {
            handleDeleteTrailerName(deleteBtn.dataset.id, deleteBtn.dataset.name);
        }
    });
}


function showEditTrailerNameModal(id, currentName, currentWeight) {
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Modifier la benne</h3>
        <div class="space-y-3">
            <div>
                <label for="edit-trailer-name-input" class="block text-sm font-medium text-slate-700 mb-1">Nom de la benne</label>
                <input type="text" id="edit-trailer-name-input" class="w-full p-3 border-2 rounded-lg" value="${currentName}">
            </div>
            <div>
                <label for="edit-trailer-weight-input" class="block text-sm font-medium text-slate-700 mb-1">Poids à vide par défaut (kg)</label>
                <input type="number" id="edit-trailer-weight-input" class="w-full p-3 border-2 rounded-lg" value="${currentWeight}" placeholder="Facultatif">
            </div>
        </div>
        <input type="hidden" id="edit-trailer-name-id" value="${id}">
        <p id="edit-trailer-name-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="edit-trailer-name-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="edit-trailer-name-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Enregistrer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('edit-trailer-name-cancel-btn')?.addEventListener('click', showTrailerNameManagementModal);
    document.getElementById('edit-trailer-name-confirm-btn')?.addEventListener('click', handleUpdateTrailerName);
}

export function showConfirmationModal(message, onConfirm, requireTextInput = false) {
    onConfirmAction = onConfirm;
    const textInputHTML = requireTextInput
        ? `<input type="text" id="confirmation-input" placeholder="Tapez 'supprimer' pour confirmer" class="w-full p-3 mt-4 bg-slate-100 border-2 border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-red-500 transition">`
        : '';

    const content = `
        <div class="text-center p-2">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <i data-lucide="alert-triangle" class="w-7 h-7 text-red-600"></i>
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mt-4">Confirmer l'action</h3>
            <div class="text-sm text-slate-600 mt-2">${message}</div>
            ${textInputHTML}
        </div>
        <div class="mt-6 grid grid-cols-2 gap-4">
            <button id="confirmation-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">Annuler</button>
            <button id="confirmation-confirm-btn" class="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow transition">Confirmer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('confirmation-confirm-btn')?.addEventListener('click', () => {
        if (requireTextInput) {
            const input = document.getElementById('confirmation-input');
            if (input.value.toLowerCase() !== 'supprimer') {
                showToast("Texte de confirmation incorrect.");
                return;
            }
        }
        if (onConfirmAction) onConfirmAction();
        closeModal();
    });
}

/**
 * Handles the deletion of a file from Storage and Firestore.
 * @param {HTMLElement} deleteButton - The button element that was clicked.
 */
function handleDeleteFile(deleteButton) {
    // On vérifie si l'utilisateur actuel est bien le propriétaire de la parcelle affichée
    const isOwner = currentFieldOwnerId === currentUser.uid;
    if (!isOwner) {
        showToast("Seul le propriétaire peut supprimer des fichiers.");
        return;
    }

    const { path, name } = deleteButton.dataset;
    const message = `Êtes-vous sûr de vouloir supprimer le fichier "${name}" ?`;
    
    showConfirmationModal(message, async () => {
        try {
            // 1. Supprimer le fichier de Firebase Storage
            const fileRef = ref(storage, path);
            await deleteObject(fileRef);

            // 2. Supprimer la référence du fichier dans Firestore
            const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
            const fieldDocSnap = await getDoc(fieldDocRef);
            if (fieldDocSnap.exists()) {
                const fieldData = fieldDocSnap.data();
                const files = fieldData.files || [];
                const fileToRemove = files.find(f => f.path === path);
                if (fileToRemove) {
                    await updateDoc(fieldDocRef, {
                        files: arrayRemove(fileToRemove)
                    });
                }
            }
            showToast("Fichier supprimé.");
            // La modale se ferme automatiquement si elle est ouverte
            closeModal();
        } catch (error) {
            console.error("Erreur de suppression du fichier:", error);
            showToast("Impossible de supprimer le fichier.");
        }
    });
}

async function handleViewFile(fileCard) {
    const { path, type, name } = fileCard.dataset;

    // --- DÉBUT DU DÉBOGAGE ---
    console.log("--- Début du débogage handleViewFile ---");
    console.log("Fichier demandé :", name);
    console.log("Chemin du fichier dans Storage :", path);

    // Extraction des IDs depuis le chemin pour vérification
    const pathParts = path.split('/');
    if (pathParts.length >= 4) {
        const ownerIdFromPath = pathParts[1];
        const fieldIdFromPath = pathParts[2];
        console.log("Propriétaire (depuis le chemin) :", ownerIdFromPath);
        console.log("Parcelle ID (depuis le chemin) :", fieldIdFromPath);
    } else {
        console.warn("Le chemin du fichier ne semble pas avoir le format attendu.");
    }

    // Affichage des informations de l'utilisateur et de la parcelle actuellement sélectionnée
    console.log("Utilisateur actuel (currentUser.uid) :", currentUser ? currentUser.uid : "Non défini");
    console.log("Propriétaire de la parcelle affichée (currentFieldOwnerId) :", currentFieldOwnerId || "Non défini");
    console.log("ID de la parcelle affichée (currentFieldKey) :", currentFieldKey || "Non défini");
    console.log("--- Fin du débogage ---");
    // --- FIN DU DÉBOGAGE ---

    let url;
    try {
        showToast("Chargement du fichier...");
        url = await getDownloadURL(ref(storage, path));
        console.log("URL de téléchargement obtenue avec succès :", url);
    } catch (error) {
        console.error("Error getting download URL:", error);
        showToast(`Erreur de permission (storage/unauthorized). Vérifiez les logs de la console (F12).`);
        return;
    }

    if (type === 'application/pdf') {
        const modalContentHTML = `
            <div id="pdf-viewer-container" class="w-full h-[85vh] bg-slate-200 flex flex-col rounded-t-xl lg:rounded-xl overflow-hidden">
                <div id="pdf-controls" class="flex-shrink-0 bg-slate-700 text-white p-2 flex items-center justify-center gap-4 shadow-md z-10">
                    <button id="pdf-prev" class="px-3 py-1 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50" disabled>&lt; Précédent</button>
                    <span>Page <span id="pdf-page-num">1</span> / <span id="pdf-page-count">...</span></span>
                    <button id="pdf-next" class="px-3 py-1 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50" disabled>Suivant &gt;</button>
                    <div class="border-l border-slate-500 h-6 mx-2"></div>
                    <button id="pdf-zoom-out" class="p-1 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50" title="Zoom arrière"><i data-lucide="zoom-out" class="w-5 h-5"></i></button>
                    <span id="pdf-zoom-level" class="w-16 text-center">150%</span>
                    <button id="pdf-zoom-in" class="p-1 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50" title="Zoom avant"><i data-lucide="zoom-in" class="w-5 h-5"></i></button>
                </div>
                <div id="pdf-render-area" class="flex-grow overflow-auto text-center p-4">
                    <canvas id="pdf-canvas"></canvas>
                    <div id="pdf-loading-spinner" class="text-slate-600">Chargement du document...</div>
                </div>
            </div>
        `;
        openModal(modalContentHTML);
        
        if (modalContent) {
            modalContent.classList.remove('max-w-lg');
            modalContent.classList.add('max-w-7xl', 'w-full', 'p-0');
            modalContent.style.maxWidth = '80rem';
        }

        const pdfUrl = url;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

        let pdfDoc = null;
        let pageNum = 1;
        let scale = 1.5;
        const zoomStep = 0.25;
        const minZoom = 0.5;
        const maxZoom = 3.0;

        const renderPage = (num, newScale) => {
            scale = newScale;
            pdfDoc.getPage(num).then(page => {
                const canvas = document.getElementById('pdf-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const viewport = page.getViewport({ scale: scale });
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = { canvasContext: ctx, viewport: viewport };
                page.render(renderContext);
                
                document.getElementById('pdf-page-num').textContent = num;
                document.getElementById('pdf-zoom-level').textContent = `${Math.round(scale * 100)}%`;
                
                document.getElementById('pdf-prev').disabled = num <= 1;
                document.getElementById('pdf-next').disabled = num >= pdfDoc.numPages;
                document.getElementById('pdf-zoom-out').disabled = scale <= minZoom;
                document.getElementById('pdf-zoom-in').disabled = scale >= maxZoom;
            });
        };

        pdfjsLib.getDocument(pdfUrl).promise.then(doc => {
            pdfDoc = doc;
            document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
            document.getElementById('pdf-loading-spinner').style.display = 'none';
            renderPage(pageNum, scale);
        }).catch(err => {
            console.error('Erreur de chargement du PDF:', err);
            document.getElementById('pdf-render-area').innerHTML = '<p class="text-red-500 p-4">Impossible de charger le document PDF.</p>';
        });

        document.getElementById('pdf-prev').addEventListener('click', () => {
            if (pageNum <= 1) return;
            pageNum--;
            renderPage(pageNum, scale);
        });

        document.getElementById('pdf-next').addEventListener('click', () => {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            renderPage(pageNum, scale);
        });

        document.getElementById('pdf-zoom-in').addEventListener('click', () => {
            if (scale >= maxZoom) return;
            const newScale = Math.min(maxZoom, scale + zoomStep);
            renderPage(pageNum, newScale);
        });

        document.getElementById('pdf-zoom-out').addEventListener('click', () => {
            if (scale <= minZoom) return;
            const newScale = Math.max(minZoom, scale - zoomStep);
            renderPage(pageNum, newScale);
        });

        return;
    }

    let content = '';
    if (type.startsWith('image/')) {
        content = `<img src="${url}" class="max-w-full max-h-[80vh] mx-auto rounded-lg">`;
    } else if (type.startsWith('video/')) {
        content = `<video controls autoplay class="max-w-full max-h-[80vh] mx-auto rounded-lg">
                        <source src="${url}" type="${type}">
                        Votre navigateur ne supporte pas la lecture de vidéos.
                   </video>`;
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
    }
    
    const modalContentHTML = `
        <div class="relative">
            ${content}
            <button id="modal-close-btn" class="absolute -top-3 -right-3 h-8 w-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-600 transition-colors">&times;</button>
        </div>
    `;
    openModal(modalContentHTML);
}


// --- Actions & Event Handlers ---
function showAddTrailerChoiceModal() {
    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center text-slate-800">Ajouter une benne</h3>
        <p class="text-center text-slate-500 mb-6">Comment souhaitez-vous enregistrer cette benne ?</p>
        <div class="space-y-3">
            <button id="add-by-weight-btn" class="w-full flex items-center justify-center gap-3 p-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all shadow-md">
                <i data-lucide="scale" class="w-6 h-6"></i>
                <span>Pesée Normale</span>
            </button>
            <button id="add-by-estimation-btn" class="w-full flex items-center justify-center gap-3 p-4 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-all shadow-md">
                <i data-lucide="calculator" class="w-6 h-6"></i>
                <span>Estimation de Poids</span>
            </button>
        </div>
        <button id="modal-cancel-btn" class="mt-8 w-full text-center text-sm text-slate-600 hover:underline">Annuler</button>
    `;
    openModal(content);
    lucide.createIcons();

    document.getElementById('add-by-weight-btn').addEventListener('click', () => {
        showWeightModal('full');
    });
    document.getElementById('add-by-estimation-btn').addEventListener('click', () => {
        showEstimationModal('new');
    });
}

function getSuggestedCropData(cropName) {
    const defaults = { density: 75, coeff: 0.90, marketPrice: 200 };
    if (!cropName) return defaults;

    const sourceData = (userCropData && Object.keys(userCropData).length > 0) ? userCropData : CROP_DATA;

    const name = cropName.toLowerCase();
    if (sourceData[name]) {
        return sourceData[name];
    }
    
    for (const key in sourceData) {
        if (name.includes(key)) {
            return sourceData[key];
        }
    }
    return defaults;
}

// MODIFICATION: La culture est maintenant pré-remplie et non modifiable
async function showEstimationModal(mode = 'new', index = -1) {
    const isEdit = mode === 'edit';
    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDoc = await getDoc(fieldDocRef);
    if (!fieldDoc.exists()) {
        showToast("Erreur : parcelle introuvable.");
        return;
    }
    const field = fieldDoc.data();
    const trailerToEdit = isEdit ? field.trailers[index] : null;

    const cropName = field.crop || 'Culture inconnue';
    const suggestedData = getSuggestedCropData(cropName);
    const initialParams = trailerToEdit?.estimationParams || {};

    const trailerOptions = trailerNames.map(t => `<option value="${t.name}" ${trailerToEdit && trailerToEdit.trailerName === t.name ? 'selected' : ''}>${t.name}</option>`).join('');

    const content = `
        <h3 class="text-xl font-semibold mb-2 text-center text-slate-800">${isEdit ? 'Modifier l\'estimation' : 'Estimer le poids'}</h3>
        <p class="text-center text-purple-600 font-bold mb-6 text-lg">${cropName}</p>
        
        <div class="space-y-4">
             <div>
                <label for="est-trailer-name-select" class="block text-sm font-medium text-slate-700 mb-1">Nom de la benne</label>
                <div class="flex items-center gap-2">
                    <select id="est-trailer-name-select" class="w-full p-3 border-2 border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 transition">
                        <option value="">Sélectionner...</option>
                        ${trailerOptions}
                    </select>
                    <button id="manage-trailer-names-btn-est" class="p-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition shrink-0 shadow-sm" title="Gérer les noms de bennes">
                        <i data-lucide="pencil"></i>
                    </button>
                </div>
            </div>
            <div>
                <label for="est-volume" class="block text-sm font-medium text-slate-700 mb-1">Volume de la benne (m³)</label>
                <input type="number" id="est-volume" value="${initialParams.volume || ''}" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition" placeholder="Ex: 30">
            </div>
            <div>
                <label for="est-density" class="block text-sm font-medium text-slate-700 mb-1">Poids spécifique (PS en kg/hL)</label>
                 <div class="flex items-center gap-3">
                    <input type="range" id="est-density" min="40" max="90" step="1" value="${initialParams.density || suggestedData.density}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600">
                    <span id="est-density-value" class="font-bold text-purple-600 w-12 text-center">${initialParams.density || suggestedData.density}</span>
                </div>
            </div>
            <div>
                <label for="est-fill-level" class="block text-sm font-medium text-slate-700 mb-1">Niveau de remplissage (%)</label>
                <div class="flex items-center gap-3">
                    <input type="range" id="est-fill-level" min="10" max="130" step="5" value="${initialParams.fillLevel || 100}" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600">
                    <span id="est-fill-level-value" class="font-bold text-purple-600 w-12 text-center">${initialParams.fillLevel || 100}%</span>
                </div>
            </div>
        </div>

        <div class="mt-6 p-4 bg-purple-50 rounded-lg text-center border border-purple-200">
            <p class="text-sm text-purple-700">Poids net estimé</p>
            <p id="est-result-text" class="text-3xl font-bold text-purple-800 mt-1">0 kg</p>
        </div>
        
        <p id="est-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-8 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Annuler</button>
            <button id="modal-confirm-estimation-btn" class="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow transition">Enregistrer</button>
        </div>
    `;
    openModal(content);

    const volumeInput = document.getElementById('est-volume');
    const densityInput = document.getElementById('est-density');
    const densityValue = document.getElementById('est-density-value');
    const fillLevelInput = document.getElementById('est-fill-level');
    const fillLevelValue = document.getElementById('est-fill-level-value');
    const resultText = document.getElementById('est-result-text');

    const calculateAndUpdate = () => {
        const volume = parseFloat(volumeInput.value) || 0;
        const density = parseFloat(densityInput.value) || 0;
        const fillLevel = parseFloat(fillLevelInput.value) || 0;
        const cropData = getSuggestedCropData(cropName);
        
        // Poids (kg) = Volume (m³) * Densité (kg/hL) * 10 * Coeff * (Remplissage / 100)
        const estimatedWeight = volume * density * 10 * cropData.coeff * (fillLevel / 100);
        
        resultText.textContent = `${Math.round(estimatedWeight).toLocaleString('fr-FR')} kg`;
    };

    densityInput.addEventListener('input', () => {
        densityValue.textContent = `${densityInput.value}`;
        calculateAndUpdate();
    });

    fillLevelInput.addEventListener('input', () => {
        fillLevelValue.textContent = `${fillLevelInput.value}%`;
        calculateAndUpdate();
    });
    volumeInput.addEventListener('input', calculateAndUpdate);

    document.getElementById('manage-trailer-names-btn-est').addEventListener('click', () => showTrailerNameManagementModal(() => showEstimationModal(mode, index)));
    document.getElementById('modal-confirm-estimation-btn').addEventListener('click', () => handleSaveEstimation(index));

    // Calcul initial
    calculateAndUpdate();
}


// CORRECTION: Assure que la sauvegarde de la modification d'une estimation utilise bien la nouvelle valeur calculée.
async function handleSaveEstimation(index = -1) {
    const isEdit = index !== -1;
    const errorEl = document.getElementById('est-modal-error');

    // Récupérer toutes les valeurs de la modale
    const trailerNameSelect = document.getElementById('est-trailer-name-select');
    const trailerName = trailerNameSelect.value;
    const volume = parseFloat(document.getElementById('est-volume').value);
    const density = parseFloat(document.getElementById('est-density').value);
    const fillLevel = parseFloat(document.getElementById('est-fill-level').value);

    // Récupérer le tableau des bennes et la culture directement depuis la BDD pour garantir la fraîcheur des données
    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDocSnap = await getDoc(fieldDocRef);
    if (!fieldDocSnap.exists()) {
        showToast("Erreur : parcelle introuvable.");
        return;
    }
    const field = fieldDocSnap.data();
    const trailers = field.trailers || [];
    const crop = field.crop; // Utilise la culture de la parcelle

    // Valider les entrées
    if (!trailerName || !crop || isNaN(volume) || volume <= 0 || isNaN(density) || density <= 0 || isNaN(fillLevel) || fillLevel <= 0) {
        errorEl.textContent = "Veuillez remplir tous les champs avec des valeurs valides.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    // Utiliser la formule de calcul correcte avec le coefficient
    const cropData = getSuggestedCropData(crop);
    const estimatedWeight = Math.round(volume * density * 10 * cropData.coeff * (fillLevel / 100));

    // Préparer les données de la benne à sauvegarder
    const trailerData = {
        full: estimatedWeight, // Sauvegarder le poids CORRECTEMENT calculé
        empty: 0,
        isEstimate: true,
        estimationParams: { volume, density, fillLevel, crop }, // Sauvegarder la culture utilisée pour le calcul
        trailerName: trailerName,
        addToStock: true // Par défaut, les estimations sont ajoutées au stock
    };

    if (isEdit) {
        // Fusionner avec les données originales pour ne pas perdre d'informations (comme les détails, la qualité, etc.)
        const originalTrailer = trailers[index];
        trailers[index] = { 
            ...originalTrailer, 
            ...trailerData,
            // S'assurer que les métadonnées ne sont pas écrasées
            addedBy: originalTrailer.addedBy,
            addedAt: originalTrailer.addedAt
        };
    } else {
        // Ajouter les métadonnées pour une nouvelle benne
        trailerData.addedBy = currentUser.uid;
        trailerData.addedAt = new Date();
        trailers.push(trailerData);
    }
    
    try {
        await updateDoc(fieldDocRef, { trailers: trailers, lastModified: new Date() });
        showToast('Estimation enregistrée.');
        closeModal();
    } catch (error) {
        showToast("Erreur de synchronisation.");
        console.error("Firestore update error:", error);
    }
}


function showYieldCalculatorModal() {
    if (!currentFieldOwnerId || !currentFieldKey) return;

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    getDoc(fieldDocRef).then(fieldDocSnap => {
        if (!fieldDocSnap.exists()) {
            showToast("Erreur: parcelle introuvable.");
            return;
        }
        const field = fieldDocSnap.data();
        // CORRECTION : Déstructuration correcte pour obtenir grainTotals
        const { grainTotals } = calculateTotals(field);
        // Assurer que totalWeight est un nombre pour éviter les erreurs
        const totalWeight = grainTotals.totalWeight || 0;

        const content = `
            <h3 class="text-xl font-semibold mb-4 text-center">Calculateur de Rendement</h3>
            <div class="space-y-4">
                <div class="bg-slate-100 p-3 rounded-lg text-center">
                    <p class="text-sm text-slate-600">Poids total actuel</p>
                    <p class="text-2xl font-bold text-slate-800">${totalWeight.toLocaleString('fr-FR')} kg</p>
                </div>
                <div>
                    <label for="harvested-area-input" class="block text-sm font-medium text-slate-700 mb-1">Surface actuellement récoltée (ha)</label>
                    <input type="number" step="0.01" id="harvested-area-input" placeholder="Ex: 5.5" class="w-full p-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 transition">
                </div>
                <div id="yield-result-container" class="hidden bg-green-100 p-3 rounded-lg text-center border border-green-200">
                    <p class="text-sm text-green-700">Rendement estimé</p>
                    <p id="yield-result-text" class="text-2xl font-bold text-green-800"></p>
                </div>
            </div>
            <div class="mt-6 grid grid-cols-2 gap-4">
                <button id="modal-close-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Fermer</button>
                <button id="calculate-yield-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">Calculer</button>
            </div>
        `;
        openModal(content);

        document.getElementById('calculate-yield-btn').addEventListener('click', () => {
            const areaInput = document.getElementById('harvested-area-input');
            const area = parseFloat(areaInput.value);
            if (isNaN(area) || area <= 0) {
                showToast("Veuillez entrer une surface valide.");
                return;
            }
            const yieldValue = (totalWeight / area) / 100; // in qx/ha
            document.getElementById('yield-result-text').textContent = `${yieldValue.toFixed(2)} qx/ha`;
            document.getElementById('yield-result-container').classList.remove('hidden');
        });
    }).catch(error => {
        console.error("Erreur lors du chargement des données de la parcelle pour le calcul du rendement :", error);
        showToast("Une erreur est survenue lors du chargement des données.");
    });
}

async function handleSaveFieldEdit() {
    const name = document.getElementById('field-name-input').value.trim();
    let crop = document.getElementById('field-crop-select-edit').value.trim();
    const size = parseFloat(document.getElementById('field-size-input').value);
    const farmSelect = document.getElementById('field-farm-select');
    const farmId = farmSelect ? farmSelect.value : null;
    const fieldKey = document.getElementById('field-key-input').value;
    const notes = document.getElementById('field-notes-input').value.trim();
    const errorEl = document.getElementById('add-field-modal-error');
    const gpsLink = document.getElementById('field-gps-link-input').value.trim() || null;
    const collectsStrawToggle = document.getElementById('collects-straw-toggle');
    const collectsStraw = collectsStrawToggle ? collectsStrawToggle.checked : false;

    if (crop === 'other') {
        const customCropName = document.getElementById('custom-crop-name-edit').value.trim();
        const customDensity = parseFloat(document.getElementById('custom-crop-density-edit').value);
        const customCoeff = parseFloat(document.getElementById('custom-crop-coeff-edit').value);

        if (!customCropName || isNaN(customDensity) || isNaN(customCoeff)) {
            if (errorEl) {
                errorEl.textContent = "Veuillez définir correctement la nouvelle culture (nom, PS, coeff).";
                errorEl.classList.remove('hidden');
            }
            return;
        }
        
        crop = customCropName.toLowerCase();
        const newCropData = { density: customDensity, coeff: customCoeff };

        try {
            const customCropDocRef = doc(db, 'users', currentUser.uid, 'customCrops', crop);
            await setDoc(customCropDocRef, newCropData);
            userCropData[crop] = newCropData;
            showToast(`Nouvelle culture "${customCropName}" enregistrée !`);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la culture personnalisée:", error);
            showToast("Erreur de sauvegarde de la nouvelle culture.");
            return;
        }
    }

    if (!name || !crop || isNaN(size) || size <= 0 || !farmId) {
        errorEl.textContent = "Veuillez remplir tous les champs obligatoires.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    try {
        const fieldDocRef = doc(db, 'users', currentUser.uid, 'fields', fieldKey);
        const fieldDoc = await getDoc(fieldDocRef);
        const existingField = fieldDoc.data();

        const updateData = { 
            name, crop, size, lastModified: new Date(),
            farmId: farmId,
            notes: notes,
            gpsLink: gpsLink,
            collectsStraw: isCerealCrop(crop) ? collectsStraw : false
        };

        if (updateData.collectsStraw && !existingField.collectsStraw) {
            updateData.strawTrailers = [];
        } else if (!updateData.collectsStraw && existingField.collectsStraw) {
            updateData.strawTrailers = deleteField();
        }

        await updateDoc(fieldDocRef, updateData);
        showToast(`Parcelle "${name}" modifiée !`);
        closeModal();
    } catch (error) {
        console.error("Error updating field:", error);
        showToast("Erreur lors de la modification.");
    }
}

async function handleConfirmWeight() {
    const weightInput = document.getElementById('weight-input');
    const errorEl = document.getElementById('weight-modal-error');
    const weight = parseFloat(weightInput.value);
    const mode = weightInput.dataset.mode;
    const index = parseInt(weightInput.dataset.index);

    if (isNaN(weight) || weight < 0) {
        errorEl.textContent = "Veuillez entrer un poids valide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
    if (!canEdit) {
        showToast("Permissions insuffisantes.");
        return;
    }

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDocSnap = await getDoc(fieldDocRef);
    if (!fieldDocSnap.exists()) {
        showToast("Erreur : parcelle introuvable.");
        return;
    }

    const fieldData = fieldDocSnap.data();
    const trailers = fieldData.trailers || [];

    if (mode === 'full') {
        const isInverted = weightInput.dataset.inverted === 'true';
        const trailerSelect = document.getElementById('trailer-name-select');
        const trailerName = trailerSelect.value;
        if (!trailerName) {
            errorEl.textContent = "Veuillez sélectionner un nom de benne.";
            errorEl.classList.remove('hidden');
            return;
        }
        const addToStock = document.getElementById('add-to-stock-toggle').checked;
        
        const useDefaultWeight = document.getElementById('use-default-weight-toggle')?.checked || false;
        const defaultEmptyWeight = parseFloat(document.getElementById('default-empty-weight-value').value);

        let fullWeight = null;
        let emptyWeight = null;

        if (isInverted) {
            emptyWeight = weight;
        } else {
            fullWeight = weight;
            if (useDefaultWeight && !isNaN(defaultEmptyWeight)) {
                emptyWeight = defaultEmptyWeight;
            }
        }

        const newTrailer = {
            full: fullWeight, 
            empty: emptyWeight, 
            trailerName: trailerName, 
            baleCount: 0,
            humidity: null, 
            protein: null, 
            specificWeight: null, 
            details: null,
            addToStock: addToStock,
            addedBy: currentUser.uid,
            addedAt: new Date(),
            isEstimate: false
        };

        const details = document.getElementById('trailer-details-input').value.trim();
        if (details) newTrailer.details = details;
        const humidity = parseFloat(document.getElementById('trailer-humidity-input').value);
        if (!isNaN(humidity)) newTrailer.humidity = humidity;
        const protein = parseFloat(document.getElementById('trailer-protein-input').value);
        if (!isNaN(protein)) newTrailer.protein = protein;
        const specificWeight = parseFloat(document.getElementById('trailer-specific-weight-input').value);
        if (!isNaN(specificWeight)) newTrailer.specificWeight = specificWeight;
        const baleCountInput = document.getElementById('bale-count-input');
        if (baleCountInput) {
            const baleCount = parseInt(baleCountInput.value);
            if (!isNaN(baleCount)) newTrailer.baleCount = baleCount;
        }
        
        trailers.push(newTrailer);

    } else if (mode === 'update' && index >= 0 && trailers[index]) {
        const weightType = weightInput.dataset.weightType;
        if (weightType) {
            trailers[index][weightType] = weight;
        }
    }

    try {
        await updateDoc(fieldDocRef, { trailers: trailers, lastModified: new Date() });
        showToast('Pesée enregistrée.');
        closeModal();
    } catch (error) {
        showToast("Erreur de synchronisation.");
        console.error("Firestore update error:", error);
    }
}

async function handleSaveEdit(index) {
    const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
    if (!canEdit) {
        showToast("Permissions insuffisantes.");
        return;
    }

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDocSnap = await getDoc(fieldDocRef);
    if (!fieldDocSnap.exists()) {
        showToast("Erreur : parcelle introuvable.");
        return;
    }

    const fieldData = fieldDocSnap.data();
    const trailers = fieldData.trailers || [];
    const trailer = trailers[index];
    if (!trailer) {
        showToast("Benne introuvable.");
        return;
    }

    // Si c'est une estimation, la logique est gérée par handleSaveEstimation,
    // qui est appelée par la modale d'estimation. Cette fonction ne devrait
    // être appelée que pour les pesées manuelles.
    if (trailer.isEstimate) {
        console.error("handleSaveEdit a été appelé pour une estimation, ce qui ne devrait pas arriver.");
        return;
    }

    const newFull = parseFloat(document.getElementById('edit-weight-full').value);
    const newEmpty = parseFloat(document.getElementById('edit-weight-empty').value);
    const addToStock = document.getElementById('edit-add-to-stock-toggle').checked;

    trailer.full = !isNaN(newFull) && newFull > 0 ? newFull : null;
    trailer.empty = !isNaN(newEmpty) && newEmpty >= 0 ? newEmpty : null;
    
    const newBaleCountInput = document.getElementById('edit-bale-count-input');
    if (newBaleCountInput) {
        const newBaleCount = parseInt(newBaleCountInput.value);
        trailer.baleCount = !isNaN(newBaleCount) && newBaleCount >= 0 ? newBaleCount : 0;
    }

    trailer.details = document.getElementById('edit-trailer-details-input').value.trim() || null;
    const humidity = parseFloat(document.getElementById('edit-trailer-humidity-input').value);
    trailer.humidity = !isNaN(humidity) ? humidity : null;
    const protein = parseFloat(document.getElementById('edit-trailer-protein-input').value);
    trailer.protein = !isNaN(protein) ? protein : null;
    const specificWeight = parseFloat(document.getElementById('edit-trailer-specific-weight-input').value);
    trailer.specificWeight = !isNaN(specificWeight) ? specificWeight : null;
    trailer.addToStock = addToStock;

    try {
        await updateDoc(fieldDocRef, { trailers: trailers, lastModified: new Date() });
        showToast('Benne modifiée.');
        closeModal();
    } catch (error) {
        showToast("Erreur de synchronisation.");
        console.error("Firestore update error:", error);
    }
}

async function handleDeleteTrailer(index) {
    const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
    if (!canEdit) {
        showToast("Permissions insuffisantes.");
        return;
    }

    const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
    const fieldDocSnap = await getDoc(fieldDocRef);
    if (!fieldDocSnap.exists()) {
        showToast("Erreur : parcelle introuvable.");
        return;
    }

    const trailers = fieldDocSnap.data().trailers || [];
    const trailer = trailers[index];
    if (!trailer) {
        showToast("Benne introuvable.");
        return;
    }

    const message = `Êtes-vous sûr de vouloir supprimer la pesée de "${trailer.trailerName || 'cette benne'}" ?`;
    showConfirmationModal(message, async () => {
        const updatedTrailers = trailers.filter((_, i) => i !== index);
        try {
            await updateDoc(fieldDocRef, { trailers: updatedTrailers, lastModified: new Date() });
            showToast('Pesée supprimée.');
        } catch (error) {
            showToast("Erreur de suppression.");
            console.error("Firestore delete error:", error);
        }
    });
}

async function handleAddNewTrailerName() {
    const nameInput = document.getElementById('new-trailer-name-input');
    const weightInput = document.getElementById('new-trailer-weight-input');
    const name = nameInput.value.trim();
    const defaultEmptyWeight = parseFloat(weightInput.value);
    const errorEl = document.getElementById('add-trailer-name-error');

    if (!name) {
        errorEl.textContent = "Le nom ne peut pas être vide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const dataToSave = { name };
    if (!isNaN(defaultEmptyWeight) && defaultEmptyWeight > 0) {
        dataToSave.defaultEmptyWeight = defaultEmptyWeight;
    }

    try {
        await addDoc(collection(db, 'users', currentUser.uid, 'trailerNames'), dataToSave);
        showToast(`Benne "${name}" ajoutée.`);
        showTrailerNameManagementModal();
    } catch (error) {
        console.error("Error adding trailer name:", error);
        showToast("Erreur lors de l'ajout.");
    }
}

// REMPLACEZ la fonction handleUpdateTrailerName
async function handleUpdateTrailerName() {
    const nameInput = document.getElementById('edit-trailer-name-input');
    const weightInput = document.getElementById('edit-trailer-weight-input');
    const id = document.getElementById('edit-trailer-name-id').value;
    const newName = nameInput.value.trim();
    const newWeight = parseFloat(weightInput.value);
    const errorEl = document.getElementById('edit-trailer-name-error');

    if (!newName) {
        errorEl.textContent = "Le nom ne peut pas être vide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const dataToUpdate = { name: newName };
    if (!isNaN(newWeight) && newWeight > 0) {
        dataToUpdate.defaultEmptyWeight = newWeight;
    } else {
        dataToUpdate.defaultEmptyWeight = deleteField(); // Supprime le champ s'il est vide ou invalide
    }

    try {
        await updateDoc(doc(db, 'users', currentUser.uid, 'trailerNames', id), dataToUpdate);
        showToast(`Benne mise à jour.`);
        showTrailerNameManagementModal();
    } catch (error) {
        console.error("Error updating trailer name:", error);
        showToast("Erreur lors de la mise à jour.");
    }
}

function handleDeleteTrailerName(id, name) {
    const message = `Êtes-vous sûr de vouloir supprimer le nom de benne "${name}" ?`;
    showConfirmationModal(message, async () => {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'trailerNames', id));
            showToast(`Benne "${name}" supprimée.`);
            showTrailerNameManagementModal();
        } catch (error) {
            console.error("Error deleting trailer name:", error);
            showToast("Erreur lors de la suppression.");
        }
    });
}

function handleShareFilteredFields() {
    // ▼▼▼ CORRECTION : Utilisation de getOwnFieldsData() pour obtenir une liste simple des parcelles de l'utilisateur. ▼▼▼
    // Cela garantit que nous travaillons avec la même base de données que celle affichée à l'écran.
    const myFields = Object.values(getOwnFieldsData()).filter(field => 
        field.year === currentYear && (currentFarmId === null || field.farmId === currentFarmId)
    );

    // Le reste de la logique de filtrage par culture est maintenant correct car elle s'applique à la bonne liste.
    const filteredFields = (selectedCrop === null)
        ? myFields
        : myFields.filter(field => field.crop === selectedCrop);
    // ▲▲▲ FIN DE LA CORRECTION ▲▲▲

    if (filteredFields.length === 0) {
        showToast("Aucune parcelle à partager pour le filtre actuel.");
        return;
    }

    const fieldIds = filteredFields.map(field => field.id);
    const cropsForModal = selectedCrop ? [selectedCrop] : []; 
    showMultiShareOptionsModal(fieldIds, cropsForModal);
}

function updateYearDisplay() {
    if (currentYearDisplay) {
        currentYearDisplay.textContent = currentYear;
    }
}

function setupYearSelectorListeners() {
    prevYearBtn.addEventListener('click', () => {
        currentYear--;
        updateYearDisplay();
        displayFieldList();
        displayCropFilters();
    });
    nextYearBtn.addEventListener('click', () => {
        currentYear++;
        updateYearDisplay();
        displayFieldList();
        displayCropFilters();
    });
}

function setupEventListeners() {
    // Cette garde empêche d'attacher les écouteurs plusieurs fois
    if (areNavListenersInitialized) {
        return;
    }
    console.log("TRACE HARVEST: setupEventListeners() est appelé.");

    const prevBtn = document.getElementById('prev-year-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentYear--;
            updateYearDisplay();
            displayFieldList();
        });
    }

    const financialSummaryButton = document.getElementById('financial-summary-btn');
    if (financialSummaryButton) {
        financialSummaryButton.addEventListener('click', () => {
            navigateToPage('page-financial-summary');
            displayFinancialSummaryPage();
        });
    }

    const nextBtn = document.getElementById('next-year-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentYear++;
            updateYearDisplay();
            displayFieldList();
        });
    }

    const backBtn = document.getElementById('back-to-list-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            navigateToPage(lastListPage);
        });
    }

    const addFieldButton = document.getElementById('add-field-btn');
    if (addFieldButton) {
        addFieldButton.addEventListener('click', displayAddFieldPage);
    }

    const shareFilteredButton = document.getElementById('share-filtered-btn');
    if (shareFilteredButton) {
        shareFilteredButton.addEventListener('click', handleShareFilteredFields);
    }

    const statsButton = document.getElementById('stats-btn');
    if (statsButton) {
        statsButton.addEventListener('click', showGlobalStats);
    }

    const shareDetailsBtn = document.getElementById('share-field-details-btn');
    if (shareDetailsBtn) {
        shareDetailsBtn.addEventListener('click', () => {
            if (currentFieldKey && currentFieldOwnerId === currentUser.uid) {
                generateShareLink(currentFieldKey);
            } else {
                showToast("Vous ne pouvez partager que vos propres parcelles.");
            }
        });
    }

    const exportBtn = document.getElementById('nav-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    const myFilterModalBtn = document.getElementById('open-my-filter-modal-btn');
    if (myFilterModalBtn) {
        myFilterModalBtn.addEventListener('click', showFilterModal);
    }
    
    const hideFinishedToggle = document.getElementById('hide-finished-own-toggle');
    if (hideFinishedToggle) {
        // Appliquer l'état lu depuis la BDD au démarrage
        hideFinishedToggle.checked = hideFinishedOwnFields;

        // Ajouter l'écouteur pour les changements
        hideFinishedToggle.addEventListener('change', (e) => {
            hideFinishedOwnFields = e.target.checked; // 1. Mettre à jour l'état local
            saveHideFinishedPreference(hideFinishedOwnFields); // 2. Sauvegarder dans la BDD (en arrière-plan)
            displayFieldList(); // 3. Rafraîchir immédiatement la liste des parcelles
        });
    }

    const changeFarmButton = document.getElementById('change-farm-btn');
    if (changeFarmButton) {
        changeFarmButton.addEventListener('click', showFarmManagementModal);
    }
    
    const addTrailerMobileBtn = document.getElementById('add-trailer-btn-mobile');
    if (addTrailerMobileBtn) {
        addTrailerMobileBtn.addEventListener('click', () => {
            const canEdit = currentFieldKey && (currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit'));
            if (canEdit) {
                showAddTrailerChoiceModal();
            } else {
                showToast("Permission de modification requise pour cette action.");
            }
        });
    }

    document.body.addEventListener('click', (e) => {
        const yieldBtn = e.target.closest('#yield-calculator-btn');
        if (yieldBtn) {
            showYieldCalculatorModal();
            return;
        }

        const addFileBtn = e.target.closest('#add-file-btn');
        if (addFileBtn) {
            showUploadFileModal();
            return;
        }

        const viewFilesBtn = e.target.closest('#view-files-btn');
        if (viewFilesBtn) {
            const fieldDocRef = doc(db, "users", currentFieldOwnerId, "fields", currentFieldKey);
            getDoc(fieldDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    showFieldFilesModal(docSnap.data(), currentFieldOwnerId === currentUser.uid);
                }
            });
            return;
        }

        const fileCard = e.target.closest('.file-card');
        if (fileCard && !e.target.closest('.delete-file-btn')) {
            handleViewFile(fileCard);
            return;
        }
        
        const deleteFileBtn = e.target.closest('.delete-file-btn');
        if (deleteFileBtn) {
            e.stopPropagation();
            handleDeleteFile(deleteFileBtn);
            return;
        }

        const addTrailerDesktopBtn = e.target.closest('#add-trailer-btn-desktop');
        if (addTrailerDesktopBtn) {
             const canEdit = currentFieldKey && (currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit'));
            if (canEdit) {
                showAddTrailerChoiceModal();
            } else {
                showToast("Permission de modification requise pour cette action.");
            }
        }
    });

    if (fieldListContainer) {
        fieldListContainer.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-field-btn');
            const deleteBtn = e.target.closest('.delete-field-btn');
            const cardContent = e.target.closest('.field-card-content');
            const selectCropBtn = e.target.closest('.select-crop-btn');
            
            if (editBtn) {
                e.stopPropagation();
                if (editBtn.dataset.ownerId === currentUser.uid) showEditFieldModal(editBtn.dataset.key);
            } else if (deleteBtn) {
                e.stopPropagation();
                if (deleteBtn.dataset.ownerId === currentUser.uid) handleDeleteField(deleteBtn.dataset.key);
            } else if (selectCropBtn) {
                e.stopPropagation();
                if (selectCropBtn.dataset.ownerId === currentUser.uid) showEditFieldModal(selectCropBtn.dataset.key);
            } else if (cardContent) {
                displayFieldDetails(cardContent.dataset.key, cardContent.dataset.ownerId);
            }
        });
    }

    if (trailersListContainer) {
        trailersListContainer.addEventListener('click', (e) => {
            const finalizeBtn = e.target.closest('.finalize-btn');
            const editBtn = e.target.closest('.edit-btn');
            const deleteBtn = e.target.closest('.delete-btn');
            
            const canEdit = currentFieldOwnerId === currentUser.uid || (currentFieldAccessControl && currentFieldAccessControl[currentUser.uid] === 'edit');
            if (!canEdit) {
                if(finalizeBtn || editBtn || deleteBtn) showToast("Permissions insuffisantes.");
                return;
            }

            if (finalizeBtn) showWeightModal('empty', parseInt(finalizeBtn.dataset.index));
            if (editBtn) showEditModal(parseInt(editBtn.dataset.index));
            if (deleteBtn) handleDeleteTrailer(parseInt(deleteBtn.dataset.index));
        });
    }

    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target.id === 'modal-backdrop') closeModal();
        });
    }

    areNavListenersInitialized = true;
}

async function saveHideFinishedPreference(value) {
    if (!currentUser) return; // Sécurité pour s'assurer que l'utilisateur est connecté
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
            hideFinishedOwnFields: value
        });
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la préférence 'masquer les parcelles terminées' :", error);
        // Pas de toast pour l'utilisateur, c'est une action d'arrière-plan.
    }
}

async function handleDeleteField(fieldKey) {
    const field = harvestData[fieldKey];
    if (!field || field.ownerId !== currentUser.uid) {
        showToast("Action non autorisée ou parcelle introuvable.");
        return;
    }

    const fieldName = field.name;
    
    const itemsToDelete = ['pesées', 'partages'];
    if (field.files && field.files.length > 0) {
        itemsToDelete.push('fichiers associés');
    }
    
    const confirmationMessage = `
        Êtes-vous sûr de vouloir supprimer la parcelle <strong>${fieldName}</strong> ? 
        Cette action est irréversible et supprimera toutes ses données (${itemsToDelete.join(', ')}).
    `;

    showConfirmationModal(confirmationMessage, async () => {
        try {
            const fieldDocRef = doc(db, 'users', currentUser.uid, 'fields', fieldKey);
            
            // Récupérer les informations sur les fichiers à supprimer avant de supprimer la parcelle
            const fieldDocSnap = await getDoc(fieldDocRef);
            let filesToDeletePaths = [];
            if (fieldDocSnap.exists() && fieldDocSnap.data().files) {
                filesToDeletePaths = fieldDocSnap.data().files.map(f => f.path).filter(Boolean);
            }

            // Supprimer les fichiers associés de Firebase Storage
            const deleteFilePromises = filesToDeletePaths.map(path => {
                const fileStorageRef = ref(storage, path);
                return deleteObject(fileStorageRef);
            });
            
            await Promise.all(deleteFilePromises);
            
            // Supprimer le document de la parcelle dans Firestore
            await deleteDoc(fieldDocRef);

            showToast(`La parcelle "${fieldName}" a été supprimée.`);
            
        } catch (error) {
            console.error("Erreur de suppression de la parcelle :", error);
            if (error.code === 'storage/object-not-found') {
                 showToast("Parcelle supprimée, mais certains fichiers n'existaient plus.");
            } else {
                 showToast("Une erreur est survenue lors de la suppression.");
            }
        }
    });
}

export function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('toast-enter');
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('hidden');
    }, 3000);
}

export function createFilterButton(text, crop, isActive) {
    const button = document.createElement('button');
    button.className = `filter-btn whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors border ${isActive ? 'bg-green-600 text-white border-green-600 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`;
    button.textContent = text;
    button.dataset.crop = crop;
    return button;
}

export function calculateTotals(field) {
    const defaultTotals = {
        grainTotals: { totalWeight: 0, yield: 0, totalCost: 0, margin: 0, avgHumidity: 0, avgProtein: 0, avgSpecificWeight: 0, hasQualityData: false },
        strawTotals: { totalBaleCount: 0, baleYield: 0, totalWeight: 0, yieldInTonsPerHa: 0 },
        baleTotals: { totalBaleCount: 0, yieldInTonsPerHa: 0, avgBaleWeight: 0, baleYieldPerHa: 0 }
    };

    if (!field) return defaultTotals;

    const validTrailers = (field.trailers || []).filter(t => t && typeof t === 'object');
    const validStrawTrailers = (field.strawTrailers || []).filter(t => t && typeof t === 'object');
    const validExpenses = (field.expenses || []).filter(e => e && typeof e === 'object');

    // ▼▼▼ CORRECTION APPLIQUÉE ICI ▼▼▼
    const totalWeight = validTrailers.reduce((sum, t) => {
        if (t.addToStock !== false) {
            const netWeight = t.isEstimate ? (t.full || 0) : ((typeof t.full === 'number' && typeof t.empty === 'number') ? t.full - t.empty : 0);
            return sum + netWeight;
        }
        return sum;
    }, 0);
    // ▲▲▲ FIN DE LA CORRECTION ▲▲▲
    
    const grainYield = (field.size > 0) ? (totalWeight / field.size) / 100 : 0;
    
    const totalCost = validExpenses.reduce((sum, expense) => {
        if (expense.unit === 'per_ha' && field.size > 0) {
            return sum + ((expense.amount || 0) * field.size);
        }
        if (expense.unit !== 'per_ha') {
             return sum + (expense.amount || 0);
        }
        return sum;
    }, 0);

    const cropData = getSuggestedCropData(field.crop);
    const totalRevenue = (totalWeight / 1000) * (cropData.marketPrice || 0);
    const margin = totalRevenue - totalCost;
    
    // ... (le reste de la fonction est inchangé)

    const qualityData = { humidity: [], protein: [], specificWeight: [] };
    validTrailers.forEach(t => {
        if (typeof t.humidity === 'number') qualityData.humidity.push(t.humidity);
        if (typeof t.protein === 'number') qualityData.protein.push(t.protein);
        if (typeof t.specificWeight === 'number') qualityData.specificWeight.push(t.specificWeight);
    });

    const calculateAverage = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const avgHumidity = calculateAverage(qualityData.humidity);
    const avgProtein = calculateAverage(qualityData.protein);
    const avgSpecificWeight = calculateAverage(qualityData.specificWeight);
    const hasQualityData = qualityData.humidity.length > 0 || qualityData.protein.length > 0 || qualityData.specificWeight.length > 0;

    const totalStrawWeight = validStrawTrailers.reduce((sum, t) => {
        const netWeight = (typeof t.full === 'number' && typeof t.empty === 'number') ? t.full - t.empty : 0;
        return sum + netWeight;
    }, 0);

    const totalBaleCountStraw = validStrawTrailers.reduce((sum, t) => sum + (Number(t.baleCount) || 0), 0);
    const baleYield = (field.size > 0) ? totalBaleCountStraw / field.size : 0;
    const strawYieldInTonsPerHa = (field.size > 0) ? (totalStrawWeight / 1000) / field.size : 0;

    const totalBaleCount = validTrailers.reduce((sum, t) => sum + (Number(t.baleCount) || 0), 0);
    const yieldInTonsPerHa = (field.size > 0) ? (totalWeight / 1000) / field.size : 0;
    const avgBaleWeight = totalBaleCount > 0 ? totalWeight / totalBaleCount : 0;
    const baleYieldPerHa = (field.size > 0) ? totalBaleCount / field.size : 0;

    return {
        grainTotals: { totalWeight, yield: grainYield, totalCost, margin, avgHumidity, avgProtein, avgSpecificWeight, hasQualityData },
        strawTotals: { totalBaleCount: totalBaleCountStraw, baleYield, totalWeight: totalStrawWeight, yieldInTonsPerHa: strawYieldInTonsPerHa },
        baleTotals: { totalBaleCount, yieldInTonsPerHa, avgBaleWeight, baleYieldPerHa }
    };
}

function showGlobalStats() {
    // Étape 1: Récupérer la liste des parcelles de l'utilisateur pour l'année et la ferme courantes.
    const fieldsToShow = Object.values(getOwnFieldsData()).filter(field =>
        field.year === currentYear &&
        (currentFarmId === null || field.farmId === currentFarmId)
    );

    // Étape 2: Appliquer le filtre de culture si un est sélectionné.
    const filteredFields = (selectedCrop === null)
        ? fieldsToShow
        : fieldsToShow.filter(field => field.crop === selectedCrop);

    // Étape 3: Vérifier s'il y a des parcelles à analyser.
    if (filteredFields.length === 0) {
        showToast("Aucune parcelle à analyser pour les filtres actuels.");
        return;
    }

    // Étape 4: Calculer les totaux à partir de la liste filtrée.
    let totalWeight = 0, totalArea = 0, totalBales = 0;
    filteredFields.forEach(field => {
        totalArea += field.size || 0;
        const { grainTotals } = calculateTotals(field);
        totalWeight += grainTotals.totalWeight || 0;
        totalBales += grainTotals.totalBaleCount || 0;
    });

    const globalYield = totalArea > 0 ? (totalWeight / totalArea) / 100 : 0;
    
    // Déterminer si une culture de type "balle" (foin, lin) est présente dans la sélection
    const hasBaleCrop = filteredFields.some(field => field.crop && (field.crop.toLowerCase().includes('lin') || field.crop.toLowerCase().includes('foin')));

    // Étape 5: Construire et afficher la modale avec les résultats.
    let summaryHTML = `
        <div class="flex justify-between items-center bg-slate-100 p-3 rounded-lg"><span class="font-medium text-slate-700">Surface Totale</span><span class="font-bold text-slate-800">${totalArea.toLocaleString('fr-FR')} ha</span></div>
        <div class="flex justify-between items-center bg-slate-100 p-3 rounded-lg"><span class="font-medium text-slate-700">Poids Total</span><span class="font-bold text-slate-800">${totalWeight.toLocaleString('fr-FR')} kg</span></div>
    `;

    if (hasBaleCrop) {
        summaryHTML += `<div class="flex justify-between items-center bg-slate-100 p-3 rounded-lg"><span class="font-medium text-slate-700">Total Bottes</span><span class="font-bold text-slate-800">${totalBales.toLocaleString('fr-FR')}</span></div>`;
    } else {
        summaryHTML += `<div class="flex justify-between items-center bg-slate-100 p-3 rounded-lg"><span class="font-medium text-slate-700">Rendement Moyen</span><span class="font-bold text-slate-800">${globalYield.toFixed(2)} qx/ha</span></div>`;
    }

    const modalTitle = selectedCrop ? `Statistiques pour : <span class="font-semibold">${selectedCrop}</span>` : "Statistiques pour la sélection actuelle";

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center text-slate-800">Statistiques de ${currentYear}</h3>
        <p class="text-sm text-center text-slate-600 mb-6">${modalTitle}</p>
        <div class="space-y-3">${summaryHTML}</div>
        <div class="mt-8"><button id="stats-modal-close-btn" class="w-full px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition">Fermer</button></div>
    `;
    openModal(content);
}

// harvest.js

// Les objets de style 'excelStyles' et la fonction 'applyStyles' restent les mêmes.
const excelStyles = {
    title: { font: { name: 'Arial', sz: 18, bold: true, color: { rgb: "15803d" } } },
    subtitle: { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: "475569" } } },
    url: { font: { name: 'Calibri', sz: 10, color: { rgb: "2563eb" }, underline: true } },
    header: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "16a34a" } },
        alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    },
    subHeader: {
        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: "1e293b" } },
        fill: { fgColor: { rgb: "f1f5f9" } },
        border: { bottom: { style: 'medium', color: { rgb: "94a3b8" } } }
    },
    totalRow: {
        font: { name: 'Calibri', sz: 11, bold: true },
        fill: { fgColor: { rgb: "e2e8f0" } },
        border: { top: { style: 'thin', color: { rgb: "94a3b8" } } }
    },
    cell: {
        font: { name: 'Calibri', sz: 11 },
        border: { top: { style: 'thin', color: { rgb: "e5e7eb" } }, bottom: { style: 'thin', color: { rgb: "e5e7eb" } }, left: { style: 'thin', color: { rgb: "e5e7eb" } }, right: { style: 'thin', color: { rgb: "e5e7eb" } } }
    },
    cellEven: {
        font: { name: 'Calibri', sz: 11 },
        fill: { fgColor: { rgb: "f9fafb" } },
        border: { top: { style: 'thin', color: { rgb: "e5e7eb" } }, bottom: { style: 'thin', color: { rgb: "e5e7eb" } }, left: { style: 'thin', color: { rgb: "e5e7eb" } }, right: { style: 'thin', color: { rgb: "e5e7eb" } } }
    },
    currency: { numFmt: "#,##0.00 €" },
    number: { numFmt: "#,##0.00" },
    integer: { numFmt: "#,##0" },
    qx: { numFmt: "0.00\" qx/ha\"" },
    positive: { font: { color: { rgb: "15803d" } } },
    negative: { font: { color: { rgb: "dc2626" } } },
    center: { alignment: { horizontal: 'center' } },
    right: { alignment: { horizontal: 'right' } }
};

const applyStyles = (base, ...additions) => {
    const combined = JSON.parse(JSON.stringify(base));
    for (const addition of additions) {
        if (!addition) continue;
        if (addition.font) combined.font = { ...combined.font, ...addition.font };
        if (addition.fill) combined.fill = { ...combined.fill, ...addition.fill };
        if (addition.alignment) combined.alignment = { ...combined.alignment, ...addition.alignment };
        if (addition.border) combined.border = { ...combined.border, ...addition.border };
        if (addition.numFmt) combined.numFmt = addition.numFmt;
    }
    return combined;
};

async function exportToExcel(externalData = null, titleOverride = '') {
    showToast("Génération de l'export Excel en cours...");

    try {
        const fieldsToExport = externalData ? externalData : Object.values(getOwnFieldsData()).filter(field =>
            field.year === currentYear &&
            (currentFarmId === null || field.farmId === currentFarmId) &&
            (selectedCrop === null || field.crop === selectedCrop)
        );

        if (fieldsToExport.length === 0) {
            showToast(`Aucune donnée à exporter.`);
            return;
        }
        if (typeof XLSX === 'undefined') {
            showToast("Erreur: La librairie d'exportation n'est pas chargée.");
            return;
        }

        // --- 1. Création du contenu du fichier Excel ---
        const wb = XLSX.utils.book_new();
        const sortedFields = fieldsToExport.sort((a,b) => a.name.localeCompare(b.name));
        const farmName = currentFarmId ? userFarms.find(f => f.id === currentFarmId)?.name : 'Toutes les fermes';
        
        let recapAOA = [
            ["Recolt'IQ - Récapitulatif de Récolte"],
            [titleOverride || `Export pour ${userProfile.name || 'N/A'} - Année ${currentYear}`],
            [`Ferme: ${farmName} | Culture: ${selectedCrop || 'Toutes'} | Date: ${new Date().toLocaleDateString('fr-FR')}`],
            [],
            ["Parcelle", "Culture", "Surface (ha)", "Poids Total (kg)", "Rendement", "Coût Total (€)", "Revenu Estimé (€)", "Marge Estimée (€)", "Marge/ha (€)"]
        ];
        
        // ... (Le reste de la logique de construction du workbook reste identique)
        
        const fileName = `${titleOverride.replace(/ /g, '_') || 'Export_RecoltIQ'}_${currentYear}_${new Date().toISOString().slice(0,10)}.xlsx`;

        // --- 2. Gérer la sortie (logique de partage/téléchargement) ---
        const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isIos() && navigator.share) {
            const excelArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const excelBlob = new Blob([excelArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const excelFile = new File([excelBlob], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            
            if (navigator.canShare && navigator.canShare({ files: [excelFile] })) {
                try {
                    await navigator.share({ files: [excelFile], title: `Export Récolte ${currentYear}` });
                } catch (error) {
                    if (error.name !== 'AbortError') throw error;
                }
            } else {
                XLSX.writeFile(wb, fileName);
            }
        } else {
            XLSX.writeFile(wb, fileName);
        }

    } catch (error) {
        console.error("ERREUR LORS DE L'EXPORT EXCEL :", error);
        showToast("Erreur lors de la génération de l'export.");
    }
}

async function displayFinancialSummaryPage() {
    const container = document.getElementById('page-financial-summary');
    if (!container) return;

    // Affiche une structure de base pendant le chargement
    container.innerHTML = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b flex items-center lg:static lg:bg-transparent lg:p-0 lg:mb-6">
            <button id="back-from-summary-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button>
            <h1 class="text-xl font-bold text-slate-800 ml-2">Synthèse Financière ${currentYear}</h1>
        </header>
        <div class="p-4 lg:p-0">
            <div id="structural-charges-section">
                <p class="text-slate-500 text-center py-4">Chargement des charges de structure...</p>
            </div>
            <div id="financial-summary-content" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <p class="text-slate-500 col-span-full text-center py-4">Calcul des synthèses en cours...</p>
            </div>
        </div>
    `;
    lucide.createIcons();
    document.getElementById('back-from-summary-btn').addEventListener('click', () => navigateToPage('page-field-list'));

    // --- 1. Récupération et affichage des charges de structure ---
    const chargesContainer = document.getElementById('structural-charges-section');
    const chargeDocRef = doc(db, 'users', currentUser.uid, 'structuralCharges', String(currentYear));
    const chargeDocSnap = await getDoc(chargeDocRef);
    const chargesData = chargeDocSnap.exists() ? chargeDocSnap.data() : {};
    
    const chargeTypes = [
        { id: 'amortissements', label: 'Amortissements' }, { id: 'assurances', label: 'Assurances' },
        { id: 'prelevements', label: 'Prélèvements privés' }, { id: 'fermages', label: 'Fermages' },
        { id: 'energie', label: 'Électricité, carburant...' }, { id: 'autres', label: 'Autres charges' }
    ];
    
    chargesContainer.innerHTML = `
        <div class="structural-charges-container">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Charges de Structure</h2>
            <div class="structural-charges-list">
                ${chargeTypes.map(c => `<div class="charge-item"><label for="${c.id}">${c.label}</label><input type="number" id="${c.id}" class="charge-input" placeholder="0" value="${chargesData[c.id] || ''}"></div>`).join('')}
                <div class="charge-total">
                    <span>TOTAL CHARGES DE STRUCTURE</span>
                    <span id="structural-total">0,00 €</span>
                </div>
            </div>
        </div>
    `;

    const updateTotal = () => {
        let total = 0;
        chargesContainer.querySelectorAll('.charge-input').forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        document.getElementById('structural-total').textContent = total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
        return total;
    };
    
    chargesContainer.addEventListener('input', updateTotal);
    chargesContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('charge-input')) handleSaveStructuralCharge(e.target.id, e.target.value);
    });
    
    const totalStructuralCharges = updateTotal(); // Calcul initial

    // --- 2. Calcul et affichage de la synthèse par culture ---
    const summaryContainer = document.getElementById('financial-summary-content');
    const fieldsThisYear = Object.values(getOwnFieldsData()).filter(f => f.year === currentYear);
    const totalCultivatedArea = fieldsThisYear.reduce((sum, f) => sum + (f.size || 0), 0);
    const structuralChargePerHa = totalCultivatedArea > 0 ? totalStructuralCharges / totalCultivatedArea : 0;
    
    const salesData = await getSalesData();
    const salesThisYear = Object.values(salesData).flatMap(cd => cd.sales).filter(s => s.harvestYear === currentYear);
    const performanceByCrop = {};

    fieldsThisYear.forEach(field => {
        const crop = field.crop || 'Inconnue';
        if (!performanceByCrop[crop]) performanceByCrop[crop] = { area: 0, cost: 0, soldWeight: 0, revenue: 0, harvestedWeight: 0 };
        const { grainTotals } = calculateTotals(field);
        performanceByCrop[crop].harvestedWeight += grainTotals.totalWeight;
        performanceByCrop[crop].area += field.size || 0;
        performanceByCrop[crop].cost += grainTotals.totalCost;
    });

    salesThisYear.forEach(sale => {
        if (!performanceByCrop[sale.crop]) return;
        performanceByCrop[sale.crop].soldWeight += sale.quantityKg || 0;
        performanceByCrop[sale.crop].revenue += (sale.quantityKg / 1000) * (sale.pricePerTonne || 0);
    });

    for (const crop in performanceByCrop) {
        const d = performanceByCrop[crop];
        const remainingStockKg = d.harvestedWeight - d.soldWeight;
        let stockValue = 0;
        if (remainingStockKg > 0) stockValue = (remainingStockKg / 1000) * (getSuggestedCropData(crop).marketPrice || 0);
        
        const totalRevenue = d.revenue + stockValue;
        d.marginBrutePerHa = d.area > 0 ? (totalRevenue - d.cost) / d.area : 0;
        d.marginNettePerHa = d.marginBrutePerHa - structuralChargePerHa;
    }

    const crops = Object.keys(performanceByCrop).sort();
    if (crops.length === 0) {
        summaryContainer.innerHTML = '<p class="text-slate-500 col-span-full text-center py-4">Aucune culture à analyser pour cette année.</p>';
    } else {
        summaryContainer.innerHTML = crops.map(crop => {
            const data = performanceByCrop[crop];
            const netMarginColor = data.marginNettePerHa >= 0 ? 'text-green-600' : 'text-red-600';
            
            return `
                <div class="summary-card clickable" data-crop="${crop}">
                    <div class="summary-card-header">
                        <h4 class="font-bold text-lg text-slate-800">${crop}</h4>
                    </div>
                    <div class="summary-card-body space-y-2 text-sm">
                         <div class="flex justify-between"><span class="text-slate-500">Marge Brute/ha</span><span class="font-semibold">${data.marginBrutePerHa.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</span></div>
                         <div class="flex justify-between"><span class="text-slate-500">Charges Structure/ha</span><span class="font-semibold text-red-500">-${structuralChargePerHa.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</span></div>
                    </div>
                    <div class="summary-card-footer">
                        <span>Marge Nette/ha</span>
                        <span class="${netMarginColor}">${data.marginNettePerHa.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    const newContainer = summaryContainer.cloneNode(true);
    summaryContainer.parentNode.replaceChild(newContainer, summaryContainer);
    newContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.summary-card');
        if (card) showCropFinancialDetailsModal(card.dataset.crop, currentYear);
    });
}

async function showCropFinancialDetailsModal(cropName, year) {
    const allFields = Object.values(getOwnFieldsData());
    const salesData = await getSalesData();
    const fieldsForCrop = allFields.filter(f => f.year === year && f.crop === cropName);
    const salesForCrop = (salesData[cropName]?.sales || []).filter(s => s.harvestYear === year);

    let totalArea = 0, totalHarvestedWeight = 0;
    const uniqueExpensesMap = new Map();
    fieldsForCrop.forEach(field => {
        totalArea += field.size || 0;
        totalHarvestedWeight += calculateTotals(field).grainTotals.totalWeight;
        (field.expenses || []).forEach(exp => { if (exp.id && !uniqueExpensesMap.has(exp.id)) uniqueExpensesMap.set(exp.id, exp); });
    });
    const uniqueExpenses = Array.from(uniqueExpensesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalCost = uniqueExpenses.reduce((sum, exp) => sum + (exp.unit === 'per_ha' ? (exp.amount || 0) * totalArea : (exp.amount || 0)), 0);
    const soldWeight = salesForCrop.reduce((sum, s) => sum + (s.quantityKg || 0), 0);
    const realRevenue = salesForCrop.reduce((sum, s) => sum + ((s.quantityKg / 1000) * (s.pricePerTonne || 0)), 0);
    const remainingStockKg = totalHarvestedWeight - soldWeight;
    let estimatedStockValue = 0;
    if (remainingStockKg > 0) estimatedStockValue = (remainingStockKg / 1000) * (getSuggestedCropData(cropName).marketPrice || 0);
    const totalRevenue = realRevenue + estimatedStockValue;
    const totalMargin = totalRevenue - totalCost;
    const marginPerHa = totalArea > 0 ? totalMargin / totalArea : 0;
    const marginColor = marginPerHa >= 0 ? 'text-green-600' : 'text-red-600';

    const expensesListHTML = uniqueExpenses.length > 0 ? uniqueExpenses.map(exp => `
        <div class="flex items-center justify-between p-2.5 border-b last:border-b-0">
            <div class="flex-1 min-w-0"><p class="font-medium truncate">${exp.type}</p><p class="text-xs text-slate-500">${new Date(exp.date).toLocaleDateString('fr-FR')}</p></div>
            <p class="font-semibold mx-4">${exp.amount.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}${exp.unit==='per_ha'?'/ha':''}</p>
            <div class="flex-shrink-0"><button class="edit-expense-btn p-2 text-slate-400 hover:text-blue-600 rounded-full" data-expense='${JSON.stringify(exp)}'><i data-lucide="pencil"></i></button><button class="delete-expense-btn p-2 text-slate-400 hover:text-red-600 rounded-full" data-expense='${JSON.stringify(exp)}'><i data-lucide="trash-2"></i></button></div>
        </div>`).join('') : '<p class="text-sm text-slate-500 text-center py-4">Aucune dépense globale enregistrée.</p>';

    const content = `
        <h3 class="text-2xl font-bold mb-1 text-center">${cropName} - ${year}</h3>
        <p class="text-center text-slate-500 mb-6">Synthèse financière détaillée</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-slate-50 p-3 rounded-lg text-center border"><h4 class="text-xs font-medium">Surface</h4><p class="text-lg font-bold">${totalArea.toLocaleString('fr-FR')} ha</p></div>
            <div class="bg-slate-50 p-3 rounded-lg text-center border"><h4 class="text-xs font-medium">Coût Total</h4><p class="text-lg font-bold">${totalCost.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</p></div>
            <div class="bg-slate-50 p-3 rounded-lg text-center border"><h4 class="text-xs font-medium">Marge Totale</h4><p class="text-lg font-bold ${marginColor}">${totalMargin.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</p></div>
            <div class="bg-slate-50 p-3 rounded-lg text-center border"><h4 class="text-xs font-medium">Marge / ha</h4><p class="text-lg font-bold ${marginColor}">${marginPerHa.toLocaleString('fr-FR',{style:'currency',currency:'EUR'})}</p></div>
        </div>
        <div class="border-t pt-4"><div class="flex justify-between items-center mb-2"><h4 class="text-lg font-semibold">Dépenses Globales</h4><button id="add-expense-from-modal-btn" class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-200">Ajouter</button></div><div id="modal-expenses-list" class="max-h-64 overflow-y-auto bg-white rounded-lg border">${expensesListHTML}</div></div>
        <button id="modal-close-btn" class="mt-6 w-full py-2.5 bg-slate-200 rounded-lg font-semibold">Fermer</button>
    `;
    openModal(content);
    const modalContent = document.getElementById('modal-content');
    if (modalContent) { modalContent.classList.remove('max-w-lg'); modalContent.classList.add('max-w-3xl'); }

    const refreshAll = async () => {
        await displayFinancialSummaryPage();
        const newModalContent = document.getElementById('modal-content');
        if(newModalContent && newModalContent.querySelector('h3')?.textContent.includes(cropName)){
             await showCropFinancialDetailsModal(cropName, year);
        }
    };

    document.getElementById('add-expense-from-modal-btn').addEventListener('click', () => showAddGlobalExpenseModal(year, 'new', { crop: cropName }, refreshAll));
    document.getElementById('modal-expenses-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-expense-btn');
        if (editBtn) showAddGlobalExpenseModal(year, 'edit', JSON.parse(editBtn.dataset.expense), refreshAll);
        const deleteBtn = e.target.closest('.delete-expense-btn');
        if (deleteBtn) handleDeleteGlobalExpense(year, JSON.parse(deleteBtn.dataset.expense), refreshAll);
    });
}

async function handleSaveStructuralCharge(chargeType, chargeValue) {
    if (!currentUser) return;
    const value = parseFloat(chargeValue) || 0; // Assure que c'est un nombre

    try {
        const chargeDocRef = doc(db, 'users', currentUser.uid, 'structuralCharges', String(currentYear));
        
        // Utilise setDoc avec merge:true pour créer le document s'il n'existe pas,
        // ou mettre à jour le champ spécifique s'il existe.
        await setDoc(chargeDocRef, { [chargeType]: value }, { merge: true });

        showToast("Charge de structure enregistrée.");
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la charge de structure:", error);
        showToast("Erreur de sauvegarde.");
    }
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

export function showFarmManagementModal() {
    const isAllFarmsSelected = currentFarmId === null;
    const allFarmsSelectedClasses = isAllFarmsSelected 
        ? 'bg-green-50 border-green-500 ring-2 ring-green-500' 
        : 'bg-white border-slate-200 hover:bg-slate-50';

    const allFarmsButtonHTML = `
        <div class="select-farm-btn flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${allFarmsSelectedClasses}" data-id="null" data-name="Toutes les fermes">
            <div class="flex items-center gap-3">
                <i data-lucide="globe" class="w-6 h-6 text-slate-500"></i>
                <span class="font-semibold text-slate-800">Toutes les fermes</span>
            </div>
            ${isAllFarmsSelected ? '<i data-lucide="check-circle-2" class="w-6 h-6 text-green-600"></i>' : ''}
        </div>
    `;

    const farmListHTML = userFarms.map(farm => {
        const isSelected = farm.id === currentFarmId;
        const selectedClasses = isSelected 
            ? 'bg-green-50 border-green-500 ring-2 ring-green-500' 
            : 'bg-white border-slate-200 hover:bg-slate-50';
        
        return `
        <div class="flex items-center justify-between p-3 rounded-lg border transition-all ${selectedClasses}">
            <div class="select-farm-btn flex-grow flex items-center gap-3 cursor-pointer min-w-0 pr-2" data-id="${farm.id}" data-name="${farm.name}">
                <i data-lucide="building-2" class="w-6 h-6 text-slate-500"></i>
                <span class="font-semibold text-slate-800 truncate">${farm.name}</span>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                ${isSelected ? '<i data-lucide="check-circle-2" class="w-6 h-6 text-green-600 mr-2"></i>' : ''}
                <button class="edit-farm-btn p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors" data-id="${farm.id}" data-name="${farm.name}" title="Modifier le nom">
                    <i data-lucide="file-pen-line" class="w-5 h-5"></i>
                </button>
                <button class="delete-farm-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors" data-id="${farm.id}" data-name="${farm.name}" title="Supprimer la ferme">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `}).join('') || '<p class="text-center text-slate-500 py-4">Ajoutez votre première ferme ci-dessous.</p>';

    const content = `
        <div class="p-2">
            <h3 class="text-xl font-bold mb-4 text-center text-slate-800">Changer de ferme</h3>
            <div id="farm-list" class="space-y-2 max-h-[45vh] overflow-y-auto mb-4 p-1 no-scrollbar">
                ${allFarmsButtonHTML}
                ${farmListHTML}
            </div>
            <div class="border-t border-slate-200 pt-4">
                <h4 class="text-base font-semibold text-slate-700 mb-2">Ajouter une ferme</h4>
                <div class="flex items-center gap-2">
                    <input type="text" id="new-farm-name-input" class="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ex: Ferme des Chênes">
                    <button id="add-farm-confirm-btn" class="p-3 bg-blue-600 text-white font-bold rounded-lg shrink-0 hover:bg-blue-700 shadow-md transition transform hover:scale-105">
                        <i data-lucide="plus" class="w-6 h-6"></i>
                    </button>
                </div>
                <p id="add-farm-error" class="text-red-500 text-sm hidden mt-1"></p>
            </div>
            <div class="mt-6">
                <button id="farm-management-back-btn" class="w-full px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-semibold">Fermer</button>
            </div>
        </div>
    `;
    openModal(content);
    
    document.getElementById('add-farm-confirm-btn')?.addEventListener('click', () => handleSaveFarm());
    
    document.getElementById('farm-list')?.addEventListener('click', (e) => {
        const selectBtn = e.target.closest('.select-farm-btn');
        const editBtn = e.target.closest('.edit-farm-btn');
        const deleteBtn = e.target.closest('.delete-farm-btn');

        if (selectBtn) {
            const farmId = selectBtn.dataset.id === 'null' ? null : selectBtn.dataset.id;
            handleSelectFarm(farmId, selectBtn.dataset.name);
        } else if (editBtn) {
            e.stopPropagation();
            showEditFarmModal(editBtn.dataset.id, editBtn.dataset.name);
        } else if (deleteBtn) {
            e.stopPropagation();
            handleDeleteFarm(deleteBtn.dataset.id, deleteBtn.dataset.name);
        }
    });
}

function showEditFarmModal(farmId, currentName) {
    const content = `
        <div class="p-2">
            <h3 class="text-xl font-bold mb-6 text-center text-slate-800">Modifier la ferme</h3>
            <div>
                <label for="farm-name-input-edit" class="block text-sm font-medium text-slate-700 mb-1">Nom de la ferme</label>
                <input type="text" id="farm-name-input-edit" class="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-lg text-lg text-center focus:ring-2 focus:ring-blue-500 transition" value="${currentName}">
            </div>
            <p id="farm-modal-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
            <div class="mt-8 grid grid-cols-2 gap-4">
                <button id="edit-farm-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">Annuler</button>
                <button id="edit-farm-confirm-btn" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow transition">Enregistrer</button>
            </div>
        </div>
    `;
    openModal(content);

    document.getElementById('edit-farm-cancel-btn')?.addEventListener('click', showFarmManagementModal);
    document.getElementById('edit-farm-confirm-btn')?.addEventListener('click', () => handleSaveFarm(farmId));
}

async function handleSaveFarm(farmId = null) {
    const isEdit = farmId !== null;
    const inputId = isEdit ? 'farm-name-input-edit' : 'new-farm-name-input';
    const nameInput = document.getElementById(inputId);
    const errorEl = document.getElementById('farm-modal-error') || document.getElementById('add-farm-error');

    if (!nameInput || !errorEl) {
        console.error("Farm modal input/error elements not found");
        return;
    }

    const name = nameInput.value.trim();
    if (!name) {
        errorEl.textContent = "Le nom de la ferme ne peut pas être vide.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    try {
        if (isEdit) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'farms', farmId), { name: name });
            showToast(`Ferme "${name}" mise à jour.`);
            if (currentFarmId === farmId) {
                currentFarmName = name;
                updateCurrentFarmDisplay();
            }
        } else {
            const newFarmRef = await addDoc(collection(db, 'users', currentUser.uid, 'farms'), {
                name: name,
                createdAt: new Date()
            });
            showToast(`Ferme "${name}" ajoutée !`);
            if (userFarms.length === 1) {
                await handleSelectFarm(newFarmRef.id, name);
            }
        }
        showFarmManagementModal();
    } catch (error) {
        console.error("Error saving farm:", error);
        showToast("Erreur lors de l'enregistrement de la ferme.");
    }
}

async function handleDeleteFarm(farmId, farmName) {
    if (farmId === currentFarmId) {
        showToast("Vous ne pouvez pas supprimer la ferme actuellement sélectionnée. Veuillez en choisir une autre d'abord.");
        return;
    }
    
    const fieldsInFarm = Object.values(harvestData).filter(field => field.farmId === farmId).length;
    const confirmationMessage = fieldsInFarm > 0 
        ? `Êtes-vous sûr de vouloir supprimer la ferme "${farmName}" ? Les ${fieldsInFarm} parcelle(s) associées seront <strong>définitivement supprimées</strong>.`
        : `Êtes-vous sûr de vouloir supprimer la ferme "${farmName}" ?`;

    showConfirmationModal(confirmationMessage, async () => {
        try {
            const batch = writeBatch(db);
            const farmDocRef = doc(db, 'users', currentUser.uid, 'farms', farmId);
            batch.delete(farmDocRef);

            const fieldsQuery = query(collection(db, 'users', currentUser.uid, 'fields'), where('farmId', '==', farmId));
            const fieldsSnapshot = await getDocs(fieldsQuery);
            fieldsSnapshot.forEach(fieldDoc => {
                batch.delete(fieldDoc.ref);
            });

            await batch.commit();
            showToast(`Ferme "${farmName}" et ses parcelles supprimées.`);
            showFarmManagementModal();
        }
        catch (error) {
            console.error("Error deleting farm:", error);
            showToast("Erreur lors de la suppression de la ferme.");
        }
    }, fieldsInFarm > 0);
}

async function handleSelectFarm(farmId, farmName) {
    if (currentFarmId === farmId) {
        closeModal();
        return;
    }
    currentFarmId = farmId;
    currentFarmName = farmName;
    updateCurrentFarmDisplay();
    showToast(`Ferme sélectionnée : ${farmName}`);
    closeModal();
    updateAllFieldsData();

    if (currentUser) {
        try {
            await updateDoc(doc(db, "users", currentUser.uid), { lastSelectedFarmId: farmId });
        } catch (error) {
            console.error("Error saving last selected farm:", error);
        }
    }
}

function handleMarkFieldAsFinished(fieldKey, ownerId) {
    // Le message est simplifié, car la notification est maintenant automatique et plus riche.
    const message = `
        Êtes-vous sûr de vouloir marquer cette récolte comme terminée ? 
        Vous ne pourrez plus ajouter de bennes, de dépenses ou de fichiers.
    `;

    showConfirmationModal(message, () => processFinishField(fieldKey, ownerId));
}

async function handleReopenField(fieldKey) {
    const message = "Êtes-vous sûr de vouloir ré-ouvrir cette récolte ? Vous pourrez de nouveau y ajouter des bennes et des dépenses.";
    showConfirmationModal(message, async () => {
        if (!currentUser || !fieldKey) return;
        const fieldDocRef = doc(db, "users", currentUser.uid, "fields", fieldKey);
        try {
            await updateDoc(fieldDocRef, {
                status: deleteField(),
                lastModified: new Date()
            });
            showToast("Récolte ré-ouverte.");
        } catch (error) {
            console.error("Error reopening field:", error);
            showToast("Une erreur est survenue.");
        }
    });
}

async function processFinishField(fieldKey, ownerId) {
    if (!currentUser || !fieldKey || !ownerId) return;

    const notifyOwnerToggle = document.getElementById('notify-owner-toggle');
    // Le collaborateur a-t-il coché la case pour notifier ? (par défaut, oui)
    // Si c'est le propriétaire lui-même qui termine, on ne notifie pas.
    const shouldNotify = currentUser.uid !== ownerId && (notifyOwnerToggle ? notifyOwnerToggle.checked : true);
    
    const fieldDocRef = doc(db, "users", ownerId, "fields", fieldKey);
    try {
        // --- Action Principale : Marquer la parcelle comme terminée ---
        await updateDoc(fieldDocRef, {
            status: 'finished',
            lastModified: new Date()
        });
        showToast("Récolte marquée comme terminée.");

        // --- Action Secondaire : Envoyer la notification si nécessaire ---
        if (shouldNotify) {
            console.log("Préparation de l'envoi de la notification de fin de récolte...");
            try {
                // Obtenir le token d'authentification de l'utilisateur actuel (le collaborateur)
                const idToken = await currentUser.getIdToken();

                // Préparer les données pour le serveur
                const notificationPayload = {
                    ownerId: ownerId,
                    fieldId: fieldKey,
                    finisherUid: currentUser.uid // On envoie l'ID de celui qui a terminé l'action
                };
                
                // Définir l'URL de l'API (assurez-vous qu'elle est cohérente avec les autres fichiers)
                const serverUrl = 'https://recolt-iq-768a9.web.app'; // Ou votre domaine personnalisé

                // Appel au serveur pour envoyer la notification
                const response = await fetch(`${serverUrl}/api/send-finish-notification`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}` // Important pour la sécurité
                    },
                    body: JSON.stringify(notificationPayload)
                });
                
                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || "La requête de notification a échoué");
                }

                console.log("Requête de notification envoyée avec succès au serveur.");

            } catch (notificationError) {
                console.error("Erreur lors de l'envoi de la requête de notification:", notificationError);
                // On n'affiche pas de toast d'erreur ici pour ne pas perturber l'utilisateur,
                // car l'action principale (terminer la récolte) a bien réussi.
                // L'erreur est juste loggée pour le débogage.
            }
        }
    } catch (error) {
        console.error("Erreur lors de la finalisation de la parcelle :", error);
        showToast("Une erreur est survenue lors de la mise à jour du statut.");
    }
}
