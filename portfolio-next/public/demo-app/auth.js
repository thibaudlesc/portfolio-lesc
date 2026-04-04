// auth.js (Version finale Email/Mot de passe uniquement)

import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    db,
    doc,
    setDoc,
    getDocs,
    collection,
    where,
    query
} from './firebase-config.js';

import { showToast, showView, closeModal } from './ui.js';

export function handleAuthentication(state, user = null) {
    showView('auth-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const verificationContainer = document.getElementById('verification-container');
    [loginForm, signupForm, verificationContainer].forEach(el => el?.classList.add('hidden'));
    if (state === 'verify' && user) {
        verificationContainer?.classList.remove('hidden');
        const messageEl = verificationContainer.querySelector('#verification-message');
        if (messageEl) messageEl.innerHTML = `Un e-mail a été envoyé à <strong>${user.email}</strong>. Veuillez vérifier votre compte.`;
    } else {
        loginForm?.classList.remove('hidden');
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const signupForm = document.getElementById('signup');
    if (!signupForm) return;
    const name = signupForm['signup-name']?.value;
    const email = signupForm['signup-email']?.value;
    const password = signupForm['signup-password']?.value;
    const termsCheckbox = document.getElementById('terms-checkbox');
    const signupError = document.getElementById('signup-error');
    if (!signupError) return;
    signupError.classList.add('hidden');
    if (!termsCheckbox || !termsCheckbox.checked) {
        signupError.textContent = "Vous devez accepter les conditions.";
        signupError.classList.remove('hidden');
        return;
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userTag = await generateUniqueUserTag();
        await setDoc(doc(db, "users", user.uid), { name, email, plan: 'demo', userTag });
        await sendEmailVerification(user);
    } catch (error) {
        let message = "Une erreur est survenue.";
        if (error.code === 'auth/weak-password') message = "Le mot de passe doit faire au moins 6 caractères.";
        else if (error.code === 'auth/email-already-in-use') message = "Cet e-mail est déjà utilisé.";
        signupError.textContent = message;
        signupError.classList.remove('hidden');
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    const loginForm = document.getElementById('login');
    if (!loginForm) return;
    const email = loginForm['login-email']?.value;
    const password = loginForm['login-password']?.value;
    const loginError = document.getElementById('login-error');
    if (!loginError) return;
    loginError.classList.add('hidden');
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "Email ou mot de passe incorrect.";
        loginError.classList.remove('hidden');
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erreur de déconnexion:", error);
    }
}

async function handleForgotPassword() {
    const emailInput = document.getElementById('login-email');
    const email = emailInput?.value;
    const loginError = document.getElementById('login-error');
    if (!loginError) return;
    if (!email) {
        loginError.textContent = "Veuillez saisir votre e-mail.";
        loginError.classList.remove('hidden');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        loginError.textContent = "E-mail de réinitialisation envoyé !";
        loginError.classList.replace('text-red-500', 'text-green-600');
        loginError.classList.remove('hidden');
    } catch (error) {
        loginError.textContent = "Erreur. L'e-mail est peut-être invalide.";
        loginError.classList.remove('hidden');
    }
}

export function setupAuthFormListeners() {
    document.getElementById('signup')?.addEventListener('submit', handleSignUp);
    document.getElementById('login')?.addEventListener('submit', handleSignIn);
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const authContainer = document.getElementById('auth-view');
        if (!authContainer) return;
        const loginForm = authContainer.querySelector('#login-form');
        const signupForm = authContainer.querySelector('#signup-form');
        const hideAllForms = () => {
            loginForm?.classList.add('hidden');
            signupForm?.classList.add('hidden');
        };
        switch (action) {
            case 'show-signup-form':
                e.preventDefault();
                hideAllForms();
                signupForm?.classList.remove('hidden');
                break;
            case 'show-login-form':
                e.preventDefault();
                hideAllForms();
                loginForm?.classList.remove('hidden');
                break;
            case 'forgot-password':
                e.preventDefault();
                handleForgotPassword();
                break;
            case 'logout':
                e.preventDefault();
                handleSignOut();
                break;
        }
    });
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