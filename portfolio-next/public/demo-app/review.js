// review.js

import { auth, db, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from './firebase-config.js';
import { showToast, openModal, closeModal, showConfirmationModal } from './ui.js';

/**
 * Point d'entrée pour gérer son propre avis (création ou modification).
 * @param {object} currentUser - L'objet utilisateur Firebase.
 * @param {object} userProfile - Le profil de l'utilisateur depuis Firestore.
 */
export async function manageMyReview(currentUser, userProfile) {
    if (!currentUser) {
        showToast("Veuillez vous connecter pour gérer votre avis.");
        return;
    }
    try {
        const reviewDocRef = doc(db, 'reviews', currentUser.uid);
        const reviewDocSnap = await getDoc(reviewDocRef);
        if (reviewDocSnap.exists()) {
            renderReviewModal('edit', reviewDocSnap.data(), userProfile);
        } else {
            renderReviewModal('new', {}, userProfile);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'avis :", error);
        showToast("Une erreur est survenue.");
    }
}

/**
 * Affiche la modale pour laisser ou modifier un avis.
 * @param {string} mode - 'new' ou 'edit'.
 * @param {object} existingData - Les données de l'avis existant.
 * @param {object} userProfile - Le profil de l'utilisateur.
 */
function renderReviewModal(mode, existingData = {}, userProfile) {
    const isEdit = mode === 'edit';
    const title = isEdit ? 'Modifier mon avis' : 'Votre avis nous intéresse';
    const comment = existingData.comment || '';
    const rating = existingData.rating || 0;

    const deleteButtonHTML = isEdit ? `
        <button id="delete-review-btn" class="px-6 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200">Supprimer</button>
    ` : `
        <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
    `;

    const content = `
        <h3 class="text-xl font-bold text-center mb-6">${title}</h3>
        <div id="rating-stars" class="flex justify-center text-4xl text-slate-300 cursor-pointer mb-4" data-rating="${rating}">
            ${[1, 2, 3, 4, 5].map(v => `<i data-lucide="star" data-value="${v}" class="star hover:text-yellow-400 transition-colors"></i>`).join('')}
        </div>
        <div>
            <label for="review-comment" class="block text-sm font-medium text-slate-700 mb-1">Votre commentaire</label>
            <textarea id="review-comment" rows="4" class="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500">${comment}</textarea>
        </div>
        <p id="review-error" class="text-red-500 text-sm hidden text-center mt-2"></p>
        <div class="mt-6 grid grid-cols-2 gap-4">
            ${deleteButtonHTML}
            <button id="submit-review-btn" class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg">${isEdit ? 'Mettre à jour' : 'Envoyer'}</button>
        </div>
    `;
    openModal(content);

    const starsContainer = document.getElementById('rating-stars');
    const stars = starsContainer.querySelectorAll('.star');

    const setRatingUI = (newRating) => {
        starsContainer.dataset.rating = newRating;
        stars.forEach(star => {
            star.classList.toggle('text-yellow-400', parseInt(star.dataset.value) <= newRating);
            star.classList.toggle('text-slate-300', parseInt(star.dataset.value) > newRating);
        });
    };
    
    setRatingUI(rating);

    stars.forEach(star => star.addEventListener('click', () => setRatingUI(parseInt(star.dataset.value))));
    
    document.getElementById('submit-review-btn').addEventListener('click', () => handleSaveOrUpdateReview(userProfile));
    if (isEdit) {
        document.getElementById('delete-review-btn').addEventListener('click', handleDeleteReview);
    }
}

/**
 * Gère la sauvegarde ou la mise à jour d'un avis.
 * @param {object} userProfile - Le profil de l'utilisateur.
 */
async function handleSaveOrUpdateReview(userProfile) {
    const rating = parseInt(document.getElementById('rating-stars').dataset.rating);
    const comment = document.getElementById('review-comment').value.trim();
    const errorEl = document.getElementById('review-error');

    if (rating === 0) {
        errorEl.textContent = 'Veuillez sélectionner une note.';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');
    
    const user = auth.currentUser;
    if (!user || !userProfile) {
        showToast("Erreur : utilisateur ou profil non identifié.");
        return;
    }

    const reviewDocRef = doc(db, 'reviews', user.uid);
    const reviewData = {
        userId: user.uid,
        userName: userProfile.name,
        rating: rating,
        comment: comment,
        updatedAt: serverTimestamp(),
        isApproved: false,
        isVerified: true
    };
    
    try {
        await setDoc(reviewDocRef, reviewData, { merge: true });
        showToast("Votre avis a bien été enregistré ! Il sera visible après modération.");
        closeModal();
    } catch (error) {
        console.error("Erreur de sauvegarde de l'avis :", error);
        showToast("Une erreur est survenue.");
    }
}

/**
 * Gère la suppression d'un avis.
 */
async function handleDeleteReview() {
    const user = auth.currentUser;
    const message = "Êtes-vous sûr de vouloir supprimer votre avis ? Cette action est définitive.";
    showConfirmationModal(message, async () => {
        if (!user) return;
        
        const reviewDocRef = doc(db, 'reviews', user.uid);
        try {
            await deleteDoc(reviewDocRef);
            showToast("Votre avis a été supprimé.");
            closeModal();
        } catch (error) {
            console.error("Erreur de suppression de l'avis :", error);
            showToast("La suppression a échoué.");
        }
    });
}

/**
 * Vérifie s'il faut proposer à l'utilisateur de laisser un avis.
 */
export function checkAndPromptForReview() {
    const hasBeenPrompted = localStorage.getItem('recoltiq_review_prompted');
    const firstUseDateStr = localStorage.getItem('recoltiq_first_use_date');

    if (hasBeenPrompted === 'true' || !firstUseDateStr) {
        return;
    }

    const firstUseDate = new Date(firstUseDateStr);
    const daysSinceFirstUse = (new Date().getTime() - firstUseDate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceFirstUse >= 7) {
        const content = `
            <div class="text-center">
                <h3 class="text-xl font-bold text-slate-800 mb-2">Vous aimez Recolt'IQ ?</h3>
                <p class="text-slate-600 mb-6">Votre avis est précieux. Cela ne prend qu'une minute !</p>
            </div>
            <div class="space-y-3">
                <button id="prompt-review-now" class="w-full py-3 bg-green-600 text-white font-bold rounded-lg">Laisser un avis</button>
                <button id="prompt-review-later" class="w-full py-3 bg-slate-200 font-semibold rounded-lg">Plus tard</button>
                <button id="prompt-review-never" class="w-full text-sm text-slate-500 hover:underline mt-2">Non, merci</button>
            </div>
        `;
        openModal(content);

        document.getElementById('prompt-review-now').addEventListener('click', () => {
            localStorage.setItem('recoltiq_review_prompted', 'true');
            manageMyReview(auth.currentUser);
        });

        document.getElementById('prompt-review-never').addEventListener('click', () => {
            localStorage.setItem('recoltiq_review_prompted', 'true');
            closeModal();
        });
        
        document.getElementById('prompt-review-later').addEventListener('click', () => {
            localStorage.setItem('recoltiq_first_use_date', new Date().toISOString());
            closeModal();
        });
    }
}