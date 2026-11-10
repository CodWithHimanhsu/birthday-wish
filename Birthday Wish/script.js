
(() => {
    'use strict';

    // =====================================================
    // EDITABLE CONTENT
    // REPLACE PLACEHOLDERS WITH REAL NAMES AND IMAGE FILES
    // -----------------------------------------------------
    // * Put your image files in:  assets/wishes/
    // * teamWishes[0] is the EXTENDED LETTER (3 images, one person).
    // * Every other entry is ONE image. Add/remove entries freely:
    //   the site supports 5 or 6 members (or any number) automatically.
    // * To go from 6 to 5 members, delete the last entry.
    // =====================================================
    const BIRTHDAY_CONTENT = {

        recipient: "Jitendra Sir",
        teamName: "The Coordinators Team",

        // Page 01 title (two lines)
        openingTitle: ["A Birthday", "Across the Stars"],

        // Page 01 greeting. FIRST item = big heading, the rest = paragraphs.
        birthdayMessage: [
            "Happy Birthday, Jitendra Sir!",
            "On behalf of the entire Coordinators Team, we wish you a wonderful year ahead, filled with happiness, good health, exciting opportunities and countless reasons to smile.",
            "May your curiosity keep taking you towards new horizons, may every new journey bring something meaningful, and may this year hold many moments worth remembering.",
            "Here's wishing you a beautiful birthday and an even more wonderful journey around the Sun."
        ],

        // Page 02 envelopes. Order here = order on screen.
        teamWishes: [
            {
                id: "member-01",
                name: "",          // <-- REPLACE with the real name
                label: "EXTENDED LETTER",
                images: [                          // <-- 3 images, same person
                    { src: "assets/wishes/member-01-page-01.png", alt: "First page of the extended birthday letter" },
                    { src: "assets/wishes/member-01-page-02.png", alt: "Second page of the extended birthday letter" },
                    { src: "assets/wishes/member-01-page-03.png", alt: "Third page of the extended birthday letter" }
                ]
            },
            {
                id: "member-02", name: "", label: "PERSONAL MESSAGE",
                images: [{ src: "assets/wishes/member-02.png", alt: "Birthday wish from team member 02" }]
            },
            {
                id: "member-03", name: "", label: "PERSONAL MESSAGE",
                images: [{ src: "assets/wishes/member-03.png", alt: "Birthday wish from team member 03" }]
            },
            {
                id: "member-04", name: " ", label: "PERSONAL MESSAGE",
                images: [{ src: "assets/wishes/member-04.png", alt: "Birthday wish from team member 04" }]
            },
            {
                id: "member-05", name: " ", label: "PERSONAL MESSAGE",
                images: [{ src: "assets/wishes/member-05.png", alt: "Birthday wish from team member 05" }]
            },
            {
                id: "member-06", name: " ", label: "PERSONAL MESSAGE",     // delete this line's entry for a 5-member team
                images: [{ src: "assets/wishes/member-06.png", alt: "Birthday wish from team member 06" }]
            },
            {
                id: "member-07", name: " ", label: "PERSONAL MESSAGE",     // delete this line's entry for a 5-member team
                images: [{ src: "assets/wishes/member-07.png", alt: "Birthday wish from team member 06" }]
            }
        ],

        // Page 03 note. Each item = one paragraph (first = salutation, last = closing line).
        closingTitle: "One Last Transmission",
        closingMessage: [
            "Jitendra Sir,",
            "We may each express it differently, but all of us share the same wish for you today.",
            "Thank you for the opportunities, experiences, encouragement and moments that make being part of this team meaningful.",
            "We hope this new year of your life brings you good health, happiness, exciting discoveries and many beautiful memories.",
            "We wanted to make this little corner of the universe for you, simply to remind you that you are appreciated.",
            "Happy Birthday, Sir!"
        ],
        closingSignoff: "With respect and warm wishes,",
        closingSignature: "Your Coordinators Team",

        // Final constellation text
        finalHeading: ["Happy Birthday,", "Jitendra Sir."],
        finalLine: "A universe of wishes, sent with respect.",
        finalSignature: "— Your Coordinators Team"
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const rm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';
    const pad2 = n => String(n).padStart(2, '0');
    function el(tag, props = {}, kids = []) {
        const n = document.createElement(tag);
        for (const [k, v] of Object.entries(props)) {
            if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
            else if (k === 'style') n.setAttribute('style', v); else n.setAttribute(k, v);
        }
        [].concat(kids).forEach(c => c && n.appendChild(c));
        return n;
    }
    function svgEl(tag, attrs = {}, kids = []) {
        const n = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
        [].concat(kids).forEach(c => c && n.appendChild(c));
        return n;
    }
    function seeded(seed) { let s = (seed * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
    function makeTimers() {
        const list = [];
        return {
            later(fn, ms) { list.push(setTimeout(fn, ms)); },
            clear() { while (list.length) clearTimeout(list.pop()); }
        };
    }

    // =====================================================
    // STATE
    // =====================================================
    const state = {
        currentPage: 1,
        activeEnvelopeId: null,
        activeImageIndex: 0,
        envelopeState: 'CLOSED',          // CLOSED | OPENING | READING | CLOSING
        openedEnvelopes: [],
        soundEnabled: false,
        audioInitialized: false,
        introCompleted: false,
        transmissionReceived: false,
        finalSequencePlayed: false,
        finalSignature : true,
        FileSystemDirectoryEntry : false,
        FileSystemDirectoryReader : false,
        finishOpening : true,
        finalHeading : false, 
        finally : true,
        finalRunning: false
    };
    let navLock = false;
    let lastTrigger = null;
    const introT = makeTimers(), viewT = makeTimers(), finalT = makeTimers(), navT = makeTimers();

    // =====================================================
    // SKY (canvas starfield)
    // =====================================================
    const Sky = (() => {
        const c = $('#sky'), ctx = c.getContext('2d');
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        let W = 0, H = 0, stars = [], shoots = [], rips = [], mx = 0, my = 0, tx = 0, ty = 0;
        let raf = 0, t0 = performance.now(), fadeStart = performance.now(), nextShoot = performance.now() + 5000;
        const COLORS = ['245,240,229', '200,215,255', '233,191,120', '128,217,232'];
        const sprites = [mkSprite('233,191,120'), mkSprite('132,119,199')];
        const dust = Array.from({ length: 9 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 160 + Math.random() * 240, v: .6 + Math.random(), k: i % 2, a: .035 + Math.random() * .03 }));

        function mkSprite(rgb) {
            const s = document.createElement('canvas'); s.width = s.height = 128;
            const g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
            gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`);
            g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s;
        }
        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            W = window.innerWidth; H = window.innerHeight;
            c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(Math.min(coarse ? 110 : 210, Math.max(60, W * H / (coarse ? 11000 : 9000))));
            stars = Array.from({ length: n }, () => {
                const r = Math.random(), z = r < .55 ? .3 : r < .85 ? .6 : 1;
                return {
                    x: Math.random() * W, y: Math.random() * H, z, r: (.4 + Math.random() * .9) * (.6 + z * .9),
                    p: Math.random() * 6.28, s: .4 + Math.random() * 1.4, c: COLORS[Math.random() < .7 ? 0 : 1 + Math.floor(Math.random() * 3)]
                };
            });
            if (rm()) draw(performance.now(), true);
        }
        function draw(now, still) {
            const t = still ? 0 : (now - t0) / 1000;
            const fade = still ? 1 : Math.min(1, (now - fadeStart) / 2200);
            mx += (tx - mx) * .04; my += (ty - my) * .04;
            ctx.clearRect(0, 0, W, H);
            for (const d of dust) {
                const x = ((d.x * W - t * 3 * d.v) % (W + 400) + W + 400) % (W + 400) - 200, y = d.y * H + Math.sin(t * .05 * d.v) * 30;
                ctx.globalAlpha = d.a * fade; ctx.drawImage(sprites[d.k], x - d.s / 2, y - d.s / 2, d.s, d.s);
            }
            for (const s of stars) {
                const x = ((s.x - t * 2 * s.z - mx * 22 * s.z) % W + W) % W;
                const y = ((s.y - t * .8 * s.z - my * 14 * s.z) % H + H) % H;
                const tw = .5 + .5 * Math.sin(t * s.s + s.p);
                const a = fade * (.3 + .7 * tw) * (.4 + .6 * s.z);
                ctx.fillStyle = `rgba(${s.c},${a})`; ctx.globalAlpha = 1;
                ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.2832); ctx.fill();
                if (s.z === 1) { ctx.fillStyle = `rgba(${s.c},${a * .14})`; ctx.beginPath(); ctx.arc(x, y, s.r * 3.4, 0, 6.2832); ctx.fill(); }
            }
            ctx.globalAlpha = 1;
            if (!still) {
                if (now > nextShoot && !coarse || (coarse && now > nextShoot + 8000)) {
                    shoots.push({ x: Math.random() * W * .8 + W * .1, y: Math.random() * H * .4, vx: 7 + Math.random() * 5, vy: 3 + Math.random() * 3, l: 1 });
                    nextShoot = now + 7000 + Math.random() * 9000;
                }
                for (let i = shoots.length - 1; i >= 0; i--) {
                    const s = shoots[i]; s.x += s.vx; s.y += s.vy; s.l -= .016;
                    if (s.l <= 0) { shoots.splice(i, 1); continue; }
                    for (let k = 0; k < 4; k++) {
                        ctx.strokeStyle = `rgba(245,240,229,${s.l * (.7 - k * .17) * fade})`; ctx.lineWidth = 1.3 - k * .25;
                        ctx.beginPath(); ctx.moveTo(s.x - s.vx * k * 3, s.y - s.vy * k * 3); ctx.lineTo(s.x - s.vx * (k + 1) * 3, s.y - s.vy * (k + 1) * 3); ctx.stroke();
                    }
                }
            }
            for (let i = rips.length - 1; i >= 0; i--) {
                const r = rips[i]; r.r += 5; r.a -= .013;
                if (r.a <= 0) { rips.splice(i, 1); continue; }
                ctx.strokeStyle = `rgba(233,191,120,${r.a})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.stroke();
            }
        }
        function frame(now) { raf = requestAnimationFrame(frame); draw(now, false); }
        function start() { if (rm() || raf) return; raf = requestAnimationFrame(frame); }
        function stop() { cancelAnimationFrame(raf); raf = 0; }
        window.addEventListener('resize', resize);
        if (!coarse) window.addEventListener('pointermove', e => { if (rm()) return; tx = e.clientX / W - .5; ty = e.clientY / H - .5; }, { passive: true });
        document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
        resize(); start();
        return {
            fadeIn() { fadeStart = performance.now(); },
            ripple(x, y) { if (!rm()) rips.push({ x, y, r: 10, a: .7 }); }
        };
    })();

    // =====================================================
    // SOUND (Web Audio, fully synthesized)
    // =====================================================
    const Sound = (() => {
        const AC = window.AudioContext || window.webkitAudioContext;
        const supported = !!AC;
        let ctx = null, master = null, revIn = null, noiseBuf = null, amb = null, enabled = false, volume = .6, suspT = 0;
        const last = {};
        function init() {
            if (!supported) return false;
            if (ctx) return true;
            try {
                ctx = new AC();
                const comp = ctx.createDynamicsCompressor();
                master = ctx.createGain(); master.gain.value = 0;
                master.connect(comp); comp.connect(ctx.destination);
                const conv = ctx.createConvolver();
                const len = Math.floor(ctx.sampleRate * 2.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
                conv.buffer = buf;
                const wet = ctx.createGain(); wet.gain.value = .6; conv.connect(wet); wet.connect(master); revIn = conv;
                noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
                const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
                return true;
            } catch (e) { ctx = null; return false; }
        }
        function tone({ f, f2, t = 0, d = 1, type = 'sine', v = .1, a = .01, send = .5 }) {
            const t0 = ctx.currentTime + t, o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type; o.frequency.setValueAtTime(f, t0);
            if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
            g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
            o.connect(g); g.connect(master);
            if (send > 0) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(revIn); }
            o.start(t0); o.stop(t0 + d + .05);
        }
        function noise({ t = 0, d = .3, v = .05, type = 'bandpass', f = 1000, f2, q = 1, send = .2 }) {
            const t0 = ctx.currentTime + t, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
            s.buffer = noiseBuf; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t0);
            if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + d);
            g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + d * .3); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
            s.connect(fl); fl.connect(g); g.connect(master);
            if (send > 0) { const sg = ctx.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(revIn); }
            s.start(t0); s.stop(t0 + d + .05);
        }
        function play(name, gap, fn) {
            if (!enabled || !ctx) return;
            const n = performance.now(); if (last[name] && n - last[name] < gap) return;
            last[name] = n; try { fn(); } catch (e) { /* audio must never break the site */ }
        }
        function startAmbient() {
            if (amb || !ctx) return;
            const g = ctx.createGain(); g.gain.value = 0; g.connect(master);
            const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = .6; f.connect(g);
            const oscs = [73.42, 110, 146.83, 220.5].map((fr, i) => {
                const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = fr; o.detune.value = (i - 1.5) * 4;
                const og = ctx.createGain(); og.gain.value = .5 / (i + 1.2); o.connect(og); og.connect(f); o.start(); return o;
            });
            const lfo = ctx.createOscillator(); lfo.frequency.value = .045; const lg = ctx.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
            g.gain.setTargetAtTime(.09, ctx.currentTime, 2.5);
            amb = { g, oscs, lfo };
        }
        function stopAmbient() {
            if (!amb) return; const a = amb; amb = null;
            a.g.gain.setTargetAtTime(0, ctx.currentTime, .3);
            setTimeout(() => { a.oscs.forEach(o => { try { o.stop(); } catch (e) { } }); try { a.lfo.stop(); } catch (e) { } try { a.g.disconnect(); } catch (e) { } }, 1500);
        }
        function setEnabled(on) {
            if (!ctx) { enabled = false; return; }
            enabled = !!on; clearTimeout(suspT);
            if (enabled) {
                ctx.resume().catch(() => { });
                master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(volume * .85, ctx.currentTime, .08);
                startAmbient();
            } else {
                master.gain.setTargetAtTime(0, ctx.currentTime, .08); stopAmbient();
                suspT = setTimeout(() => { if (!enabled && ctx.state === 'running') ctx.suspend().catch(() => { }); }, 1800);
            }
        }
        function setVolume(v) { volume = v; if (enabled && ctx) master.gain.setTargetAtTime(volume * .85, ctx.currentTime, .05); }
        document.addEventListener('visibilitychange', () => {
            if (!ctx) return;
            if (document.hidden) ctx.suspend().catch(() => { }); else if (enabled) ctx.resume().catch(() => { });
        });
        const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
        return {
            supported, init, setEnabled, setVolume,
            get ready() { return !!ctx; },
            opening() {
                play('opening', 1500, () => {
                    [392, 523.25, 659.25, 783.99].forEach((f, i) => tone({ f, t: i * .22, d: 1.1, type: 'triangle', v: .07 }));
                    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime;
                    o.type = o2.type = 'sawtooth'; o.frequency.value = 98; o2.frequency.value = 98.6; fl.type = 'lowpass'; fl.frequency.setValueAtTime(200, t0); fl.frequency.exponentialRampToValueAtTime(1300, t0 + 1.6);
                    g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.05, t0 + 1.2); g.gain.exponentialRampToValueAtTime(.0001, t0 + 2.6);
                    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(master); o.start(t0); o2.start(t0); o.stop(t0 + 2.7); o2.stop(t0 + 2.7);
                    tone({ f: 1568, t: 1.2, d: 2.4, v: .06, send: .8 }); tone({ f: 2349, t: 1.25, d: 2, v: .03, send: .8 });
                });
            },
            transition() {
                play('transition', 600, () => {
                    noise({ d: .55, v: .06, f: 300, f2: 2600, q: .8, send: .3 });
                    tone({ f: 220, f2: 330, d: .4, v: .05, type: 'triangle' });
                });
            },
            envelope() {
                play('envelope', 1200, () => {
                    noise({ d: .05, v: .09, type: 'highpass', f: 2500, send: 0 }); tone({ f: 1800, d: .06, v: .05, send: 0 });
                    noise({ t: .25, d: .35, v: .035, f: 3400, q: .7, send: .1 });
                    [1318.51, 1975.53, 2637.02].forEach((f, i) => tone({ f, t: .85 + i * .09, d: 1.8, v: .05 / (i + 1), send: .8 }));
                });
            },
            page() { play('page', 180, () => { tone({ f: 1046.5, d: .4, v: .035, send: .7 }); }); },
            pulse() {
                play('pulse', 700, () => {
                    tone({ f: 440, f2: 880, d: .8, v: .06, type: 'triangle', send: .6 }); tone({ f: 1760, t: .1, d: .9, v: .025, send: .8 });
                });
            },
            star(i) {
                play('star', 150, () => {
                    const f = PENTA[i % PENTA.length]; tone({ f, d: 1.5, v: .07, type: 'triangle', send: .7 }); tone({ f: f * 2, d: 1.1, v: .02, send: .8 });
                });
            },
            finale() {
                play('finale', 1500, () => {
                    [293.66, 440, 587.33, 739.99, 880].forEach((f, i) => tone({ f, t: i * .05, d: 5, a: .7, v: .05, send: .6 }));
                    tone({ f: 1174.66, t: .9, d: 3.4, v: .06, send: .9 }); tone({ f: 3240, t: .9, d: 2.2, v: .015, send: .9 });
                });
            },
            confirm() { play('confirm', 300, () => { tone({ f: 784, d: .5, v: .05 }); tone({ f: 1175, t: .1, d: .6, v: .04 }); }); }
        };
    })();

    function initializeAudio() {
        if (state.audioInitialized) return true;
        if (Sound.init()) { state.audioInitialized = true; return true; }
        return false;
    }
    function setSound(on) {
        state.soundEnabled = !!on && state.audioInitialized;
        Sound.setEnabled(state.soundEnabled);
        const b = $('#soundBtn');
        b.setAttribute('aria-pressed', String(state.soundEnabled));
        $('#soundTxt').textContent = state.soundEnabled ? 'Sound on' : 'Sound off';
    }
    const playTransitionSound = () => Sound.transition();
    const playEnvelopeSound = () => Sound.envelope();

    // =====================================================
    // RENDERING: static content
    // =====================================================
    const C = BIRTHDAY_CONTENT;
    const WISHES = C.teamWishes;
    const wishById = id => WISHES.find(w => w.id === id);

    function renderStaticContent() {
        document.title = `Happy Birthday, ${C.recipient} — The Celestial Dispatch`;
        $('#t1').textContent = C.openingTitle[0]; $('#t2').textContent = C.openingTitle[1];
        $('#p1title').setAttribute('aria-label', C.openingTitle.join(' '));

        const tel = $('#telemetry');
        const rows = [['head', 'Deep Space Communication Network'], ['head', 'Incoming transmission'],
        ['', 'Source:', C.teamName], ['', 'Recipient:', C.recipient], ['', 'Signal:', 'A special day detected', true]];
        rows.forEach(r => {
            const d = el('div');
            if (r[0] === 'head') { d.className = 'head'; d.textContent = r[1]; }
            else { d.appendChild(document.createTextNode(r[1] + ' ')); d.appendChild(el('span', { class: 'v' + (r[3] ? ' hot' : ''), text: r[2] })); }
            tel.appendChild(d);
        });

        // greeting
        $('#greetTitle').textContent = C.birthdayMessage[0];
        const gb = $('#greetBody');
        C.birthdayMessage.slice(1).forEach((t, i) => gb.appendChild(el('p', { class: 'g-item', text: t, style: `--d:${(.55 + i * .5).toFixed(2)}s` })));
        const n = C.birthdayMessage.length - 1;
        $('#signoff1').style.setProperty('--d', (.7 + n * .5) + 's');
        $('#nextBlock').style.setProperty('--d', (1.2 + n * .5) + 's');
        $('#teamSign1').textContent = C.teamName;

        // final note
        const note = $('#note');
        C.closingMessage.forEach((t, i, a) => {
            const cls = 'reveal' + (i === 0 ? ' salute' : i === a.length - 1 ? ' closer' : '');
            note.appendChild(el('p', { class: cls, text: t, style: `--d:${i === 0 ? 0 : .08}s` }));
        });
        note.appendChild(el('p', { class: 'reveal signoff-line', text: C.closingSignoff }));
        note.appendChild(el('p', { class: 'reveal sig', text: C.closingSignature }));

        // final text
        const fh = $('#finalHeading'); C.finalHeading.forEach(l => fh.appendChild(el('span', { text: l })));
        $('#finalLine').textContent = C.finalLine; $('#finalSig').textContent = C.finalSignature;
    }

    // =====================================================
    // ENVELOPES
    // =====================================================
    const ACCENTS = ['#e9bf78', '#80d9e8', '#a99be8', '#e9bf78', '#80d9e8', '#a99be8'];
    function constellationSVG(seed, count, vb, attrs, stroke, fill) {
        const r = seeded(seed + 3), pts = [];
        for (let i = 0; i < count; i++) pts.push([vb[0] * (.1 + .8 * r()), vb[1] * (.1 + .8 * r())]);
        const g = svgEl('svg', Object.assign({ viewBox: `0 0 ${vb[0]} ${vb[1]}`, 'aria-hidden': 'true' }, attrs));
        g.appendChild(svgEl('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke, 'stroke-width': vb[0] > 60 ? .8 : 1.1, 'stroke-linejoin': 'round' }));
        pts.forEach(p => g.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: vb[0] > 60 ? 1.6 : 2.1, fill })));
        return g;
    }
    function buildEnvelope(wish, idx, { stage = false } = {}) {
        const accent = ACCENTS[idx % ACCENTS.length];
        const root = el(stage ? 'div' : 'button', stage ? { class: 'env', 'aria-hidden': 'true' } : {
            class: 'env', type: 'button', 'data-id': wish.id,
            'aria-label': `Open sealed transmission ${pad2(idx + 1)} from ${wish.name}${wish.images.length > 1 ? ` (${wish.images.length}-page letter)` : ''}`
        });
        root.style.setProperty('--accent', accent);
        const seal = el('span', { class: 'env-seal' });
        seal.appendChild(constellationSVG(idx * 7 + 1, 3 + (idx % 4), [40, 40], {}, 'rgba(42,29,8,.85)', 'rgba(42,29,8,.95)'));
        const engr = constellationSVG(idx * 11 + 5, 6 + (idx % 3), [120, 70], { class: 'env-engrave' }, accent, accent);
        const float = el('span', { class: 'env-float', style: `--fd:${(6 + (idx * 1.3) % 3).toFixed(1)}s;--fdl:${(-idx * 1.1).toFixed(1)}s` }, [
            el('span', { class: 'env-persp' }, [
                el('span', { class: 'env-tilt' }, [
                    el('span', { class: 'env-back' }), el('span', { class: 'env-glow' }), el('span', { class: 'env-paper' }),
                    el('span', { class: 'env-pocket' }, [el('i')]),
                    el('span', { class: 'env-flap' }, [el('i')]),
                    engr, el('span', { class: 'env-serial', text: `№ ${pad2(idx + 1)}-${String.fromCharCode(65 + idx)}` }),
                    seal, el('span', { class: 'env-status' })
                ])
            ])
        ]);
        root.appendChild(float);
        return root;
    }
    function orbitPositions(n) {
        const out = [], rx = 37, ry = 38;
        for (let i = 0; i < n; i++) {
            const a = (-90 + (360 / n) * i) * Math.PI / 180;
            out.push([50 + rx * Math.cos(a), 50 + ry * Math.sin(a)]);
        }
        return out;
    }
    function renderEnvelopeArchive() {
        const arch = $('#archive'); arch.replaceChildren();
        $('#archiveEyebrow').textContent = `Archive · ${WISHES.length} sealed transmissions`;
        const others = WISHES.length - 1, pos = orbitPositions(others);
        const links = svgEl('svg', { class: 'links', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
        arch.appendChild(el('div', { class: 'orbit-path' })); arch.appendChild(el('div', { class: 'orbit-path two' }));
        arch.appendChild(links);
        WISHES.forEach((w, i) => {
            const p = i === 0 ? [50, 50] : pos[i - 1];
            const multi = w.images.length > 1;
            const item = el('div', { class: 'env-item' + (i === 0 ? ' featured' : ''), 'data-item': w.id, style: `--x:${p[0].toFixed(2)};--y:${p[1].toFixed(2)};--i:${i}` });
            const btn = buildEnvelope(w, i);
            const cap = el('div', { class: 'cap' }, [
                el('span', { class: 'c1', text: `Transmission ${pad2(i + 1)}` }),
                el('span', { class: 'c2', text: w.name }),
                el('span', { class: 'c3', text: 'Sealed message' })
            ]);
            if (multi && w.label) cap.appendChild(el('span', { class: 'c4', text: `${w.label} · ${w.images.length} pages` }));
            item.append(btn, cap); arch.appendChild(item);
            let line = null;
            if (i > 0) {
                line = svgEl('line', { x1: 50, y1: 50, x2: p[0], y2: p[1] }); links.appendChild(line);
                arch.appendChild(el('span', { class: 'node', style: `left:${50 + (p[0] - 50) * .45}%;top:${50 + (p[1] - 50) * .45}%;animation-delay:${-i * .7}s` }));
            }
            btn.addEventListener('click', () => openEnvelope(w.id));
            const lit = on => { if (line) line.classList.toggle('lit', on); };
            btn.addEventListener('pointerenter', () => lit(true)); btn.addEventListener('pointerleave', () => { lit(false); btn.style.removeProperty('--rx'); btn.style.removeProperty('--ry'); });
            btn.addEventListener('focus', () => lit(true)); btn.addEventListener('blur', () => lit(false));
            btn.addEventListener('pointermove', e => {
                if (e.pointerType !== 'mouse' || rm()) return;
                const r = btn.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
                btn.querySelector('.env-tilt').style.setProperty('--rx', (-py * 12).toFixed(1) + 'deg');
                btn.querySelector('.env-tilt').style.setProperty('--ry', (px * 14).toFixed(1) + 'deg');
            });
            btn.addEventListener('pointerleave', () => { const t = btn.querySelector('.env-tilt'); t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); });
        });
        refreshArchiveStatus();
    }
    function refreshArchiveStatus() {
        $$('.env-item').forEach(it => {
            const opened = state.openedEnvelopes.includes(it.dataset.item);
            it.classList.toggle('opened', opened);
            $('.c3', it).textContent = opened ? '● Opened' : 'Sealed message';
        });
        $('#archiveProgress').textContent = `${state.openedEnvelopes.length} of ${WISHES.length} opened`;
    }

    // =====================================================
    // LETTER VIEWER (state machine: CLOSED → OPENING → READING → CLOSING → CLOSED)
    // =====================================================
    const viewer = $('#viewer'), vStage = $('#vStage'), reader = $('#reader');
    const readerImg = $('#readerImg'), imgCache = new Map();
    let loadToken = 0;
    const activeWish = () => wishById(state.activeEnvelopeId);
    const isMulti = () => !!activeWish() && activeWish().images.length > 1;

    function loadImage(src) {
        if (imgCache.has(src)) return imgCache.get(src);
        const p = new Promise(res => {
            const im = new Image(); im.decoding = 'async';
            im.onload = () => res(true); im.onerror = () => res(false); im.src = src;
        });
        imgCache.set(src, p); return p;
    }
    function renderImageViewer() {
        const wish = activeWish(); if (!wish) return;
        const total = wish.images.length, i = state.activeImageIndex, img = wish.images[i], multi = total > 1;
        const token = ++loadToken;
        $('#readerName').textContent = wish.name;
        $('#pager').hidden = !multi;
        $('#imgCount').textContent = `${pad2(i + 1)} / ${pad2(total)}`;
        $('#prevImg').disabled = i === 0; $('#nextImg').disabled = i === total - 1;
        const last = !multi || i === total - 1, cl = $('#closeLetter');
        cl.textContent = last ? 'Close letter & return to archive' : 'Close letter';
        cl.classList.toggle('primary', last);
        readerImg.hidden = true; readerImg.classList.remove('fadein'); readerImg.removeAttribute('src');
        $('#readerMissing').hidden = true; $('#readerLoading').hidden = false;
        loadImage(img.src).then(ok => {
            if (token !== loadToken) return;
            $('#readerLoading').hidden = true;
            if (ok) {
                readerImg.alt = img.alt || `Birthday wish from ${wish.name}`; readerImg.src = img.src; readerImg.hidden = false;
                void readerImg.offsetWidth; readerImg.classList.add('fadein');
            } else {
                $('#missingName').textContent = img.src; $('#readerMissing').hidden = false;
            }
        });
        if (wish.images[i + 1]) loadImage(wish.images[i + 1].src);
    }
    function showNextImage() {
        if (state.envelopeState !== 'READING' || !isMulti()) return;
        if (state.activeImageIndex < activeWish().images.length - 1) { state.activeImageIndex++; renderImageViewer(); Sound.page(); }
    }
    function showPreviousImage() {
        if (state.envelopeState !== 'READING' || !isMulti()) return;
        if (state.activeImageIndex > 0) { state.activeImageIndex--; renderImageViewer(); Sound.page(); }
    }
    function burstParticles(from) {
        if (rm()) return;
        const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, made = [];
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * 6.28, d = 40 + Math.random() * 90;
            const p = el('span', { class: 'pt', style: `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px` });
            document.body.appendChild(p); made.push(p);
        }
        setTimeout(() => made.forEach(p => p.remove()), 1100);
    }
    const stageEnv = () => vStage.querySelector('.env');
    const OPEN_CLASSES = ['is-seal-glow', 'is-seal-gone', 'is-open', 'is-flap-back', 'is-paper-up'];

    function openEnvelope(id) {
        if (state.envelopeState !== 'CLOSED') return;
        const wish = wishById(id); if (!wish) return;
        state.envelopeState = 'OPENING'; state.activeEnvelopeId = id; state.activeImageIndex = 0;
        lastTrigger = document.querySelector(`.env[data-id="${id}"]`);
        $('#app').inert = true;
        vStage.replaceChildren(buildEnvelope(wish, WISHES.indexOf(wish), { stage: true }));
        vStage.classList.remove('away'); reader.hidden = true; reader.classList.remove('in', 'out');
        viewer.hidden = false; void viewer.offsetWidth; viewer.classList.add('show'); viewer.focus({ preventScroll: true });
        renderImageViewer();
        const env = stageEnv();
        if (rm()) { env.classList.add(...OPEN_CLASSES.filter(c => c !== 'is-seal-glow')); finishOpening(); return; }
        viewT.later(() => env.classList.add('is-seal-glow'), 450);
        viewT.later(() => { burstParticles($('.env-seal', env)); env.classList.add('is-seal-gone'); playEnvelopeSound(); }, 1050);
        viewT.later(() => env.classList.add('is-open'), 1250);
        viewT.later(() => env.classList.add('is-flap-back'), 1600);
        viewT.later(() => env.classList.add('is-paper-up'), 1900);
        viewT.later(finishOpening, 2800);
    }
    function finishOpening() {
        if (state.envelopeState !== 'OPENING') return;
        viewT.clear();
        const env = stageEnv(); if (env) { env.classList.remove('is-seal-glow'); env.classList.add('is-seal-gone', 'is-open', 'is-flap-back', 'is-paper-up'); }
        state.envelopeState = 'READING';
        if (!state.openedEnvelopes.includes(state.activeEnvelopeId)) state.openedEnvelopes.push(state.activeEnvelopeId);
        vStage.classList.add('away'); reader.hidden = false; reader.classList.add('in');
        $('#readerX').focus({ preventScroll: true });
    }
    function closeEnvelope() {
        const st = state.envelopeState; if (st === 'CLOSED' || st === 'CLOSING') return;
        viewT.clear(); state.envelopeState = 'CLOSING'; loadToken++;
        if (st === 'OPENING' || rm()) { finishClose(); return; }
        const env = stageEnv();
        reader.classList.add('out'); vStage.classList.remove('away');
        viewT.later(() => { reader.hidden = true; reader.classList.remove('in', 'out'); env.classList.remove('is-paper-up'); }, 300);
        viewT.later(() => env.classList.remove('is-open'), 600);
        viewT.later(() => env.classList.remove('is-flap-back'), 950);
        viewT.later(() => env.classList.remove('is-seal-gone'), 1250);
        viewT.later(() => viewer.classList.remove('show'), 1500);
        viewT.later(finishClose, 1950);
    }
    function finishClose() {
        viewT.clear();
        viewer.classList.remove('show'); viewer.hidden = true; reader.hidden = true; reader.classList.remove('in', 'out');
        vStage.replaceChildren(); $('#app').inert = false;
        const id = state.activeEnvelopeId;
        state.envelopeState = 'CLOSED'; state.activeEnvelopeId = null; state.activeImageIndex = 0;
        refreshArchiveStatus();
        const target = (id && document.querySelector(`.env[data-id="${id}"]`)) || lastTrigger;
        if (target) target.focus({ preventScroll: true });
        lastTrigger = null;
    }

    // =====================================================
    // NAVIGATION
    // =====================================================
    const pages = { 1: $('#page1'), 2: $('#page2'), 3: $('#page3') };
    function updateStepper() {
        $$('.step').forEach(s => {
            const n = +s.dataset.step;
            s.classList.toggle('is-current', n === state.currentPage); s.classList.toggle('is-done', n < state.currentPage);
            const b = $('button', s); if (n === state.currentPage) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        });
        $$('.conn').forEach((c, i) => c.classList.toggle('on', i + 1 < state.currentPage));
    }
    function navigateToPage(n) {
        n = Math.max(1, Math.min(3, n));
        if (n === state.currentPage || navLock || state.envelopeState !== 'CLOSED') return;
        navLock = true;
        const old = state.currentPage, from = pages[old], to = pages[n];
        if (old === 1 && !state.introCompleted) completeIntro();
        if (old === 3) cancelFinal();
        Sound.transition();
        const pulse = $('#pulse'); pulse.classList.remove('go'); void pulse.offsetWidth; if (!rm()) pulse.classList.add('go');
        const swap = () => {
            from.classList.remove('is-active', 'leaving', 'play');
            state.currentPage = n; updateStepper();
            to.classList.add('is-active', 'entering');
            if (n !== 1) { to.classList.remove('play'); void to.offsetWidth; to.classList.add('play'); }
            window.scrollTo(0, 0);
            const h = $('h1,h2', to.querySelector('header') || to); if (n !== 1 && h) h.focus({ preventScroll: true });
            if (n === 1) $('#p1title').focus({ preventScroll: true });
            if (n === 3) maybeStartFinal();
            navT.later(() => { to.classList.remove('entering'); navLock = false; }, rm() ? 0 : 900);
        };
        if (rm()) swap(); else { from.classList.add('leaving'); navT.later(swap, 380); }
    }

    // =====================================================
    // PAGE 01: intro + transmission
    // =====================================================
    const page1 = pages[1];
    function startIntro() {
        introT.clear(); state.introCompleted = false;
        page1.classList.remove('intro-done'); page1.classList.add('intro-run');
        $('#receiveBtn').disabled = true; $('#skipIntro').hidden = false; $('#beaconHint').textContent = '';
        Sky.fadeIn();
        if (rm()) { completeIntro(); return; }
        introT.later(completeIntro, 4800);
    }
    function completeIntro() {
        introT.clear();
        page1.classList.remove('intro-run'); page1.classList.add('intro-done');
        state.introCompleted = true;
        $('#receiveBtn').disabled = false; $('#skipIntro').hidden = true;
        if (!state.transmissionReceived) $('#beaconHint').textContent = 'Tap the beacon';
    }
    function receiveTransmission() {
        if (state.transmissionReceived) return;
        if (!state.introCompleted) completeIntro();
        state.transmissionReceived = true;
        if (initializeAudio()) { setSound(true); Sound.opening(); }
        const stage = $('#p1stage'); stage.classList.add('greet');
        $('#beaconHint').textContent = '';
        $('#introBlock').classList.add('out');
        beaconWave();
        const reveal = () => {
            $('#introBlock').hidden = true; $('#greetBlock').hidden = false;
            page1.classList.add('greet-run');
            window.scrollTo(0, 0);
        };
        if (rm()) reveal(); else introT.later(reveal, 600);
    }
    function beaconWave() {
        const b = $('#beacon'), w = el('span', { class: 'wave-click' }); b.appendChild(w); setTimeout(() => w.remove(), 1600);
        const r = b.getBoundingClientRect(); Sky.ripple(r.left + r.width / 2, r.top + r.height / 2);
    }
    function onBeacon() {
        if (!state.transmissionReceived) { receiveTransmission(); return; }
        beaconWave(); Sound.pulse();
    }

    // =====================================================
    // PAGE 03: constellation finale
    // =====================================================
    const TEMPLATE = [[95, 255], [140, 120], [250, 62], [392, 88], [498, 165], [462, 282], [340, 312], [200, 300]];
    const CENTER = [300, 178];
    let cStars = [], cChain = [], cSpokes = [], cCore = null;
    function buildConstellation() {
        const svg = $('#constellation'); svg.replaceChildren();
        const N = WISHES.length;
        let pts = TEMPLATE.slice(0, N);
        if (N > TEMPLATE.length) {
            pts = Array.from({ length: N }, (_, i) => { const a = (-150 + 300 * i / (N - 1)) * Math.PI / 180; return [300 + 240 * Math.cos(a), 178 + 130 * Math.sin(a)]; });
        }
        const defs = svgEl('defs', {}, [svgEl('radialGradient', { id: 'cGlow' }, [
            svgEl('stop', { offset: 0, 'stop-color': '#f6d28f', 'stop-opacity': .9 }), svgEl('stop', { offset: .4, 'stop-color': '#e9bf78', 'stop-opacity': .3 }), svgEl('stop', { offset: 1, 'stop-color': '#e9bf78', 'stop-opacity': 0 })])]);
        svg.appendChild(defs);
        const dust = svgEl('g', { class: 'cdust' }); const r = seeded(42);
        for (let i = 0; i < 42; i++) { const c = svgEl('circle', { cx: r() * 600, cy: r() * 360, r: .5 + r() * 1.1 }); c.style.transitionDelay = (r() * 2).toFixed(2) + 's'; dust.appendChild(c); }
        svg.appendChild(dust);
        const link = (a, b) => { const p = svgEl('path', { class: 'clink', pathLength: 1, d: `M${a[0]} ${a[1]}L${b[0]} ${b[1]}` }); svg.appendChild(p); return p; };
        cChain = []; cSpokes = [];
        for (let i = 0; i < pts.length - 1; i++) cChain.push(link(pts[i], pts[i + 1]));
        [...new Set([0, Math.floor(pts.length / 2), pts.length - 1])].forEach(i => cSpokes.push(link(CENTER, pts[i])));
        const star = (p, big, label) => {
            const g = svgEl('g', { class: 'cstar' + (big ? ' big' : '') }, [
                svgEl('circle', { class: 'halo', cx: p[0], cy: p[1], r: big ? 46 : 22 }), svgEl('circle', { class: 'core', cx: p[0], cy: p[1], r: big ? 6.5 : 3.6 })]);
            if (label) g.appendChild(svgEl('text', { x: p[0] + 9, y: p[1] - 9, 'aria-hidden': 'true' }, [document.createTextNode(label)]));
            svg.appendChild(g); return g;
        };
        cStars = pts.map((p, i) => star(p, false, pad2(i + 1)));
        cCore = star(CENTER, true);
    }
    function resetConstellation() {
        $('#constellation').classList.remove('dust-on');
        [...cStars, cCore, ...cChain, ...cSpokes].forEach(e => e.classList.remove('on'));
        $('#finaleText').classList.remove('show');
    }
    function showConstellationInstant() {
        $('#constellation').classList.add('dust-on');
        [...cStars, cCore, ...cChain, ...cSpokes].forEach(e => e.classList.add('on'));
        $('#finaleText').classList.add('show');
        state.finalSequencePlayed = true; state.finalRunning = false;
    }
    function cancelFinal() { finalT.clear(); state.finalRunning = false; }
    function playFinalSequence(opts = {}) {
        if (state.finalRunning && !opts.force) return;
        cancelFinal(); resetConstellation();
        if (rm()) { showConstellationInstant(); return; }
        state.finalRunning = true; state.finalSequencePlayed = false;
        const N = cStars.length, step = 600;
        finalT.later(() => $('#constellation').classList.add('dust-on'), 50);
        cStars.forEach((s, i) => {
            finalT.later(() => { s.classList.add('on'); Sound.star(i); }, 700 + step * i);
            if (i > 0) finalT.later(() => cChain[i - 1].classList.add('on'), 700 + step * i + 250);
        });
        const T = 700 + step * N + 400;
        cSpokes.forEach((l, i) => finalT.later(() => l.classList.add('on'), T + i * 380));
        const Tc = T + cSpokes.length * 380 + 200;
        finalT.later(() => { cCore.classList.add('on'); Sound.finale(); }, Tc);
        finalT.later(() => { $('#finaleText').classList.add('show'); state.finalSequencePlayed = true; state.finalRunning = false; }, Tc + 1400);
    }
    function maybeStartFinal() {
        if (state.currentPage !== 3) return;
        const r = $('#constellation').getBoundingClientRect();
        if (r.top < innerHeight * .75 && r.bottom > 0) startFinalOnce();
    }
    function startFinalOnce() {
        if (state.finalSequencePlayed) { showConstellationInstant(); return; }
        playFinalSequence();
    }

    // =====================================================
    // RESET / REPLAY
    // =====================================================
    function resetExperience() {
        if (navLock || state.envelopeState !== 'CLOSED') return;
        cancelFinal(); resetConstellation();
        state.finalSequencePlayed = false; state.transmissionReceived = false; state.openedEnvelopes = [];
        page1.classList.remove('greet-run'); $('#p1stage').classList.remove('greet');
        $('#greetBlock').hidden = true; $('#introBlock').hidden = false; $('#introBlock').classList.remove('out');
        $$('.reveal').forEach(n => n.classList.remove('in'));
        refreshArchiveStatus();
        startIntro();
        navigateToPage(1);
    }

    // =====================================================
    // EVENTS
    // =====================================================
    function bindEvents() {
        $$('[data-goto]').forEach(b => b.addEventListener('click', () => navigateToPage(+b.dataset.goto)));
        $('#receiveBtn').addEventListener('click', receiveTransmission);
        $('#skipIntro').addEventListener('click', completeIntro);
        $('#beacon').addEventListener('click', onBeacon);
        $('#toCrew').addEventListener('click', () => navigateToPage(2));
        $('#backTo1').addEventListener('click', () => navigateToPage(1));
        $('#toFinal').addEventListener('click', () => navigateToPage(3));
        $('#revisit').addEventListener('click', resetExperience);
        $('#again').addEventListener('click', () => navigateToPage(2));
        $('#replayConst').addEventListener('click', () => { state.finalSequencePlayed = false; playFinalSequence({ force: true }); });

        $('#prevImg').addEventListener('click', showPreviousImage);
        $('#nextImg').addEventListener('click', showNextImage);
        $('#closeLetter').addEventListener('click', closeEnvelope);
        $('#readerX').addEventListener('click', closeEnvelope);
        vStage.addEventListener('click', () => { if (state.envelopeState === 'OPENING') finishOpening(); });

        document.addEventListener('keydown', e => {
            const st = state.envelopeState; if (st === 'CLOSED') return;
            if (e.key === 'Escape') { e.preventDefault(); closeEnvelope(); }
            else if (st === 'OPENING' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); finishOpening(); }
            else if (st === 'READING' && isMulti()) {
                if (e.key === 'ArrowRight') { e.preventDefault(); showNextImage(); }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); showPreviousImage(); }
            }
        });
        viewer.addEventListener('keydown', e => {
            if (e.key !== 'Tab') return;
            const f = $$('button:not([disabled])', viewer).filter(b => !b.closest('[hidden]') && b.offsetParent !== null);
            if (!f.length) { e.preventDefault(); viewer.focus(); return; }
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === viewer)) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });

        // sound controls
        const sb = $('#soundBtn');
        if (!Sound.supported) { sb.disabled = true; sb.title = 'Audio is not available in this browser'; $('#vol').hidden = true; $('#soundTxt').textContent = 'No audio'; }
        sb.addEventListener('click', () => {
            if (!Sound.supported) return;
            if (!initializeAudio()) return;
            const next = !state.soundEnabled; setSound(next); if (next) Sound.confirm();
        });
        $('#vol').addEventListener('input', e => Sound.setVolume(parseFloat(e.target.value)));
        if (matchMedia('(max-width:900px)').matches) $('#vol').hidden = true;
        matchMedia('(max-width:900px)').addEventListener('change', e => { if (Sound.supported) $('#vol').hidden = e.matches; });

        // reveal + finale observers
        if ('IntersectionObserver' in window) {
            document.documentElement.classList.add('js-reveal');
            const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .2 });
            $$('.reveal').forEach(n => io.observe(n));
            const fo = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && state.currentPage === 3) startFinalOnce(); }), { threshold: .55 });
            fo.observe($('#constellation'));
        }
    }

    // =====================================================
    // INIT
    // =====================================================
    renderStaticContent();
    renderEnvelopeArchive();
    buildConstellation();
    bindEvents();
    updateStepper();
    startIntro();
})();
