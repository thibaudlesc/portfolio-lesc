// On importe le moteur WebGPU
import * as THREE from 'three/webgpu';

// On importe les fonctions TSL (fini le GLSL en string !)
import { color, time, positionLocal, Fn, mix, uv } from 'three/tsl';


const initWebGPU = async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 2;

    // 1. Déclaration du nouveau Renderer
    const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // 2. L'ÉTAPE CRUCIALE : Attendre l'initialisation du backend
    await renderer.init(); 

    return { scene, camera, renderer };
};


const createHoloMaterial = () => {
    // On utilise un NodeMaterial
    const material = new THREE.MeshBasicNodeMaterial({ transparent: true });

    // On crée notre shader avec la fonction Fn()
    material.colorNode = Fn(() => {
        const uvCoord = uv(); // Récupère les coordonnées UV
        
        // On crée un effet de vague qui évolue avec le temps
        const wave = uvCoord.x.add(time).sin().mul(0.5).add(0.5);
        
        // On mixe deux couleurs fluo
        const color1 = color('#ff0055'); // Rose néon
        const color2 = color('#00ffff'); // Cyan néon
        
        return mix(color1, color2, wave);
    })();

    return material;
};

const startApp = async () => {
    const { scene, camera, renderer } = await initWebGPU();

    // Ajout d'un mesh avec notre shader TSL
    const geometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    const material = createHoloMaterial();
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Boucle d'animation
    const animate = () => {
        requestAnimationFrame(animate);
        
        // C'est ici que tu mettras `renderer.compute(tonComputeNode)` 
        // juste avant le rendu visuel pour animer tes particules.
        
        renderer.render(scene, camera);
    };

    animate();
    
    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

startApp();


/**
 * Portfolio Thibaud Lescroart
 * Style éditorial minimaliste
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    const config = {
        recoltiqImages: [
            'assets/images/projects/recoltiq/C1.png',
            'assets/images/projects/recoltiq/C2.png',
            'assets/images/projects/recoltiq/C3.png',
            'assets/images/projects/recoltiq/C4.png',
            'assets/images/projects/recoltiq/C5.png',
            'assets/images/projects/recoltiq/C6.png',
            'assets/images/projects/recoltiq/C7.png',
            'assets/images/projects/recoltiq/C8.png',
            'assets/images/projects/recoltiq/C9.png',
            'assets/images/projects/recoltiq/C10.png'
        ]
    };

    // ============================================
    // THEME TOGGLE
    // ============================================
    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateToggleIcon(toggle, savedTheme);

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateToggleIcon(toggle, next);
        });
    }

    function updateToggleIcon(toggle, theme) {
        toggle.textContent = theme === 'dark' ? '☀' : '☾';
    }

    // ============================================
    // MOBILE MENU
    // ============================================
    function initMobileMenu() {
        const btn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav-links');
        if (!btn || !nav) return;

        btn.addEventListener('click', () => {
            nav.classList.toggle('active');
            btn.textContent = nav.classList.contains('active') ? 'Fermer' : 'Menu';
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                btn.textContent = 'Menu';
            });
        });
    }

    // ============================================
    // HEADER SCROLL
    // ============================================
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    function initScrollAnimations() {
        const reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        reveals.forEach(el => observer.observe(el));
    }

    // ============================================
    // ACTIVE NAV LINK
    // ============================================
    function pageKeyFromPathname(pathname) {
        const trimmed = pathname.replace(/\/$/, '') || '/';
        const segments = trimmed.split('/').filter(Boolean);
        let name = segments.length ? segments[segments.length - 1] : '';
        name = name.replace(/\.html$/i, '');
        if (!name || name === 'index') return 'index';
        return name;
    }

    function pageKeyFromHref(href) {
        if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return null;
        const clean = href.replace(/^\.\//, '').replace(/^\//, '');
        let name = clean.replace(/\.html$/i, '');
        if (!name || name === 'index') return 'index';
        return name;
    }

    function setActiveNavLink() {
        const current = pageKeyFromPathname(window.location.pathname);

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            const key = pageKeyFromHref(href);
            if (key !== null && key === current) {
                link.classList.add('active');
            }
        });
    }

    // ============================================
    // RECOLT'IQ PREMIUM CAROUSEL
    // ============================================
    function initRecoltiqCarousel() {
        const container = document.getElementById('recoltiq-carousel');
        const dotsContainer = document.getElementById('carousel-dots');
        if (!container) return;

        let currentSlide = 0;
        const images = config.recoltiqImages;
        const total = images.length;
        let autoplayInterval = null;

        // Créer la structure du carousel avec mockup iPhone
        container.innerHTML = `
            <button class="carousel-nav prev" aria-label="Image précédente">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            
            <div class="phone-frame">
                <div class="phone-screen">
                    <div class="carousel-track">
                        ${images.map((src, i) => `
                            <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                                <img src="${src}" alt="Recolt'IQ screenshot ${i + 1}" loading="${i < 3 ? 'eager' : 'lazy'}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <button class="carousel-nav next" aria-label="Image suivante">
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        `;

        // Créer les dots
        if (dotsContainer) {
            dotsContainer.innerHTML = images.map((_, i) => `
                <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Aller à l'image ${i + 1}"></button>
            `).join('');
        }

        const slides = container.querySelectorAll('.carousel-slide');
        const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
        const prevBtn = container.querySelector('.prev');
        const nextBtn = container.querySelector('.next');

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
            
            currentSlide = (index + total) % total;
            
            slides[currentSlide].classList.add('active');
            if (dots[currentSlide]) dots[currentSlide].classList.add('active');

            // Précharger les images adjacentes
            preloadAdjacentImages();
        }

        function preloadAdjacentImages() {
            const prevIndex = (currentSlide - 1 + total) % total;
            const nextIndex = (currentSlide + 1) % total;
            
            [prevIndex, nextIndex].forEach(idx => {
                const img = slides[idx].querySelector('img');
                if (img && img.loading === 'lazy') {
                    img.loading = 'eager';
                }
            });
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(() => {
                goToSlide(currentSlide + 1);
            }, 4000);
        }

        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }

        // Event listeners
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
            stopAutoplay();
        });

        nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
            stopAutoplay();
        });

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                goToSlide(parseInt(dot.dataset.index));
                stopAutoplay();
            });
        });

        // Keyboard navigation
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                goToSlide(currentSlide - 1);
                stopAutoplay();
            }
            if (e.key === 'ArrowRight') {
                goToSlide(currentSlide + 1);
                stopAutoplay();
            }
        });

        // Touch / Swipe
        let touchStartX = 0;
        let touchEndX = 0;

        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoplay();
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) goToSlide(currentSlide + 1);
                else goToSlide(currentSlide - 1);
            }
        }, { passive: true });

        // Pause autoplay on hover
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);

        // Focus pour accessibilité
        container.setAttribute('tabindex', '0');

        // Démarrer l'autoplay
        startAutoplay();

        // Observer pour démarrer/arrêter l'autoplay selon la visibilité
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startAutoplay();
                } else {
                    stopAutoplay();
                }
            });
        }, { threshold: 0.3 });

        visibilityObserver.observe(container);
    }

    // ============================================
    // INITIALISATION
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        initThemeToggle();
        initMobileMenu();
        initHeaderScroll();
        initScrollAnimations();
        setActiveNavLink();
        initRecoltiqCarousel();
    });

})();
