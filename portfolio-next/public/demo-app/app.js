// app.js

try {
    // --- Imports des modules de l'application ---
    const { auth, onAuthStateChanged, db, doc, getDoc, updateDoc, signOut } = await import('./firebase-config.js');
    const { navigateToPage, showToast, openModal, closeModal, showConfirmationModal, updateUIForAuthState, closeDropdowns, showView, hideLoadingScreen } = await import('./ui.js');
    const { handleAuthentication, setupAuthFormListeners } = await import('./auth.js');
    const { displayAccountPage } = await import('./account.js');
    const { manageMyReview, checkAndPromptForReview } = await import('./review.js');
    const { initWeatherWidget, displayWeatherPage } = await import('./weather.js');
    const { initHarvestApp } = await import('./harvest.js');
    const { initSharing } = await import('./sharing.js');
    const { initStorage, displayStockPage } = await import('./storage.js');
    await import('./api.js');
    await import('./market.js');
    const { initMarketPage, displayMarketPage } = await import('./sales.js');
    const { initDashboard, displayDashboard } = await import('./dashboard.js');
    const { initContacts, showContactManagementModal } = await import('./contacts.js');
    await import('./onboarding.js');
    const { initClientServices, displayServicesListPage } = await import('./clientServices.js');
    const { initServices, displayServicesPage } = await import('./services.js');

    // --- Imports des bibliothèques externes (stubs en mode démo) ---
    const getAnalytics = () => null;
    const PushNotifications = { requestPermissions: async () => ({ receive: 'denied' }), register: async () => {}, addListener: () => {} };
    const Capacitor = { isNativePlatform: () => false };

    // --- Mode démo/embed : désactive les popups parasites ---
    const IS_EMBED = new URLSearchParams(window.location.search).has('embed');

    // --- Le reste de votre code applicatif ---
    let currentUser = null;
    let userProfile = null;
    let analyticsInitialized = false;
    const COOKIE_CONSENT_KEY = 'recoltiq_cookie_consent';

    function initializeApp() {
        if (window.lucide) {
            lucide.createIcons();
        }
        createMobileNav();
        setupGlobalEventListeners();

        setupServiceWorkerUpdateListener();
        checkConsentOnLoad();

        onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    await user.reload();

                    // Si l'email n'est pas vérifié, on reste strictement sur l'écran de vérification
                    if (!user.emailVerified) {
                        currentUser = null;
                        userProfile = null;
                        handleAuthentication('verify', user);
                        return;
                    }

                    // À partir d'ici, on ne considère l'utilisateur comme vraiment connecté
                    // QUE si son document Firestore existe.
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (!userDocSnap.exists()) {
                        // Cas incohérent : utilisateur auth sans profil Firestore.
                        // On nettoie complètement la session et on renvoie vers la connexion.
                        await signOut(auth);
                        currentUser = null;
                        userProfile = null;
                        handleAuthentication('logout');
                        return;
                    }

                    currentUser = user;
                    userProfile = userDocSnap.data();
                    
                    updateUIForAuthState(user, userProfile);
                    showView('app-view');
                    await initApplicationModules(user, userProfile);

                    // On arrive par défaut sur la liste des parcelles.
                    navigateToPage('page-field-list');

                } else {
                    currentUser = null;
                    userProfile = null;
                    handleAuthentication('logout');
                }
            } catch (error) {
                handleAuthentication('logout');
            } finally {
                hideLoadingScreen();
            }
        });
    }

    async function initApplicationModules(user, profile) {
        await Promise.all([
            initHarvestApp(user, profile),
            initSharing(user),
            initStorage(user),
            initMarketPage(user),
            initDashboard(user),
            initClientServices(user),
            initServices(user),
            initContacts(user),
            IS_EMBED ? Promise.resolve() : initWeatherWidget(profile)
        ]);
        manageNotificationSubscription(user);
    }

    function createMobileNav() {
        const mainNav = document.getElementById('main-nav-links-container');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        if (!mainNav || !mobileNav) return;
        mobileNav.innerHTML = '';
        mainNav.querySelectorAll('.nav-btn').forEach(button => {
            if (button.id === 'nav-dashboard') return;
            const clone = button.cloneNode(true);
            clone.querySelector('span')?.remove();
            clone.addEventListener('click', () => document.getElementById(button.id)?.click());
            mobileNav.appendChild(clone);
        });
    }

    function showSupportModal() {
        const email = 'support@recolt-iq.fr';
        const content = `
            <h3 class="text-xl font-semibold mb-4 text-center">Support Technique</h3>
            <p class="text-center text-slate-600 mb-6">Contactez-nous par e-mail pour toute question.</p>
            <div class="bg-slate-100 p-3 rounded-lg flex items-center justify-between">
                <a href="mailto:${email}" class="text-green-600 font-semibold break-all">${email}</a>
                <button id="copy-support-email-btn" class="ml-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Copier</button>
            </div>
            <button id="modal-close-btn" class="mt-6 w-full py-3 bg-slate-200 rounded-lg">Fermer</button>
        `;
        openModal(content);
        document.getElementById('copy-support-email-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(email).then(() => showToast("Adresse e-mail copiée !"));
        });
    }

    async function showLegalPage(targetId) {
        try {
            const response = await fetch('legal.html');
            if (!response.ok) throw new Error('Fichier legal.html introuvable.');
            const text = await response.text();
            const parser = new DOMParser();
            const legalDoc = parser.parseFromString(text, 'text/html');

            const legalMainContent = legalDoc.querySelector('main')?.innerHTML || 'Contenu indisponible.';

            const modalHTML = `
                <div class="relative">
                    <button id="close-legal-modal-btn" 
                            class="sticky top-0 right-0 z-10 float-right -mt-2 -mr-2 h-9 w-9 bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors" 
                            aria-label="Fermer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    <div class="max-h-[80vh] overflow-y-auto pr-4 clear-both">
                        ${legalMainContent}
                    </div>
                </div>
            `;

            openModal(modalHTML);
            
            const closeBtn = document.getElementById('close-legal-modal-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal, { once: true });
            }
            
            const targetElement = document.getElementById('modal-content')?.querySelector(`#${targetId}`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }

        } catch (error) {
            console.error("Erreur lors de l'affichage de la page légale:", error);
            showToast("Impossible de charger le document.");
        }
    }

    // ▼▼▼ DÉBUT DE LA MODIFICATION : La fonction de mise à jour de l'UI est modifiée ▼▼▼
    function setupGlobalEventListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const actions = {
                // Ouverture explicite de l'écran d'authentification complet
                'show-auth': () => { handleAuthentication('login'); closeDropdowns(); },
                'show-app': () => { navigateToPage('page-dashboard'); displayDashboard(); closeDropdowns(); },
                'show-account': () => { displayAccountPage(currentUser, userProfile); closeDropdowns(); },
                'show-services-list': () => { displayServicesListPage(); closeDropdowns(); },
                'show-utilities': () => { navigateToPage('page-services'); displayServicesPage(); closeDropdowns(); },
                'show-review-modal': () => { manageMyReview(currentUser, userProfile); closeDropdowns(); },
                'show-support': () => { showSupportModal(); closeDropdowns(); },
                'show-dashboard': () => { navigateToPage('page-dashboard'); displayDashboard(); closeDropdowns(); },
                'show-contacts': () => { showContactManagementModal(); closeDropdowns(); },
                'show-fields': () => { navigateToPage('page-field-list'); closeDropdowns(); },
                'show-storage': () => { navigateToPage('page-storage'); displayStockPage(); closeDropdowns(); },
                'show-market': () => { navigateToPage('page-market'); displayMarketPage(); closeDropdowns(); },
                'show-shared-fields': () => { navigateToPage('page-shared-field-list'); closeDropdowns(); },
                // Le lien "Mes Partages" est maintenant géré ici
                'show-my-shares': () => { navigateToPage('page-my-shares'); closeDropdowns(); },
                'toggle-mobile-menu': () => document.getElementById('mobile-menu')?.classList.toggle('hidden'),
                'show-legal': () => showLegalPage(target.dataset.target),
            };
            if (actions[action]) {
                e.preventDefault();
                actions[action]();
            }
        });
        setupAuthFormListeners();
        ['weather-widget-mobile', 'weather-widget-desktop'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {
                navigateToPage('page-weather');
                displayWeatherPage();
            });
        });
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobile-menu');
            const menuButton = document.getElementById('mobile-menu-button');
            if (mobileMenu && !mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && !menuButton.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
    // ▲▲▲ FIN DE LA MODIFICATION ▲▲▲

    function setupServiceWorkerUpdateListener() {
        if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return;
        navigator.serviceWorker.getRegistration().then(reg => {
            if (!reg) return;
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            openModal(`<h3>Mise à jour disponible</h3><button id="update-app-btn">Mettre à jour</button>`);
                            document.getElementById('update-app-btn')?.addEventListener('click', () => newWorker.postMessage({ action: 'SKIP_WAITING' }));
                        }
                    });
                }
            });
        });
        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }

    async function manageNotificationSubscription(user) {
        if (Capacitor.isNativePlatform()) {
            try {
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === 'prompt') permStatus = await PushNotifications.requestPermissions();
                if (permStatus.receive !== 'granted') return;
                await PushNotifications.register();
                PushNotifications.addListener('registration', token => updateFcmToken(user.uid, token.value));
            } catch (e) { /* Error handling silenced for production */ }
        }
    }

    async function updateFcmToken(userId, token) {
        try {
            await updateDoc(doc(db, "users", userId), { fcmToken: token });
        } catch (error) { /* Error handling silenced for production */ }
    }

    function initializeAnalytics() {
        if (!analyticsInitialized) {
            getAnalytics(db.app);
            analyticsInitialized = true;
        }
    }

    function checkConsentOnLoad() {
        if (Capacitor.isNativePlatform()) {
            initializeAnalytics();
            return;
        }
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            const banner = document.getElementById('cookie-consent-banner');
            if (banner) {
                banner.classList.remove('hidden');
                const acceptBtn = document.getElementById('cookie-accept-btn');
                const declineBtn = document.getElementById('cookie-decline-btn');
                if (acceptBtn) acceptBtn.addEventListener('click', () => handleConsent('granted'));
                if (declineBtn) declineBtn.addEventListener('click', () => handleConsent('denied'));
            }
        } else if (consent === 'granted') {
            initializeAnalytics();
        }
    }

    function handleConsent(status) {
        localStorage.setItem(COOKIE_CONSENT_KEY, status);
        document.getElementById('cookie-consent-banner')?.classList.add('hidden');
        if (status === 'granted') initializeAnalytics();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

} catch (error) {
    alert("Une erreur critique s'est produite au chargement de l'application. Veuillez vérifier la console (F12) pour plus de détails.");
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}