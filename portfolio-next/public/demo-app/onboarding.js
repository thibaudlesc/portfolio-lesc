// onboarding.js

/**
 * Gère la visite guidée interactive pour les nouveaux utilisateurs
 * en utilisant la bibliothèque Shepherd.js.
 * Cette version est adaptative (mobile/ordinateur), plus complète et esthétique.
 */

/**
 * Démarre la visite guidée.
 * @param {Function} onCompleteCallback - Une fonction à exécuter à la fin de la visite.
 */
export function startOnboardingTour(onCompleteCallback) {
    if (typeof Shepherd === 'undefined') {
        console.error("Shepherd.js n'est pas chargé. La visite guidée ne peut pas démarrer.");
        if (onCompleteCallback) onCompleteCallback();
        return;
    }

    const isMobile = window.innerWidth < 1024;

    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        tourName: 'recoltiq-onboarding',
        defaultStepOptions: {
            cancelIcon: { enabled: true },
            classes: 'tour-recoltiq',
            scrollTo: { behavior: 'smooth', block: 'center' },
            when: {
                show: () => {
                    if(typeof lucide !== 'undefined') lucide.createIcons();
                }
            },
            // Ajout d'une barre de progression pour un meilleur suivi
            progress: true 
        }
    });

    const tourEndHandler = () => {
        // S'assurer de revenir à la page principale à la fin
        document.getElementById('nav-fields')?.click();
        if (onCompleteCallback) onCompleteCallback();
    };
    tour.on('complete', tourEndHandler);
    tour.on('cancel', tourEndHandler);

    // Étape 1: Bienvenue
    tour.addStep({
        title: '<i data-lucide="sparkles" class="w-5 h-5 text-yellow-500"></i> Bienvenue sur Recolt\'IQ !',
        text: "Suivez ce guide complet pour maîtriser toutes les fonctionnalités clés et bien démarrer votre expérience.",
        buttons: [{ action: tour.next, text: 'Commencer la visite' }]
    });

    // Étape 2: Navigation principale (adaptative)
    tour.addStep({
        title: '<i data-lucide="compass" class="w-5 h-5 text-slate-500"></i> Navigation Principale',
        text: 'Utilisez cette barre pour naviguer entre les sections principales : vos parcelles, votre stock, le marché et les parcelles partagées.',
        attachTo: {
            element: isMobile ? '#mobile-bottom-nav' : '#main-nav-links-container',
            on: isMobile ? 'top' : 'right'
        },
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 3: Gestion des fermes
    tour.addStep({
        title: '<i data-lucide="building-2" class="w-5 h-5 text-blue-500"></i> Gestion des Fermes',
        text: "Tout est organisé par ferme. Cliquez ici pour créer votre première ferme ou pour passer de l'une à l'autre.",
        attachTo: { element: '#change-farm-btn', on: 'bottom' },
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 4: Ajouter une parcelle
    tour.addStep({
        title: '<i data-lucide="plus-circle" class="w-5 h-5 text-green-500"></i> Ajouter une Parcelle',
        text: 'Une fois votre ferme créée, cliquez ici pour enregistrer un nouveau champ, sa culture et sa surface.',
        attachTo: { element: '#add-field-btn', on: 'bottom' },
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 5: Sélecteur d'année
    tour.addStep({
        title: '<i data-lucide="calendar" class="w-5 h-5 text-slate-500"></i> Sélecteur d\'Année',
        text: 'Naviguez facilement entre les années de récolte pour consulter vos archives ou préparer la saison à venir.',
        attachTo: { element: '#current-year-display', on: 'bottom' },
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 6: Gestion de stock
    tour.addStep({
        title: '<i data-lucide="warehouse" class="w-5 h-5 text-orange-500"></i> Suivez votre Stock',
        text: 'Cette section calcule automatiquement vos stocks par culture en se basant sur vos récoltes et vos ventes. Simple et efficace.',
        attachTo: { element: '#page-storage header', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-storage')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });
    
    // Étape 7: Marché et Ventes
    tour.addStep({
        title: '<i data-lucide="euro" class="w-5 h-5 text-purple-500"></i> Marché et Ventes',
        text: "Consultez les indices de marché et enregistrez vos contrats de vente pour suivre votre chiffre d'affaires et mieux piloter votre commercialisation.",
        attachTo: { element: '#page-market header', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-sales')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 8: Partage (envoi)
    tour.addStep({
        title: '<i data-lucide="share-2" class="w-5 h-5 text-blue-500"></i> Partagez votre travail',
        text: "Partagez une ou plusieurs parcelles avec vos collaborateurs. Vous pouvez générer un lien unique ou partager directement avec un autre utilisateur de Recolt'IQ.",
        attachTo: { element: '#share-filtered-btn', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-fields')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 9: Partage (gestion)
    tour.addStep({
        title: '<i data-lucide="settings-2" class="w-5 h-5 text-slate-500"></i> Gérez vos Partages',
        text: "Gérez ici tous vos partages en cours. Vous pouvez voir qui a accès à quoi et révoquer les accès à tout moment.",
        attachTo: { element: '#page-my-shares header', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-my-shares')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 10: Partage (réception)
    tour.addStep({
        title: '<i data-lucide="users" class="w-5 h-5 text-indigo-500"></i> Parcelles Partagées',
        text: "Et ici, consultez les parcelles que d'autres agriculteurs ont partagées avec vous.",
        attachTo: { element: '#page-shared-field-list header', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-shared-fields')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });
    
    // Étape 11: Tableau de bord
    tour.addStep({
        title: '<i data-lucide="layout-dashboard" class="w-5 h-5 text-cyan-500"></i> Tableau de Bord',
        text: "Visualisez en un coup d'œil les indicateurs clés de votre exploitation : récolte totale, chiffre d'affaires, marge brute et bien plus.",
        attachTo: { element: '#page-dashboard header', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-dashboard')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 12: Export Excel
    tour.addStep({
        title: '<i data-lucide="file-spreadsheet" class="w-5 h-5 text-emerald-500"></i> Export Excel',
        text: "Besoin de vos données sur ordinateur ? Exportez toutes les informations de vos parcelles (pesées, qualité, etc.) en un seul clic au format Excel.",
        attachTo: { element: '#nav-export', on: 'bottom' },
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-fields')?.click();
            setTimeout(resolve, 500);
        }),
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 13: Menu (Entretien, Compte, etc.)
    tour.addStep({
        title: '<i data-lucide="menu" class="w-5 h-5 text-slate-500"></i> Menu & Plus',
        text: "C'est ici que vous trouverez le reste des fonctionnalités : suivi de l'entretien, gestion de votre compte, vos contacts et le support technique.",
        attachTo: {
            element: isMobile ? '#mobile-menu-button' : '#desktop-sidebar-footer',
            on: isMobile ? 'bottom' : 'top'
        },
        buttons: [
            { action: tour.back, classes: 'shepherd-button-secondary', text: 'Précédent' },
            { action: tour.next, text: 'Suivant' }
        ]
    });

    // Étape 14: Fin
    tour.addStep({
        title: '<i data-lucide="rocket" class="w-5 h-5 text-green-500"></i> Vous êtes prêt !',
        text: "La visite est terminée. Explorez l'application et n'hésitez pas à contacter le support si vous avez des questions. Bonne récolte !",
        beforeShowPromise: () => new Promise(resolve => {
            document.getElementById('nav-fields')?.click();
            setTimeout(resolve, 300);
        }),
        buttons: [
            { action: tour.complete, text: 'Terminer' }
        ]
    });

    tour.start();
}
