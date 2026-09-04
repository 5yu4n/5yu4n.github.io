(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const getAnime = () => {
        const api = window.anime;
        return api && typeof api.animate === 'function' && typeof api.stagger === 'function' ? api : null;
    };

    const motionEnabled = () => !reduceMotion.matches && Boolean(getAnime());
    const clearTransform = (node) => node.style.removeProperty('transform');

    function animateTerminal() {
        const api = getAnime();
        const terminal = document.getElementById('hero-terminal');
        if (!api || !terminal || !motionEnabled()) return;

        const lines = terminal.querySelectorAll('[data-terminal-line]');
        const bars = terminal.querySelectorAll('[data-skill-level]');
        bars.forEach((bar) => { bar.style.width = '0%'; });

        api.animate(lines, {
            opacity: { from: 0 },
            y: { from: 10 },
            delay: api.stagger(110, { start: 350 }),
            duration: 650,
            ease: 'outExpo',
            onComplete: () => lines.forEach(clearTransform)
        });

        bars.forEach((bar, index) => {
            const level = Number.parseFloat(bar.dataset.skillLevel);
            if (!Number.isFinite(level)) return;
            api.animate(bar, {
                width: `${Math.max(0, Math.min(100, level))}%`,
                delay: 820 + index * 120,
                duration: 900,
                ease: 'outExpo'
            });
        });
    }

    function animateWriteupCards(grid) {
        const api = getAnime();
        if (!api || !grid || !motionEnabled()) return;

        const cards = Array.from(grid.children);
        if (!cards.length) return;

        api.animate(cards, {
            opacity: { from: 0 },
            delay: api.stagger(65),
            duration: 450,
            ease: 'outQuad'
        });

        const bodies = cards.map((card) => card.firstElementChild).filter(Boolean);
        api.animate(bodies, {
            y: { from: 14 },
            delay: api.stagger(65),
            duration: 600,
            ease: 'outExpo',
            onComplete: () => bodies.forEach(clearTransform)
        });
    }

    function observeWriteups() {
        const api = getAnime();
        const grid = document.getElementById('writeup-grid');
        const list = document.getElementById('writeup-list-view');
        const detail = document.getElementById('writeup-detail-view');
        if (!grid || !list || !detail) return;

        let frame = null;
        const scheduleGridAnimation = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                frame = null;
                animateWriteupCards(grid);
            });
        };

        new MutationObserver((mutations) => {
            if (mutations.some((mutation) => mutation.type === 'childList')) {
                scheduleGridAnimation();
            }
        }).observe(grid, { childList: true });

        let detailVisible = !detail.classList.contains('hidden');
        let listVisible = !list.classList.contains('hidden');

        new MutationObserver(() => {
            const nextDetailVisible = !detail.classList.contains('hidden');
            const nextListVisible = !list.classList.contains('hidden');

            if (api && motionEnabled() && nextDetailVisible && !detailVisible) {
                const targets = Array.from(detail.children);
                api.animate(targets, {
                    opacity: { from: 0 },
                    y: { from: 16 },
                    delay: api.stagger(80),
                    duration: 550,
                    ease: 'outExpo',
                    onComplete: () => targets.forEach(clearTransform)
                });
            }

            if (nextListVisible && !listVisible) {
                animateWriteupCards(grid);
            }

            detailVisible = nextDetailVisible;
            listVisible = nextListVisible;
        }).observe(detail.parentElement, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        if (grid.children.length) scheduleGridAnimation();
    }

    function setupMobileMenu() {
        const api = getAnime();
        const button = document.getElementById('menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (!button || !menu) return;

        const items = Array.from(menu.querySelectorAll('.ios-mobile-nav-item'));
        const setExpanded = (value) => button.setAttribute('aria-expanded', String(value));
        const reset = () => {
            [menu, ...items].forEach((node) => {
                node.style.removeProperty('opacity');
                node.style.removeProperty('transform');
            });
        };

        const close = (animated = true) => {
            if (menu.classList.contains('hidden')) {
                setExpanded(false);
                return;
            }
            if (!animated || !api || !motionEnabled()) {
                menu.classList.add('hidden');
                reset();
                setExpanded(false);
                return;
            }
            api.animate(menu, {
                opacity: 0,
                y: -6,
                duration: 220,
                ease: 'inQuad',
                onComplete: () => {
                    menu.classList.add('hidden');
                    reset();
                }
            });
            setExpanded(false);
        };

        const open = () => {
            menu.classList.remove('hidden');
            setExpanded(true);
            if (!api || !motionEnabled()) {
                reset();
                return;
            }
            api.animate(menu, {
                opacity: { from: 0 },
                y: { from: -8 },
                duration: 300,
                ease: 'outExpo',
                onComplete: () => clearTransform(menu)
            });
            api.animate(items, {
                opacity: { from: 0 },
                x: { from: 10 },
                delay: api.stagger(45, { start: 40 }),
                duration: 360,
                ease: 'outExpo',
                onComplete: () => items.forEach(clearTransform)
            });
        };

        setExpanded(!menu.classList.contains('hidden'));

        button.addEventListener('click', (event) => {
            // Registered before main.js so this layer owns the menu transition
            // while preserving main.js as the non-motion implementation fallback.
            event.preventDefault();
            event.stopImmediatePropagation();
            menu.classList.contains('hidden') ? open() : close();
        });

        items.forEach((item) => item.addEventListener('click', () => close()));
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) close(false);
        });
    }

    function init() {
        setupMobileMenu();
        observeWriteups();
        animateTerminal();
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init, { once: true })
        : init();
})();
