const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 1.5,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            lenis.scrollTo(target, { offset: -80 });
        }
    });
});

class AmbientPlayer {
    constructor() {
        this.ctx = null;
        this.gainNode = null;
        this.noiseNode = null;
        this.isMuted = true;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 0;
        this.gainNode.connect(this.ctx.destination);
    }

    createNoise() {
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }

        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;

        const lowPass = this.ctx.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 2000;

        const highPass = this.ctx.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 400;

        this.noiseNode.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(this.gainNode);
        this.noiseNode.start(0);
    }

    toggle() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.isMuted = !this.isMuted;
        const icon = document.getElementById('audio-icon');

        if (!this.noiseNode) this.createNoise();

        if (!this.isMuted) {
            this.gainNode.gain.setTargetAtTime(0.1, this.ctx.currentTime, 0.5);
            if (icon) icon.className = 'fas fa-volume-up text-white relative z-10';
        } else {
            this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
            if (icon) icon.className = 'fas fa-volume-mute text-white/70 relative z-10';
        }
    }
}

class DayNightCycle {
    constructor() {
        this.bg = document.getElementById('city-bg');
        this.update();
        setInterval(() => this.update(), 60000);
    }

    update() {
        const h = new Date().getHours();
        let tone = '';

        if (h >= 5 && h < 12) {
            tone = 'brightness(0.8) contrast(1.1) hue-rotate(-10deg) sepia(0.2) saturate(0.8)';
            const color = '255, 219, 112';
            document.documentElement.style.setProperty('--lamp-color-rgb', color);
            document.documentElement.style.setProperty('--lamp-glow', `rgba(${color}, 0.15)`);
        } else if (h >= 12 && h < 17) {
            tone = 'brightness(0.9) contrast(1.0) grayscale(0.2)';
            const color = '255, 240, 160';
            document.documentElement.style.setProperty('--lamp-color-rgb', color);
            document.documentElement.style.setProperty('--lamp-glow', `rgba(${color}, 0.15)`);
        } else if (h >= 17 && h < 20) {
            tone = 'brightness(0.6) contrast(1.2) hue-rotate(10deg) saturate(1.2)';
            const color = '255, 170, 94';
            document.documentElement.style.setProperty('--lamp-color-rgb', color);
            document.documentElement.style.setProperty('--lamp-glow', `rgba(${color}, 0.15)`);
        } else {
            tone = 'brightness(0.5) contrast(1.3) hue-rotate(5deg) saturate(1.1)';
            const color = '255, 219, 112';
            document.documentElement.style.setProperty('--lamp-color-rgb', color);
            document.documentElement.style.setProperty('--lamp-glow', `rgba(${color}, 0.15)`);
        }

        if (this.bg) {
            this.bg.style.filter = `blur(8px) ${tone}`;
        }
    }
}

class RainCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.splashes = [];
        this.width = 0;
        this.height = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    addDrop() {
        this.drops.push({
            x: Math.random() * this.width,
            y: -20,
            vy: Math.random() * 10 + 25,
            len: Math.random() * 30 + 20,
            op: Math.random() * 0.3 + 0.2
        });
    }

    addSplash(x) {
        for (let i = 0; i < 3; i++) {
            this.splashes.push({
                x: x,
                y: this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 3 + 2),
                life: 1.0
            });
        }
    }

    update() {
        if (Math.random() > 0.1) this.addDrop();

        for (let i = this.drops.length - 1; i >= 0; i--) {
            let d = this.drops[i];
            d.y += d.vy;

            if (d.y > this.height) {
                this.addSplash(d.x);
                this.drops.splice(i, 1);
            }
        }

        for (let i = this.splashes.length - 1; i >= 0; i--) {
            let s = this.splashes[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.2;
            s.life -= 0.05;

            if (s.life <= 0) this.splashes.splice(i, 1);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = 'rgba(200, 220, 255, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        for (let d of this.drops) {
            this.ctx.globalAlpha = d.op;
            this.ctx.moveTo(d.x, d.y);
            this.ctx.lineTo(d.x, d.y + d.len);
        }
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(174, 194, 224, 0.4)';
        for (let s of this.splashes) {
            this.ctx.globalAlpha = s.life;
            this.ctx.fillRect(s.x, s.y, 2, 2);
        }
        this.ctx.globalAlpha = 1;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

class LiquidNav {
    constructor() {
        this.nav = document.getElementById('main-nav');
        this.indicator = document.getElementById('nav-indicator');
        this.items = document.querySelectorAll('.ios-nav-item');
        if (!this.nav || !this.indicator) return;
        this.init();
    }

    init() {
        const active = document.querySelector('.ios-nav-item.active') || this.items[0];
        if (active) this.updatePos(active);

        this.items.forEach(item => {
            item.addEventListener('mouseenter', () => this.updatePos(item));
            item.addEventListener('click', () => {
                this.items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.updatePos(item);
            });
        });
        this.nav.addEventListener('mouseleave', () => {
            const active = document.querySelector('.ios-nav-item.active');
            if (active) this.updatePos(active);
        });
        this.initScrollSpy();
    }

    updatePos(target) {
        if (!target) return;
        const navRect = this.nav.getBoundingClientRect();
        const itemRect = target.getBoundingClientRect();
        this.indicator.style.left = `${itemRect.left - navRect.left}px`;
        this.indicator.style.width = `${itemRect.width}px`;
    }

    initScrollSpy() {
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    const navItem = document.querySelector(`.ios-nav-item[href="#${id}"]`);
                    const mobileItem = document.querySelector(`.ios-mobile-nav-item[href="#${id}"]`);
                    if (navItem) {
                        this.items.forEach(i => i.classList.remove('active'));
                        navItem.classList.add('active');
                        this.updatePos(navItem);
                    }
                    if (mobileItem) {
                        document.querySelectorAll('.ios-mobile-nav-item').forEach(i => i.classList.remove('active'));
                        mobileItem.classList.add('active');
                    }
                    entry.target.classList.add('in-view');
                }
            });
        }, { threshold: 0.3 });
        sections.forEach(s => observer.observe(s));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LiquidNav();
    new RainCanvas('liquid-glass');
    new DayNightCycle();
    AOS.init({ once: true });

    const audio = new AmbientPlayer();
    const toggle = document.getElementById('audio-toggle');
    if (toggle) toggle.addEventListener('click', () => audio.toggle());

    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    loadData();
});

async function loadData() {
    try {
        const res = await fetch('assets/data/data.json');
        const data = await res.json();
        renderExperience(data.experience);
        renderAchievements(data.achievements);
        renderFriends(data.friends);
        try {
            const wRes = await fetch('assets/data/writeups.json');
            const writeups = await wRes.json();
            renderWriteups(writeups);
        } catch (e) { console.log('No Writeups'); }
    } catch (e) {
        console.error("Failed to load data", e);
    }
}

function renderExperience(exp) {
    const container = document.getElementById('experience-list');
    if (!container) return;
    container.innerHTML = exp.map(e => `
        <div class="mb-10 relative">
            <div class="absolute -left-[21px] top-1 w-3 h-3 bg-lamp-yellow rounded-full border-2 border-night-bg shadow-[0_0_10px_rgba(255,219,112,0.5)]"></div>
            <h4 class="text-white text-lg font-medium">${e.title}</h4>
            <span class="text-sm text-text-mute font-mono mb-2 block">${e.period}</span>
            <p class="text-text-mute/80 leading-relaxed">${e.type}</p>
        </div>
    `).join('');
}

function renderAchievements(ach) {
    const container = document.getElementById('achievements-list');
    if (!container) return;
    container.innerHTML = ach.map(a => `
        <div class="p-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors backdrop-blur-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-white font-medium">${a.name}</span>
                <span class="text-xs font-mono text-lamp-yellow bg-lamp-yellow/10 px-2 py-0.5 rounded">${a.rank}</span>
            </div>
            ${a.note ? `<p class="text-xs text-text-mute opacity-70">${a.note}</p>` : ''}
        </div>
    `).join('');
}

function renderFriends(friends) {
    const container = document.getElementById('friend-grid');
    if (!container) return;
    container.innerHTML = friends.map(f => `
        <a href="${f.link}" target="_blank" class="block p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all group">
            <h4 class="text-white font-medium mb-2 group-hover:text-lamp-yellow transition-colors">${f.name}</h4>
            <p class="text-sm text-text-mute group-hover:text-white/80 transition-colors">${f.desc}</p>
        </a>
    `).join('');
}

function renderWriteups(writeups) {
    const grid = document.getElementById('writeup-grid');
    if (!grid) return;
    function updateGrid(filter) {
        const filtered = filter === 'all' ? writeups : writeups.filter(w => w.category.toLowerCase() === filter);
        grid.innerHTML = filtered.map(w => `
            <div class="group cursor-pointer rounded-2xl bg-night-dark border border-white/5 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1" onclick="viewWriteup('${w.file}')">
                <div class="p-8">
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-xs font-medium tracking-wider text-lamp-yellow uppercase opacity-80">${w.category}</span>
                        <span class="text-xs text-text-mute font-mono">${w.date}</span>
                    </div>
                    <h3 class="text-xl text-white font-light mb-4 group-hover:text-lamp-yellow transition-colors">${w.title}</h3>
                    <p class="text-text-mute text-sm leading-relaxed line-clamp-2">${w.desc}</p>
                </div>
                <div class="h-1 w-full bg-white/5">
                    <div class="h-full bg-lamp-yellow w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
                </div>
            </div>
        `).join('');
    }
    updateGrid('all');
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.className = 'filter-btn text-sm px-6 py-2 rounded-full border border-white/10 text-text-mute hover:border-white/30 hover:text-white transition-all';
            });
            e.target.className = 'filter-btn active text-sm px-6 py-2 rounded-full border border-lamp-yellow/30 bg-lamp-yellow/10 text-lamp-yellow transition-all';
            updateGrid(e.target.dataset.filter);
        });
    });
    window.viewWriteup = async (file) => {
        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error("Load failed");
            const text = await res.text();
            document.getElementById('markdown-content').innerHTML = marked.parse(text);

            setTimeout(() => {
                document.querySelectorAll('#markdown-content pre code').forEach((block) => {
                    hljs.highlightElement(block);
                });
            }, 0);

            const list = document.getElementById('writeup-list-view');
            const detail = document.getElementById('writeup-detail-view');
            list.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                list.classList.add('hidden');
                detail.classList.remove('hidden');
                setTimeout(() => detail.classList.remove('opacity-0'), 50);
            }, 500);
        } catch (e) { alert("Failed to load writeup"); }
    };
    const backBtn = document.getElementById('back-to-writeups');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const list = document.getElementById('writeup-list-view');
            const detail = document.getElementById('writeup-detail-view');
            detail.classList.add('opacity-0');
            setTimeout(() => {
                detail.classList.add('hidden');
                list.classList.remove('hidden', 'pointer-events-none');
                setTimeout(() => list.classList.remove('opacity-0'), 50);
            }, 500);
        });
    }
}
