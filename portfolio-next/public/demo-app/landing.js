// landing.js

import {
    auth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    deleteUser,
    db,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    limit
} from './firebase-config.js';



// --- DOM Elements ---
const headerAuthSection = document.getElementById('header-auth-section');
const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content');
const modalBackdrop = document.getElementById('modal-backdrop');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

let currentUser = null;
let userProfile = null;
let pendingSubscriptionPlan = null;
const serverUrl = 'https://api-gte2tsbfiq-uc.a.run.app';


async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            console.log("Nouvel utilisateur via Google (landing), création du profil...");
            const userTag = await generateUniqueUserTag();
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
                plan: 'demo',
                userTag: userTag,
                createdAt: new Date()
            });
            showToast(`Bienvenue, ${user.displayName} !`);
        } else {
            showToast(`Heureux de vous revoir, ${user.displayName} !`);
        }

    } catch (error) {
        console.error("Erreur de connexion Google:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
            showToast("Une erreur est survenue lors de la connexion avec Google.");
        }
    }
}


// --- UI Functions ---

function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function openModal(content, size = 'max-w-md') {
    if (!modalContainer || !modalContent) return;
    modalContent.innerHTML = content;
    
    modalContent.classList.remove('max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-3xl');
    modalContent.classList.add(size);

    if (window.lucide) lucide.createIcons();
    modalContainer.classList.remove('hidden');
    
    setTimeout(() => {
        modalBackdrop.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
    }, 10);
    
    setupModalEventListeners();
}

function closeModal() {
    if (!modalContainer) return;
    modalBackdrop.classList.add('opacity-0');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modalContainer.classList.add('hidden');
        modalContent.innerHTML = '';
    }, 300);
}

function showLoginFormModal() {
    const template = document.getElementById('login-form-template');
    if (!template) {
        console.error("Le template du formulaire de connexion est introuvable !");
        return;
    }
    openModal(template.innerHTML);
}

function showSignupFormModal() {
    const template = document.getElementById('signup-form-template');
    if (!template) {
        console.error("Le template du formulaire d'inscription est introuvable !");
        return;
    }
    openModal(template.innerHTML);
}

function setupModalEventListeners() {
    const closeButton = modalContent.querySelector('#modal-close-btn, #modal-cancel-btn');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    modalContent.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        e.preventDefault();
        const action = target.dataset.action;

        switch (action) {
            case 'google-signin':
                handleGoogleSignIn();
                break;
            case 'show-signup-form':
                showSignupFormModal();
                break;
            case 'show-login-form':
                showLoginFormModal();
                break;
            case 'forgot-password':
                handleForgotPassword();
                break;
            case 'manage-subscription':
                redirectToCustomerPortal();
                break;
            case 'send-password-reset':
                handleSendPasswordResetFromAccount();
                break;
            case 'delete-account':
                handleDeleteAccount();
                break;
            case 'show-legal':
                 showLegalPage(target.dataset.target);
                 break;
        }
    });

    modalContent.querySelector('#login')?.addEventListener('submit', handleSignIn);
    modalContent.querySelector('#signup')?.addEventListener('submit', handleSignUp);
}


// --- Auth UI ---

function updateHeaderUI(user, profile) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const appUrl = isMobile ? 'install.html' : 'app.html';

    if (user && profile) {
        headerAuthSection.innerHTML = `
            <a href="${appUrl}" class="bg-green-600 text-white font-bold px-4 py-2 rounded-full hover:bg-green-700 transition transform hover:scale-105 shadow-lg text-center text-xs leading-tight">
                Accéder à<br>l'App
            </a>
            <div class="relative dropdown">
                <button data-action="toggle-dropdown" class="flex items-center gap-2 cursor-pointer">
                    <div class="h-9 w-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold shrink-0">${getInitials(profile.name)}</div>
                </button>
                <div id="user-dropdown-menu" class="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <a href="#" data-action="show-account" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Mon Compte</a>
                    <a href="#" data-action="logout" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Déconnexion</a>
                </div>
            </div>
        `;
        headerAuthSection.querySelector('[data-action="logout"]').addEventListener('click', handleSignOut);
        headerAuthSection.querySelector('[data-action="show-account"]').addEventListener('click', handleShowAccount);
        headerAuthSection.querySelector('[data-action="toggle-dropdown"]').addEventListener('click', (e) => {
             e.stopPropagation();
             document.getElementById('user-dropdown-menu').classList.toggle('hidden');
        });

    } else {
        headerAuthSection.innerHTML = `
            <a href="#" data-action="login" class="bg-green-600 text-white font-bold px-5 py-2.5 rounded-full hover:bg-green-700 transition transform hover:scale-105 shadow-lg shadow-green-500/20">
                Connexion
            </a>
        `;
        headerAuthSection.querySelector('[data-action="login"]').addEventListener('click', (e) => {
            e.preventDefault();
            showLoginFormModal();
        });
    }
    if (window.lucide) lucide.createIcons();
}

// --- Auth Handlers ---

async function handleSignIn(e) {
    e.preventDefault();
    const email = modalContent.querySelector('#login-email').value;
    const password = modalContent.querySelector('#login-password').value;
    const loginError = modalContent.querySelector('#login-error');
    loginError.classList.add('hidden');
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "Email ou mot de passe incorrect.";
        loginError.classList.remove('hidden');
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const name = modalContent.querySelector('#signup-name').value;
    const email = modalContent.querySelector('#signup-email').value;
    const password = modalContent.querySelector('#signup-password').value;
    const termsCheckbox = modalContent.querySelector('#terms-checkbox-signup');
    const signupError = modalContent.querySelector('#signup-error');
    signupError.classList.add('hidden');

    if (!termsCheckbox.checked) {
        signupError.textContent = "Vous devez accepter les Conditions Générales d'Utilisation.";
        signupError.classList.remove('hidden');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userTag = await generateUniqueUserTag();
        await setDoc(doc(db, "users", user.uid), { name, email, plan: 'demo', userTag });
        await sendEmailVerification(user);
        closeModal();
        showToast("Compte créé ! Veuillez vérifier votre e-mail.");
    } catch (error) {
        let message = "Une erreur est survenue.";
        if (error.code === 'auth/email-already-in-use') message = "Cette adresse e-mail est déjà utilisée.";
        signupError.textContent = message;
        signupError.classList.remove('hidden');
    }
}

async function handleSignOut(e) {
    e.preventDefault();
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign out error", error);
    }
}

async function handleForgotPassword() {
    const email = modalContent.querySelector('#login-email').value;
    const loginError = modalContent.querySelector('#login-error');
    if (!email) {
        loginError.textContent = "Veuillez saisir votre e-mail pour réinitialiser le mot de passe.";
        loginError.classList.remove('hidden');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showToast("E-mail de réinitialisation envoyé !");
        closeModal();
    } catch (error) {
        loginError.textContent = "Erreur lors de l'envoi de l'e-mail.";
        loginError.classList.remove('hidden');
    }
}

async function handleShowAccount(e) {
    e.preventDefault();
    if (!currentUser || !userProfile) return;

    const content = `
        <h3 class="text-xl font-semibold mb-6 text-center">Mon Compte</h3>
        <div class="space-y-4">
            <div class="bg-slate-50 p-4 rounded-lg border">
                <p><strong>Nom:</strong> ${userProfile.name}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
            </div>
            <div class="bg-slate-50 p-4 rounded-lg border space-y-3">
                 <button data-action="send-password-reset" class="w-full text-center bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition">Réinitialiser le mot de passe</button>
                 <button data-action="delete-account" class="w-full text-center bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition">Supprimer mon compte</button>
            </div>
        </div>
        <button id="modal-close-btn" class="mt-6 w-full px-6 py-3 bg-slate-200 rounded-lg">Fermer</button>
    `;
    openModal(content, 'max-w-lg');
}

async function handleSendPasswordResetFromAccount() {
    if (!currentUser) return;
    try {
        await sendPasswordResetEmail(auth, currentUser.email);
        showToast("Un e-mail de réinitialisation a été envoyé.");
        closeModal();
    } catch (error) {
        showToast("Erreur lors de l'envoi de l'e-mail.");
        console.error("Password reset error from account:", error);
    }
}

function handleDeleteAccount() {
    const confirmationContent = `
        <h3 class="text-xl font-semibold mb-4 text-center text-red-600">Supprimer le compte</h3>
        <p class="text-center text-slate-600 mb-4">Cette action est irréversible. Pour confirmer, veuillez taper "supprimer" dans le champ ci-dessous.</p>
        <input type="text" id="delete-confirmation-input" class="w-full p-3 border-2 rounded-lg text-center" placeholder="supprimer">
        <div class="mt-6 grid grid-cols-2 gap-4">
            <button id="modal-cancel-btn" class="px-6 py-3 bg-slate-200 rounded-lg">Annuler</button>
            <button id="confirm-delete-btn" class="px-6 py-3 bg-red-600 text-white font-bold rounded-lg">Confirmer</button>
        </div>
    `;
    openModal(confirmationContent, 'max-w-md');

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        const input = document.getElementById('delete-confirmation-input').value;
        if (input.toLowerCase() === 'supprimer') {
            try {
                await deleteUser(currentUser);
                showToast("Compte supprimé avec succès.");
                closeModal();
            } catch (error) {
                showToast("Erreur. Veuillez vous reconnecter et réessayer.");
                console.error("Delete account error:", error);
            }
        } else {
            showToast("Le texte de confirmation est incorrect.");
        }
    });
}

function handleSubscriptionClick(e) {
    e.preventDefault();
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Si l'utilisateur n'est pas connecté, on ouvre la modale de connexion.
    // Après connexion, il sera redirigé.
    if (!currentUser) {
        showLoginFormModal();
    } else {
        // S'il est déjà connecté, on l'envoie directement à l'application.
        window.location.href = isMobile ? 'install.html' : 'app.html';
    }
}

function showLegalPage(targetId) {
    const legalContent = document.getElementById('legal-content');
    if (!legalContent) return;
    const targetContent = legalContent.querySelector(`#${targetId}`);
    if (!targetContent) return;

    const modalHTML = `
        <div class="relative">
            <button id="modal-close-btn" class="absolute -top-3 -right-3 h-8 w-8 bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg">×</button>
            <div class="max-h-[80vh] overflow-y-auto pr-4">
                ${targetContent.innerHTML}
            </div>
        </div>
    `;
    openModal(modalHTML, 'max-w-3xl');
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await user.reload();
        if (user.emailVerified) {
            currentUser = user;
            const userDoc = await getDoc(doc(db, "users", user.uid));
            userProfile = userDoc.exists() ? userDoc.data() : { name: 'Utilisateur', plan: 'demo' };
            updateHeaderUI(currentUser, userProfile);
            closeModal();

            if (pendingSubscriptionPlan) {
                const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile && pendingSubscriptionPlan !== 'free') {
                    window.location.href = 'install.html';
                } else {
                    if (pendingSubscriptionPlan === 'free') {
                        window.location.href = 'app.html';
                    } else {
                        initStripePayment(currentUser, pendingSubscriptionPlan);
                    }
                }
                pendingSubscriptionPlan = null;
            }

        } else {
            currentUser = null;
            userProfile = null;
            updateHeaderUI(null, null);
        }
    } else {
        currentUser = null;
        userProfile = null;
        updateHeaderUI(null, null);
    }
});

function initializeLandingPage() {
    modalBackdrop.addEventListener('click', closeModal);

    document.querySelectorAll('[data-action="start-subscription"]').forEach(btn => {
        btn.addEventListener('click', handleSubscriptionClick);
    });

    document.querySelectorAll('[data-action="show-legal"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLegalPage(e.currentTarget.dataset.target);
        });
    });

    document.addEventListener('click', (e) => {
        const dropdownMenu = document.getElementById('user-dropdown-menu');
        if (dropdownMenu && !dropdownMenu.classList.contains('hidden') && !e.target.closest('.dropdown')) {
            dropdownMenu.classList.add('hidden');
        }
    });

    displayApprovedReviews();
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


function generateStarRatingHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<i data-lucide="star" class="w-5 h-5 text-yellow-400 ${i <= rating ? 'fill-current' : ''}"></i>`;
    }
    return `<div class="flex items-center gap-1">${starsHTML}</div>`;
}

async function displayApprovedReviews() {
    const reviewsContainer = document.getElementById("reviews-grid");
    if (!reviewsContainer) return;

    try {
        const q = query(collection(db, "reviews"), where("isApproved", "==", true), orderBy("createdAt", "desc"), limit(3));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            reviewsContainer.innerHTML = "<p class='col-span-full text-center text-slate-500'>Soyez le premier à donner votre avis !</p>";
            return;
        }

        let reviewsHTML = '';
        querySnapshot.forEach((doc) => {
            const review = doc.data();
            const initials = review.userName ? review.userName.charAt(0).toUpperCase() : '?';
            const stars = generateStarRatingHTML(review.rating);
            
            reviewsHTML += `
                <div class="testimonial-card bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-full animo card-hover-effect" data-animation="animate-fadeInUp">
                    <div class="p-8 flex-grow">
                        <div class="flex items-center justify-between mb-4">
                            ${stars}
                        </div>
                        <blockquote class="relative">
                            <p class="text-slate-700 italic leading-relaxed">"${review.comment}"</p>
                        </blockquote>
                    </div>
                    <div class="bg-slate-50 p-6 border-t border-slate-100 mt-auto">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xl">
                                ${initials}
                            </div>
                            <div>
                                <p class="font-bold text-slate-800">${review.userName}</p>
                                <p class="text-sm text-slate-500">Utilisateur vérifié</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        reviewsContainer.innerHTML = reviewsHTML;
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Erreur de chargement des avis:", error);
        reviewsContainer.innerHTML = "<p class='col-span-full text-center text-red-500'>Impossible de charger les avis.</p>";
    }
}

async function generateUniqueUserTag() {
    let tag, isUnique = false;
    while (!isUnique) {
        tag = Math.floor(1000 + Math.random() * 9000).toString();
        const q = query(collection(db, "users"), where("userTag", "==", tag));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) isUnique = true;
    }
    return tag;
}


// Lancement de la page
initializeLandingPage();