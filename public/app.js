(() => {
    /* ═════════════════════════ Text ═════════════════════════ */
    const T = {
        en: {
            finish: 'Finish', welcome: 'Welcome',
            loginLead: 'Sign in to challenge the player next to you. Every match counts on the leaderboard.',
            name: 'Full name', empId: 'Employee ID', start: 'Sign in', namePh: 'e.g. Sara Al-Qahtani', idPh: 'e.g. 123456',
            errName: 'Please enter your full name.', errId: 'Please enter your employee ID.', errNet: "Can't reach the game server. Check the Wi-Fi and try again.",
            welcomeBack: 'Welcome back — your previous scores are saved.',
            you: 'You', vs: 'VS', points: 'pts', rank: 'Rank', record: (w, l, d) => `${w}W · ${l}L · ${d}D`,
            waitingOpp: 'Waiting for an opponent', waitingOppLead: 'Ask a colleague to sign in on the other iPad.',
            pickGame: 'Pick a game', pickLead: 'Choose any game to challenge your opponent. Faster correct answers earn more points!', pickLeadSolo: 'No opponent yet — you can play solo.',
            questions: 'questions', words: 'words', playSolo: 'Play solo', challenge: 'Challenge',
            youChallenged: (o, g) => `Waiting for ${o} to accept ${g}…`, cancel: 'Cancel',
            challengedYou: (o, g) => `${o} challenges you to ${g}!`, accept: 'Accept', decline: 'Pick another',
            oppSolo: (o) => `${o} is playing a solo game. You can challenge them when they finish.`,
            soloOff: 'Solo play is turned off — wait for an opponent.',
            getReady: 'Get ready!', question: 'Question', timeLeft: 's',
            speedHint: "Answer fast — the quicker you're right, the more points you get!",
            ptsNow: 'pts', answeredIn: (s) => `answered in ${s}s`,
            lockedIn: 'Locked in! Waiting for your opponent…', oppAnswered: 'answered', oppThinking: 'thinking…',
            correct: 'Correct!', wrong: 'Not quite.', timeUp: "Time's up!", answerIs: 'Correct answer',
            oppPicked: 'picked', nextIn: (s) => `Next question in ${s}s`,
            youWin: 'You win!', youLose: 'You lost this one', draw: "It's a draw!", soloDone: 'Game complete!',
            matchPts: 'Match points', bonus: 'Bonus', totalNow: 'Your total',
            playAnother: 'Play another game', aborted: 'The match was stopped.',
            puzzleLead: 'Tap the letters in order to spell each word. First to finish wins!',
            mistakes: 'Mistakes', hint: 'Hint', wordsDone: 'Words', youFinished: 'Finished! Waiting for your opponent…',
            evalTitle: 'Rate your experience', evalLead: 'One last step — tell us what you thought.',
            comment: 'Comments or suggestions (optional)', submit: 'Submit & finish', errRate: 'Please rate every question.',
            rateScale: ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'],
            thanks: 'Thank you, ', thanksLead: 'Your results and feedback have been recorded.',
            totalPts: 'Total points', lbRank: 'Leaderboard rank', of: 'of',
            nextPlayer: 'Next player', autoReset: (s) => `Returning to the sign-in screen in ${s}s`,
            setupTitle: 'Device setup', setupLead: 'Choose which screen and iPad this is. Staff only.',
            screenN: (n) => `Screen ${n}`, ipadN: (n) => `iPad ${n}`, save: 'Save',
            deviceLabel: (s, d) => `Screen ${s} · iPad ${d}`,
            confirmFinish: 'Finish now?', confirmLead: 'You will rate your experience and sign out.',
            confirmMatch: 'Your current match will be cancelled.', yesFinish: 'Yes, finish', keepPlaying: 'Keep playing', skipEval: 'Skip rating',
            kicked: 'You were signed out by the organisers.', offline: 'Reconnecting to the game server…',
            keys: ['A', 'B', 'C', 'D', 'E', 'F']
        },
        ar: {
            finish: 'إنهاء', welcome: 'مرحباً بك',
            loginLead: 'سجّل دخولك لتتحدى اللاعب بجانبك. كل مباراة تُحتسب في لوحة المتصدرين.',
            name: 'الاسم الكامل', empId: 'الرقم الوظيفي', start: 'تسجيل الدخول', namePh: 'مثال: سارة القحطاني', idPh: 'مثال: 123456',
            errName: 'يرجى إدخال اسمك الكامل.', errId: 'يرجى إدخال رقمك الوظيفي.', errNet: 'تعذّر الاتصال بخادم اللعبة. تحقق من الواي فاي وحاول مجدداً.',
            welcomeBack: 'مرحباً بعودتك — نتائجك السابقة محفوظة.',
            you: 'أنت', vs: 'ضد', points: 'نقطة', rank: 'الترتيب', record: (w, l, d) => `${w} فوز · ${l} خسارة · ${d} تعادل`,
            waitingOpp: 'بانتظار منافس', waitingOppLead: 'اطلب من زميلك تسجيل الدخول على الآيباد الآخر.',
            pickGame: 'اختر لعبة', pickLead: 'اختر أي لعبة لتتحدى منافسك. الإجابة الصحيحة الأسرع تمنحك نقاطاً أكثر!', pickLeadSolo: 'لا يوجد منافس بعد — يمكنك اللعب منفرداً.',
            questions: 'أسئلة', words: 'كلمات', playSolo: 'العب منفرداً', challenge: 'تحدَّ',
            youChallenged: (o, g) => `بانتظار موافقة ${o} على ${g}…`, cancel: 'إلغاء',
            challengedYou: (o, g) => `${o} يتحداك في ${g}!`, accept: 'قبول', decline: 'اختر لعبة أخرى',
            oppSolo: (o) => `${o} يلعب منفرداً. يمكنك تحديه عندما ينتهي.`,
            soloOff: 'اللعب المنفرد غير متاح — انتظر منافساً.',
            getReady: 'استعد!', question: 'السؤال', timeLeft: 'ث',
            speedHint: 'أجب بسرعة — كلما كانت إجابتك الصحيحة أسرع، زادت نقاطك!',
            ptsNow: 'نقطة', answeredIn: (s) => `أجبت خلال ${s} ث`,
            lockedIn: 'تم تسجيل إجابتك! بانتظار منافسك…', oppAnswered: 'أجاب', oppThinking: 'يفكر…',
            correct: 'إجابة صحيحة!', wrong: 'ليست الإجابة الصحيحة.', timeUp: 'انتهى الوقت!', answerIs: 'الإجابة الصحيحة',
            oppPicked: 'اختار', nextIn: (s) => `السؤال التالي خلال ${s} ث`,
            youWin: 'لقد فزت!', youLose: 'خسرت هذه الجولة', draw: 'تعادل!', soloDone: 'اكتملت اللعبة!',
            matchPts: 'نقاط المباراة', bonus: 'مكافأة', totalNow: 'مجموعك',
            playAnother: 'العب لعبة أخرى', aborted: 'تم إيقاف المباراة.',
            puzzleLead: 'اضغط على الحروف بالترتيب لتكوين كل كلمة. الأسرع يفوز!',
            mistakes: 'الأخطاء', hint: 'تلميح', wordsDone: 'الكلمات', youFinished: 'أنهيت! بانتظار منافسك…',
            evalTitle: 'قيّم تجربتك', evalLead: 'خطوة أخيرة — شاركنا رأيك.',
            comment: 'ملاحظات أو اقتراحات (اختياري)', submit: 'إرسال وإنهاء', errRate: 'يرجى تقييم جميع الأسئلة.',
            rateScale: ['ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'],
            thanks: 'شكراً لك، ', thanksLead: 'تم تسجيل نتائجك وتقييمك.',
            totalPts: 'مجموع النقاط', lbRank: 'الترتيب', of: 'من',
            nextPlayer: 'اللاعب التالي', autoReset: (s) => `العودة إلى شاشة الدخول خلال ${s} ثانية`,
            setupTitle: 'إعداد الجهاز', setupLead: 'اختر الشاشة والآيباد لهذا الجهاز. للمنظمين فقط.',
            screenN: (n) => `الشاشة ${n}`, ipadN: (n) => `آيباد ${n}`, save: 'حفظ',
            deviceLabel: (s, d) => `الشاشة ${s} · آيباد ${d}`,
            confirmFinish: 'هل تريد الإنهاء؟', confirmLead: 'ستقيّم تجربتك ثم يتم تسجيل خروجك.',
            confirmMatch: 'سيتم إلغاء مباراتك الحالية.', yesFinish: 'نعم، إنهاء', keepPlaying: 'متابعة اللعب', skipEval: 'تخطي التقييم',
            kicked: 'تم تسجيل خروجك من قبل المنظمين.', offline: 'جارٍ إعادة الاتصال بالخادم…',
            keys: ['أ', 'ب', 'ج', 'د', 'هـ', 'و']
        }
    };

    const ICONS = {
        megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
        scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21h10M5 7h14"/><path d="m5 7-3 7a3.5 3.5 0 0 0 6 0z"/><path d="m19 7-3 7a3.5 3.5 0 0 0 6 0z"/></svg>',
        puzzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h4v2.5a1.5 1.5 0 1 0 3 0V3h3a2 2 0 0 1 2 2v3h-2.5a1.5 1.5 0 1 0 0 3H21v3"/><path d="M21 14v5a2 2 0 0 1-2 2h-5v-2.5a1.5 1.5 0 1 0-3 0V21H5a2 2 0 0 1-2-2v-5h2.5a1.5 1.5 0 1 0 0-3H3V5a2 2 0 0 1 2-2h4"/></svg>',
        star4: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6L20 11l-5.4 2.4L12 19l-2.6-5.6L4 11l5.4-2.4z"/></svg>',
        arrow: '<svg class="arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
        check: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
        cross: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
        badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.7-1.4 1.8-2 3-2s2.3.6 3 2M14.5 10h4M14.5 13.5h3"/></svg>',
        gear: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
        star: '<svg viewBox="0 0 24 24" width="30" height="30"><path fill="currentColor" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>',
        trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
        swords: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/></svg>'
    };

    /* ═════════════════════════ State ═════════════════════════ */
    const $ = (id) => document.getElementById(id);
    const app = $('app');
    const topbar = document.querySelector('.topbar');

    const store = {
        get(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch (e) { return f; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
        del(k) { try { localStorage.removeItem(k); } catch (e) {} }
    };

    const params = new URLSearchParams(location.search);
    let device = store.get('roadshow-device', null);
    if (params.get('station') && params.get('device')) {
        device = { station: params.get('station'), device: params.get('device').toUpperCase() };
        store.set('roadshow-device', device);
    }
    const SLOT = () => device && device.device;
    const OTHER = () => (SLOT() === 'A' ? 'B' : 'A');

    const LKEY = () => `roadshow-lang-${device ? device.station + device.device : ''}`;
    let lang = store.get(LKEY(), null);
    const PKEY = () => `roadshow-player-${device ? device.station + device.device : ''}`;
    let player = device ? store.get(PKEY(), null) : null; // { empId, name }
    let content = null;
    let snap = null;
    let offset = 0;
    let online = false;
    let view = device ? (player ? 'lobby' : 'login') : 'setup';
    let lastKey = '';
    let loginError = '';
    let evalState = { ratings: {}, comment: '', error: '' };
    let finalInfo = null;
    let dismissed = store.get('roadshow-dismissed', {});
    let picks = {};          // qIndex -> option picked locally (so it shows instantly)
    let picksFor = null;     // match id the picks belong to
    let pickPts = {};        // qIndex -> points shown when the player answered
    let rejoining = Boolean(player && device);
    let puzzle = null;       // local puzzle progress for the running match
    let thanksTimer = null;

    const t = (k) => T[lang || 'en'][k];
    const TT = () => T[lang || 'en'];
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const L = (obj, key) => (obj && obj[lang] && obj[lang][key]) || (obj && obj.en && obj.en[key]) || '';
    const first = (n) => String(n || '').trim().split(/\s+/)[0];
    const serverNow = () => Date.now() + offset;
    const secsLeft = (deadline) => Math.max(0, Math.ceil((deadline - serverNow()) / 1000));
    const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    };
    const gameById = (id) => content && content.games.find(g => g.id === id);
    const unitById = (id) => content && content.units.find(u => u.id === id);
    const gameName = (id) => {
        const g = gameById(id);
        if (!g) return '';
        const u = unitById(g.unit);
        const ut = u ? L(u, 'title') : '';
        const gt = L(g, 'title');
        return !ut || ut === gt ? gt : `${ut} · ${gt}`;
    };

    /* ═════════════════════════ Server ═════════════════════════ */
    async function post(path, body) {
        const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...device, ...body }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { const e = new Error(data.error || `HTTP ${res.status}`); e.status = res.status; throw e; }
        return data;
    }

    let loadError = '';
    async function loadContent() {
        const res = await fetch('/api/content', { cache: 'no-store' });
        const data = await res.json().catch(() => ({ error: `The game server returned an error (HTTP ${res.status}).` }));
        if (!res.ok || !data.games) {
            loadError = data.error || `The game server returned an error (HTTP ${res.status}).`;
            throw new Error(loadError);
        }
        loadError = '';
        content = data;
    }

    // Ask the server for the latest state about once a second (and right after every tap).
    let pollTimer = null, polling = false, pollCount = 0, fails = 0;
    async function poll() {
        clearTimeout(pollTimer);
        if (polling) return;
        polling = true;
        try {
            const beat = pollCount++ % 10 === 0 ? '&beat=1' : '';
            const res = await fetch(`/api/state?station=${encodeURIComponent(device.station)}&device=${encodeURIComponent(device.device)}${beat}`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            fails = 0;
            online = true;
            $('offline').hidden = true;
            offset = data.serverNow - Date.now();
            if (!content || content.version !== data.contentVersion) { await loadContent(); lastKey = ''; }
            if (!lang) { lang = data.settings.defaultLang || 'en'; applyLang(); }
            snap = data;
            onSnapshot();
        } catch (e) {
            if (++fails >= 3) { online = false; $('offline').hidden = false; }
        } finally {
            polling = false;
            pollTimer = setTimeout(poll, (snap && snap.settings.pollMs) || 1000);
        }
    }
    const pollNow = () => setTimeout(poll, 30);
    function connect() { poll(); }

    /* ═════════════════════════ Derived state ═════════════════════════ */
    const st = () => (snap && device ? snap.stations[device.station] : null);
    const me = () => st() && st().devices[SLOT()];
    const opp = () => st() && st().devices[OTHER()];
    const settings = () => (snap ? snap.settings : {});

    function myMatch() {
        const s = st();
        const m = s && s.match;
        if (!m || !m.players.some(p => p.slot === SLOT() && player && p.empId === player.empId)) return null;
        if (m.phase === 'done' && dismissed[m.id]) return null;
        return m;
    }

    function onSnapshot() {
        // Signed out by the admin (or someone else took this iPad)?
        const cur = myMatch();
        if (cur && cur.id !== picksFor) { picks = {}; pickPts = {}; picksFor = cur.id; }
        if (player && !rejoining && ['lobby', 'match', 'confirm'].includes(view)) {
            const d = me();
            if (!d || d.empId !== player.empId) {
                player = null;
                store.del(PKEY());
                view = 'login';
                loginError = t('kicked');
                lastKey = '';
            }
        }
        if (player && ['lobby', 'match'].includes(view)) view = myMatch() ? 'match' : 'lobby';

        $('langBtn').hidden = !settings().showArabic;
        if (!settings().showArabic && lang === 'ar') { lang = 'en'; applyLang(); }
        render();
    }

    /* ═════════════════════════ Chrome ═════════════════════════ */
    function applyLang() {
        document.documentElement.lang = lang || 'en';
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.querySelectorAll('#langBtn [data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === (lang || 'en')));
        document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
        $('offlineText').textContent = t('offline');
    }

    function updateChrome() {
        const inSession = Boolean(player) && ['lobby', 'match'].includes(view);
        topbar.classList.toggle('on-home', !inSession);
        $('finishBtn').hidden = !inSession;
        const d = me();
        $('playerChip').hidden = !inSession || !d;
        if (d) {
            $('playerInitial').textContent = (d.name.trim()[0] || '?').toUpperCase();
            $('playerName').textContent = first(d.name);
            $('playerPoints').textContent = `${d.total || 0} ${t('points')}`;
        }
    }

    let toastTimer = null;
    function toast(msg) {
        const el = $('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
    }

    function go(v) {
        view = v;
        lastKey = '';
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Only redraw when something visible changed, so forms and taps aren't disturbed.
    function render() {
        updateChrome();
        if (!content && !['setup'].includes(view)) {
            app.innerHTML = loadError
                ? `<div class="auth panel"><img src="assets/logo.webp" alt="SAB" class="auth-logo"><h1 class="auth-title">Can't load the games</h1><p class="auth-lead">${esc(loadError)}</p><p class="countdown">Retrying automatically…</p></div>`
                : '<div class="loading"><span></span></div>';
            return;
        }
        const s = st();
        let key = `${view}|${lang}|${content && content.version}`;
        if (view === 'lobby') key += JSON.stringify([s && s.devices, s && s.proposal, s && s.match && [s.match.id, s.match.phase], settings().allowSolo]);
        if (view === 'match') {
            const m = myMatch();
            key += JSON.stringify(m && [m.id, m.phase, m.qIndex, m.answered, m.scores, m.puzzle, m.result && m.result.winner, picks[m.qIndex], s.devices]);
            if (m && m.type === 'puzzle' && puzzle) key += JSON.stringify([puzzle.w, puzzle.filled, puzzle.bank.map(b => b.used), puzzle.mistakes, puzzle.done]);
        }
        if (key === lastKey) return;
        lastKey = key;

        clearInterval(thanksTimer);
        const screens = { setup: renderSetup, login: renderLogin, lobby: renderLobby, match: renderMatch, confirm: renderConfirm, evaluate: renderEvaluate, thanks: renderThanks };
        app.innerHTML = `<section class="screen ${view}">${screens[view]()}</section>`;
        if (view === 'thanks') startThanksCountdown();
        if (view === 'login') { const f = $('f-name'); if (f && !f.value) setTimeout(() => f.focus(), 250); }
        tick();
    }

    // Smooth timers without full redraws.
    // Points a correct answer would earn right now (mirrors the server's formula).
    function ptsAt(phaseStart) {
        const s = settings();
        const limit = (s.questionSeconds || 20) * 1000;
        const frac = Math.max(0, 1 - (serverNow() - phaseStart) / limit);
        return (s.pointsPerCorrect || 0) + Math.round((s.speedBonus || 0) * frac);
    }

    function tick() {
        app.querySelectorAll('[data-pts-start]').forEach(el => {
            el.querySelector('b').textContent = ptsAt(Number(el.dataset.ptsStart));
        });
        app.querySelectorAll('[data-deadline]').forEach(el => {
            const dl = Number(el.dataset.deadline);
            const total = Number(el.dataset.total) || 1;
            const left = Math.max(0, dl - serverNow());
            if (el.classList.contains('timer-bar')) el.firstElementChild.style.width = `${(left / total) * 100}%`;
            else if (el.dataset.fmt === 'next') el.textContent = TT().nextIn(Math.ceil(left / 1000));
            else if (el.dataset.fmt === 'mmss') { const s = Math.ceil(left / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
            else el.textContent = Math.ceil(left / 1000);
            if (el.dataset.urgent !== undefined) el.classList.toggle('urgent', left < 5000);
        });
    }
    setInterval(tick, 200);

    /* ═════════════════════════ Setup & login ═════════════════════════ */
    function renderSetup() {
        const cur = device || { station: '1', device: 'A' };
        const n = (snap && snap.settings.stations) || 2;
        const stationsList = Array.from({ length: n }, (_, i) => String(i + 1));
        const pick = (group, vals, label, sel) => vals.map(v => `
            <button type="button" class="seg ${String(sel) === String(v) ? 'on' : ''}" data-setup="${group}" data-val="${v}">${esc(label(v))}</button>`).join('');
        return `
        <div class="auth panel">
            <img src="assets/logo.webp" alt="SAB" class="auth-logo">
            <h1 class="auth-title">${esc(t('setupTitle'))}</h1>
            <p class="auth-lead">${esc(t('setupLead'))}</p>
            <div class="seg-group" id="seg-station">${pick('station', stationsList, TT().screenN, cur.station)}</div>
            <div class="seg-group" id="seg-device">${pick('device', ['A', 'B'], TT().ipadN, cur.device)}</div>
            <button class="btn wide" type="button" data-setup-save>${esc(t('save'))} ${ICONS.arrow}</button>
        </div>`;
    }

    function renderLogin() {
        const tx = content.text;
        return `
        <form class="auth panel" id="loginForm" autocomplete="off" novalidate>
            <img src="assets/logo.webp" alt="SAB" class="auth-logo">
            <span class="eyebrow">${esc(L(tx ? { en: tx.en, ar: tx.ar } : null, 'eventName'))}</span>
            <h1 class="auth-title">${esc(t('welcome'))}</h1>
            <p class="auth-lead">${esc(t('loginLead'))}</p>
            <label class="field">
                <span class="field-label">${esc(t('name'))}</span>
                <span class="field-box"><span class="field-icon">${ICONS.user}</span>
                    <input id="f-name" name="name" type="text" maxlength="60" autocapitalize="words" spellcheck="false" placeholder="${esc(t('namePh'))}" required></span>
            </label>
            <label class="field">
                <span class="field-label">${esc(t('empId'))}</span>
                <span class="field-box"><span class="field-icon">${ICONS.badge}</span>
                    <input id="f-id" name="empId" type="text" inputmode="numeric" maxlength="30" spellcheck="false" placeholder="${esc(t('idPh'))}" dir="ltr" required></span>
            </label>
            <p class="form-error" id="loginError" ${loginError ? '' : 'hidden'}>${esc(loginError)}</p>
            <button class="btn wide" type="submit" id="loginBtn">${esc(t('start'))} ${ICONS.arrow}</button>
            <div class="device-tag">
                <span>${esc(TT().deviceLabel(device.station, device.device))}</span>
                <button type="button" class="icon-link" data-open-setup aria-label="${esc(t('setupTitle'))}">${ICONS.gear}</button>
            </div>
        </form>`;
    }

    async function doLogin(form) {
        const name = form.name.value.replace(/\s+/g, ' ').trim();
        const empId = form.empId.value.trim();
        const err = $('loginError');
        const show = (m) => { loginError = m; err.textContent = m; err.hidden = false; };
        if (name.length < 2) return show(t('errName'));
        if (!empId) return show(t('errId'));
        $('loginBtn').disabled = true;
        try {
            const data = await post('/api/login', { name, empId });
            player = { empId: data.player.empId, name: data.player.name };
            store.set(PKEY(), player);
            loginError = '';
            evalState = { ratings: {}, comment: '', error: '' };
            go('lobby');
            if (data.returning && data.player.played) toast(t('welcomeBack'));
        } catch (e) {
            show(e.status ? e.message : t('errNet'));
            $('loginBtn').disabled = false;
        }
    }

    /* ═════════════════════════ Lobby ═════════════════════════ */
    function playerCard(d, mine) {
        if (!d) {
            return `
            <div class="vs-card empty">
                <span class="vs-avatar ghost">?</span>
                <div><b>${esc(t('waitingOpp'))}</b><small>${esc(t('waitingOppLead'))}</small></div>
            </div>`;
        }
        return `
        <div class="vs-card ${mine ? 'mine' : ''}">
            <span class="vs-avatar">${esc((d.name.trim()[0] || '?').toUpperCase())}</span>
            <div>
                <b>${esc(d.name)}${mine ? ` <em>(${esc(t('you'))})</em>` : ''}</b>
                <small>${d.total || 0} ${esc(t('points'))}${d.rank ? ` · ${esc(t('rank'))} #${d.rank}` : ''} · ${esc(TT().record(d.wins || 0, d.losses || 0, d.draws || 0))}</small>
            </div>
        </div>`;
    }

    function renderLobby() {
        const s = st();
        const d = me(), o = opp();
        const prop = s.proposal;
        const m = s.match;
        const oppBusy = m && m.phase !== 'done' && !m.players.some(p => p.slot === SLOT());
        let banner = '';
        if (oppBusy && o) banner = `<div class="banner">${ICONS.puzzle}<span>${esc(TT().oppSolo(first(o.name)))}</span></div>`;
        else if (prop && prop.by === SLOT()) {
            banner = `<div class="banner live">${ICONS.swords}<span>${esc(TT().youChallenged(first(o ? o.name : ''), gameName(prop.game)))}</span>
                <button class="btn ghost small" type="button" data-cancel-prop>${esc(t('cancel'))}</button></div>`;
        } else if (prop && prop.by === OTHER()) {
            banner = `<div class="banner challenge">${ICONS.swords}<span>${esc(TT().challengedYou(first(o ? o.name : ''), gameName(prop.game)))}</span>
                <div class="banner-actions">
                    <button class="btn small" type="button" data-accept>${esc(t('accept'))} ${ICONS.arrow}</button>
                    <button class="btn ghost small" type="button" data-decline>${esc(t('decline'))}</button>
                </div></div>`;
        }

        const canSolo = settings().allowSolo;
        const blocked = oppBusy || (!o && !canSolo);
        const tx = content.text;
        const lead = !o ? (canSolo ? t('pickLeadSolo') : t('soloOff')) : t('pickLead');

        const units = content.units.filter(u => u.enabled !== false).map(u => {
            const games = content.games.filter(g => g.unit === u.id && g.enabled !== false && g.count > 0);
            if (!games.length) return '';
            const cards = games.map(g => {
                const best = d && d.byGame && d.byGame[g.id];
                const selected = prop && prop.game === g.id;
                return `
                <button class="game-card ${selected ? 'selected' : ''}" type="button" data-game="${g.id}" ${blocked ? 'disabled' : ''}>
                    <span class="gc-title">${esc(L(g, 'title'))}</span>
                    <span class="gc-meta">${g.type === 'puzzle' ? `${(content.puzzle[lang] || content.puzzle.en).length} ${esc(t('words'))}` : `${g.count} ${esc(t('questions'))}`}${best !== undefined ? ` · ${ICONS.check}${best}` : ''}</span>
                    <span class="gc-cta">${esc(o ? t('challenge') : t('playSolo'))} ${ICONS.arrow}</span>
                </button>`;
            }).join('');
            return `
            <div class="unit-block panel">
                <div class="unit-head"><span class="card-icon">${ICONS[u.icon] || ICONS.star4}</span><div><h2>${esc(L(u, 'title'))}</h2><p>${esc(L(u, 'sub'))}</p></div></div>
                <div class="game-row">${cards}</div>
            </div>`;
        }).join('');

        return `
        <div class="versus panel">
            ${playerCard(d, true)}
            <span class="vs-badge">${esc(t('vs'))}</span>
            ${playerCard(o, false)}
        </div>
        ${banner}
        <div class="section-head"><div><div class="kicker">${esc(L({ en: tx.en, ar: tx.ar }, 'eventName'))}</div><h2>${esc(t('pickGame'))}</h2><p class="section-lead">${esc(lead)}</p></div></div>
        <div class="units">${units}</div>`;
    }

    /* ═════════════════════════ Match ═════════════════════════ */
    function scoreboard(m) {
        const s = st();
        const side = (p) => {
            const mine = p.slot === SLOT();
            const d = s.devices[p.slot];
            const answered = m.phase === 'question' && m.answered[p.slot];
            const ps = m.puzzle && m.puzzle[p.slot];
            const status = m.phase === 'question' ? (answered ? `${ICONS.check} ${t('oppAnswered')}` : t('oppThinking'))
                : ps ? `${ps.done ? ICONS.check : ''} ${ps.w} ${t('words')}` : '';
            return `
            <div class="sb-side ${mine ? 'mine' : ''} ${answered ? 'answered' : ''}">
                <span class="vs-avatar">${esc((p.name.trim()[0] || '?').toUpperCase())}</span>
                <div class="sb-name"><b>${esc(first(d ? d.name : p.name))}${mine ? ` <em>(${esc(t('you'))})</em>` : ''}</b><small>${status}</small></div>
                <span class="sb-score">${m.type === 'puzzle' ? (ps && ps.done ? ps.points : '–') : m.scores[p.slot]}</span>
            </div>`;
        };
        return `<div class="scoreboard panel ${m.players.length < 2 ? 'solo' : ''}">${m.players.map(side).join(`<span class="vs-badge">${esc(t('vs'))}</span>`)}</div>`;
    }

    function renderMatch() {
        const m = myMatch();
        if (!m) return renderLobby();
        const g = gameById(m.game);
        const title = gameName(m.game);

        if (m.phase === 'countdown') {
            return `${scoreboard(m)}
            <div class="countdown-card panel">
                <span class="kicker">${esc(title)}</span>
                <h1>${esc(t('getReady'))}</h1>
                <div class="big-count" data-deadline="${m.deadline}">${secsLeft(m.deadline)}</div>
                ${m.type === 'puzzle' ? '' : `<p class="speed-hint">⚡ ${esc(t('speedHint'))}</p>`}
            </div>`;
        }
        if (m.phase === 'done') return renderResult(m);
        if (m.type === 'puzzle') return renderPuzzle(m);

        const q = g && g.questions.find(x => x.id === m.question.qid);
        if (!q) return `${scoreboard(m)}<div class="panel question"><h3>…</h3></div>`;
        const keys = t('keys');
        const opts = lang === 'ar' ? q.ar.o : q.en.o;
        const reveal = m.phase === 'reveal' ? m.reveal : null;
        const mine = reveal ? reveal.picks[SLOT()] : picks[m.qIndex] ?? null;
        const locked = mine !== null && mine !== undefined;
        const oppSlot = m.players.find(p => p.slot !== SLOT());

        const buttons = m.question.order.map((oi, pos) => {
            let cls = 'option';
            let mark = '';
            let tags = '';
            if (reveal) {
                if (oi === reveal.correct) { cls += ' is-correct'; mark = ICONS.check; }
                else if (oi === mine) { cls += ' is-wrong'; mark = ICONS.cross; }
                else cls += ' is-dim';
                if (oppSlot && reveal.picks[oppSlot.slot] === oi) tags = `<span class="opp-pick">${esc(first(oppSlot.name))}${reveal.gained[oppSlot.slot] ? ` +${reveal.gained[oppSlot.slot]}` : ''}</span>`;
            } else if (locked) {
                cls += oi === mine ? ' is-picked' : ' is-dim';
            }
            return `
            <button class="${cls}" type="button" data-opt="${oi}" ${reveal || locked ? 'disabled' : ''}>
                <span class="key">${keys[pos] || pos + 1}</span>
                <span class="opt-text">${esc(opts[oi] || q.en.o[oi])}</span>
                ${tags}
                <span class="mark">${mark}</span>
            </button>`;
        }).join('');

        let footer = '';
        if (reveal) {
            const ok = mine === reveal.correct;
            const none = mine === null || mine === undefined;
            const gained = reveal.gained[SLOT()] || 0;
            const ms = reveal.times ? reveal.times[SLOT()] : null;
            const speed = ok && ms != null ? ` <span class="speed">${esc(TT().answeredIn((ms / 1000).toFixed(1)))}</span>` : '';
            const expl = reveal.e ? (reveal.e[lang] || reveal.e.en) : '';
            footer = `
            <div class="feedback ${ok ? '' : 'bad'}">
                <div>
                    <strong>${esc(ok ? t('correct') : none ? t('timeUp') : t('wrong'))}${gained ? ` <span class="plus">+${gained}</span>` : ''}${speed}</strong>
                    ${!ok ? `<p>${esc(t('answerIs'))}: <b>${esc(opts[reveal.correct] || q.en.o[reveal.correct])}</b></p>` : ''}
                    ${expl ? `<p>${esc(expl)}</p>` : ''}
                </div>
            </div>
            <p class="next-in" data-deadline="${m.deadline}" data-fmt="next"></p>`;
        } else if (locked) {
            footer = `<p class="locked">${esc(t('lockedIn'))}</p>`;
        }

        const tag = q.tag && q.tag !== 'tf' && content.tags[q.tag] ? `<span class="tag">${esc(content.tags[q.tag][lang] || content.tags[q.tag].en)}</span>` : '';

        return `
        ${scoreboard(m)}
        <div class="quiz-meta">
            <span class="count">${esc(title)} · ${esc(t('question'))} <b>${String(m.qIndex + 1).padStart(2, '0')}</b> / ${String(m.qTotal).padStart(2, '0')}</span>
            ${reveal ? '' : `<span class="meta-right">
                <span class="pts-now ${locked ? 'frozen' : ''}" ${locked ? '' : `data-pts-start="${m.phaseStart}"`}>⚡ <b>${locked ? (pickPts[m.qIndex] ?? '') : ptsAt(m.phaseStart)}</b> ${esc(t('ptsNow'))}</span>
                <span class="timer-num" data-deadline="${m.deadline}" data-urgent>${secsLeft(m.deadline)}</span>
            </span>`}
        </div>
        ${reveal ? '<div class="timer-bar done"><span style="width:0"></span></div>' : `<div class="timer-bar" data-deadline="${m.deadline}" data-total="${settings().questionSeconds * 1000}"><span></span></div>`}
        <article class="question panel">
            ${tag}
            <h3>${esc(lang === 'ar' ? q.ar.q : q.en.q)}</h3>
            <div class="options ${opts.length === 2 ? 'two' : ''}">${buttons}</div>
            ${footer}
        </article>`;
    }

    function answer(opt) {
        const m = myMatch();
        if (!m || m.phase !== 'question' || picks[m.qIndex] !== undefined) return;
        picks[m.qIndex] = opt;
        pickPts[m.qIndex] = ptsAt(m.phaseStart);
        render();
        post('/api/answer', { qIndex: m.qIndex, opt }).catch(() => {}).finally(pollNow);
    }

    function renderResult(m) {
        const r = m.result;
        const mineSlot = SLOT();
        const solo = m.players.length < 2;
        const title = solo ? t('soloDone') : r.winner === 'draw' ? t('draw') : r.winner === mineSlot ? t('youWin') : t('youLose');
        const d = me();
        const cols = m.players.map(p => `
            <div class="res-col ${r.winner === p.slot ? 'winner' : ''} ${p.slot === mineSlot ? 'mine' : ''}">
                ${r.winner === p.slot ? `<span class="crown">${ICONS.trophy}</span>` : ''}
                <span class="vs-avatar">${esc((p.name.trim()[0] || '?').toUpperCase())}</span>
                <b>${esc(first(p.name))}</b>
                <span class="res-pts">${r.final[p.slot]}</span>
                <small>${r.base[p.slot]} ${esc(t('matchPts'))}${r.bonus[p.slot] ? ` + ${r.bonus[p.slot]} ${esc(t('bonus'))}` : ''}</small>
            </div>`).join(solo ? '' : `<span class="vs-badge">${esc(t('vs'))}</span>`);
        return `
        <div class="result panel ${r.winner === mineSlot ? 'won' : ''}">
            <span class="kicker">${esc(gameName(m.game))}</span>
            <h1>${esc(title)}</h1>
            <div class="res-cols ${solo ? 'solo' : ''}">${cols}</div>
            ${d ? `<p class="res-total">${esc(t('totalNow'))}: <b>${d.total}</b> ${esc(t('points'))}${d.rank ? ` · ${esc(t('rank'))} #${d.rank}` : ''}</p>` : ''}
            <div class="actions center">
                <button class="btn" type="button" data-dismiss="${m.id}">${esc(t('playAnother'))} ${ICONS.arrow}</button>
            </div>
        </div>`;
    }

    /* ─────────── Puzzle race ─────────── */
    const isLetter = (ch) => ch !== "'" && ch !== ' ';
    const lettersOf = (w) => [...w].filter(isLetter);

    function ensurePuzzle(m) {
        if (puzzle && puzzle.matchId === m.id) return puzzle;
        const words = (content.puzzle[lang] && content.puzzle[lang].length ? content.puzzle[lang] : content.puzzle.en);
        puzzle = { matchId: m.id, words, w: 0, filled: words.map(() => 0), bank: [], mistakes: 0, hints: 0, done: false };
        buildBank();
        return puzzle;
    }
    function buildBank() {
        const letters = lettersOf(puzzle.words[puzzle.w]);
        puzzle.bank = shuffle(letters.map((ch, i) => ({ ch, id: i, used: false })));
        if (letters.length > 2 && puzzle.bank.every((b, i) => b.ch === letters[i])) buildBank();
    }

    function renderPuzzle(m) {
        const p = ensurePuzzle(m);
        const server = m.puzzle[SLOT()];
        if (server && server.done) p.done = true;
        const phrase = p.words.map((word, wi) => {
            let li = 0;
            const slots = [...word].map(ch => {
                if (!isLetter(ch)) return `<span class="slot fixed">${esc(ch)}</span>`;
                const shown = li < p.filled[wi];
                li++;
                return `<span class="slot ${shown ? 'filled' : ''}">${shown ? esc(ch) : ''}</span>`;
            }).join('');
            const cls = wi < p.w || p.done ? 'done' : wi === p.w ? 'active' : '';
            return `<div class="word ${cls}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">${slots}</div>`;
        }).join('');
        const bank = p.done ? '' : p.bank.map((b, i) => `<button class="tile ${b.used ? 'used' : ''}" type="button" data-tile="${i}">${esc(b.ch)}</button>`).join('');
        return `
        ${scoreboard(m)}
        <div class="quiz-meta">
            <span class="count">${esc(gameName(m.game))}</span>
            <span class="timer-num" data-deadline="${m.deadline}" data-fmt="mmss" data-urgent></span>
        </div>
        <div class="timer-bar" data-deadline="${m.deadline}" data-total="${settings().puzzleSeconds * 1000}"><span></span></div>
        <article class="puzzle panel">
            <p class="puzzle-lead">${esc(t('puzzleLead'))}</p>
            <div class="puzzle-stats">
                <div class="stat"><small>${esc(t('wordsDone'))}</small><b>${p.done ? p.words.length : p.w}/${p.words.length}</b></div>
                <div class="stat"><small>${esc(t('mistakes'))}</small><b id="pz-mistakes">${p.mistakes}</b></div>
            </div>
            <div class="phrase">${phrase}</div>
            <div class="bank">${bank}</div>
            ${p.done ? `<p class="locked">${esc(t('youFinished'))}</p>` : `
            <div class="actions center"><button class="btn ghost" type="button" data-hint>${esc(t('hint'))}</button></div>`}
        </article>`;
    }

    function placeTile(i, el) {
        const m = myMatch();
        if (!m || m.phase !== 'puzzle' || !puzzle || puzzle.done) return;
        const tile = puzzle.bank[i];
        if (!tile || tile.used) return;
        const need = lettersOf(puzzle.words[puzzle.w])[puzzle.filled[puzzle.w]];
        if (tile.ch !== need) {
            puzzle.mistakes++;
            el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
            const mk = $('pz-mistakes'); if (mk) mk.textContent = puzzle.mistakes;
            sendPuzzle();
            return;
        }
        tile.used = true;
        advancePuzzle();
    }
    function hint() {
        if (!puzzle || puzzle.done) return;
        const need = lettersOf(puzzle.words[puzzle.w])[puzzle.filled[puzzle.w]];
        const tile = puzzle.bank.find(b => !b.used && b.ch === need);
        if (!tile) return;
        tile.used = true;
        puzzle.hints++;
        advancePuzzle();
    }
    function advancePuzzle() {
        const p = puzzle;
        p.filled[p.w]++;
        if (p.filled[p.w] === lettersOf(p.words[p.w]).length) {
            if (p.w === p.words.length - 1) p.done = true;
            else { p.w++; buildBank(); }
        }
        sendPuzzle();
        render();
    }
    function sendPuzzle() {
        const p = puzzle;
        post('/api/puzzle', { w: p.done ? p.words.length : p.w, mistakes: p.mistakes, hints: p.hints, done: p.done, words: p.words.length }).catch(() => {}).finally(() => { if (p.done || p.filled[p.w] === 0) pollNow(); });
    }

    /* ═════════════════════════ Finish / evaluation ═════════════════════════ */
    function renderConfirm() {
        const d = me();
        const inMatch = Boolean(myMatch() && myMatch().phase !== 'done');
        return `
        <div class="auth panel">
            <span class="auth-icon">${ICONS.trophy}</span>
            <h1 class="auth-title">${esc(t('confirmFinish'))}</h1>
            <p class="auth-lead">${esc(inMatch ? t('confirmMatch') : t('confirmLead'))}</p>
            ${d ? `<div class="hero-stats"><div><b>${d.total || 0}</b><span>${esc(t('points'))}</span></div><div><b>${d.wins || 0}</b><span>W</span></div><div><b>${d.rank ? '#' + d.rank : '–'}</b><span>${esc(t('rank'))}</span></div></div>` : ''}
            <div class="actions center">
                <button class="btn" type="button" data-go-eval>${esc(t('yesFinish'))} ${ICONS.arrow}</button>
                <button class="btn ghost" type="button" data-back-lobby>${esc(t('keepPlaying'))}</button>
            </div>
        </div>`;
    }

    function renderEvaluate() {
        const qs = content.evalQuestions.map((q, qi) => {
            const v = evalState.ratings[q.id] || 0;
            const stars = [1, 2, 3, 4, 5].map(n => `<button type="button" class="star ${n <= v ? 'on' : ''}" data-rate="${q.id}" data-val="${n}" aria-label="${n}">${ICONS.star}</button>`).join('');
            return `
            <div class="rate-row ${v ? 'rated' : ''}">
                <div class="rate-q"><span class="rate-n">${qi + 1}</span>${esc(q[lang] || q.en)}</div>
                <div class="rate-stars">${stars}</div>
                <div class="rate-label">${v ? esc(t('rateScale')[v - 1]) : '&nbsp;'}</div>
            </div>`;
        }).join('');
        return `
        <div class="section-head"><div><div class="kicker">${esc(t('evalLead'))}</div><h2>${esc(t('evalTitle'))}</h2></div></div>
        <form class="evaluate panel" id="evalForm" novalidate>
            ${qs}
            <label class="field"><span class="field-label">${esc(t('comment'))}</span>
                <textarea id="f-comment" rows="3" maxlength="1000">${esc(evalState.comment)}</textarea></label>
            <p class="form-error" id="evalError" ${evalState.error ? '' : 'hidden'}>${esc(evalState.error)}</p>
            <div class="actions">
                ${settings().requireEvaluation ? '' : `<button class="btn ghost" type="button" data-skip-eval>${esc(t('skipEval'))}</button>`}
                <button class="btn wide" type="submit">${esc(t('submit'))} ${ICONS.arrow}</button>
            </div>
        </form>`;
    }

    function setRating(id, val) {
        evalState.ratings[id] = val;
        const c = $('f-comment');
        if (c) evalState.comment = c.value;
        evalState.error = '';
        const y = window.scrollY;
        lastKey = '';
        render();
        window.scrollTo(0, y);
    }

    async function signOut() {
        const d = me();
        finalInfo = d ? { name: d.name, total: d.total || 0, rank: d.rank, players: snap.leaderboard.length } : { name: player.name, total: 0 };
        await post('/api/logout', {}).catch(() => {});
        go('thanks');
    }

    async function submitEvaluation() {
        const c = $('f-comment');
        evalState.comment = c ? c.value : '';
        if (!content.evalQuestions.every(q => evalState.ratings[q.id])) {
            evalState.error = t('errRate');
            const el = $('evalError'); el.textContent = evalState.error; el.hidden = false;
            return;
        }
        try {
            await post('/api/evaluation', { empId: player.empId, ratings: evalState.ratings, comment: evalState.comment });
        } catch (e) { /* the admin still sees the result; don't trap the player */ }
        signOut();
    }

    function renderThanks() {
        const f = finalInfo || { name: '', total: 0 };
        return `
        <div class="auth panel thanks">
            <span class="auth-icon">${ICONS.trophy}</span>
            <h1 class="auth-title">${esc(t('thanks'))}<em>${esc(first(f.name))}</em></h1>
            <p class="auth-lead">${esc(t('thanksLead'))}</p>
            <div class="final">
                <div><span>${esc(t('totalPts'))}</span><b>${f.total}</b></div>
                <div><span>${esc(t('lbRank'))}</span><b>${f.rank ? `#${f.rank} <small>${esc(t('of'))} ${f.players}</small>` : '—'}</b></div>
            </div>
            <button class="btn wide" type="button" data-next-player>${esc(t('nextPlayer'))} ${ICONS.arrow}</button>
            <p class="countdown" id="countdown">${esc(TT().autoReset(settings().thanksSeconds || 20))}</p>
        </div>`;
    }

    function startThanksCountdown() {
        let s = settings().thanksSeconds || 20;
        thanksTimer = setInterval(() => {
            s--;
            const el = $('countdown');
            if (el) el.textContent = TT().autoReset(s);
            if (s <= 0) nextPlayer();
        }, 1000);
    }

    function nextPlayer() {
        clearInterval(thanksTimer);
        player = null;
        puzzle = null;
        picks = {};
        finalInfo = null;
        evalState = { ratings: {}, comment: '', error: '' };
        store.del(PKEY());
        loginError = '';
        lang = settings().defaultLang || 'en';
        store.del(LKEY());
        applyLang();
        go('login');
    }

    /* ═════════════════════════ Events ═════════════════════════ */
    async function act(path, body) {
        try { await post(path, body); } catch (e) { toast(e.message); }
        pollNow();
    }

    app.addEventListener('click', (e) => {
        const el = e.target.closest('button');
        if (!el || el.disabled) return;
        const d = el.dataset;
        if (d.game) act('/api/propose', { game: d.game });
        else if ('accept' in d) act('/api/respond', { accept: true });
        else if ('decline' in d) act('/api/respond', { accept: false });
        else if ('cancelProp' in d) act('/api/cancel-proposal', {});
        else if (d.opt !== undefined) answer(Number(d.opt));
        else if (d.tile !== undefined) placeTile(Number(d.tile), el);
        else if ('hint' in d) hint();
        else if (d.dismiss) {
            dismissed[d.dismiss] = true;
            store.set('roadshow-dismissed', dismissed);
            picks = {};
            puzzle = null;
            go('lobby');
        }
        else if (d.rate) setRating(d.rate, Number(d.val));
        else if ('goEval' in d) go('evaluate');
        else if ('skipEval' in d) signOut();
        else if ('backLobby' in d) go(myMatch() ? 'match' : 'lobby');
        else if ('nextPlayer' in d) nextPlayer();
        else if ('openSetup' in d) go('setup');
        else if (d.setup) el.parentElement.querySelectorAll('.seg').forEach(b => b.classList.toggle('on', b === el));
        else if ('setupSave' in d) {
            const stn = app.querySelector('#seg-station .on').dataset.val;
            const dv = app.querySelector('#seg-device .on').dataset.val;
            const changed = !device || device.station !== stn || device.device !== dv;
            device = { station: stn, device: dv };
            store.set('roadshow-device', device);
            if (changed) { location.search = `?station=${stn}&device=${dv}`; return; }
            go(player ? 'lobby' : 'login');
        }
    });

    app.addEventListener('submit', (e) => {
        e.preventDefault();
        if (e.target.id === 'loginForm') doLogin(e.target);
        if (e.target.id === 'evalForm') submitEvaluation();
    });

    document.addEventListener('keydown', (e) => {
        const m = myMatch();
        if (view !== 'match' || !m || m.phase !== 'question') return;
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= m.question.order.length) answer(m.question.order[n - 1]);
    });

    $('finishBtn').addEventListener('click', () => go('confirm'));
    $('langBtn').addEventListener('click', (e) => {
        const b = e.target.closest('[data-lang]');
        if (!b || b.dataset.lang === lang) return;
        // Keep anything typed on the sign-in form when switching language.
        const name = $('f-name') && $('f-name').value, id = $('f-id') && $('f-id').value;
        const comment = $('f-comment') && $('f-comment').value;
        if (comment !== undefined && comment !== null) evalState.comment = comment;
        lang = b.dataset.lang;
        store.set(LKEY(), lang);
        applyLang();
        lastKey = '';
        render();
        if (name && $('f-name')) $('f-name').value = name;
        if (id && $('f-id')) $('f-id').value = id;
    });

    /* ═════════════════════════ Boot ═════════════════════════ */
    applyLang();
    render();
    if (device) connect();
    else fetch('/api/state').then(r => r.json()).then(d => { snap = d; lang = lang || d.settings.defaultLang; applyLang(); render(); }).catch(() => {});
    (function retryContent() {
        loadContent().then(() => { lastKey = ''; render(); }).catch(() => { lastKey = ''; render(); setTimeout(retryContent, 5000); });
    })();

    // Re-announce the signed-in player after a reload.
    if (player && device) {
        post('/api/login', { name: player.name, empId: player.empId })
            .catch(() => {})
            .finally(() => { rejoining = false; if (snap) onSnapshot(); });
    }
})();
