
// sharing.js

import { db, doc, getDoc, updateDoc, setDoc, onSnapshot, collection, addDoc, query, where, deleteDoc, arrayUnion, arrayRemove, collectionGroup, writeBatch, deleteField, getDocs } from './firebase-config.js';
import { limit, startAt, endAt, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showToast, navigateToPage, showConfirmationModal, createFilterButton, openModal, closeModal, displayFieldDetails, calculateTotals } from './harvest.js';

// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const sharedFieldListContainer = document.getElementById('shared-field-list-container');
const mySharesListContainer = document.getElementById('my-shares-list-container'); 
const sharedFarmFiltersContainer = document.getElementById('shared-farm-filters-container');
const sharedCropFiltersContainer = document.getElementById('shared-crop-filters-container');
const openSharedFilterModalBtn = document.getElementById('open-shared-filter-modal-btn');
// --- (Le début du fichier avec les variables globales reste le même) ---
let currentUser = null;
let unsubscribeSharedFields = null;
let unsubscribeMyShares = null; 
let isSharingInitialized = false;
let allSharedFields = [];
let myFieldsWithShares = []; 
let selectedSharedCrop = null; 
let selectedSharedFarm = null; 
let userNamesCache = {};
let farmNamesCache = {};
let hideFinishedSharedFields = false;
const HIDE_FINISHED_KEY = 'recoltiq_hide_finished_shared';
let searchTimeout = null;



export function initSharing(user) {
    currentUser = user;
    if (unsubscribeSharedFields) unsubscribeSharedFields();
    if (unsubscribeMyShares) unsubscribeMyShares(); 

    if (!isSharingInitialized) {
        sharedFieldListContainer.addEventListener('click', (e) => {
            const cardContent = e.target.closest('.field-card-content');
            const revokeBtn = e.target.closest('.revoke-access-btn');

            if (revokeBtn) {
                const { key, ownerId, fieldName } = revokeBtn.dataset;
                handleRevokeAccess(key, ownerId, fieldName);
            }
            else if (cardContent?.dataset.key && cardContent?.dataset.ownerId) {
                displayFieldDetails(cardContent.dataset.key, cardContent.dataset.ownerId);
            }
        });

        mySharesListContainer.addEventListener('click', (e) => {
            const revokeBtn = e.target.closest('.revoke-others-access-btn');
            const revokeAllBtn = e.target.closest('.revoke-all-btn');
            const toggleHeader = e.target.closest('[data-target]');


            if (revokeAllBtn) {
                e.stopPropagation();
                const { userId, userName } = revokeAllBtn.dataset;
                handleRevokeAllAccessForUser(userId, userName);
            } else if (revokeBtn) {
                e.stopPropagation();
                const { fieldId, userId, userName, fieldName } = revokeBtn.dataset;
                handleRevokeAccessForOtherUser(fieldId, userId, userName, fieldName);
            } else if (toggleHeader) {
                const targetId = toggleHeader.dataset.target;
                const content = document.querySelector(targetId);
                const arrow = toggleHeader.querySelector('.share-toggle-arrow');
                
                if (content) {
                    content.classList.toggle('hidden');
                }
                if (arrow) {
                    arrow.classList.toggle('rotate-180');
                }
            }
        });
        
        const sharedFiltersContainer = document.querySelector('#page-shared-field-list > .p-4.lg\\:p-0.lg\\:mt-6');
        if (sharedFiltersContainer && !sharedFiltersContainer.querySelector('.filter-control-box')) {
            const desktopFilters = sharedFiltersContainer.querySelector('#shared-filters-desktop-container');
            const mobileFilterBtn = sharedFiltersContainer.querySelector('#open-shared-filter-modal-btn');

            const controlBox = document.createElement('div');
            controlBox.className = 'filter-control-box bg-white p-3 rounded-xl shadow-sm border border-slate-200';

            const toggleContainer = document.createElement('div');
            toggleContainer.className = 'flex items-center justify-between';
            toggleContainer.innerHTML = `
                <label for="hide-finished-toggle" class="text-sm font-semibold text-slate-700">Masquer les parcelles terminées</label>
                <input type="checkbox" id="hide-finished-toggle" class="toggle-switch">
            `;
            controlBox.appendChild(toggleContainer);

            const separator = document.createElement('div');
            separator.className = 'border-t border-slate-200 mt-3 pt-3';
            controlBox.appendChild(separator);

            if (desktopFilters) {
                controlBox.appendChild(desktopFilters);
            }
            if (mobileFilterBtn) {
                controlBox.appendChild(mobileFilterBtn);
                mobileFilterBtn.classList.remove('mt-3');
                mobileFilterBtn.addEventListener('click', showSharedFilterModal);
            }

            sharedFiltersContainer.innerHTML = '';
            sharedFiltersContainer.appendChild(controlBox);

            const toggle = document.getElementById('hide-finished-toggle');
            const savedState = localStorage.getItem(HIDE_FINISHED_KEY);
            hideFinishedSharedFields = savedState === 'true';
            toggle.checked = hideFinishedSharedFields;

            toggle.addEventListener('change', (e) => {
                hideFinishedSharedFields = e.target.checked;
                localStorage.setItem(HIDE_FINISHED_KEY, hideFinishedSharedFields);
                displaySharedFieldList();
            });

            if (!document.getElementById('toggle-switch-style')) {
                const style = document.createElement('style');
                style.id = 'toggle-switch-style';
                style.textContent = `
                    .toggle-switch {
                        position: relative; display: inline-block; width: 44px; height: 24px;
                        background-color: #cbd5e1; border-radius: 9999px; transition: background-color 0.2s;
                        cursor: pointer; -webkit-appearance: none; appearance: none;
                    }
                    .toggle-switch::before {
                        content: ''; position: absolute; width: 20px; height: 20px; border-radius: 50%;
                        background-color: white; top: 2px; left: 2px; transition: transform 0.2s;
                    }
                    .toggle-switch:checked { background-color: #16a34a; }
                    .toggle-switch:checked::before { transform: translateX(20px); }
                `;
                document.head.appendChild(style);
            }
        }

        isSharingInitialized = true;
    }

    loadSharedFields();
    loadMySharedFields(); 
}

/**
 * Trouve un utilisateur dans la base de données via son identifiant complet (Nom#Tag).
 * @param {string} fullTag - L'identifiant complet, ex: "John#1234".
 * @returns {Promise<object|null>} L'objet utilisateur trouvé ou null.
 */
async function findUserByTag(fullTag) {
    const parts = fullTag.split('#');
    if (parts.length !== 2) return null;
    
    const name = parts[0].trim();
    const tag = parts[1].trim();

    if (!name || !/^\d{4}$/.test(tag)) return null;

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("name", "==", name), where("userTag", "==", tag));
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
}

/**
 * Gère le partage direct d'une ou plusieurs parcelles avec un utilisateur cible.
 * @param {string[]} fieldIds - IDs des parcelles à partager.
 * @param {string} targetUserId - UID de l'utilisateur qui reçoit le partage.
 * @param {string} permission - 'read' ou 'edit'.
 */
async function handleDirectShare(fieldIds, targetUserId, permission) {
    const ownerId = currentUser.uid;

    if (ownerId === targetUserId) {
        showToast("Vous ne pouvez pas partager une parcelle avec vous-même.");
        return;
    }

    try {
        const batch = writeBatch(db);
        for (const fieldId of fieldIds) {
            const fieldDocRef = doc(db, "users", ownerId, "fields", fieldId);
            const updateData = {
                accessControlUids: arrayUnion(targetUserId),
                [`accessControlMap.${targetUserId}`]: permission
            };
            batch.update(fieldDocRef, updateData);
        }

        // Ajoute l'utilisateur à la sous-collection des collaborateurs si la permission est 'edit'
        if (permission === 'edit') {
            const collaboratorDocRef = doc(db, "users", ownerId, "collaborators", targetUserId);
            batch.set(collaboratorDocRef, { addedAt: new Date(), sharedVia: 'direct' });
        }

        await batch.commit();
        showToast(`Parcelle(s) partagée(s) avec succès !`);
        closeModal();
    } catch (error) {
        console.error("Erreur lors du partage direct :", error);
        showToast("Une erreur est survenue lors du partage.");
    }
}

/**
 * Configure la logique des onglets dans la modale de partage.
 */
function setupShareModalTabs() {
    const tabUser = document.getElementById('tab-share-user');
    const tabLink = document.getElementById('tab-share-link');
    const contentUser = document.getElementById('content-share-user');
    const contentLink = document.getElementById('content-share-link');

    tabUser.addEventListener('click', () => {
        tabUser.classList.add('text-blue-600', 'border-blue-600');
        tabUser.classList.remove('text-slate-500', 'border-transparent');
        contentUser.classList.remove('hidden');
        tabLink.classList.add('text-slate-500', 'border-transparent');
        tabLink.classList.remove('text-blue-600', 'border-blue-600');
        contentLink.classList.add('hidden');
    });

    tabLink.addEventListener('click', () => {
        tabLink.classList.add('text-blue-600', 'border-blue-600');
        tabLink.classList.remove('text-slate-500', 'border-transparent');
        contentLink.classList.remove('hidden');
        tabUser.classList.add('text-slate-500', 'border-transparent');
        tabUser.classList.remove('text-blue-600', 'border-blue-600');
        contentUser.classList.add('hidden');
    });
}


function showShareOptionsModal(fieldId) {
    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Partager la parcelle</h3>
        
        <div class="border-b border-slate-200 mb-4">
            <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                <button id="tab-share-user" class="whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm text-blue-600 border-blue-600">
                    Par Utilisateur
                </button>
                <button id="tab-share-link" class="whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300">
                    Par Lien
                </button>
            </nav>
        </div>

        <div id="content-share-user">
            <p class="text-center text-slate-600 mb-4 text-sm">Entrez l'identifiant (Nom#Tag) de l'utilisateur.</p>
            <div class="space-y-3 relative">
                <div>
                    <label for="user-tag-input" class="block text-sm font-medium text-slate-700 mb-1">Identifiant</label>
                    <input type="text" id="user-tag-input" class="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Commencez à taper un nom..." autocomplete="off">
                    <div id="user-suggestions" class="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 hidden shadow-lg max-h-40 overflow-y-auto"></div>
                    <p id="user-search-status" class="text-sm mt-1 h-5"></p>
                </div>
                <div class="bg-slate-100 p-3 rounded-lg flex items-center justify-center space-x-4">
                    <span class="text-slate-600 font-medium">Lecture seule</span>
                    <label for="permission-toggle-user" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="permission-toggle-user" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span class="text-green-700 font-medium">Modification</span>
                </div>
            </div>
            <div class="mt-6">
                 <button id="confirm-direct-share-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Partager Directement</button>
            </div>
        </div>

        <div id="content-share-link" class="hidden">
             <p class="text-center text-slate-600 mb-6 text-sm">
                Le lien généré sera à usage unique et expirera dans 24 heures.
            </p>
            <div class="bg-slate-100 p-3 rounded-lg flex items-center justify-center space-x-4 mb-6">
                <span class="text-slate-600 font-medium">Lecture seule</span>
                <label for="permission-toggle-link" class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="permission-toggle-link" class="sr-only peer" checked>
                    <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <span class="text-green-700 font-medium">Modification</span>
            </div>
            <button id="generate-share-link-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Générer le lien</button>
        </div>
        
        <button id="close-share-modal-btn" class="mt-6 w-full text-center text-sm text-slate-500 hover:underline">Annuler</button>
    `;
    openModal(content);
    setupShareModalTabs();

    const userInput = document.getElementById('user-tag-input');
    const suggestionsContainer = document.getElementById('user-suggestions');

    userInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const searchTerm = userInput.value.trim();
        if (searchTerm.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const usersRef = collection(db, "users");
            const q = query(usersRef, 
                orderBy("name"), 
                startAt(searchTerm), 
                endAt(searchTerm + '\uf8ff'),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            
            suggestionsContainer.innerHTML = '';
            if (querySnapshot.empty) {
                suggestionsContainer.innerHTML = '<div class="p-2 text-sm text-slate-500">Aucun utilisateur trouvé.</div>';
            } else {
                querySnapshot.forEach(doc => {
                    const user = doc.data();
                    const suggestionEl = document.createElement('div');
                    suggestionEl.className = 'p-2 cursor-pointer hover:bg-slate-100';
                    suggestionEl.textContent = `${user.name}#${user.userTag}`;
                    suggestionEl.addEventListener('click', () => {
                        userInput.value = `${user.name}#${user.userTag}`;
                        suggestionsContainer.classList.add('hidden');
                    });
                    suggestionsContainer.appendChild(suggestionEl);
                });
            }
            suggestionsContainer.classList.remove('hidden');
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!userInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });

    document.getElementById('generate-share-link-btn').addEventListener('click', async () => {
        const generateBtn = document.getElementById('generate-share-link-btn');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Génération...';

        const permission = document.getElementById('permission-toggle-link').checked ? 'edit' : 'read';
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        try {
            const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const tokenDocRef = doc(db, "shareTokens", token);

            await setDoc(tokenDocRef, {
                ownerId: currentUser.uid,
                fieldId: fieldId,
                permission: permission,
                createdAt: new Date(),
                expiresAt: expiresAt
            });

            const shareUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;
            showGeneratedLinkModal(shareUrl);

        } catch (error) {
            console.error("Erreur lors de la création du lien de partage:", error);
            showToast("Impossible de générer le lien.");
            closeModal();
        }
    });

    document.getElementById('confirm-direct-share-btn').addEventListener('click', async () => {
        const fullTag = document.getElementById('user-tag-input').value;
        const statusEl = document.getElementById('user-search-status');
        statusEl.textContent = 'Recherche...';
        statusEl.className = 'text-sm mt-1 h-5 text-slate-500';

        const targetUser = await findUserByTag(fullTag);

        if (!targetUser) {
            statusEl.textContent = 'Utilisateur non trouvé.';
            statusEl.className = 'text-sm mt-1 h-5 text-red-500';
            return;
        }
        
        statusEl.textContent = `Utilisateur trouvé : ${targetUser.name}`;
        statusEl.className = 'text-sm mt-1 h-5 text-green-600';

        const permission = document.getElementById('permission-toggle-user').checked ? 'edit' : 'read';
        await handleDirectShare([fieldId], targetUser.id, permission);
    });
}

export async function generateShareLink(fieldId) {
    if (!currentUser) return;
    showShareOptionsModal(fieldId);
}

export function showMultiShareOptionsModal(fieldIds, selectedCrops) {
    const title = selectedCrops.length > 0
        ? `Partager les parcelles de ${selectedCrops.join(', ')} (${fieldIds.length})`
        : `Partager toutes vos parcelles (${fieldIds.length})`;

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">${title}</h3>
        
        <div class="border-b border-slate-200 mb-4">
            <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                <button id="tab-share-user" class="whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm text-blue-600 border-blue-600">
                    Par Utilisateur
                </button>
                <button id="tab-share-link" class="whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300">
                    Par Lien
                </button>
            </nav>
        </div>

        <div id="content-share-user">
            <p class="text-center text-slate-600 mb-4 text-sm">Entrez l'identifiant (Nom#Tag) de l'utilisateur.</p>
            <div class="space-y-3 relative">
                <div>
                    <label for="user-tag-input" class="block text-sm font-medium text-slate-700 mb-1">Identifiant</label>
                    <input type="text" id="user-tag-input" class="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Commencez à taper un nom..." autocomplete="off">
                    <div id="user-suggestions" class="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 hidden shadow-lg max-h-40 overflow-y-auto"></div>
                    <p id="user-search-status" class="text-sm mt-1 h-5"></p>
                </div>
                <div class="bg-slate-100 p-3 rounded-lg flex items-center justify-center space-x-4">
                    <span class="text-slate-600 font-medium">Lecture seule</span>
                    <label for="permission-toggle-user" class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="permission-toggle-user" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span class="text-green-700 font-medium">Modification</span>
                </div>
            </div>
            <div class="mt-6">
                 <button id="confirm-direct-share-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Partager Directement</button>
            </div>
        </div>

        <div id="content-share-link" class="hidden">
             <p class="text-center text-slate-600 mb-6 text-sm">
                Le lien généré sera à usage unique et expirera dans 24 heures.
            </p>
            <div class="bg-slate-100 p-3 rounded-lg flex items-center justify-center space-x-4 mb-6">
                <span class="text-slate-600 font-medium">Lecture seule</span>
                <label for="permission-toggle-link" class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="permission-toggle-link" class="sr-only peer" checked>
                    <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-green-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <span class="text-green-700 font-medium">Modification</span>
            </div>
            <button id="generate-multi-share-link-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Générer le lien</button>
        </div>
        
        <button id="close-share-modal-btn" class="mt-6 w-full text-center text-sm text-slate-500 hover:underline">Annuler</button>
    `;
    
    openModal(content);
    setupShareModalTabs();

    const userInput = document.getElementById('user-tag-input');
    const suggestionsContainer = document.getElementById('user-suggestions');

    userInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const searchTerm = userInput.value.trim();
        if (searchTerm.length < 2) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const usersRef = collection(db, "users");
            const q = query(usersRef, 
                orderBy("name"), 
                startAt(searchTerm), 
                endAt(searchTerm + '\uf8ff'),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            
            suggestionsContainer.innerHTML = '';
            if (querySnapshot.empty) {
                suggestionsContainer.innerHTML = '<div class="p-2 text-sm text-slate-500">Aucun utilisateur trouvé.</div>';
            } else {
                querySnapshot.forEach(doc => {
                    const user = doc.data();
                    const suggestionEl = document.createElement('div');
                    suggestionEl.className = 'p-2 cursor-pointer hover:bg-slate-100';
                    suggestionEl.textContent = `${user.name}#${user.userTag}`;
                    suggestionEl.addEventListener('click', () => {
                        userInput.value = `${user.name}#${user.userTag}`;
                        suggestionsContainer.classList.add('hidden');
                    });
                    suggestionsContainer.appendChild(suggestionEl);
                });
            }
            suggestionsContainer.classList.remove('hidden');
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!userInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.classList.add('hidden');
        }
    });

    document.getElementById('generate-multi-share-link-btn').addEventListener('click', async () => {
        const generateBtn = document.getElementById('generate-multi-share-link-btn');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Génération...';

        const permission = document.getElementById('permission-toggle-link').checked ? 'edit' : 'read';
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        try {
            const token = `token_multi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tokenDocRef = doc(db, "shareTokens", token);

            await setDoc(tokenDocRef, {
                ownerId: currentUser.uid,
                fieldIds: fieldIds,
                type: 'multi',
                permission: permission,
                createdAt: new Date(),
                expiresAt: expiresAt
            });

            const shareUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;
            showGeneratedLinkModal(shareUrl);

        } catch (error) {
            console.error("Erreur lors de la création du lien de partage multiple:", error);
            showToast("Impossible de générer le lien.");
            closeModal();
        }
    });

    document.getElementById('confirm-direct-share-btn').addEventListener('click', async () => {
        const fullTag = document.getElementById('user-tag-input').value;
        const statusEl = document.getElementById('user-search-status');
        statusEl.textContent = 'Recherche...';
        statusEl.className = 'text-sm mt-1 h-5 text-slate-500';

        const targetUser = await findUserByTag(fullTag);

        if (!targetUser) {
            statusEl.textContent = 'Utilisateur non trouvé.';
            statusEl.className = 'text-sm mt-1 h-5 text-red-500';
            return;
        }
        
        statusEl.textContent = `Utilisateur trouvé : ${targetUser.name}`;
        statusEl.className = 'text-sm mt-1 h-5 text-green-600';

        const permission = document.getElementById('permission-toggle-user').checked ? 'edit' : 'read';
        await handleDirectShare(fieldIds, targetUser.id, permission);
    });
}

function showGeneratedLinkModal(url) {
    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Lien de partage généré</h3>
        <p class="text-gray-600 text-center mb-4">Envoyez ce lien à la personne avec qui vous souhaitez partager. Il est à usage unique et expirera dans 24 heures.</p>
        <div class="bg-gray-100 p-3 rounded-lg flex items-center justify-between">
            <input id="share-url-input" type="text" readonly value="${url}" class="bg-transparent border-none text-gray-700 text-sm flex-grow">
            <button id="copy-share-url-btn" class="ml-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">Copier</button>
        </div>
        <button id="close-share-modal-btn" class="mt-6 w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg">Fermer</button>
    `;
    openModal(content);

    const copyBtn = document.getElementById('copy-share-url-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('share-url-input');
            if (urlInput) {
                const textarea = document.createElement('textarea');
                textarea.value = urlInput.value;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    showToast("Lien de partage copié !");
                } catch (err) {
                    showToast("Erreur de copie.");
                }
                document.body.removeChild(textarea);
            }
        });
    }
}

export async function handleShareToken(token, user) {
    if (!token || !user) return;
    
    const tokenDocRef = doc(db, "shareTokens", token);
    try {
        const tokenDocSnap = await getDoc(tokenDocRef);

        if (!tokenDocSnap.exists()) {
            showToast("Ce lien de partage est invalide ou a déjà été utilisé.");
            return;
        }

        const tokenData = tokenDocSnap.data();
        const permission = tokenData.permission || 'read';

        if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
            showToast("Ce lien de partage a expiré.");
            await deleteDoc(tokenDocRef);
            return;
        }

        if (tokenData.ownerId === user.uid) {
            showToast("Vous ne pouvez pas accepter votre propre partage.");
            await deleteDoc(tokenDocRef); 
            return;
        }
        
        const batch = writeBatch(db);
        const fieldIds = tokenData.type === 'multi' ? tokenData.fieldIds : [tokenData.fieldId];

        for (const fieldId of fieldIds) {
            if (fieldId) {
                const fieldDocRef = doc(db, "users", tokenData.ownerId, "fields", fieldId);
                const updateData = {
                    accessControlUids: arrayUnion(user.uid),
                    [`accessControlMap.${user.uid}`]: permission
                };
                batch.update(fieldDocRef, updateData);
            }
        }
        
        if (permission === 'edit') {
            const collaboratorDocRef = doc(db, "users", tokenData.ownerId, "collaborators", user.uid);
            batch.set(collaboratorDocRef, { addedAt: new Date(), fromToken: token });
        }

        await batch.commit();
        showToast(`Accès accordé à ${fieldIds.length} parcelle(s) avec permission de ${permission === 'edit' ? 'modification' : 'lecture'}.`);

        await deleteDoc(tokenDocRef); 
        
        navigateToPage('page-shared-field-list');

    } catch (error) {
        console.error("Erreur lors du traitement du jeton :", error);
        showToast("Une erreur est survenue lors de l'acceptation du partage.");
    } finally {
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
    }
}

function loadMySharedFields() {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'fields'), where('accessControlUids', '!=', []));
    
    unsubscribeMyShares = onSnapshot(q, (snapshot) => {
        myFieldsWithShares = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(field => field.accessControlUids && field.accessControlUids.length > 0);
        displayMySharesList();
    }, (error) => {
        console.error("Erreur de chargement de mes partages:", error);
        mySharesListContainer.innerHTML = `<p class="text-center text-red-500 mt-8">Impossible de charger la liste de vos partages.</p>`;
    });
}

async function displayMySharesList() {
    const container = mySharesListContainer;
    if (!container) return;

    container.innerHTML = `<p class="text-center text-slate-500">Chargement de vos partages...</p>`;

    // 1. Récupérer toutes les données
    const fieldsSharedPromise = getDocs(query(collection(db, 'users', currentUser.uid, 'fields'), where('accessControlUids', '!=', [])));
    const userDocPromise = getDoc(doc(db, 'users', currentUser.uid));
    const [fieldsSnapshot, userDocSnap] = await Promise.all([fieldsSharedPromise, userDocPromise]);

    const myFieldsWithShares = fieldsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sharedHoursTo = userDocSnap.exists() ? (userDocSnap.data().hourAccessGrantedTo || []) : [];

    if (myFieldsWithShares.length === 0 && sharedHoursTo.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg"><h3 class="font-semibold">Aucun partage actif</h3></div>`;
        return;
    }

    // 2. Préparer les données
    const allUserIds = [...new Set([...myFieldsWithShares.flatMap(f => f.accessControlUids || []), ...sharedHoursTo])];
    await cacheUserNames(allUserIds);

    // 3. Séparer les partages de parcelles et d'heures par utilisateur
    const fieldSharesByUser = myFieldsWithShares.reduce((acc, field) => {
        (field.accessControlUids || []).forEach(userId => {
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push(field);
        });
        return acc;
    }, {});

    const hourSharesByUser = sharedHoursTo.reduce((acc, userId) => {
        if (!acc[userId]) acc[userId] = { id: userId, name: userNamesCache[userId] || 'Utilisateur inconnu' };
        return acc;
    }, {});


    // 4. Construire le HTML
    
    // Section Parcelles
    let fieldsSectionHTML = '';
    if (Object.keys(fieldSharesByUser).length > 0) {
        const fieldSharingsHTML = Object.keys(fieldSharesByUser).sort((a,b) => (userNamesCache[a] || '').localeCompare(userNamesCache[b] || '')).map(userId => {
            const userName = userNamesCache[userId] || 'Utilisateur Inconnu';
            const userFields = fieldSharesByUser[userId];
            const contentId = `field-details-${userId}`;
            
            const fieldsList = userFields.map(field => {
                const permission = field.accessControlMap?.[userId] || 'read';
                const permissionText = permission === 'edit' ? 'Modification' : 'Lecture seule';
                const permissionClass = permission === 'edit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
                return `<div class="flex justify-between items-center bg-slate-50 p-3 rounded-lg"><span class="font-medium text-slate-800">${field.name}</span><div><span class="text-xs font-semibold px-2 py-1 rounded-full ${permissionClass}">${permissionText}</span><button class="revoke-field-btn text-sm font-semibold text-red-500 hover:text-red-700 ml-4" data-field-id="${field.id}" data-user-id="${userId}" data-user-name="${userName}" data-field-name="${field.name}">Révoquer</button></div></div>`;
            }).join('');

            return `
                <div class="bg-white rounded-xl shadow-sm border">
                    <header class="flex justify-between items-center p-4 cursor-pointer" data-toggle-id="${contentId}">
                        <h3 class="font-bold text-lg">${userName.toUpperCase()}</h3>
                        <div class="flex items-center gap-2">
                            <button class="revoke-all-fields-btn text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full px-3 py-1.5" data-user-id="${userId}" data-user-name="${userName}">Tout révoquer</button>
                            <i data-lucide="chevron-down" class="toggle-arrow h-5 w-5 text-slate-500 transition-transform"></i>
                        </div>
                    </header>
                    <div id="${contentId}" class="px-4 pb-4 border-t border-slate-100 space-y-2 hidden">
                        ${fieldsList}
                    </div>
                </div>`;
        }).join('');
        fieldsSectionHTML = `<section id="field-shares-section"><h2 class="text-2xl font-bold text-slate-800 mb-4">Parcelles Partagées</h2><div class="space-y-4">${fieldSharingsHTML}</div></section>`;
    }

    // Section Heures
    let hoursSectionHTML = '';
    if (Object.keys(hourSharesByUser).length > 0) {
        const hourSharingsHTML = Object.values(hourSharesByUser).sort((a,b) => a.name.localeCompare(b.name)).map(user => {
            return `
                <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                    <span class="font-bold text-lg">${user.name.toUpperCase()}</span>
                    <button class="revoke-hour-btn text-sm font-semibold text-red-500 hover:text-red-700" data-user-id="${user.id}" data-user-name="${user.name}">Révoquer l'accès</button>
                </div>
            `;
        }).join('');
        hoursSectionHTML = `<section id="hour-shares-section" class="mt-8"><h2 class="text-2xl font-bold text-slate-800 mb-4">Horaires Partagés</h2><div class="space-y-3">${hourSharingsHTML}</div></section>`;
    }
    
    container.innerHTML = fieldsSectionHTML + hoursSectionHTML;
    lucide.createIcons();

    // 5. Attacher les écouteurs d'événements
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
    newContainer.addEventListener('click', (e) => {
        const header = e.target.closest('[data-toggle-id]');
        const revokeAllFieldsBtn = e.target.closest('.revoke-all-fields-btn');
        const revokeFieldBtn = e.target.closest('.revoke-field-btn');
        const revokeHourBtn = e.target.closest('.revoke-hour-btn');

        if (revokeAllFieldsBtn) {
            e.stopPropagation();
            const { userId, userName } = revokeAllFieldsBtn.dataset;
            handleRevokeAllAccessForUser(userId, userName, 'fields');
        } else if (revokeFieldBtn) {
            const { fieldId, userId, userName, fieldName } = revokeFieldBtn.dataset;
            handleRevokeAccessForOtherUser(fieldId, userId, userName, fieldName);
        } else if (revokeHourBtn) {
            const { userId, userName } = revokeHourBtn.dataset;
            handleRevokeHourAccess(userId, userName);
        } else if (header) {
            const content = document.getElementById(header.dataset.toggleId);
            const arrow = header.querySelector('.toggle-arrow');
            content?.classList.toggle('hidden');
            arrow?.classList.toggle('rotate-180');
        }
    });
}

function handleRevokeHourAccess(patronId, patronName) {
    const message = `Êtes-vous sûr de vouloir révoquer l'accès de <strong>${patronName}</strong> à vos heures ?`;
    showConfirmationModal(message, async () => {
        try {
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, { hourAccessGrantedTo: arrayRemove(patronId) });
            showToast(`Accès aux heures révoqué pour ${patronName}.`);
            displayMySharesList(); 
        } catch (error) {
            console.error("Erreur de révocation des heures :", error);
            showToast("Une erreur est survenue.");
        }
    });
}

function handleRevokeAllAccessForUser(userId, userName) {
    const message = `Êtes-vous sûr de vouloir révoquer <strong>TOUS</strong> les accès (parcelles et heures) pour <strong>${userName}</strong> ?`;
    showConfirmationModal(message, async () => {
        try {
            const batch = writeBatch(db);
            
            // Révoquer l'accès aux heures
            const userDocRef = doc(db, "users", currentUser.uid);
            batch.update(userDocRef, { hourAccessGrantedTo: arrayRemove(userId) });

            // Révoquer l'accès à toutes les parcelles partagées avec cet utilisateur
            const fieldsToUpdate = myFieldsWithShares.filter(f => f.accessControlUids.includes(userId));
            fieldsToUpdate.forEach(field => {
                const fieldRef = doc(db, 'users', currentUser.uid, 'fields', field.id);
                batch.update(fieldRef, {
                    accessControlUids: arrayRemove(userId),
                    [`accessControlMap.${userId}`]: deleteField()
                });
            });

            await batch.commit();
            showToast(`Tous les accès pour ${userName} ont été révoqués.`);
            displayMySharesList();

        } catch (error) {
            console.error("Erreur de révocation totale :", error);
            showToast("Une erreur est survenue.");
        }
    }, true); // Le 'true' demande une confirmation textuelle pour cette action dangereuse
}

async function handleRevokeAccessForOtherUser(fieldId, userIdToRevoke, userName, fieldName) {
    const message = `Êtes-vous sûr de vouloir révoquer l'accès de <strong>${userName}</strong> à la parcelle <strong>${fieldName}</strong> ?`;
    
    const action = async () => {
        if (!currentUser) return;
        const fieldDocRef = doc(db, "users", currentUser.uid, "fields", fieldId);
        try {
            await updateDoc(fieldDocRef, {
                accessControlUids: arrayRemove(userIdToRevoke),
                [`accessControlMap.${userIdToRevoke}`]: deleteField()
            });

            await checkAndRemoveCollaborator(currentUser.uid, userIdToRevoke);

            showToast("Accès révoqué.");
        } catch (error) {
            console.error("Erreur lors de la révocation de l'accès :", error);
            showToast("Une erreur est survenue.");
        }
    };

    showConfirmationModal(message, action);
}

async function checkAndRemoveCollaborator(ownerId, collaboratorId) {
    const q = query(
        collection(db, 'users', ownerId, 'fields'),
        where(`accessControlMap.${collaboratorId}`, '==', 'edit')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const collaboratorDocRef = doc(db, "users", ownerId, "collaborators", collaboratorId);
        await deleteDoc(collaboratorDocRef);
    }
}

async function handleRevokeAccess(fieldId, ownerId, fieldName) {
    const message = `Êtes-vous sûr de vouloir quitter le partage de la parcelle "${fieldName}" ? Vous n'y aurez plus accès.`;
    
    const action = async () => {
        if (!currentUser) return;
        const fieldDocRef = doc(db, "users", ownerId, "fields", fieldId);
        try {
            await updateDoc(fieldDocRef, {
                accessControlUids: arrayRemove(currentUser.uid),
                [`accessControlMap.${currentUser.uid}`]: deleteField()
            });
            
            await checkAndRemoveCollaborator(ownerId, currentUser.uid);

            showToast("Vous avez quitté le partage.");
        } catch (error) {
            console.error("Erreur lors de la révocation de l'accès :", error);
            showToast("Une erreur est survenue.");
        }
    };

    showConfirmationModal(message, action);
}

function displaySharedFarmFilters() {
    if (!sharedFarmFiltersContainer) return;

    // Correction : Utilisation de Array.from() pour garantir la création d'un tableau
    const farms = Array.from(new Map(allSharedFields.map(field => {
        const farmName = field.farmId ? (farmNamesCache[`${field.ownerId}/${field.farmId}`] || 'Ferme inconnue') : 'Non assignée';
        const ownerName = userNamesCache[field.ownerId] || 'Propriétaire inconnu';
        const uniqueFarmName = `${ownerName} - ${farmName}`;
        return [uniqueFarmName, { name: uniqueFarmName }];
    })).values());

    // Maintenant, le tri fonctionnera car 'farms' est bien un tableau
    farms.sort((a, b) => a.name.localeCompare(b.name));

    sharedFarmFiltersContainer.innerHTML = ''; // On vide
    sharedFarmFiltersContainer.classList.add('flex-wrap'); // On autorise le retour à la ligne des boutons

    // On crée et ajoute le libellé
    const label = document.createElement('span');
    label.className = 'font-semibold text-sm text-slate-600 mr-2 shrink-0 self-center';
    label.textContent = sharedFarmFiltersContainer.dataset.label;
    sharedFarmFiltersContainer.appendChild(label);

    // On ajoute le bouton "Toutes"
    const allButton = createFilterButton('Toutes les fermes', 'all-farms', selectedSharedFarm === null);
    allButton.addEventListener('click', () => {
        selectedSharedFarm = null;
        displaySharedFarmFilters();
        displaySharedFieldList();
    });
    sharedFarmFiltersContainer.appendChild(allButton);

    // On ajoute les autres boutons
    farms.forEach(farm => {
        const button = createFilterButton(farm.name, farm.name, selectedSharedFarm === farm.name);
        button.addEventListener('click', () => {
            selectedSharedFarm = farm.name;
            displaySharedFarmFilters();
            displaySharedFieldList();
        });
        sharedFarmFiltersContainer.appendChild(button);
    });
}

function displaySharedCropFilters() {
    if (!sharedCropFiltersContainer) return;
    const crops = [...new Set(allSharedFields.map(field => field.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    
    // On reconstruit la ligne de filtre proprement
    sharedCropFiltersContainer.innerHTML = ''; // On vide
    sharedCropFiltersContainer.classList.add('flex-wrap'); // On autorise le retour à la ligne des boutons

    // On crée et ajoute le libellé
    const label = document.createElement('span');
    label.className = 'font-semibold text-sm text-slate-600 mr-2 shrink-0 self-center';
    label.textContent = sharedCropFiltersContainer.dataset.label;
    sharedCropFiltersContainer.appendChild(label);
    
    // On ajoute le bouton "Toutes"
    const allButton = createFilterButton('Toutes les cultures', 'all-crops', selectedSharedCrop === null);
    allButton.addEventListener('click', () => {
        selectedSharedCrop = null;
        displaySharedCropFilters();
        displaySharedFieldList();
    });
    sharedCropFiltersContainer.appendChild(allButton);

    // On ajoute les autres boutons
    crops.forEach(crop => {
        const button = createFilterButton(crop, crop, selectedSharedCrop === crop);
        button.addEventListener('click', () => {
            selectedSharedCrop = crop;
            displaySharedCropFilters();
            displaySharedFieldList();
        });
        sharedCropFiltersContainer.appendChild(button);
    });
}

function showSharedFilterModal() {
    const farms = [...new Map(allSharedFields.map(field => {
        const farmName = field.farmId ? (farmNamesCache[`${field.ownerId}/${field.farmId}`] || 'Ferme inconnue') : 'Non assignée';
        const ownerName = userNamesCache[field.ownerId] || 'Propriétaire inconnu';
        const uniqueFarmName = `${ownerName} - ${farmName}`;
        return [uniqueFarmName, { name: uniqueFarmName }];
    })).values()].sort((a, b) => a.name.localeCompare(b.name));

    let farmFiltersHTML = createFilterButton('Toutes les fermes', 'all-farms', selectedSharedFarm === null).outerHTML;
    farms.forEach(farm => {
        farmFiltersHTML += createFilterButton(farm.name, farm.name, selectedSharedFarm === farm.name).outerHTML;
    });

    const crops = [...new Set(allSharedFields.map(field => field.crop).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    let cropFiltersHTML = createFilterButton('Toutes les cultures', 'all-crops', selectedSharedCrop === null).outerHTML;
    crops.forEach(crop => {
        cropFiltersHTML += createFilterButton(crop, crop, selectedSharedCrop === crop).outerHTML;
    });

    const hideFinishedToggleHTML = `
        <div class="border-t border-slate-200 pt-4 mt-4">
            <div class="flex items-center justify-between">
                <label for="modal-hide-finished-toggle" class="font-medium text-slate-700">Masquer les parcelles terminées</label>
                <input type="checkbox" id="modal-hide-finished-toggle" class="toggle-switch" ${hideFinishedSharedFields ? 'checked' : ''}>
            </div>
        </div>
    `;

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Filtrer les parcelles</h3>
        <div class="space-y-4">
            <div>
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Par Ferme</h4>
                <div id="modal-farm-filter-options" class="flex flex-wrap gap-2">
                    ${farmFiltersHTML}
                </div>
            </div>
            <div class="border-t border-slate-200 pt-4">
                <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Par Culture</h4>
                <div id="modal-crop-filter-options" class="flex flex-wrap gap-2">
                    ${cropFiltersHTML}
                </div>
            </div>
            ${hideFinishedToggleHTML}
        </div>
        <button id="modal-close-btn" class="mt-6 w-full px-6 py-3 bg-slate-200 rounded-lg font-semibold">Fermer</button>
    `;
    openModal(content);
    
    document.getElementById('modal-farm-filter-options')?.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-btn');
        if (!button) return;
        const farmName = button.dataset.crop;
        selectedSharedFarm = farmName === 'all-farms' ? null : farmName;
        showSharedFilterModal();
    });

    document.getElementById('modal-crop-filter-options')?.addEventListener('click', (e) => {
        const button = e.target.closest('.filter-btn');
        if (!button) return;
        const crop = button.dataset.crop;
        selectedSharedCrop = crop === 'all-crops' ? null : crop;
        showSharedFilterModal();
    });
    
    document.getElementById('modal-hide-finished-toggle')?.addEventListener('change', (e) => {
        hideFinishedSharedFields = e.target.checked;
        const desktopToggle = document.getElementById('hide-finished-toggle');
        if (desktopToggle) desktopToggle.checked = hideFinishedSharedFields;
        localStorage.setItem(HIDE_FINISHED_KEY, hideFinishedSharedFields);
    });


    document.getElementById('modal-container').addEventListener('click', function applyFiltersOnClose(e) {
        if (e.target.id === 'modal-backdrop' || e.target.closest('#modal-close-btn')) {
            displaySharedFarmFilters();
            displaySharedCropFilters();
            displaySharedFieldList();
            this.removeEventListener('click', applyFiltersOnClose);
        }
    });
}

async function cacheUserNames(uids) {
    const uidsToFetch = [...new Set(uids.filter(uid => uid && !userNamesCache[uid]))];
    if (uidsToFetch.length === 0) return;

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
}

async function cacheFarmNames(fields) {
    const farmKeysToFetch = [...new Set(fields.filter(f => f.farmId).map(f => `${f.ownerId}/${f.farmId}`))];
    const newFarmKeys = farmKeysToFetch.filter(key => !farmNamesCache[key]);
    if (newFarmKeys.length === 0) return;

    const farmPromises = newFarmKeys.map(key => {
        const [ownerId, farmId] = key.split('/');
        return getDoc(doc(db, "users", ownerId, "farms", farmId));
    });

    const farmDocs = await Promise.all(farmPromises);
    farmDocs.forEach((farmDoc, index) => {
        const key = newFarmKeys[index];
        if (farmDoc.exists()) {
            farmNamesCache[key] = farmDoc.data().name || 'Ferme inconnue';
        } else {
            farmNamesCache[key] = 'Ferme inconnue';
        }
    });
}

async function displaySharedFieldList() {
    if (allSharedFields.length === 0) {
        sharedFieldListContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <h3 class="font-semibold text-slate-700">Aucun partage</h3>
            <p class="text-sm mt-1">Aucune parcelle n'a encore été partagée avec vous.</p>
        </div>`;
        return;
    }

    const farmFilteredFields = (selectedSharedFarm === null)
        ? allSharedFields
        : allSharedFields.filter(field => {
            const farmName = field.farmId ? (farmNamesCache[`${field.ownerId}/${field.farmId}`] || 'Ferme inconnue') : 'Non assignée';
            const ownerName = userNamesCache[field.ownerId] || 'Propriétaire inconnu';
            const uniqueFarmName = `${ownerName} - ${farmName}`;
            return selectedSharedFarm === uniqueFarmName;
        });
    
    let filteredFields = ((selectedSharedCrop === null)
        ? farmFilteredFields
        : farmFilteredFields.filter(field => field.crop === selectedSharedCrop)
    );

    if (hideFinishedSharedFields) {
        filteredFields = filteredFields.filter(field => field.status !== 'finished');
    }

    filteredFields.sort((a, b) => {
        const dateA = a.lastModified && a.lastModified.toDate ? a.lastModified.toDate() : 0;
        const dateB = b.lastModified && b.lastModified.toDate ? b.lastModified.toDate() : 0;
        return dateB - dateA;
    });

    if (filteredFields.length === 0) {
        sharedFieldListContainer.innerHTML = `<div class="text-center text-slate-500 mt-8 p-6 bg-slate-100 rounded-lg col-span-full">
            <h3 class="font-semibold text-slate-700">Aucune parcelle correspondante</h3>
            <p class="text-sm mt-1">Vérifiez vos filtres pour afficher les parcelles partagées.</p>
        </div>`;
        return;
    }

    await cacheUserNames(filteredFields.map(f => f.ownerId));
    await cacheFarmNames(filteredFields);

    const fieldCardsHTML = filteredFields.map(field => {
        const ownerName = userNamesCache[field.ownerId] || "Propriétaire Inconnu";
        const farmName = field.farmId ? (farmNamesCache[`${field.ownerId}/${field.farmId}`] || 'Ferme inconnue') : 'Non assignée';
        
        // CORRECTION : Utilisation de la nouvelle structure de données retournée par calculateTotals
        const { grainTotals } = calculateTotals(field);
        const { totalWeight, yield: fieldYield, totalBaleCount } = grainTotals;
        
        const isLinCrop = field.crop && field.crop.toLowerCase().includes('lin');
        const isFinished = field.status === 'finished';
        
        const yieldOrBaleHTML = isLinCrop 
            ? `<p class="text-sm text-slate-500">${(totalBaleCount || 0).toLocaleString('fr-FR')} bottes</p>`
            : `<p class="text-sm text-slate-500">${(fieldYield || 0).toFixed(2)} qx/ha</p>`;

        const finishedBadgeHTML = isFinished ? `
            <div class="mt-2 pt-2 border-t border-slate-100 text-center">
                <span class="inline-flex items-center gap-2 text-sm font-bold text-green-600">
                    <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    Terminé
                </span>
            </div>
        ` : `
            <div class="flex items-center justify-end mt-2 pt-2 border-t border-slate-100">
                <button class="revoke-access-btn p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors" 
                        data-key="${field.id}" 
                        data-owner-id="${field.ownerId}"
                        data-field-name="${field.name}" 
                        title="Quitter le partage">
                    <i data-lucide="x-circle" class="w-5 h-5"></i>
                </button>
            </div>
        `;

        return `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full justify-between mb-4 lg:mb-0">
                <div class="field-card-content cursor-pointer" data-key="${field.id}" data-owner-id="${field.ownerId}">
                    <div class="flex justify-between items-start gap-4">
                        <div class="min-w-0">
                            <h3 class="font-bold text-lg text-slate-800 truncate">${field.name}</h3>
                            <p class="text-sm text-slate-500">${field.crop || 'N/A'}</p>
                            <p class="text-xs text-slate-400 mt-1">Partagé par : ${ownerName}</p>
                            <p class="text-xs text-slate-400">Ferme : ${farmName}</p>
                        </div>
                        <div class="text-right flex-shrink-0">
                            <p class="font-bold text-lg text-green-600 whitespace-nowrap">${(totalWeight || 0).toLocaleString('fr-FR')} kg</p>
                            <p class="text-sm text-slate-500">${(field.size || 0).toLocaleString('fr-FR')} ha</p>
                            ${yieldOrBaleHTML}
                        </div>
                    </div>
                </div>
                ${finishedBadgeHTML}
            </div>
        `;
    }).join('');
    
    sharedFieldListContainer.innerHTML = fieldCardsHTML;
    lucide.createIcons();
}

function loadSharedFields() {
    if (!currentUser) return;

    const q = query(collectionGroup(db, 'fields'), where('accessControlUids', 'array-contains', currentUser.uid));

    unsubscribeSharedFields = onSnapshot(q, (snapshot) => {
        allSharedFields = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        (async () => {
            await cacheUserNames(allSharedFields.map(f => f.ownerId));
            await cacheFarmNames(allSharedFields);
            displaySharedFarmFilters();
            displaySharedCropFilters();
            displaySharedFieldList();
        })();

    }, (error) => {
        console.error("Erreur de chargement des champs partagés:", error);
        let userMessage = "";
        if (error.code === 'failed-precondition') {
            userMessage = `<p class="font-bold">Action requise : Index manquant !</p><p class="text-sm mt-2">La base de données a besoin d'un index pour cette recherche. Ouvrez la console (F12), trouvez l'erreur et <strong>cliquez sur le lien</strong> pour le créer.</p>`;
        } else if (error.code === 'permission-denied') {
             userMessage = `<p class="font-bold">Erreur de Permissions</p><p class="text-sm mt-2">Vos règles de sécurité Firestore ne permettent pas cette opération. Assurez-vous d'avoir publié les dernières règles.</p>`;
        } else {
             userMessage = `<p class="font-bold\\">La récupération des partages a échoué.</p><p class="text-sm mt-2">Vérifiez votre connexion et réessayez.</p>`;
        }
        sharedFieldListContainer.innerHTML = `<div class="text-center text-red-600 mt-8 p-4 bg-red-100 rounded-lg border border-red-200">${userMessage}</div>`;
    });
}