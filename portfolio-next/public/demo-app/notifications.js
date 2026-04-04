// notifications.js
import { showToast } from './harvest.js';

// L'URL de votre serveur. Assurez-vous qu'elle est correcte.
const serverUrl = 'https://api-gte2tsbfiq-uc.a.run.app';

/**
 * Appelle le serveur pour envoyer une notification de test à l'utilisateur actuel.
 * Cette fonction est maintenant universelle et sûre pour le web et le natif.
 * @param {object} user - L'objet utilisateur Firebase.
 */
export async function sendTestNotification(user) {
    if (!user) {
        showToast("Utilisateur non connecté.");
        return;
    }

    try {
        const token = await user.getIdToken();
        showToast("Envoi de la notification de test...");

        const response = await fetch(`${serverUrl}/send-test-notification`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Erreur serveur ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            showToast("Requête de notification envoyée !");
        } else {
            throw new Error(result.error || "Échec de l'envoi");
        }
    } catch (error) {
        console.error("Erreur d'envoi de la notification de test:", error);
        showToast(`Erreur : ${error.message}`);
    }
}