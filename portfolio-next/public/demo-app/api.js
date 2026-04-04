// api.js

import { db, collection, getDocs } from './firebase-config.js';

let cachedCommodities = [];
let lastFetchTime = 0;

/**
 * Récupère la liste des matières premières depuis la collection 'marketData' de Firestore.
 * Met les données en cache pendant 5 minutes pour améliorer les performances.
 * @returns {Promise<Array>}
 */
export async function fetchAllAvailableCommodities() {
    const now = Date.now();
    // Si le cache a moins de 5 minutes, on le réutilise
    if (cachedCommodities.length > 0 && (now - lastFetchTime < 300000)) {
        console.log("Utilisation des données du marché depuis le cache.");
        return cachedCommodities;
    }

    try {
        console.log("Lecture des données du marché depuis Firestore...");
        const querySnapshot = await getDocs(collection(db, "marketData"));
        
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push(doc.data());
        });
        
        console.log(`${data.length} documents lus depuis 'marketData'.`);

        // Mise à jour du cache
        cachedCommodities = data;
        lastFetchTime = now;

        return data;

    } catch (error) {
        console.error("Erreur lors de la lecture des données marché depuis Firestore:", error);
        return [];
    }
}