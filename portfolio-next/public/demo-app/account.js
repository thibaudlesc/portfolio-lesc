// account.js
import { auth, db, doc, getDoc, deleteUser, sendPasswordResetEmail, sendEmailVerification, serverUrl } from './firebase-config.js';
import { navigateToPage, showToast, showConfirmationModal, closeModal } from './ui.js';
import { Capacitor } from 'https://unpkg.com/@capacitor/core?module';

// ▼▼▼ CORRECTION DÉFINITIVE ▼▼▼
// L'import statique est complètement supprimé. Le code ne sera chargé que dynamiquement au clic.
// ▲▲▲ FIN DE LA CORRECTION ▲▲▲

/**
 * Affiche la page "Mon Compte" avec les informations de l'utilisateur.
 * @param {object} user - L'objet utilisateur Firebase.
 * @param {object} userProfile - Le profil de l'utilisateur depuis Firestore.
 */
export async function displayAccountPage(user, userProfile) {
    if (!user) return;
    navigateToPage('page-account');
    const container = document.getElementById('page-account');
    if (!container) return;

    // La section "Abonnement" est complètement supprimée.
    const content = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b lg:static lg:bg-transparent lg:p-0 lg:mb-6">
            <h1 class="text-xl font-bold">Mon Compte</h1>
        </header>
        <div class="p-4 lg:p-0 space-y-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border">
                <p><strong>Identifiant:</strong> ${userProfile.name}#${userProfile.userTag}</p>
                <p><strong>Email:</strong> ${user.email}</p>
            </div>
            
            <div class="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                 <button id="account-send-reset-email-btn" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg">Réinitialiser mot de passe</button>
                 <button id="account-delete-btn-page" class="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg">Supprimer mon compte</button>
            </div>

            <!-- ▼▼▼ NOUVELLE SECTION AJOUTÉE ▼▼▼ -->
            <div class="bg-white p-4 rounded-xl shadow-sm border text-center text-sm space-y-2">
                <p class="text-slate-600">
                    Consultez nos documents légaux :
                </p>
                <div class="flex justify-center gap-4">
                    <a href="#" data-action="show-legal" data-target="cgu" class="font-medium text-green-600 hover:underline">Conditions d'Utilisation</a>
                    <a href="#" data-action="show-legal" data-target="politique-confidentialite" class="font-medium text-green-600 hover:underline">Politique de Confidentialité</a>
                </div>
            </div>
            <!-- ▲▲▲ FIN DE L'AJOUT ▲▲▲ -->

        </div>
    `;
    container.innerHTML = content;
    
    document.getElementById('account-send-reset-email-btn')?.addEventListener('click', () => handleSendPasswordReset(user.email));
    document.getElementById('account-delete-btn-page')?.addEventListener('click', handleDeleteAccount);
}

// ... (le reste du fichier account.js reste inchangé) ...
async function loadSubscriptionDetails(stripeSubscriptionId, appleSubscriptionId) {
    const container = document.getElementById('subscription-details-container');
    if (!container) return;

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Utilisateur non authentifié.");
        const token = await user.getIdToken();
        
        if (Capacitor.isNativePlatform()) {
            const userDocSnap = await getDoc(doc(db, "users", user.uid));
            const userProfile = userDocSnap.data();
            const renewalDate = userProfile.appleSubscriptionExpiresAt 
                ? userProfile.appleSubscriptionExpiresAt.toDate().toLocaleDateString('fr-FR')
                : 'N/A';
            
            container.innerHTML = `
                <p><strong>Statut:</strong> <span class="font-semibold text-green-600">Actif</span></p>
                <p><strong>Prochain renouvellement:</strong> ${renewalDate}</p>
                <p class="text-sm text-slate-500 mt-2">Votre abonnement est géré via les réglages de votre compte App Store.</p>
            `;
        } 
        else {
            if (!stripeSubscriptionId) throw new Error("ID d'abonnement Stripe manquant.");
            const response = await fetch(`${serverUrl}/get-subscription-details?subscriptionId=${stripeSubscriptionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erreur serveur.');
            
            const sub = await response.json();
            const renewalDate = new Date(sub.current_period_end * 1000).toLocaleDateString('fr-FR');

            container.innerHTML = `
                <p><strong>Statut:</strong> <span class="font-semibold text-green-600">Actif</span></p>
                <p><strong>Prochain renouvellement:</strong> ${renewalDate}</p>
                <button id="manage-subscription-btn" class="w-full mt-2 bg-blue-100 text-blue-700 font-bold py-2 rounded-lg">Gérer mon abonnement</button>
            `;
            document.getElementById('manage-subscription-btn')?.addEventListener('click', redirectToCustomerPortal);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-red-500">Erreur de chargement des détails de l'abonnement.</p>`;
    }
}

async function redirectToCustomerPortal() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const customerId = userDocSnap.data()?.stripeCustomerId;
        if (!customerId) {
            showToast("Identifiant client non trouvé.");
            return;
        }

        const token = await user.getIdToken();
        const response = await fetch(`${serverUrl}/create-customer-portal-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ customerId })
        });
        if (!response.ok) throw new Error('Impossible de créer la session.');
        const { url } = await response.json();
        window.location.href = url;

    } catch (error) {
        showToast("Erreur d'accès au portail de gestion.");
    }
}

async function handleSendPasswordReset(email) {
    if (!email) return;
    try {
        await sendPasswordResetEmail(auth, email);
        showToast("E-mail de réinitialisation envoyé !");
    } catch (error) {
        showToast("Erreur lors de l'envoi de l'e-mail.");
    }
}

function handleDeleteAccount() {
    const user = auth.currentUser;
    if (!user) return;
    showConfirmationModal("Cette action est irréversible. Pour confirmer, tapez \"supprimer\".", async () => {
        try {
            await deleteUser(user);
            showToast("Compte supprimé avec succès.");
        } catch (error) {
            showToast("Erreur. Déconnectez-vous et reconnectez-vous avant de réessayer.");
        }
    }, true);
}