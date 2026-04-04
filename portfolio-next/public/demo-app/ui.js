// ui.js

export function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

export function openModal(content) {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    if (!modalContainer || !modalContent) return;
    modalContent.innerHTML = content;
    if (window.lucide) window.lucide.createIcons();
    document.body.classList.add('overflow-hidden');
    modalContainer.classList.remove('hidden');
    const closeBtn = modalContent.querySelector('#modal-cancel-btn, #modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal, { once: true });
    }
}

export function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    document.body.classList.remove('overflow-hidden');
    modalContainer.classList.add('hidden');
    const modalContent = document.getElementById('modal-content');
    if (modalContent) {
        modalContent.innerHTML = '';
        modalContent.className = 'relative w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl lg:rounded-xl mt-auto lg:mt-0';
    }
}

export function showConfirmationModal(message, onConfirm, requireTextInput = false) {
    const textInputHTML = requireTextInput ? `<input type="text" id="confirmation-input" placeholder="Tapez 'supprimer'" class="w-full p-3 mt-4 bg-slate-100 rounded-lg text-center">` : '';
    const content = `
        <h3 class="text-lg font-semibold text-slate-800 text-center">Confirmer l'action</h3>
        <p class="text-sm text-slate-600 mt-2 text-center">${message}</p>
        ${textInputHTML}
        <div class="mt-6 grid grid-cols-2 gap-4">
            <button id="confirmation-cancel-btn" class="py-3 bg-slate-200 font-semibold rounded-lg">Annuler</button>
            <button id="confirmation-confirm-btn" class="py-3 bg-red-600 text-white font-bold rounded-lg">Confirmer</button>
        </div>
    `;
    openModal(content);
    document.getElementById('confirmation-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('confirmation-confirm-btn')?.addEventListener('click', () => {
        if (requireTextInput) {
            const input = document.getElementById('confirmation-input');
            if (input.value.toLowerCase() !== 'supprimer') {
                showToast("Texte de confirmation incorrect.");
                return;
            }
        }
        if (onConfirm) onConfirm();
        closeModal();
    });
}

export function navigateToPage(pageId) {
    document.querySelectorAll('#app-content-wrapper > div[id^="page-"]').forEach(p => p.classList.add('hidden'));
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.remove('hidden');
    } else {
        console.error(`Page avec l'ID ${pageId} non trouvée.`);
    }
    const viewMap = {
        'page-dashboard': 'dashboard', 'page-field-list': 'fields', 'page-storage': 'storage', 
        'page-market': 'sales', 'page-sales-management': 'sales', 'page-shared-field-list': 'shared-fields', 
        'page-my-shares': 'my-shares', 'page-services': 'utilities'
    };
    updateActiveNav(viewMap[pageId] || null);
    const mainContent = document.querySelector('main.flex-1');
    if (mainContent) mainContent.scrollTo(0, 0);
    else window.scrollTo(0, 0);
}

export function updateActiveNav(activeView) {
    const buttonIdMap = {
        'dashboard': 'nav-dashboard', 'fields': 'nav-fields', 'storage': 'nav-storage',
        'sales': 'nav-sales', 'shared-fields': 'nav-shared-fields', 'my-shares': 'nav-my-shares',
        'utilities': 'nav-utilities'
    };
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-green-600', 'bg-green-50', 'font-semibold');
        if (!btn.classList.contains('text-slate-500')) {
            btn.classList.add('text-slate-500');
        }
    });
    const activeBtnId = buttonIdMap[activeView];
    if (activeBtnId) {
        document.querySelectorAll(`#${activeBtnId}`).forEach(button => {
            button.classList.add('active', 'text-green-600');
            button.classList.remove('text-slate-500');
            if (button.closest('#app-nav')) {
                button.classList.add('bg-green-50', 'font-semibold');
            }
        });
    }
}

export function initConnectionStatusListener() {
    const statusIndicator = document.getElementById('connection-status');
    if (!statusIndicator) return;

    // Cette fonction est maintenant appelée UNIQUEMENT lors d'un changement d'état.
    const handleConnectionChange = () => {
        if (navigator.onLine) {
            statusIndicator.classList.remove('bg-red-500', 'animate-pulse');
            statusIndicator.classList.add('bg-green-500');
            statusIndicator.title = 'En ligne';
            // On affiche un toast uniquement lors de la RE-connexion.
            showToast("Vous êtes de nouveau en ligne. Synchronisation en cours.");
        } else {
            statusIndicator.classList.remove('bg-green-500');
            statusIndicator.classList.add('bg-red-500', 'animate-pulse'); // On fait pulser l'icône pour attirer l'attention
            statusIndicator.title = 'Hors ligne - Modifications sauvegardées localement';
            showToast("Mode hors ligne activé. Vos modifications seront synchronisées plus tard.");
        }
    };

    // 1. Définir l'état visuel initial AU CHARGEMENT, SANS toast.
    if (navigator.onLine) {
        statusIndicator.classList.add('bg-green-500');
        statusIndicator.title = 'En ligne';
    } else {
        statusIndicator.classList.add('bg-red-500', 'animate-pulse');
        statusIndicator.title = 'Hors ligne - Modifications sauvegardées localement';
    }

    // 2. Attacher les écouteurs pour les changements FUTURS.
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
}

export function showView(viewId) {
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    
    if (authView) authView.classList.add('hidden');
    if (appView) appView.classList.add('hidden');

    const viewToShow = document.getElementById(viewId);
    if (viewToShow) {
        viewToShow.classList.remove('hidden');
    }

    if (viewId === 'app-view') {
        document.body.classList.add('app-view-active');
    } else {
        document.body.classList.remove('app-view-active');
    }
}

export function updateUIForAuthState(user, userProfile) {
    const isLoggedIn = !!user && user.emailVerified;
    const elements = {
        userMenuLoggedIn: document.getElementById('user-menu-loggedin'),
        userMenuLoggedOut: document.getElementById('user-menu-loggedout'),
        navLinkLogin: document.getElementById('nav-link-login'),
        mobileLogoutBtn: document.getElementById('mobile-logout-btn'),
        desktopLogoutBtn: document.getElementById('desktop-logout-btn'),
    };
    elements.userMenuLoggedIn?.classList.toggle('hidden', !isLoggedIn);
    elements.userMenuLoggedOut?.classList.toggle('hidden', isLoggedIn);
    elements.navLinkLogin?.classList.toggle('hidden', isLoggedIn);
    elements.mobileLogoutBtn?.classList.toggle('hidden', !isLoggedIn);
    elements.desktopLogoutBtn?.classList.toggle('hidden', !isLoggedIn);

    // Définition des liens du menu mobile
    const mobileNavLinks = {
        app: document.getElementById('mobile-nav-link-app'),
        dashboard: document.getElementById('mobile-nav-link-dashboard'),
        account: document.getElementById('mobile-nav-link-account'),
        myShares: document.getElementById('mobile-nav-link-my-shares'), // Nouveau lien ajouté
        review: document.querySelector('#mobile-menu [data-action="show-review-modal"]'),
        contacts: document.getElementById('mobile-nav-link-contacts'),
        support: document.getElementById('mobile-nav-link-support'),
    };

    // Logique d'affichage/masquage des liens
    mobileNavLinks.app?.classList.toggle('hidden', !isLoggedIn);
    mobileNavLinks.dashboard?.classList.toggle('hidden', !isLoggedIn);
    mobileNavLinks.account?.classList.toggle('hidden', !user);
    mobileNavLinks.myShares?.classList.toggle('hidden', !isLoggedIn); // Gère l'affichage du nouveau lien
    mobileNavLinks.review?.classList.toggle('hidden', !user);
    mobileNavLinks.contacts?.classList.toggle('hidden', !user);
    mobileNavLinks.support?.classList.toggle('hidden', !user);

    if (isLoggedIn && userProfile) {
        const userAvatarInitials = document.getElementById('user-avatar-initials');
        const userAvatarName = document.getElementById('user-avatar-name');
        const userAvatarEmail = document.getElementById('user-avatar-email');
        if(userAvatarInitials) userAvatarInitials.textContent = getInitials(userProfile.name);
        if(userAvatarName) userAvatarName.textContent = userProfile.name || 'Utilisateur';
        if(userAvatarEmail) userAvatarEmail.textContent = user.email;
    }
}

export function closeDropdowns() {
    document.getElementById('mobile-menu')?.classList.add('hidden');
}

export function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('opacity-0');
        setTimeout(() => loadingScreen.remove(), 500);
    }
}