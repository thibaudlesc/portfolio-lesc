// services.js

import { showToast, openModal, closeModal, showConfirmationModal } from './ui.js';

// Remplacez votre ligne d'import Firestore par celle-ci au début de services.js

import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, where, Timestamp, getDoc, getDocs, arrayUnion, arrayRemove } from './firebase-config.js';

import { displayServicesListPage } from './clientServices.js';
import { Capacitor } from 'https://unpkg.com/@capacitor/core?module';
import { Share } from 'https://unpkg.com/@capacitor/share?module';
import { Filesystem, Directory } from 'https://unpkg.com/@capacitor/filesystem?module';

// --- État et Variables ---
let wakeLock = null;
let currentUser = null;
let unsubscribeTodos = null;
let unsubscribeWorkHours = null;
let unsubscribeReceivedHours = null;
let currentDate = new Date();
let currentViewMode = 'week';
let currentlyViewedEmployee = null; // {id, name}

export function initServices(user) {
    currentUser = user;
}

export function displayServicesPage() {
    const container = document.getElementById('page-services');
    if (!container) { console.error("Le conteneur de la page des services est introuvable."); return; }

    container.innerHTML = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b border-slate-200 lg:static lg:bg-transparent lg:p-0 lg:mb-6"><h1 class="text-xl lg:text-3xl font-bold text-slate-800">Prestations & Utilitaires</h1></header>
        <div id="services-grid" class="p-4 lg:p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="service-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" data-service="client-services"><div class="flex items-center gap-4"><div class="bg-indigo-100 p-3 rounded-full"><i data-lucide="briefcase" class="w-8 h-8 text-indigo-600"></i></div><div><h3 class="font-bold text-lg text-slate-800">Gérer mes Prestations</h3><p class="text-sm text-slate-500">Suivez les services rendus à vos clients.</p></div></div></div>
            <div class="service-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" data-service="work-hours"><div class="flex items-center gap-4"><div class="bg-teal-100 p-3 rounded-full"><i data-lucide="clock" class="w-8 h-8 text-teal-600"></i></div><div><h3 class="font-bold text-lg text-slate-800">Mes Heures</h3><p class="text-sm text-slate-500">Suivez et partagez vos heures de travail.</p></div></div></div>
            <div class="service-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" data-service="received-hours"><div class="flex items-center gap-4"><div class="bg-purple-100 p-3 rounded-full"><i data-lucide="inbox" class="w-8 h-8 text-purple-600"></i></div><div><h3 class="font-bold text-lg text-slate-800">Heures Partagées</h3><p class="text-sm text-slate-500">Consultez les heures de vos employés.</p></div></div></div>
            <div class="service-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" data-service="bucket-counter"><div class="flex items-center gap-4"><div class="bg-blue-100 p-3 rounded-full"><i data-lucide="cuboid" class="w-8 h-8 text-blue-600"></i></div><div><h3 class="font-bold text-lg text-slate-800">Compteur de godets</h3><p class="text-sm text-slate-500">Comptez facilement les godets.</p></div></div></div>
            <div class="service-card bg-white p-6 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all" data-service="todo-list"><div class="flex items-center gap-4"><div class="bg-yellow-100 p-3 rounded-full"><i data-lucide="check-square" class="w-8 h-8 text-yellow-600"></i></div><div><h3 class="font-bold text-lg text-slate-800">Gestionnaire de Tâches</h3><p class="text-sm text-slate-500">Organisez votre travail.</p></div></div></div>
        </div>
    `;
    lucide.createIcons();
    
    document.getElementById('services-grid').addEventListener('click', (e) => {
        const card = e.target.closest('.service-card');
        if (card && card.dataset.service) launchService(card.dataset.service);
    });
}

function launchService(serviceName) {
    if (unsubscribeWorkHours) unsubscribeWorkHours();
    if (unsubscribeReceivedHours) unsubscribeReceivedHours();
    if (unsubscribeTodos) unsubscribeTodos();
    switch(serviceName) {
        case 'client-services': displayServicesListPage(); break;
        case 'bucket-counter': renderBucketCounter(); break;
        case 'todo-list': renderTodoList(); break;
        case 'work-hours': renderMyHoursPage(); break;
        case 'received-hours': displayReceivedHoursPage(); break;
        default: showToast("Ce service n'est pas encore disponible.");
    }
}

// ===================================================================
// GESTION DES HEURES (Côté Employé)
// ===================================================================

function renderMyHoursPage() {
    const container = document.getElementById('page-services');
    if (!container) return;
    container.innerHTML = `
        <header class="bg-slate-50 p-4 lg:p-0 lg:bg-transparent hours-page-header flex items-center justify-between sticky top-[68px] z-10 lg:static">
            <button id="back-from-service-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button>
            <h1 class="text-xl font-bold text-slate-800">Mes Heures</h1>
            <div class="w-8"></div>
        </header>
        <div class="p-4 lg:p-0">
            <div class="action-btn-group justify-end mb-4">
                <button id="share-hours-btn" class="action-btn share"><i data-lucide="share-2"></i><span>Partager</span></button>
                <button id="export-hours-pdf-btn" class="action-btn export"><i data-lucide="file-text"></i><span>Exporter</span></button>
                <button id="add-work-entry-btn" class="action-btn add"><i data-lucide="plus"></i><span>Ajouter</span></button>
            </div>
            <div class="date-navigator flex justify-between items-center mb-4">
                 <button id="prev-period-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-left"></i></button>
                <div class="text-center">
                    <div class="period-selector mx-auto mb-2 w-48">
                        <button class="period-filter-btn" data-mode="week">Semaine</button>
                        <button class="period-filter-btn" data-mode="month">Mois</button>
                    </div>
                    <p id="period-display" class="font-semibold text-lg text-slate-800"></p>
                    <p id="period-total-hours" class="text-sm text-slate-500">Total: 0h 00min</p>
                </div>
                <button id="next-period-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-right"></i></button>
            </div>
            <div id="work-hours-container" class="space-y-3"></div>
        </div>
    `;
    lucide.createIcons();
    document.getElementById('back-from-service-btn').addEventListener('click', displayServicesPage);
    document.getElementById('add-work-entry-btn').addEventListener('click', () => showAddWorkEntryModal());
    document.getElementById('share-hours-btn').addEventListener('click', showShareHoursModal);
    document.getElementById('prev-period-btn').addEventListener('click', () => changePeriod(-1));
    document.getElementById('next-period-btn').addEventListener('click', () => changePeriod(1));
    document.getElementById('export-hours-pdf-btn').addEventListener('click', () => generateWorkHoursPDF(currentUser.uid, currentUser.displayName || currentUser.email));
    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentViewMode);
        btn.addEventListener('click', (e) => { 
            currentViewMode = e.target.dataset.mode; 
            document.querySelector('.period-filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            updatePeriodView();
        });
    });
    updatePeriodView();
}

function renderWorkEntries(entries, isReadOnly = false) {
    const container = document.getElementById('work-hours-container');
    if (!container) return;
    const totalMinutes = entries.reduce((acc, entry) => acc + (entry.durationMinutes || 0), 0);
    const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60;
    const totalHoursDisplay = document.getElementById('period-total-hours');
    if (totalHoursDisplay) totalHoursDisplay.textContent = `Total : ${h}h ${m.toString().padStart(2, '0')}min`;
    if (entries.length === 0) { container.innerHTML = `<div class="text-center text-slate-500 p-6 bg-white rounded-lg border"><p>Aucune heure enregistrée.</p></div>`; return; }
    container.innerHTML = entries.map(entry => {
        const dH = Math.floor(entry.durationMinutes / 60); const dM = entry.durationMinutes % 60;
        const date = entry.date.toDate(); const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
        const controls = isReadOnly ? '' : `
            <div class="entry-controls">
                <button class="edit-work-entry-btn" data-id="${entry.id}"><i data-lucide="pencil"></i></button>
                <button class="delete-work-entry-btn" data-id="${entry.id}"><i data-lucide="trash-2"></i></button>
            </div>`;
        return `
            <div class="hours-entry-card">
                <div class="date-badge"><p class="day-number">${date.getDate()}</p><p class="day-name">${dayName}.</p></div>
                <div class="flex-1 min-w-0">
                    <p class="entry-periods">${(entry.periods||[]).map(p=>`${p.start}-${p.end}`).join(' / ')}</p>
                    ${entry.description ? `<p class="entry-description">${entry.description}</p>` : ''}
                </div>
                <p class="entry-duration">${dH}h ${dM.toString().padStart(2, '0')}</p>
                ${controls}
            </div>
        `;
    }).join('');
    lucide.createIcons();
    if (!isReadOnly) {
        container.querySelectorAll('.edit-work-entry-btn').forEach(btn => btn.addEventListener('click', e => showAddWorkEntryModal(e.currentTarget.dataset.id)));
        container.querySelectorAll('.delete-work-entry-btn').forEach(btn => btn.addEventListener('click', e => handleDeleteWorkEntry(e.currentTarget.dataset.id)));
    }
}

async function showAddWorkEntryModal(entryId = null) {
    const isEdit = entryId !== null;
    let entryData = {};
    if (isEdit) {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid, 'workHours', entryId));
        if (docSnap.exists()) entryData = docSnap.data();
    }

    const dateValue = entryData.date ? entryData.date.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const initialPeriods = entryData.periods || [{ start: '08:00', end: '12:00' }];

    // ▼▼▼ DÉBUT DE LA MODIFICATION : Structure HTML et CSS des périodes simplifiée pour iOS ▼▼▼
    const createPeriodHTML = (period, index) => `
        <div class="period-group grid grid-cols-[1fr_auto] gap-2 items-center">
            <div class="grid grid-cols-2 gap-3">
                <div class="time-input-wrapper">
                    <span class="time-input-label">Début</span>
                    <input type="time" class="work-start-time" value="${period.start || ''}" required>
                </div>
                <div class="time-input-wrapper">
                    <span class="time-input-label">Fin</span>
                    <input type="time" class="work-end-time" value="${period.end || ''}" required>
                </div>
            </div>
            <button type="button" class="remove-period-btn p-2 text-red-500 hover:bg-red-100 rounded-full" style="${index === 0 ? 'visibility: hidden;' : ''}">
                <i data-lucide="x-circle" class="w-5 h-5"></i>
            </button>
        </div>
    `;
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲

    const content = `
        <h3 class="text-xl font-bold mb-6 text-center">${isEdit ? 'Modifier la journée' : 'Nouvelle journée'}</h3>
        <form id="work-entry-form" class="space-y-4">
            <div>
                <label for="work-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" id="work-date" value="${dateValue}" class="w-full p-3 bg-slate-100 border-2 border-slate-200 rounded-lg" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Périodes</label>
                <div id="periods-container" class="space-y-3">
                    ${initialPeriods.map((p, i) => createPeriodHTML(p, i)).join('')}
                </div>
                <button type="button" id="add-period-btn" class="mt-3 text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>Ajouter une période
                </button>
            </div>
            <div>
                <label for="work-description" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea id="work-description" rows="3" class="w-full p-3 border-2 bg-slate-100 border-slate-200 rounded-lg" placeholder="Facultatif...">${entryData.description || ''}</textarea>
            </div>
            <p id="work-entry-error" class="text-red-500 text-sm hidden text-center pt-2"></p>
            <div class="mt-6 grid grid-cols-2 gap-3">
                <button type="button" id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg">Annuler</button>
                <button type="submit" class="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg">Enregistrer</button>
            </div>
        </form>
    `;
    openModal(content);
    lucide.createIcons();

    const periodsContainer = document.getElementById('periods-container');

    const addPeriod = () => {
        const newIndex = periodsContainer.children.length;
        const periodDiv = document.createElement('div');
        periodDiv.innerHTML = createPeriodHTML({ start: '', end: '' }, newIndex).trim();
        const newPeriodGroup = periodDiv.children[0]; 
        periodsContainer.appendChild(newPeriodGroup);
        lucide.createIcons();
        newPeriodGroup.querySelector('.remove-period-btn').addEventListener('click', () => {
            newPeriodGroup.remove();
        });
    };

    document.getElementById('add-period-btn').addEventListener('click', addPeriod);
    
    periodsContainer.querySelectorAll('.remove-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.period-group').remove());
    });

    document.getElementById('work-entry-form').addEventListener('submit', e => { e.preventDefault(); handleSaveWorkEntry(entryId); });
}

async function handleSaveWorkEntry(entryId) {
    if (!currentUser) return;
    const isEdit = entryId !== null;
    const errorEl = document.getElementById('work-entry-error');
    if (!errorEl) return;
    
    const workDateEl = document.getElementById('work-date');
    const workDescEl = document.getElementById('work-description');
    if (!workDateEl || !workDescEl) return;
    
    const date = new Date(workDateEl.value);
    const description = workDescEl.value.trim();
    const periodGroups = document.querySelectorAll('.period-group');
    const periods = []; let totalDuration = 0;
    for (const group of periodGroups) {
        const startEl = group.querySelector('.work-start-time');
        const endEl = group.querySelector('.work-end-time');
        if (!startEl || !endEl) continue;
        const start = startEl.value;
        const end = endEl.value;
        if (start && end) {
            const startDT = new Date(`${date.toISOString().split('T')[0]}T${start}`); const endDT = new Date(`${date.toISOString().split('T')[0]}T${end}`);
            if (endDT <= startDT) { errorEl.textContent = "L'heure de fin doit être après son début."; errorEl.classList.remove('hidden'); return; }
            periods.push({ start, end }); totalDuration += (endDT - startDT) / 60000;
        }
    }
    if (periods.length === 0) { errorEl.textContent = "Veuillez renseigner au moins une période."; errorEl.classList.remove('hidden'); return; }
    errorEl.classList.add('hidden');
    // ▼▼▼ Ligne de code obsolète supprimée ▼▼▼
    const entryData = { date: Timestamp.fromDate(date), startTime: periods[0].start, endTime: periods[periods.length - 1].end, periods, description, durationMinutes: totalDuration, updatedAt: serverTimestamp() };
    try {
        if (isEdit) { await updateDoc(doc(db, 'users', currentUser.uid, 'workHours', entryId), entryData); } 
        else { entryData.createdAt = serverTimestamp(); await addDoc(collection(db, 'users', currentUser.uid, 'workHours'), entryData); }
        showToast(`Journée ${isEdit ? 'modifiée' : 'enregistrée'}.`); closeModal();
    } catch (error) { showToast("Une erreur est survenue."); }
}

async function findUserByTag(fullTag) {
    const parts = fullTag.split('#');
    if (parts.length !== 2) return null;
    const name = parts[0].trim();
    const tag = parts[1].trim();
    if (!name || !/^\d{4}$/.test(tag)) return null;
    const q = query(collection(db, "users"), where("name", "==", name), where("userTag", "==", tag));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
}

function showShareHoursModal() {
    const content = `
        <h3 class="text-xl font-bold text-center mb-4">Donner accès à mes heures</h3>
        <p class="text-center text-slate-500 text-sm mb-6">Entrez l'identifiant (Nom#Tag) de votre patron. Il pourra consulter vos heures en temps réel.</p>
        <div>
            <label for="user-tag-input" class="block text-sm font-medium mb-1">Identifiant du destinataire</label>
            <input type="text" id="user-tag-input" class="w-full p-3 bg-slate-100 border-2 rounded-lg" placeholder="Ex: Jean Dupont#1234">
            <p id="user-search-status" class="text-sm mt-1 h-5"></p>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3">
            <button id="modal-cancel-btn" class="w-full px-6 py-3 bg-slate-200 font-bold rounded-lg">Annuler</button>
            <button id="confirm-share-hours-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Donner l'accès</button>
        </div>
    `;
    openModal(content);
    const confirmBtn = document.getElementById('confirm-share-hours-btn');
    if (!confirmBtn) return;
    confirmBtn.addEventListener('click', async (e) => {
        const btn = e.target; btn.disabled = true; btn.textContent = "Vérification...";
        const userTagInput = document.getElementById('user-tag-input');
        const statusEl = document.getElementById('user-search-status');
        if (!userTagInput || !statusEl) {
            btn.disabled = false; btn.textContent = "Donner l'accès";
            return;
        }
        const fullTag = userTagInput.value;
        const targetUser = await findUserByTag(fullTag);
        if (!targetUser || targetUser.id === currentUser.uid) {
            statusEl.textContent = 'Utilisateur invalide ou introuvable.';
            statusEl.className = 'text-sm mt-1 h-5 text-red-500';
            btn.disabled = false; btn.textContent = "Donner l'accès";
            return;
        }
        await handleGrantHourAccess(targetUser.id);
        btn.disabled = false; btn.textContent = "Donner l'accès";
    });
}

async function exportWorkHoursToExcel(userId, userName) {
    showToast("Génération de l'export Excel en cours...");

    try {
        if (typeof XLSX === 'undefined') {
            showToast("Erreur: La librairie d'exportation n'est pas chargée.");
            return;
        }

        let startDate, endDate;
        if (currentViewMode === 'week') { startDate = getStartOfWeek(currentDate); endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 7); }
        else { startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); }

        const q = query(collection(db, 'users', userId, 'workHours'), where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<', Timestamp.fromDate(endDate)), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => doc.data());

        if (entries.length === 0) {
            showToast("Aucune heure à exporter pour cette période.");
            return;
        }

        const periodDisplayEl = document.getElementById('period-display');
        const periodDisplay = periodDisplayEl ? periodDisplayEl.textContent : '';
        const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
        const totalH = Math.floor(totalMinutes / 60);
        const totalM = totalMinutes % 60;
        
        const header = ["Date", "Périodes", "Durée", "Description"];
        const dataRows = entries.map(entry => {
            const date = entry.date.toDate().toLocaleDateString('fr-FR');
            const durationH = Math.floor(entry.durationMinutes / 60);
            const durationM = entry.durationMinutes % 60;
            const periodsStr = (entry.periods || []).map(p => `${p.start} - ${p.end}`).join(' | ');
            return [ date, periodsStr, `${durationH}h ${String(durationM).padStart(2, '0')}`, entry.description || '' ];
        });

        const wsData = [
            ["Relevé d'heures - Recolt'IQ"],
            [`Employé: ${userName}`],
            [`Période: ${periodDisplay}`],
            [`Total: ${totalH}h ${String(totalM).padStart(2, '0')}min`],
            [],
            header,
            ...dataRows
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws, "Relevé d'heures");

        const fileName = `Heures_${userName.replace(' ', '_')}_${currentDate.toISOString().slice(0,10)}.xlsx`;
        
        // Logique de partage/téléchargement
        const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIos() && navigator.share) {
            const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const file = new File([blob], fileName, { type: blob.type });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: `Relevé d'heures de ${userName}` });
            } else {
                XLSX.writeFile(wb, fileName);
            }
        } else {
            XLSX.writeFile(wb, fileName);
        }

    } catch (error) {
        console.error("ERREUR LORS DE L'EXPORT EXCEL DES HEURES :", error);
        showToast("Erreur lors de la génération de l'export Excel.");
    }
}

async function handleGrantHourAccess(targetUserId) {
    showToast("Mise à jour des permissions...");
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Cette ligne fonctionne désormais car arrayUnion est importé
        await updateDoc(userDocRef, {
            hourAccessGrantedTo: arrayUnion(targetUserId)
        });
        showToast("Accès aux heures partagé avec succès !");
        closeModal();
    } catch (error) {
        console.error("Erreur lors du partage d'accès : ", error);
        showToast("Une erreur est survenue.");
    }
}

// ===================================================================
// GESTION DES HEURES (Côté Patron)
// ===================================================================

function displayReceivedHoursPage() {
    const container = document.getElementById('page-services');
    if (!container) return;
    container.innerHTML = `<header class="bg-slate-50 p-4 lg:p-0 lg:bg-transparent hours-page-header flex items-center justify-between sticky top-[68px] z-10 lg:static"><button id="back-from-service-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button><h1 class="text-xl font-bold text-slate-800">Heures Partagées</h1><div class="w-8"></div></header><div id="received-hours-list" class="p-4 lg:p-0 space-y-4"><p class="text-center text-slate-500">Recherche des employés...</p></div>`;
    lucide.createIcons();
    document.getElementById('back-from-service-btn').addEventListener('click', displayServicesPage);
    const q = query(collection(db, 'users'), where('hourAccessGrantedTo', 'array-contains', currentUser.uid));
    unsubscribeReceivedHours = onSnapshot(q, (snapshot) => {
        const employees = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name || 'Employé inconnu' }));
        renderReceivedHoursList(employees);
    });
}

function renderReceivedHoursList(employees) {
    const container = document.getElementById('received-hours-list');
    if (!container) return;
    if (employees.length === 0) { container.innerHTML = `<div class="text-center text-slate-500 p-6 bg-white rounded-lg border mt-4"><p>Aucun employé ne partage ses heures avec vous.</p></div>`; return; }

    container.innerHTML = employees.map(emp => `
        <div class="report-summary-card cursor-pointer" data-employee-id="${emp.id}" data-employee-name="${emp.name}">
            <div class="flex justify-between items-center">
                <span class="font-bold text-lg">${emp.name}</span>
                <i data-lucide="chevron-right" class="w-5 h-5 text-slate-400"></i>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
    container.querySelectorAll('.report-summary-card').forEach(card => {
        card.addEventListener('click', () => {
            currentlyViewedEmployee = { id: card.dataset.employeeId, name: card.dataset.employeeName };
            displayHoursForEmployee();
        });
    });
}

function displayHoursForEmployee() {
    const container = document.getElementById('page-services');
    if (!container || !currentlyViewedEmployee) return;

    // ▼▼▼ MODIFICATION : Ajout des boutons d'export ▼▼▼
    container.innerHTML = `
        <header class="bg-slate-50 p-4 lg:p-0 lg:bg-transparent hours-page-header flex items-center justify-between sticky top-[68px] z-10 lg:static">
            <button id="back-to-received-list" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button>
            <h1 class="text-xl font-bold text-slate-800">${currentlyViewedEmployee.name}</h1>
            <div class="flex items-center gap-2">
                <button id="export-employee-pdf-btn" class="action-btn export !p-2" title="Exporter en PDF"><i data-lucide="file-text"></i></button>
                <button id="export-employee-excel-btn" class="action-btn share !p-2" title="Exporter en Excel"><i data-lucide="file-spreadsheet"></i></button>
            </div>
        </header>
        <div class="p-4 lg:p-0">
            <div class="date-navigator flex justify-between items-center mb-4">
                 <button id="prev-period-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-left"></i></button>
                <div class="text-center">
                    <div class="period-selector mx-auto mb-2 w-48">
                        <button class="period-filter-btn" data-mode="week">Semaine</button>
                        <button class="period-filter-btn" data-mode="month">Mois</button>
                    </div>
                    <p id="period-display" class="font-semibold text-lg text-slate-800"></p>
                    <p id="period-total-hours" class="text-sm text-slate-500">Total: 0h 00min</p>
                </div>
                <button id="next-period-btn" class="p-2 rounded-full hover:bg-slate-100"><i data-lucide="chevron-right"></i></button>
            </div>
            <div id="work-hours-container" class="space-y-3"></div>
        </div>`;
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲
    lucide.createIcons();

    document.getElementById('back-to-received-list').addEventListener('click', displayReceivedHoursPage);
    document.getElementById('prev-period-btn').addEventListener('click', () => changePeriod(-1, true));
    document.getElementById('next-period-btn').addEventListener('click', () => changePeriod(1, true));
    
    // ▼▼▼ NOUVEAU : Écouteurs pour les nouveaux boutons ▼▼▼
    document.getElementById('export-employee-pdf-btn').addEventListener('click', () => 
        generateWorkHoursPDF(currentlyViewedEmployee.id, currentlyViewedEmployee.name)
    );
    document.getElementById('export-employee-excel-btn').addEventListener('click', () => 
        exportWorkHoursToExcel(currentlyViewedEmployee.id, currentlyViewedEmployee.name)
    );
    // ▲▲▲ FIN DES NOUVEAUX ÉCOUTEURS ▲▲▲

    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentViewMode);
        btn.addEventListener('click', (e) => { 
            currentViewMode = e.target.dataset.mode; 
            document.querySelector('.period-filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            updatePeriodView(true);
        });
    });
    updatePeriodView(true);
}

// --- Fonctions utilitaires et autres ---

function updatePeriodView(isPatronView = false) {
    const display = document.getElementById('period-display'); if (!display) return;
    if (currentViewMode === 'week') { const start = getStartOfWeek(currentDate); const end = new Date(start); end.setDate(start.getDate() + 6); display.textContent = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`; } 
    else { display.textContent = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()); }
    const userIdToListen = isPatronView ? currentlyViewedEmployee.id : currentUser.uid;
    listenForWorkHours(userIdToListen, isPatronView);
}

function listenForWorkHours(userId, isPatronView = false) {
    if (unsubscribeWorkHours) unsubscribeWorkHours();
    if (!userId) return;
    let startDate, endDate;
    if (currentViewMode === 'week') { startDate = getStartOfWeek(currentDate); endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 7); } 
    else { startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); }
    const q = query(collection(db, 'users', userId, 'workHours'), where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<', Timestamp.fromDate(endDate)), orderBy('date', 'asc'));
    unsubscribeWorkHours = onSnapshot(q, (snapshot) => { 
        renderWorkEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), isPatronView); 
    });
}

function changePeriod(direction, isPatronView = false) {
    if (currentViewMode === 'week') { currentDate.setDate(currentDate.getDate() + (7 * direction)); } 
    else { currentDate.setMonth(currentDate.getMonth() + direction); }
    updatePeriodView(isPatronView);
}

async function handleDeleteWorkEntry(entryId) { if (!currentUser) return; showConfirmationModal("Êtes-vous sûr de vouloir supprimer cette entrée ?", async () => { try { await deleteDoc(doc(db, 'users', currentUser.uid, 'workHours', entryId)); showToast("Entrée supprimée."); } catch (error) { showToast("Impossible de supprimer l'entrée."); } }); }
function getStartOfWeek(d) { d = new Date(d); d.setHours(0,0,0,0); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); }

function getImageBase64(url) {
    return new Promise((resolve, reject) => {
        fetch(url).then(res => res.blob()).then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }).catch(reject);
    });
}

async function generateWorkHoursPDF(userId, userName) {
    showToast("Génération du PDF en cours...");
    try {
        const { jsPDF } = window.jspdf;
        const docPDF = new jsPDF();
        const fileName = `releve_heures_${userName.replace(' ', '_')}_${currentDate.toISOString().split('T')[0]}.pdf`;
        let startDate, endDate;
        if (currentViewMode === 'week') { startDate = getStartOfWeek(currentDate); endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 7); } 
        else { startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); }
        const q = query(collection(db, 'users', userId, 'workHours'), where('date', '>=', Timestamp.fromDate(startDate)), where('date', '<', Timestamp.fromDate(endDate)), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => doc.data());
        const buildPdfContent = async () => {
            const logoBase64 = await getImageBase64('apple-touch-icon.png');
            const primaryColor = '#16a34a', textColor = '#1e293b', mutedColor = '#64748b';
            const periodDisplayEl = document.getElementById('period-display');
            const totalHoursEl = document.getElementById('period-total-hours');
            const periodDisplay = periodDisplayEl ? periodDisplayEl.textContent : '';
            const totalHoursText = totalHoursEl ? totalHoursEl.textContent : '';
            docPDF.addImage(logoBase64, 'PNG', 14, 15, 20, 20);
            docPDF.setFontSize(22); docPDF.setFont('helvetica', 'bold'); docPDF.setTextColor(primaryColor); docPDF.text("Relevé d'heures", 40, 28);
            docPDF.setFontSize(11); docPDF.setFont('helvetica', 'normal'); docPDF.setTextColor(textColor);
            docPDF.text(`Employé: ${userName}`, 14, 45); docPDF.text(`Période: ${periodDisplay}`, 14, 51);
            docPDF.setFontSize(12); docPDF.setFont('helvetica', 'bold'); docPDF.text(totalHoursText, 14, 59);
            const tableData = entries.map(e => [ e.date.toDate().toLocaleDateString('fr-FR'), (e.periods||[]).map(p=>`${p.start}-${p.end}`).join(' | '), `${Math.floor(e.durationMinutes/60)}h ${String(e.durationMinutes%60).padStart(2,'0')}`, e.description||'' ]);
            docPDF.autoTable({ startY: 70, head: [['Date', 'Périodes', 'Durée', 'Description']], body: tableData, theme: 'grid', headStyles: { fillColor: primaryColor, textColor: '#FFFFFF' }, alternateRowStyles: { fillColor: '#f8fafc' }, didDrawPage: (data) => {
                const pageCount = docPDF.internal.getNumberOfPages();
                docPDF.setFontSize(8); docPDF.setTextColor(mutedColor);
                docPDF.text(`Page ${data.pageNumber} sur ${pageCount}`, data.settings.margin.left, docPDF.internal.pageSize.height - 10);
                docPDF.text('Généré par Recolt\'IQ', docPDF.internal.pageSize.width - data.settings.margin.right, docPDF.internal.pageSize.height - 10, { align: 'right' });
            }});
        };
        await buildPdfContent();
        const isIos = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIos() && navigator.share) {
            const pdfBlob = docPDF.output('blob');
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                try { await navigator.share({ files: [pdfFile], title: 'Relevé d\'heures' }); } 
                catch (error) { if (error.name !== 'AbortError') throw error; }
            } else { docPDF.save(fileName); }
        } else { docPDF.save(fileName); }
    } catch (error) { console.error("ERREUR LORS DE L'EXPORT PDF :", error); showToast("Erreur de création du PDF."); }
}
function renderTodoList() {
    const c = document.getElementById('page-services'); if (!c) return;
    c.innerHTML = `<header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b lg:static lg:bg-transparent lg:p-0 lg:mb-6"><button id="back-from-service-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button><h1 class="text-xl font-bold text-center flex-grow">Tâches</h1></header><div class="p-4 lg:p-0"><form id="add-todo-form" class="flex gap-2 mb-4"><input type="text" id="todo-input" class="w-full p-3 border-2 rounded-lg" placeholder="Ajouter..." required><button type="submit" class="p-3 bg-yellow-500 text-white rounded-lg"><i data-lucide="plus"></i></button></form><div class="flex justify-center bg-slate-100 p-1 rounded-lg mb-4"><button class="todo-filter-btn flex-1 py-2 px-4 text-sm font-semibold rounded-md active" data-filter="todo">À faire</button><button class="todo-filter-btn flex-1 py-2 px-4 text-sm font-semibold rounded-md" data-filter="done">Terminées</button></div><div id="todo-list-container" class="space-y-2"></div></div>`;
    lucide.createIcons();
    document.getElementById('back-from-service-btn').addEventListener('click', () => { if (unsubscribeTodos) unsubscribeTodos(); displayServicesPage(); });
    document.getElementById('add-todo-form').addEventListener('submit', (e) => { e.preventDefault(); const i = document.getElementById('todo-input'); const t = i.value.trim(); if (t) { addTodo(t); i.value = ''; } });
    document.querySelectorAll('.todo-filter-btn').forEach(b => b.addEventListener('click', () => { document.querySelector('.todo-filter-btn.active').classList.remove('active'); b.classList.add('active'); listenForTodoUpdates(); }));
    listenForTodoUpdates();
}
function listenForTodoUpdates() { if (unsubscribeTodos) unsubscribeTodos(); if (!currentUser) return; const q = query(collection(db, 'users', currentUser.uid, 'todos'), orderBy('createdAt', 'desc')); unsubscribeTodos = onSnapshot(q, (s) => { const todos = s.docs.map(d => ({ id: d.id, ...d.data() })); const f = document.querySelector('.todo-filter-btn.active')?.dataset.filter || 'todo'; renderTasks(todos, f); });}
function renderTasks(all, filter) {
    const c = document.getElementById('todo-list-container'); if (!c) return; const f = all.filter(t => filter === 'done' ? t.done : !t.done);
    if (f.length === 0) { c.innerHTML = `<div class="text-center text-slate-500 p-6 bg-slate-50 rounded-lg"><p>${filter === 'done' ? 'Aucune tâche terminée.' : 'Rien à faire !'}</p></div>`; } 
    else { c.innerHTML = f.map(t => `<div class="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border"><label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" class="todo-checkbox h-5 w-5 rounded text-yellow-600" data-id="${t.id}" ${t.done ? 'checked' : ''}><span class="${t.done ? 'line-through text-slate-400' : ''}">${t.text}</span></label><button class="delete-todo-btn p-2 text-slate-400 hover:text-red-600" data-id="${t.id}"><i data-lucide="trash-2"></i></button></div>`).join(''); }
    lucide.createIcons(); c.querySelectorAll('.todo-checkbox').forEach(cb => cb.addEventListener('change', e => updateTaskStatus(e.target.dataset.id, e.target.checked))); c.querySelectorAll('.delete-todo-btn').forEach(b => b.addEventListener('click', e => deleteTask(e.currentTarget.dataset.id)));
}
async function addTodo(t) { if (!currentUser) return; await addDoc(collection(db, 'users', currentUser.uid, 'todos'), { text: t, done: false, createdAt: serverTimestamp() }); }
async function updateTaskStatus(id, done) { if (!currentUser) return; await updateDoc(doc(db, 'users', currentUser.uid, 'todos', id), { done }); }
async function deleteTask(id) { if (!currentUser) return; await deleteDoc(doc(db, 'users', currentUser.uid, 'todos', id)); }
function renderBucketCounter() {
    const c = document.getElementById('page-services'); if (!c) return; let count = 0;
    c.innerHTML = `<header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b lg:static lg:bg-transparent lg:p-0 lg:mb-6"><button id="back-from-service-btn" class="p-2 -ml-2 rounded-full hover:bg-slate-200"><i data-lucide="arrow-left"></i></button><h1 class="text-xl font-bold text-center flex-grow">Compteur</h1></header><div class="flex flex-col items-center justify-center flex-grow p-4 lg:p-0"><button id="increment-bucket-btn" class="w-full h-64 flex items-center justify-center bg-green-500 text-white rounded-2xl shadow-lg"><span id="bucket-count-display" class="text-9xl font-black">${count}</span></button><button id="reset-bucket-btn" class="mt-6 flex items-center gap-2 text-red-600 font-semibold"><i data-lucide="rotate-ccw"></i>Remettre à zéro</button></div>`;
    lucide.createIcons(); const d = document.getElementById('bucket-count-display'); document.getElementById('increment-bucket-btn').addEventListener('click', () => { count++; d.textContent = count; }); document.getElementById('reset-bucket-btn').addEventListener('click', () => { count = 0; d.textContent = count; }); document.getElementById('back-from-service-btn').addEventListener('click', () => { releaseWakeLock(); displayServicesPage(); }); requestWakeLock();
}
const requestWakeLock = async () => { if ('wakeLock' in navigator) try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch (err) { console.error(`${err.name}, ${err.message}`); } };
const releaseWakeLock = async () => { if (wakeLock !== null) { await wakeLock.release(); wakeLock = null; } };