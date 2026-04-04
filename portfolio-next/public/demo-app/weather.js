// weather.js

import { auth, db, doc, updateDoc } from './firebase-config.js';
import { showToast, openModal, closeModal } from './ui.js';

/** Aperçu embarqué dans le portfolio (?embed=1) : pas de GPS / moins de modales gênantes */
function isPortfolioEmbed() {
    try {
        return new URLSearchParams(window.location.search).get('embed') === '1';
    } catch {
        return false;
    }
}

// --- État du Module ---
let weatherData = null;
let userCoordinates = null;
let userLocationName = null;

/** Météo par défaut pour la démo (Bordeaux) — évite la modale + le prompt géoloc dans l’iframe */
const DEMO_DEFAULT_LAT = 44.8378;
const DEMO_DEFAULT_LON = -0.5792;
const DEMO_DEFAULT_NAME = 'Bordeaux (démo)';

// ===================================================================================
// ⚠️ ALERTE DE SÉCURITÉ CRITIQUE ⚠️
// La clé API ci-dessous est visible par tout le monde.
// SOLUTION RECOMMANDÉE : Déplacer cet appel côté serveur via une Cloud Function.
// ===================================================================================
const WEATHERAPI_KEY = '88c7d950706b408eb05160250250408';

/**
 * Initialise le widget météo avec les données de l'utilisateur.
 * @param {object} userProfile - Le profil utilisateur depuis Firestore.
 */
export async function initWeatherWidget(userProfile) {
    if (userProfile?.weatherLocation) {
        userCoordinates = userProfile.weatherLocation.coordinates;
        userLocationName = userProfile.weatherLocation.name;
        await fetchWeatherData(userCoordinates.latitude, userCoordinates.longitude);
    } else if (isPortfolioEmbed()) {
        userCoordinates = { latitude: DEMO_DEFAULT_LAT, longitude: DEMO_DEFAULT_LON };
        userLocationName = DEMO_DEFAULT_NAME;
        await fetchWeatherData(DEMO_DEFAULT_LAT, DEMO_DEFAULT_LON);
    } else {
        showWeatherLocationModal();
    }
}

/**
 * Récupère les données météo depuis l'API et met à jour l'interface.
 * @param {number} latitude 
 * @param {number} longitude 
 */
export async function fetchWeatherData(latitude, longitude) {
    if (WEATHERAPI_KEY === 'VOTRE_CLÉ_API_ICI') {
        console.error("ERREUR : La clé API météo n'est pas configurée.");
        return;
    }
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${latitude},${longitude}&days=7&lang=fr`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur réseau.');
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        weatherData = data;
        updateWeatherWidgets();
        
        const weatherPage = document.getElementById('page-weather');
        if (weatherPage && !weatherPage.classList.contains('hidden')) {
            displayWeatherPage();
        }
    } catch (error) {
        console.error("Erreur de récupération météo:", error);
        weatherData = null;
        const widgets = [document.getElementById('weather-widget-mobile'), document.getElementById('weather-widget-desktop')];
        widgets.forEach(w => { if(w) w.innerHTML = 'Météo N/A'; });
    }
}

/**
 * Met à jour les petits widgets météo dans l'en-tête et la barre latérale.
 */
function updateWeatherWidgets() {
    if (!weatherData) return;
    const temp = weatherData.current.temp_c;
    const iconUrl = weatherData.current.condition.icon;
    const html = `
        <div class="flex items-center gap-1">
            <img src="https:${iconUrl}" alt="Météo" class="w-6 h-6">
            <span>${Math.round(temp)}°C</span>
        </div>`;
    
    const widgetMobile = document.getElementById('weather-widget-mobile');
    const widgetDesktop = document.getElementById('weather-widget-desktop');
    if(widgetMobile) widgetMobile.innerHTML = html;
    if(widgetDesktop) widgetDesktop.innerHTML = html;
}

/**
 * Affiche la page météo détaillée avec le design original complet.
 */
export function displayWeatherPage() {
    const container = document.getElementById('page-weather');
    if (!container) return;

    const headerHTML = `
        <header class="bg-white/80 backdrop-blur-sm sticky top-[68px] z-10 p-4 border-b border-slate-200 flex justify-between items-center lg:static lg:bg-transparent lg:p-0 lg:mb-6">
            <div>
                <h1 class="text-xl lg:text-3xl font-bold text-slate-800">Météo Agricole Détaillée</h1>
                <p id="weather-location-display" class="text-sm text-slate-500">${userLocationName || 'Aucun lieu défini'}</p>
            </div>
            <button id="change-location-btn" class="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 font-semibold p-2 rounded-lg hover:bg-blue-200 transition">
                <i data-lucide="map-pin" class="w-4 h-4"></i>
                <span>Changer</span>
            </button>
        </header>
    `;

    if (!weatherData || !weatherData.forecast) {
        container.innerHTML = headerHTML + `<div class="text-center p-8"><p class="text-slate-500">Données météo non disponibles. Veuillez choisir un lieu.</p></div>`;
        document.getElementById('change-location-btn').addEventListener('click', showWeatherLocationModal);
        if(window.lucide) window.lucide.createIcons();
        return;
    }

    const { current, forecast } = weatherData;
    const hourlyDetailHTML = forecast.forecastday[0].hour.map(hour => `
        <div class="flex flex-col items-center text-center p-2 flex-shrink-0 w-20">
            <p class="text-sm font-semibold text-slate-800">${new Date(hour.time).getHours()}h</p>
            <img src="https:${hour.condition.icon}" class="w-10 h-10 my-1" alt="${hour.condition.text}">
            <p class="font-bold text-lg text-slate-900">${Math.round(hour.temp_c)}°</p>
            <div class="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <i data-lucide="umbrella" class="w-3 h-3"></i><span>${hour.chance_of_rain}%</span>
            </div>
        </div>
    `).join('');

    const getDayName = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long' });

    // --- CORRECTION ICI ---
    // La boucle itère maintenant sur tous les jours reçus de l'API (7 jours).
    const forecastHTML = forecast.forecastday.map((day, i) => {
        const { date, day: dayData } = day;
        return `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <img src="https:${dayData.condition.icon}" alt="${dayData.condition.text}" class="w-10 h-10">
                        <div>
                            <p class="font-bold text-slate-800 capitalize">${i === 0 ? 'Aujourd\'hui' : getDayName(date)}</p>
                            <p class="text-xs text-slate-500">${dayData.condition.text}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg">${Math.round(dayData.maxtemp_c)}°</p>
                        <p class="text-sm text-slate-500">${Math.round(dayData.mintemp_c)}°</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm pt-3">
                    <div class="text-center"><i data-lucide="umbrella" class="w-5 h-5 mx-auto text-blue-500 mb-1"></i><p class="font-semibold">${dayData.totalprecip_mm.toFixed(1)} mm</p><p class="text-xs">Précipitations</p></div>
                    <div class="text-center"><i data-lucide="wind" class="w-5 h-5 mx-auto text-slate-500 mb-1"></i><p class="font-semibold">${Math.round(dayData.maxwind_kph)} km/h</p><p class="text-xs">Vent max</p></div>
                </div>
            </div>
        `;
    }).join('');

    const contentHTML = `
        <div class="space-y-6 p-4 lg:p-0">
            <div class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                <div>
                    <p class="text-lg font-medium">${current.condition.text}</p>
                    <p class="text-5xl font-bold tracking-tight">${Math.round(current.temp_c)}°C</p>
                </div>
                <img src="https:${current.condition.icon}" alt="${current.condition.text}" class="w-20 h-20">
            </div>
            <div>
                <h2 class="text-lg font-semibold text-slate-700 mb-3">Prévisions pour Aujourd'hui</h2>
                <div class="bg-white rounded-xl shadow-sm border p-2">
                    <div id="hourly-forecast-container" class="flex overflow-x-auto pb-2 no-scrollbar horizontal-scroll-container">
                        ${hourlyDetailHTML}
                    </div>
                </div>
            </div>
            <div>
                <h2 class="text-lg font-semibold text-slate-700 mb-3">Prévisions sur 7 jours</h2>
                <div class="space-y-4">
                    ${forecastHTML}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = headerHTML + contentHTML;
    document.getElementById('change-location-btn').addEventListener('click', showWeatherLocationModal);
    if(window.lucide) window.lucide.createIcons();

    // Script pour le glisser-déposer de la prévision horaire
    const slider = document.getElementById('hourly-forecast-container');
    if (slider) {
        let isDown = false, startX, scrollLeft;
        slider.addEventListener('mousedown', e => { isDown = true; slider.classList.add('cursor-grabbing'); startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
        slider.addEventListener('mouseleave', () => { isDown = false; slider.classList.remove('cursor-grabbing'); });
        slider.addEventListener('mouseup', () => { isDown = false; slider.classList.remove('cursor-grabbing'); });
        slider.addEventListener('mousemove', e => { if (isDown) { e.preventDefault(); const x = e.pageX - slider.offsetLeft; const walk = (x - startX) * 2; slider.scrollLeft = scrollLeft - walk; }});
    }
}

/**
 * Affiche la modale pour choisir ou changer de lieu météo.
 */
export function showWeatherLocationModal() {
    const embed = isPortfolioEmbed();
    const geoBlock = embed
        ? ''
        : `
            <div class="relative flex items-center"><div class="flex-grow border-t"></div><span class="mx-4 text-slate-400">OU</span><div class="flex-grow border-t"></div></div>
            <button id="use-geolocation-btn" type="button" class="w-full flex items-center justify-center gap-3 p-3 bg-slate-200 font-bold rounded-lg"><i data-lucide="navigation"></i>Utiliser ma position</button>
        `;
    const intro = embed
        ? '<p class="text-slate-600 mb-6">Entrez une ville (la géolocalisation est désactivée dans l&apos;aperçu du portfolio).</p>'
        : '<p class="text-slate-600 mb-6">Entrez une ville ou utilisez votre position.</p>';

    const content = `
        <div class="text-center">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Choisir un lieu</h3>
            ${intro}
        </div>
        <div class="space-y-4">
            <div class="flex items-center gap-2">
                <input type="text" id="city-name-input" class="w-full p-3 border-2 rounded-lg" placeholder="Ex: Paris, Lyon...">
                <button id="search-city-btn" type="button" class="p-3 bg-blue-600 text-white rounded-lg"><i data-lucide="search"></i></button>
            </div>
            ${geoBlock}
        </div>
        <button id="modal-cancel-btn" type="button" class="mt-6 w-full text-sm">Annuler</button>
    `;
    openModal(content);
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('search-city-btn').addEventListener('click', getCoordsFromCityName);
    document.getElementById('city-name-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') getCoordsFromCityName(); });
    const geoBtn = document.getElementById('use-geolocation-btn');
    if (geoBtn) geoBtn.addEventListener('click', getCoordsFromGeolocation);
}

/**
 * Récupère les coordonnées GPS du navigateur.
 */
function getCoordsFromGeolocation() {
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            userCoordinates = { latitude, longitude };
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`);
                const data = await response.json();
                userLocationName = data.city || 'Position actuelle';
            } catch (e) { userLocationName = 'Position actuelle'; }

            await saveWeatherLocation({ name: userLocationName, coordinates: userCoordinates });
            closeModal();
            await fetchWeatherData(latitude, longitude);
        },
        () => showToast("Impossible d'obtenir la position.")
    );
}

/**
 * Récupère les coordonnées GPS à partir d'un nom de ville.
 */
async function getCoordsFromCityName() {
    const cityName = document.getElementById('city-name-input').value.trim();
    if (!cityName) return;
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=fr`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name } = data.results[0];
            userCoordinates = { latitude, longitude };
            userLocationName = name;
            await saveWeatherLocation({ name, coordinates: { latitude, longitude } });
            closeModal();
            await fetchWeatherData(latitude, longitude);
        } else {
            showToast("Ville non trouvée.");
        }
    } catch (error) {
        showToast("Erreur de recherche.");
    }
}

/**
 * Sauvegarde le lieu météo dans le profil de l'utilisateur.
 * @param {object} locationData - L'objet contenant le nom et les coordonnées.
 */
async function saveWeatherLocation(locationData) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await updateDoc(doc(db, "users", user.uid), { weatherLocation: locationData });
        showToast(`Lieu météo enregistré : ${locationData.name}`);
    } catch (error) {
        showToast("Erreur de sauvegarde du lieu.");
    }
}