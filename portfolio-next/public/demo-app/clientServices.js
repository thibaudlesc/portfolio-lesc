// clientServices.js (Version SANS facturation PDF)

import { db, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, setDoc, getDoc, auth } from './firebase-config.js';
import { showToast, openModal, closeModal, navigateToPage, showConfirmationModal } from './harvest.js';
import { getContacts, showContactManagementModal } from './contacts.js';

let unsubscribeServices = null;

export function initClientServices(user) {
    // Cette fonction assure la cohérence de l'architecture.
}

export function displayServicesListPage() {
    navigateToPage('page-services-list');
    const container = document.getElementById('page-services-list');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
        container.innerHTML = `<p class="text-center text-red-500 p-8">Erreur : Utilisateur non connecté. Veuillez vous reconnecter.</p>`;
        return;
    }

    container.innerHTML = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b border-slate-200 flex items-center justify-between lg:static lg:bg-transparent lg:p-0 lg:mb-6">
            <h1 class="text-xl lg:text-3xl font-bold text-slate-800">Mes Prestations</h1>
            <button id="add-service-btn" class="bg-green-600 text-white p-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center shadow-md">
                <i data-lucide="plus" class="h-5 w-5"></i>
                <span class="hidden md:inline ml-1.5 text-sm">Ajouter</span>
            </button>
        </header>
        <div id="services-list-container" class="p-4 lg:p-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <p class="col-span-full text-center text-slate-500">Chargement des prestations...</p>
        </div>
    `;
    lucide.createIcons();
    
    document.getElementById('add-service-btn').addEventListener('click', () => showAddOrEditServiceModal());

    if (unsubscribeServices) unsubscribeServices();
    const servicesQuery = query(collection(db, 'users', currentUser.uid, 'clientServices'), orderBy('date', 'desc'));
    unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
        const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderServicesList(services);
    });
}

function renderServicesList(services) {
    const container = document.getElementById('services-list-container');
    if (!container) return;

    if (services.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-slate-500 p-10 bg-white rounded-lg border"><p>Aucune prestation enregistrée pour le moment.</p></div>`;
        return;
    }
    container.innerHTML = services.map(service => createServiceCardHTML(service)).join('');
    lucide.createIcons();

    // Utilisation de la délégation d'événements pour gérer les clics
    container.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const card = button.closest('.service-card');
        if (!card) return;
        
        const serviceId = card.dataset.id;
        const serviceTitle = card.dataset.title;
        const currentStatus = card.dataset.status;

        if (button.classList.contains('delete-service-btn')) {
            handleDeleteService(serviceId, serviceTitle);
        } else if (button.classList.contains('edit-service-btn')) {
            showAddOrEditServiceModal(serviceId);
        } else if (button.classList.contains('status-change-btn')) {
            handleQuickStatusChange(serviceId, currentStatus);
        }
    });
}

function createServiceCardHTML(service) {
    const date = service.date?.toDate().toLocaleDateString('fr-FR') || 'N/A';
    const total = service.totalAmount || 0;
    const status = service.status || 'pending';
    const statusInfo = {
        pending: { text: 'À facturer', class: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
        completed: { text: 'Terminé', class: 'bg-green-100 text-green-800 hover:bg-green-200' },
        invoiced: { text: 'Facturé', class: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    };

    return `
    <div class="service-card bg-white p-4 rounded-xl shadow-sm border flex flex-col" data-id="${service.id}" data-title="${service.title}" data-status="${status}">
        <div class="flex-grow">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-slate-800">${service.title}</p>
                    <p class="text-sm text-slate-500">${service.clientName}</p>
                    <p class="text-xs text-slate-400">${date}</p>
                </div>
                <button class="status-change-btn text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${statusInfo[status]?.class}">
                    ${statusInfo[status]?.text}
                </button>
            </div>
            <p class="text-right text-3xl font-bold text-green-600 mt-4">${total.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</p>
        </div>
        <div class="border-t mt-2 pt-2 px-2 flex justify-end gap-1">
            <button class="edit-service-btn p-2 text-slate-400 hover:text-blue-600 rounded-full" title="Modifier"><i data-lucide="pencil" class="w-5 h-5 pointer-events-none"></i></button>
            <button class="delete-service-btn p-2 text-slate-400 hover:text-red-600 rounded-full" title="Supprimer"><i data-lucide="trash-2" class="w-5 h-5 pointer-events-none"></i></button>
        </div>
    </div>
    `;
}

async function showAddOrEditServiceModal(serviceId = null) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    const isEdit = serviceId !== null;
    let serviceData = {};

    if (isEdit) {
        const docRef = doc(db, 'users', currentUser.uid, 'clientServices', serviceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            serviceData = docSnap.data();
        }
    }

    const clients = getContacts().filter(c => c.isClient);
    const clientOptions = clients.map(c => `<option value="${c.name}"></option>`).join('');

    const today = new Date().toISOString().split('T')[0];
    const dateValue = serviceData.date ? serviceData.date.toDate().toISOString().split('T')[0] : today;

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">${isEdit ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
        <form id="service-form" class="space-y-4">
            <div>
                <label for="service-title" class="block text-sm font-medium text-slate-700 mb-1">Titre de la prestation</label>
                <input type="text" id="service-title" value="${serviceData.title || ''}" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Moisson champ du moulin" required>
            </div>
            <div>
                <label for="service-client" class="block text-sm font-medium text-slate-700 mb-1">Client</label>
                <input type="text" id="service-client" value="${serviceData.clientName || ''}" list="clients-list" class="w-full p-3 border-2 rounded-lg" placeholder="Taper ou sélectionner un client..." required>
                <datalist id="clients-list">${clientOptions}</datalist>
                <p class="text-xs text-slate-500 mt-1">Si le client n'existe pas, il sera créé automatiquement.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="service-quantity" class="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                    <input type="number" step="0.01" id="service-quantity" value="${serviceData.quantity || ''}" class="w-full p-3 border-2 rounded-lg" placeholder="10">
                </div>
                <div>
                    <label for="service-unit" class="block text-sm font-medium text-slate-700 mb-1">Unité</label>
                    <input type="text" id="service-unit" value="${serviceData.unit || 'ha'}" class="w-full p-3 border-2 rounded-lg" placeholder="ha, h, km...">
                </div>
            </div>
            <div>
                <label for="service-rate" class="block text-sm font-medium text-slate-700 mb-1">Taux (€ / Unité)</label>
                <input type="number" step="0.01" id="service-rate" value="${serviceData.rate || ''}" class="w-full p-3 border-2 rounded-lg" placeholder="150.00">
            </div>
            <div>
                <label for="service-date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input type="date" id="service-date" value="${dateValue}" class="w-full p-3 border-2 rounded-lg" required>
            </div>
            <div>
                <label for="service-status" class="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                <select id="service-status" class="w-full p-3 border-2 rounded-lg">
                    <option value="pending" ${!serviceData.status || serviceData.status === 'pending' ? 'selected' : ''}>À facturer</option>
                    <option value="completed" ${serviceData.status === 'completed' ? 'selected' : ''}>Terminé</option>
                    <option value="invoiced" ${serviceData.status === 'invoiced' ? 'selected' : ''}>Facturé</option>
                </select>
            </div>
            <p id="service-error" class="text-red-500 text-sm hidden text-center pt-2"></p>
            <div class="mt-4 flex gap-4">
                <button type="button" id="modal-cancel-btn" class="w-full px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
                <button type="submit" class="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg">${isEdit ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
        </form>
    `;
    openModal(content);
    
    document.getElementById('service-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveService(serviceId);
    });
}

async function handleSaveService(serviceId = null) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const isEdit = serviceId !== null;
    const errorEl = document.getElementById('service-error');

    const title = document.getElementById('service-title').value.trim();
    const clientName = document.getElementById('service-client').value.trim();
    const quantity = parseFloat(document.getElementById('service-quantity').value) || 0;
    const unit = document.getElementById('service-unit').value.trim() || 'unité';
    const rate = parseFloat(document.getElementById('service-rate').value) || 0;
    const dateStr = document.getElementById('service-date').value;
    const status = document.getElementById('service-status').value;

    if (!title || !clientName || !dateStr) {
        errorEl.textContent = "Le titre, le client et la date sont obligatoires.";
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const allContacts = getContacts();
    const clientExists = allContacts.some(contact => contact.name.toLowerCase() === clientName.toLowerCase());

    if (!clientExists) {
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'contacts'), {
                name: clientName, phone: '', isClient: true
            });
            showToast(`Nouveau client "${clientName}" ajouté.`);
        } catch (error) {
            console.error("Erreur lors de la création auto du client:", error);
        }
    }

    const serviceData = {
        title, clientName, quantity, unit, rate,
        totalAmount: quantity * rate,
        date: new Date(dateStr),
        status,
        updatedAt: serverTimestamp()
    };

    try {
        if (isEdit) {
            const docRef = doc(db, 'users', currentUser.uid, 'clientServices', serviceId);
            await updateDoc(docRef, serviceData);
        } else {
            serviceData.createdAt = serverTimestamp();
            const docRef = doc(collection(db, 'users', currentUser.uid, 'clientServices'));
            await setDoc(docRef, serviceData);
        }
        showToast(`Prestation ${isEdit ? 'modifiée' : 'enregistrée'}.`);
        closeModal();
    } catch (error) {
        console.error("Erreur de sauvegarde de la prestation:", error);
        showToast("Une erreur est survenue.");
    }
}

function handleDeleteService(serviceId, serviceTitle) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const message = `Êtes-vous sûr de vouloir supprimer la prestation "${serviceTitle}" ?`;
    showConfirmationModal(message, async () => {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'clientServices', serviceId));
            showToast("Prestation supprimée.");
        } catch (error) {
            console.error("Erreur de suppression de la prestation:", error);
            showToast("La suppression a échoué.");
        }
    });
}

// ▼▼▼ NOUVELLES FONCTIONS (ANCIENNES FONCTIONS DE FACTURATION SUPPRIMÉES) ▼▼▼

/**
 * Gère le changement rapide de statut d'une prestation.
 * @param {string} serviceId - L'ID de la prestation.
 * @param {string} currentStatus - Le statut actuel ('pending', 'completed', 'invoiced').
 */
async function handleQuickStatusChange(serviceId, currentStatus) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const statusCycle = {
        pending: 'completed',
        completed: 'invoiced',
        invoiced: 'pending',
    };
    const newStatus = statusCycle[currentStatus] || 'pending';

    try {
        const docRef = doc(db, 'users', currentUser.uid, 'clientServices', serviceId);
        await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
        showToast(`Statut mis à jour.`);
    } catch (error) {
        console.error("Erreur de mise à jour du statut:", error);
        showToast("Une erreur est survenue.");
    }
}