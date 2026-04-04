// contacts.js (Version Corrigée et Complète)

// CORRECTION 1 : Importer 'auth' pour un accès direct à l'utilisateur
import { db, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, auth } from './firebase-config.js';
import { showToast, openModal, closeModal, showConfirmationModal } from './ui.js';

// CORRECTION 2 : La variable globale 'currentUser' est maintenant inutile ici.
// let currentUser = null; 
let contacts = [];
let unsubscribeContacts = null;

/**
 * Initialise le module de contacts.
 * @param {object} user - L'objet utilisateur Firebase.
 */
export function initContacts(user) {
    // La fonction reste, mais la logique est déplacée pour plus de robustesse.
    if (user) {
        if (unsubscribeContacts) unsubscribeContacts();
        const contactsCollectionRef = collection(db, 'users', user.uid, 'contacts');
        unsubscribeContacts = onSnapshot(contactsCollectionRef, (snapshot) => {
            contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            contacts.sort((a, b) => a.name.localeCompare(b.name));
        }, (error) => {
            console.error("Erreur de chargement des contacts:", error);
        });
    } else {
        // Nettoyage si l'utilisateur se déconnecte
        if (unsubscribeContacts) unsubscribeContacts();
        contacts = [];
    }
}

/**
 * Retourne la liste des contacts en cache.
 * @returns {Array}
 */
export function getContacts() {
    return contacts;
}

/**
 * Affiche la modale de gestion des contacts.
 */
export function showContactManagementModal() {
    const contactsHTML = contacts.map(contact => `
        <div class="flex items-center justify-between bg-slate-50 p-2 rounded-lg border">
            <div>
                <p class="font-medium text-slate-800 flex items-center gap-2">
                    ${contact.isClient ? '<i data-lucide="user-check" class="w-4 h-4 text-green-600"></i>' : ''}
                    ${contact.name}
                </p>
                <p class="text-sm text-slate-500 pl-6">${contact.phone || 'Pas de numéro'}</p>
            </div>
            <div>
                <button class="edit-contact-btn p-2 text-slate-400 hover:text-blue-600" data-id="${contact.id}"><i data-lucide="pencil"></i></button>
                <button class="delete-contact-btn p-2 text-slate-400 hover:text-red-600" data-id="${contact.id}" data-name="${contact.name}"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `).join('') || '<p class="text-center text-slate-500 py-4">Aucun contact enregistré.</p>';

    const content = `
        <h3 class="text-xl font-semibold mb-4 text-center">Gérer les Contacts & Clients</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto mb-4">${contactsHTML}</div>
        <div class="border-t pt-4">
            <h4 id="contact-form-title" class="text-lg font-semibold mb-2">Ajouter un contact</h4>
            <input type="hidden" id="contact-id">
            <div class="space-y-3">
                <input type="text" id="contact-name" class="w-full p-3 border-2 rounded-lg" placeholder="Nom du contact">
                <input type="tel" id="contact-phone" class="w-full p-3 border-2 rounded-lg" placeholder="Numéro de téléphone (facultatif)">
                <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                    <input type="checkbox" id="contact-is-client" class="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500">
                    <label for="contact-is-client" class="text-sm font-medium text-slate-700">Marquer comme client (pour les prestations)</label>
                </div>
            </div>
            <p id="contact-error" class="text-red-500 text-sm hidden mt-2"></p>
            <div class="mt-4 flex gap-2">
                <button id="save-contact-btn" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Enregistrer</button>
                <button id="cancel-edit-contact-btn" class="hidden w-full px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            </div>
        </div>
        <button id="modal-close-btn" class="mt-6 w-full text-center">Fermer</button>
    `;
    openModal(content);
    if (window.lucide) lucide.createIcons();

    const contactList = document.querySelector('.space-y-2.max-h-60');
    const saveBtn = document.getElementById('save-contact-btn');
    const cancelBtn = document.getElementById('cancel-edit-contact-btn');
    
    if (contactList) contactList.addEventListener('click', handleContactListClick);
    if (saveBtn) saveBtn.addEventListener('click', handleSaveContact);
    if (cancelBtn) cancelBtn.addEventListener('click', resetContactForm);
}

function handleContactListClick(e) {
    const editBtn = e.target.closest('.edit-contact-btn');
    const deleteBtn = e.target.closest('.delete-contact-btn');

    if (editBtn) {
        const contact = contacts.find(c => c.id === editBtn.dataset.id);
        if (contact) {
            document.getElementById('contact-form-title').textContent = 'Modifier le contact';
            document.getElementById('contact-id').value = contact.id;
            document.getElementById('contact-name').value = contact.name;
            document.getElementById('contact-phone').value = contact.phone || '';
            document.getElementById('contact-is-client').checked = contact.isClient || false;
            document.getElementById('cancel-edit-contact-btn').classList.remove('hidden');
        }
    } else if (deleteBtn) {
        handleDeleteContact(deleteBtn.dataset.id, deleteBtn.dataset.name);
    }
}

function resetContactForm() {
    document.getElementById('contact-form-title').textContent = 'Ajouter un contact';
    document.getElementById('contact-id').value = '';
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-is-client').checked = false;
    document.getElementById('cancel-edit-contact-btn').classList.add('hidden');
    document.getElementById('contact-error').classList.add('hidden');
}

async function handleSaveContact() {
    // CORRECTION 3 : On récupère l'utilisateur actuel directement ici.
    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast("Erreur : Utilisateur non connecté.");
        return;
    }

    const id = document.getElementById('contact-id').value;
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const isClient = document.getElementById('contact-is-client').checked;
    const errorEl = document.getElementById('contact-error');

    if (!name) {
        errorEl.textContent = 'Le nom est obligatoire.';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const contactData = { name, phone, isClient };

    try {
        if (id) {
            await updateDoc(doc(db, 'users', currentUser.uid, 'contacts', id), contactData);
            showToast('Contact mis à jour.');
        } else {
            await addDoc(collection(db, 'users', currentUser.uid, 'contacts'), contactData);
            showToast('Contact ajouté.');
        }
        resetContactForm();
    } catch (error) {
        console.error("Erreur d'enregistrement du contact:", error);
        showToast("Une erreur est survenue.");
    }
}

function handleDeleteContact(id, name) {
    // CORRECTION 4 : On récupère l'utilisateur actuel directement ici aussi.
    const currentUser = auth.currentUser;
    if (!currentUser) {
        showToast("Erreur : Utilisateur non connecté.");
        return;
    }

    showConfirmationModal(`Supprimer le contact "${name}" ?`, async () => {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'contacts', id));
            showToast('Contact supprimé.');
        } catch (error) {
            console.error("Erreur de suppression du contact:", error);
            showToast("La suppression a échoué.");
        }
    });
}