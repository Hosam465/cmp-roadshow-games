// Compliance Roadshow Games — shared app for the laptop server (server.js) and Vercel (api/index.js).
// State lives in a store (Redis on Vercel, JSON files locally). There are no background timers:
// every request first "advances" matches whose deadlines have passed, and the iPads/screens poll
// about once a second, so questions move on exactly on time either way.

const express = require('express');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');
const crypto = require('crypto');
const os = require('os');
const { createStore, storageEnvNames } = require('./lib/store');

const store = createStore();
const SLOTS = ['A', 'B'];
const ON_VERCEL = Boolean(process.env.VERCEL);
const ENV_PIN = process.env.ADMIN_PIN || '';

/* ═════════════════════════ Defaults ═════════════════════════ */

const uid = (p = '') => p + crypto.randomBytes(4).toString('hex');

const DEFAULT_SETTINGS = {
    adminPin: ENV_PIN || '2026',
    stations: 2,
    pointsPerCorrect: 10,   // a correct answer given at the very last second
    speedBonus: 20,         // extra for answering instantly; shrinks to 0 as the timer runs out
    winBonus: 20,
    drawBonus: 10,
    scoreMode: 'best',
    countdownSeconds: 3,
    questionSeconds: 20,
    revealSeconds: 5,
    resultSeconds: 20,
    questionsPerMatch: 0,
    shuffleQuestions: false,
    shuffleOptions: true,
    allowSolo: true,
    puzzleMax: 100,
    puzzleMin: 20,
    puzzleMistakePenalty: 5,
    puzzleHintPenalty: 10,
    puzzleFreeSeconds: 60,
    puzzleSecondsPerPoint: 5,
    puzzleSeconds: 240,
    puzzlePointsPerWord: 10,
    requireEvaluation: true,
    thanksSeconds: 20,
    showArabic: true,
    defaultLang: 'en',
    leaderboardRows: 7,
    showLeaderboard: true,
    showEmployeeIds: true,
    pollMs: 1000
};

function defaultContent() {
    const D = require('./default-content.js');
    return {
        text: {
            en: { eventName: 'Compliance Roadshow', headline1: 'Play. Learn. ', headline2: 'Comply.', lead: 'Challenge a colleague and climb the leaderboard.', leaderboard: 'Leaderboard' },
            ar: { eventName: 'جولة الالتزام', headline1: 'العب. تعلّم. ', headline2: 'التزم.', lead: 'تحدَّ زميلك وتصدّر القائمة.', leaderboard: 'لوحة المتصدرين' }
        },
        units: Object.entries(D.UNITS).map(([id, u]) => ({ id, icon: u.icon, enabled: true, en: { ...u.en }, ar: { ...u.ar } })),
        games: Object.entries(D.GAMES).map(([id, g]) => ({
            id, unit: g.unit, type: g.type, enabled: true,
            en: { title: D.GAME_TYPES[g.type].en }, ar: { title: D.GAME_TYPES[g.type].ar },
            questions: (g.questions || []).map(q => ({
                id: uid('q'), a: q.a, fixed: Boolean(q.fixed), tag: q.tag || '', enabled: true,
                en: { q: q.en.q, o: [...q.en.o], e: q.en.e || '' },
                ar: { q: q.ar.q, o: [...q.ar.o], e: q.ar.e || '' }
            }))
        })),
        puzzle: { en: [...D.PUZZLE.en], ar: [...D.PUZZLE.ar] },
        tags: D.TAGS,
        evalQuestions: [
            { id: 'overall', en: 'How would you rate the Compliance Roadshow overall?', ar: 'ما تقييمك العام لجولة الالتزام؟' },
            { id: 'useful', en: 'The games helped me understand compliance topics.', ar: 'ساعدتني الألعاب على فهم موضوعات الالتزام.' },
            { id: 'clarity', en: 'The content was clear and easy to follow.', ar: 'كان المحتوى واضحاً وسهل الفهم.' },
            { id: 'apply', en: 'I can apply what I learned in my daily work.', ar: 'أستطيع تطبيق ما تعلمته في عملي اليومي.' }
        ]
    };
}

/* ═════════════════════════ World (load / save) ═════════════════════════ */
// W = { config: { settings, content, contentVersion }, db: { players, evaluations, matches }, stations: {} }

const KEYS = ['config', 'db', 'stations'];

async function loadWorld() {
    const raw = await store.mget(KEYS);
    const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
    const W = { config: parse(raw[0]), db: parse(raw[1]), stations: parse(raw[2]) || {} };
    if (!W.config) W.config = { settings: { ...DEFAULT_SETTINGS }, content: defaultContent() };
    W.config.settings = { ...DEFAULT_SETTINGS, ...W.config.settings };
    if (ENV_PIN) W.config.settings.adminPin = ENV_PIN;
    if (!W.config.contentVersion) W.config.contentVersion = Date.now();
    W.db = { players: {}, evaluations: {}, matches: [], ...(W.db || {}) };
    for (let i = 1; i <= W.config.settings.stations; i++) station(W, i);
    W._orig = raw;
    return W;
}

async function saveWorld(W) {
    const out = {};
    KEYS.forEach((k, i) => {
        const s = JSON.stringify(W[k]);
        if (s !== W._orig[i]) out[k] = s;
    });
    out.pub = JSON.stringify(buildPub(W));
    await store.mset(out);
    if (out.db && onDbSaved) onDbSaved(W);
}

let onDbSaved = null; // the laptop server hooks this to keep an Excel copy on disk

// Every change goes through here: lock → load → catch up on timers → change → save.
async function mutate(fn) {
    return store.withLock(async () => {
        const W = await loadWorld();
        const t = Date.now();
        advanceAll(W, t);
        const result = await fn(W, t);
        await saveWorld(W);
        return result;
    });
}

const S = (W) => W.config.settings;
const C = (W) => W.config.content;
const gameById = (W, id) => C(W).games.find(g => g.id === id);
const unitById = (W, id) => C(W).units.find(u => u.id === id);
const gameLabel = (W, g) => {
    const unit = unitById(W, g.unit);
    const u = unit ? unit.en.title : '';
    return !u || u === g.en.title ? g.en.title : `${u} – ${g.en.title}`;
};
const activeQuestions = (g) => (g.questions || []).filter(q => q.enabled !== false);

function station(W, id) {
    id = String(id);
    if (!W.stations[id]) W.stations[id] = { id, devices: { A: null, B: null }, proposal: null, match: null };
    return W.stations[id];
}

/* ═════════════════════════ Scores ═════════════════════════ */

function playerTotals(W, p) {
    const byGame = {};
    for (const m of p.matches || []) {
        if (S(W).scoreMode === 'sum') byGame[m.game] = (byGame[m.game] || 0) + m.points;
        else byGame[m.game] = Math.max(byGame[m.game] ?? -Infinity, m.points);
    }
    const adjust = (p.adjustments || []).reduce((n, a) => n + a.delta, 0);
    const ms = p.matches || [];
    return {
        score: Object.values(byGame).reduce((n, v) => n + v, 0) + adjust,
        adjust, byGame,
        played: ms.length,
        wins: ms.filter(m => m.outcome === 'win').length,
        losses: ms.filter(m => m.outcome === 'loss').length,
        draws: ms.filter(m => m.outcome === 'draw').length,
        time: ms.reduce((n, m) => n + (m.timeMs || 0), 0)
    };
}

function leaderboard(W) {
    return Object.values(W.db.players)
        .map(p => ({ empId: p.empId, name: p.name, station: p.station, ...playerTotals(W, p) }))
        .filter(r => r.played > 0 || r.adjust !== 0)
        .sort((a, b) => b.score - a.score || b.wins - a.wins || a.time - b.time || a.name.localeCompare(b.name))
        .map((r, i) => ({ ...r, rank: i + 1 }));
}

function publicPlayer(W, p, ranks) {
    if (!p) return null;
    const t = playerTotals(W, p);
    return { empId: p.empId, name: p.name, total: t.score, played: t.played, wins: t.wins, losses: t.losses, draws: t.draws, byGame: t.byGame, rank: ranks[p.empId] || null };
}

/* ═════════════════════════ Match engine (pure state changes) ═════════════════════════ */

const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

function startMatch(W, st, gameId, slots, t) {
    const g = gameById(W, gameId);
    if (!g || g.enabled === false) return 'Game not available';
    const players = slots.filter(s => st.devices[s]);
    if (!players.length) return 'No players at this station';
    let questions = [];
    if (g.type !== 'puzzle') {
        let qs = activeQuestions(g);
        if (!qs.length) return 'This game has no questions';
        if (S(W).shuffleQuestions) qs = shuffle(qs);
        if (S(W).questionsPerMatch > 0) qs = qs.slice(0, S(W).questionsPerMatch);
        questions = qs.map(q => {
            const idx = q.en.o.map((_, i) => i);
            return { qid: q.id, order: q.fixed || !S(W).shuffleOptions ? idx : shuffle(idx) };
        });
    }
    st.proposal = null;
    st.match = {
        id: uid('m'), game: g.id, type: g.type,
        players: players.map(s => ({ slot: s, empId: st.devices[s].empId, name: st.devices[s].name })),
        questions, qIndex: -1,
        phase: 'countdown', phaseStart: t, deadline: t + S(W).countdownSeconds * 1000, startedAt: t,
        scores: Object.fromEntries(players.map(s => [s, 0])),
        correct: Object.fromEntries(players.map(s => [s, 0])),
        answers: {}, reveal: null,
        puzzle: g.type === 'puzzle' ? Object.fromEntries(players.map(s => [s, { w: 0, mistakes: 0, hints: 0, done: false, finishMs: null, points: 0 }])) : null,
        result: null
    };
    return null;
}

function nextQuestion(W, st, t) {
    const m = st.match;
    m.qIndex++;
    if (m.qIndex >= m.questions.length) return finishMatch(W, st, t);
    m.phase = 'question';
    m.answers = {};
    m.reveal = null;
    m.phaseStart = t;
    m.deadline = t + S(W).questionSeconds * 1000;
}

function revealQuestion(W, st, t) {
    const m = st.match;
    if (!m || m.phase !== 'question') return;
    const g = gameById(W, m.game);
    const q = g && g.questions.find(x => x.id === m.questions[m.qIndex].qid);
    const limit = S(W).questionSeconds * 1000;
    const gained = {};
    for (const p of m.players) {
        const ans = m.answers[p.slot];
        const ok = ans && q && ans.opt === q.a;
        gained[p.slot] = ok ? S(W).pointsPerCorrect + Math.round(S(W).speedBonus * Math.max(0, 1 - ans.ms / limit)) : 0;
        m.scores[p.slot] += gained[p.slot];
        if (ok) m.correct[p.slot]++;
    }
    m.phase = 'reveal';
    m.reveal = {
        correct: q ? q.a : null,
        e: q ? { en: q.en.e || '', ar: q.ar.e || '' } : null,
        picks: Object.fromEntries(m.players.map(p => [p.slot, m.answers[p.slot] ? m.answers[p.slot].opt : null])),
        times: Object.fromEntries(m.players.map(p => [p.slot, m.answers[p.slot] ? m.answers[p.slot].ms : null])),
        gained
    };
    m.phaseStart = t;
    m.deadline = t + S(W).revealSeconds * 1000;
}

function startPuzzle(W, st, t) {
    const m = st.match;
    m.phase = 'puzzle';
    m.phaseStart = t;
    m.deadline = t + S(W).puzzleSeconds * 1000;
}

function puzzlePoints(W, ps) {
    const s = S(W);
    if (!ps.done) return Math.min(s.puzzleMax, ps.w * s.puzzlePointsPerWord);
    const secs = Math.floor(ps.finishMs / 1000);
    const timePenalty = Math.floor(Math.max(0, secs - s.puzzleFreeSeconds) / Math.max(1, s.puzzleSecondsPerPoint));
    return Math.max(s.puzzleMin, s.puzzleMax - ps.mistakes * s.puzzleMistakePenalty - ps.hints * s.puzzleHintPenalty - timePenalty);
}

function finishMatch(W, st, t, { record = true } = {}) {
    const m = st.match;
    if (!m || m.phase === 'done') return;
    if (m.type === 'puzzle') {
        for (const p of m.players) {
            const ps = m.puzzle[p.slot];
            ps.points = puzzlePoints(W, ps);
            m.scores[p.slot] = ps.points;
        }
    }
    const base = { ...m.scores };
    let winner = null;
    if (m.players.length === 2) {
        const [a, b] = m.players.map(p => p.slot);
        if (base[a] === base[b]) {
            if (m.type === 'puzzle' && m.puzzle[a].done && m.puzzle[b].done && m.puzzle[a].finishMs !== m.puzzle[b].finishMs) {
                winner = m.puzzle[a].finishMs < m.puzzle[b].finishMs ? a : b;
            } else winner = 'draw';
        } else winner = base[a] > base[b] ? a : b;
    }
    const bonus = {};
    for (const p of m.players) bonus[p.slot] = winner === p.slot ? S(W).winBonus : winner === 'draw' ? S(W).drawBonus : 0;
    const final = Object.fromEntries(m.players.map(p => [p.slot, base[p.slot] + bonus[p.slot]]));
    m.phase = 'done';
    m.result = { winner, base, bonus, final, recorded: record };
    m.phaseStart = t;
    m.deadline = t + S(W).resultSeconds * 1000;

    if (record) {
        const timeMs = t - m.startedAt;
        const at = new Date(t).toISOString();
        const entry = {
            id: m.id, game: m.game, station: st.id, at, timeMs,
            players: m.players.map(p => ({
                slot: p.slot, empId: p.empId, name: p.name,
                points: final[p.slot], base: base[p.slot], bonus: bonus[p.slot],
                correct: m.type === 'puzzle' ? null : m.correct[p.slot],
                total: m.type === 'puzzle' ? null : m.questions.length,
                outcome: m.players.length < 2 ? 'solo' : winner === 'draw' ? 'draw' : winner === p.slot ? 'win' : 'loss'
            }))
        };
        W.db.matches.push(entry);
        for (const p of entry.players) {
            const pl = W.db.players[p.empId];
            if (!pl) continue;
            pl.matches = pl.matches || [];
            const opp = entry.players.find(o => o.empId !== p.empId);
            pl.matches.push({ id: entry.id, game: entry.game, points: p.points, outcome: p.outcome, opponent: opp ? opp.name : null, timeMs, at });
            pl.updatedAt = at;
        }
    }
}

// Run every transition whose deadline has passed, in order, using the deadlines themselves as the clock.
function advanceStation(W, st, t) {
    for (let guard = 0; guard < 500 && st.match && st.match.deadline <= t; guard++) {
        const m = st.match;
        const at = m.deadline;
        if (m.phase === 'countdown') (m.type === 'puzzle' ? startPuzzle : nextQuestion)(W, st, at);
        else if (m.phase === 'question') revealQuestion(W, st, at);
        else if (m.phase === 'reveal') nextQuestion(W, st, at);
        else if (m.phase === 'puzzle') finishMatch(W, st, at);
        else if (m.phase === 'done') st.match = null;
    }
}
function advanceAll(W, t) { for (const st of Object.values(W.stations)) advanceStation(W, st, t); }

/* ═════════════════════════ Public snapshot (what iPads & screens poll) ═════════════════════════ */

function publicStation(W, st, ranks, seen) {
    const devices = {};
    for (const s of SLOTS) {
        const d = st.devices[s];
        devices[s] = d ? { ...publicPlayer(W, W.db.players[d.empId], ranks), empId: d.empId, name: d.name, ...(seen ? { online: Date.now() - Number(seen[`${st.id}-${s}`] || 0) < 20000 } : {}) } : null;
    }
    let match = null;
    const m = st.match;
    if (m) {
        const q = m.qIndex >= 0 && m.questions[m.qIndex];
        match = {
            id: m.id, game: m.game, type: m.type, phase: m.phase,
            players: m.players, deadline: m.deadline, phaseStart: m.phaseStart,
            qIndex: m.qIndex, qTotal: m.questions.length,
            question: q ? { qid: q.qid, order: q.order } : null,
            answered: Object.fromEntries(m.players.map(p => [p.slot, Boolean(m.answers[p.slot])])),
            scores: m.scores, correct: m.correct,
            reveal: m.phase === 'reveal' ? m.reveal : null,
            puzzle: m.puzzle,
            result: m.result
        };
    }
    return { id: st.id, devices, proposal: st.proposal, match };
}

function publicSettings(W) {
    const s = S(W);
    return {
        pointsPerCorrect: s.pointsPerCorrect, speedBonus: s.speedBonus, winBonus: s.winBonus, drawBonus: s.drawBonus,
        questionSeconds: s.questionSeconds, revealSeconds: s.revealSeconds, puzzleSeconds: s.puzzleSeconds,
        puzzleMax: s.puzzleMax, allowSolo: s.allowSolo, requireEvaluation: s.requireEvaluation,
        thanksSeconds: s.thanksSeconds, showArabic: s.showArabic, defaultLang: s.defaultLang,
        leaderboardRows: s.leaderboardRows, showLeaderboard: s.showLeaderboard, showEmployeeIds: s.showEmployeeIds,
        stations: s.stations, pollMs: s.pollMs
    };
}

function buildPub(W) {
    const lb = leaderboard(W);
    const ranks = Object.fromEntries(lb.map(r => [r.empId, r.rank]));
    const deadlines = Object.values(W.stations).map(st => st.match && st.match.deadline).filter(Boolean);
    return {
        contentVersion: W.config.contentVersion,
        settings: publicSettings(W),
        stations: Object.fromEntries(Object.values(W.stations).map(st => [st.id, publicStation(W, st, ranks)])),
        leaderboard: lb,
        players: Object.keys(W.db.players).length,
        nextDeadline: deadlines.length ? Math.min(...deadlines) : null
    };
}

async function readPub() {
    const [raw] = await store.mget(['pub']);
    let pub = null;
    try { pub = raw ? JSON.parse(raw) : null; } catch (e) { pub = null; }
    // Missing, or a timer has run out: take the lock and catch up.
    if (!pub || (pub.nextDeadline && pub.nextDeadline <= Date.now())) {
        await mutate(() => {});
        const [again] = await store.mget(['pub']);
        pub = JSON.parse(again);
    }
    return pub;
}

/* ═════════════════════════ Excel ═════════════════════════ */

const fmtTime = (ms) => {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const TZ_OFFSET_MIN = Number(process.env.TZ_OFFSET_MINUTES ?? (ON_VERCEL ? 180 : -new Date().getTimezoneOffset())); // Saudi time (UTC+3) on Vercel
const xlDate = (v) => (v ? new Date(new Date(v).getTime() + TZ_OFFSET_MIN * 60000) : null);

async function buildWorkbook(W, { exclude = [], extra = [] } = {}) {
    const excluded = new Set(exclude.map(String));
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Compliance Roadshow Games';
    wb.created = new Date();
    const styleHeader = (ws) => {
        const row = ws.getRow(1);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE31B23' } };
        row.alignment = { vertical: 'middle' };
        row.height = 22;
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
    };
    const games = C(W).games;

    const ws = wb.addWorksheet('Results');
    ws.columns = [
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Employee ID', key: 'empId', width: 15 },
        { header: 'Screen', key: 'station', width: 9 },
        ...games.map(g => ({ header: gameLabel(W, g), key: `g_${g.id}`, width: 22 })),
        { header: 'Manual adjustment', key: 'adjust', width: 18 },
        { header: 'Total points', key: 'total', width: 13 },
        { header: 'Matches', key: 'played', width: 10 },
        { header: 'Wins', key: 'wins', width: 8 },
        { header: 'Losses', key: 'losses', width: 8 },
        { header: 'Draws', key: 'draws', width: 8 },
        { header: 'Evaluation done', key: 'evaluated', width: 15 },
        { header: 'First login', key: 'created', width: 20 },
        { header: 'Last activity', key: 'updated', width: 20 }
    ];
    const rows = Object.values(W.db.players).filter(p => !excluded.has(p.empId)).map(p => {
        const t = playerTotals(W, p);
        const row = {
            name: p.name, empId: p.empId, station: p.station || '',
            adjust: t.adjust || '', total: t.score, played: t.played, wins: t.wins, losses: t.losses, draws: t.draws,
            evaluated: W.db.evaluations[p.empId] ? 'Yes' : 'No', created: xlDate(p.createdAt), updated: xlDate(p.updatedAt),
            _time: t.time, _ranked: t.played > 0 || t.adjust !== 0
        };
        for (const g of games) row[`g_${g.id}`] = t.byGame[g.id] ?? '';
        return row;
    });
    for (const x of extra) rows.push({ name: x.name, empId: x.empId, station: '', total: x.points, played: '', wins: '', losses: '', draws: '', evaluated: '', _time: 0, _ranked: true });
    rows.sort((a, b) => (b._ranked - a._ranked) || (b.total - a.total) || (a._time - b._time) || a.name.localeCompare(b.name));
    let rank = 0;
    for (const row of rows) {
        row.rank = row._ranked ? ++rank : '';
        delete row._time; delete row._ranked;
        ws.addRow(row);
    }
    ws.getColumn('created').numFmt = 'yyyy-mm-dd hh:mm';
    ws.getColumn('updated').numFmt = 'yyyy-mm-dd hh:mm';
    styleHeader(ws);

    const ev = wb.addWorksheet('Evaluations');
    const eq = C(W).evalQuestions;
    ev.columns = [
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Employee ID', key: 'empId', width: 15 },
        { header: 'Screen', key: 'station', width: 9 },
        ...eq.map(q => ({ header: `${q.en} (1–5)`, key: `r_${q.id}`, width: 30 })),
        { header: 'Average', key: 'avg', width: 10 },
        { header: 'Comments', key: 'comment', width: 50 },
        { header: 'Submitted', key: 'at', width: 20 }
    ];
    for (const e of Object.values(W.db.evaluations).filter(e => !excluded.has(e.empId)).sort((a, b) => a.at.localeCompare(b.at))) {
        const p = W.db.players[e.empId] || {};
        const vals = Object.values(e.ratings).filter(Number.isFinite);
        const row = { name: p.name || '', empId: e.empId, station: p.station || '', comment: e.comment || '', at: xlDate(e.at), avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : '' };
        for (const q of eq) row[`r_${q.id}`] = e.ratings[q.id] ?? '';
        ev.addRow(row);
    }
    ev.getColumn('avg').numFmt = '0.0';
    ev.getColumn('at').numFmt = 'yyyy-mm-dd hh:mm';
    ev.getColumn('comment').alignment = { wrapText: true, vertical: 'top' };
    styleHeader(ev);

    const mt = wb.addWorksheet('Matches');
    mt.columns = [
        { header: 'Played at', key: 'at', width: 20 },
        { header: 'Screen', key: 'station', width: 9 },
        { header: 'Game', key: 'game', width: 36 },
        { header: 'Player 1', key: 'p1', width: 26 },
        { header: 'P1 ID', key: 'p1id', width: 13 },
        { header: 'P1 points', key: 'p1pts', width: 10 },
        { header: 'Player 2', key: 'p2', width: 26 },
        { header: 'P2 ID', key: 'p2id', width: 13 },
        { header: 'P2 points', key: 'p2pts', width: 10 },
        { header: 'Winner', key: 'winner', width: 26 },
        { header: 'Duration', key: 'dur', width: 10 }
    ];
    for (const m of W.db.matches.filter(m => m.players.some(p => !excluded.has(p.empId)))) {
        const [a, b] = m.players;
        const g = gameById(W, m.game);
        const w = m.players.find(p => p.outcome === 'win');
        mt.addRow({
            at: xlDate(m.at), station: m.station, game: g ? gameLabel(W, g) : m.game,
            p1: a ? a.name : '', p1id: a ? a.empId : '', p1pts: a ? a.points : '',
            p2: b ? b.name : '(solo)', p2id: b ? b.empId : '', p2pts: b ? b.points : '',
            winner: w ? w.name : m.players.length > 1 ? 'Draw' : '—', dur: fmtTime(m.timeMs)
        });
    }
    mt.getColumn('at').numFmt = 'yyyy-mm-dd hh:mm';
    styleHeader(mt);

    const adj = wb.addWorksheet('Adjustments');
    adj.columns = [
        { header: 'At', key: 'at', width: 20 },
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Employee ID', key: 'empId', width: 15 },
        { header: 'Points', key: 'delta', width: 10 },
        { header: 'Reason', key: 'reason', width: 40 }
    ];
    for (const p of Object.values(W.db.players).filter(p => !excluded.has(p.empId))) {
        for (const a of p.adjustments || []) adj.addRow({ at: xlDate(a.at), name: p.name, empId: p.empId, delta: a.delta, reason: a.reason || '' });
    }
    adj.getColumn('at').numFmt = 'yyyy-mm-dd hh:mm';
    styleHeader(adj);
    return wb;
}

/* ═════════════════════════ Content validation ═════════════════════════ */

const clean = (v, max = 80) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (v) => clean(v, 30).replace(/[^\p{L}\p{N}\-_]/gu, '');
const slotOf = (v) => (SLOTS.includes(String(v).toUpperCase()) ? String(v).toUpperCase() : null);

function validateContent(c) {
    if (!c || !Array.isArray(c.units) || !Array.isArray(c.games)) return 'Invalid content';
    for (const g of c.games) {
        if (!g.id || !g.unit || !['quiz', 'wwyd', 'puzzle'].includes(g.type)) return `Game "${g.id}" is incomplete`;
        g.en = g.en || {}; g.ar = g.ar || {};
        if (!clean(g.en.title)) return `Game "${g.id}" needs an English title`;
        if (g.type === 'puzzle') { g.questions = []; continue; }
        g.questions = Array.isArray(g.questions) ? g.questions : [];
        for (const [i, q] of g.questions.entries()) {
            const where = `${g.en.title}, question ${i + 1}`;
            q.id = q.id || uid('q');
            q.en = q.en || {}; q.ar = q.ar || {};
            q.en.o = (q.en.o || []).map(o => String(o).trim()).filter(Boolean);
            if (!String(q.en.q || '').trim()) return `${where}: question text is empty`;
            if (q.en.o.length < 2) return `${where}: needs at least 2 answers`;
            q.ar.o = Array.isArray(q.ar.o) ? q.ar.o.slice(0, q.en.o.length).map(o => String(o || '').trim()) : [];
            while (q.ar.o.length < q.en.o.length) q.ar.o.push('');
            q.ar.o = q.ar.o.map((o, k) => o || q.en.o[k]);
            q.ar.q = String(q.ar.q || '').trim() || q.en.q;
            q.en.e = String(q.en.e || ''); q.ar.e = String(q.ar.e || '');
            q.a = Number(q.a);
            if (!(q.a >= 0 && q.a < q.en.o.length)) return `${where}: pick the correct answer`;
            q.fixed = Boolean(q.fixed);
            q.enabled = q.enabled !== false;
        }
    }
    for (const u of c.units) { u.en = u.en || {}; u.ar = u.ar || {}; if (!clean(u.en.title)) return 'Every unit needs an English title'; }
    c.puzzle = c.puzzle || { en: [], ar: [] };
    c.puzzle.en = (c.puzzle.en || []).map(w => String(w).trim().toUpperCase()).filter(Boolean);
    c.puzzle.ar = (c.puzzle.ar || []).map(w => String(w).trim()).filter(Boolean);
    if (!c.puzzle.en.length) return 'The puzzle needs at least one English word';
    if (!c.puzzle.ar.length) c.puzzle.ar = [...c.puzzle.en];
    c.evalQuestions = (c.evalQuestions || []).filter(q => clean(q.en)).map(q => ({ id: q.id || uid('e'), en: String(q.en).trim(), ar: String(q.ar || q.en).trim() }));
    if (!c.evalQuestions.length) return 'Keep at least one evaluation question';
    c.tags = c.tags || defaultContent().tags;
    c.text = c.text || defaultContent().text;
    return null;
}

/* ═════════════════════════ HTTP ═════════════════════════ */

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const bad = (msg, status = 400) => { throw new HttpError(status, msg); };

// Wrap async handlers so errors become clean JSON responses.
const h = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
    if (!res.headersSent) res.status(err.status || 500).json({ error: err.status ? err.message : `Server error: ${err.message}` });
    if (!err.status) console.error(err);
});

// Quick diagnostics: open /api/health in a browser. Shows env var NAMES only, never values.
app.get('/api/health', async (req, res) => {
    const out = { storage: store.kind, onVercel: ON_VERCEL, adminPinFromEnv: Boolean(ENV_PIN), databaseEnvVars: storageEnvNames() };
    try {
        const t = Date.now();
        await store.mget(['config']);
        out.database = `ok (${Date.now() - t} ms)`;
    } catch (err) {
        out.database = `error: ${err.message}`;
    }
    res.set('Cache-Control', 'no-store').json(out);
});

// On Vercel without a database, explain what to add instead of failing silently.
app.use('/api', (req, res, next) => {
    if (store.kind === 'missing') {
        return res.status(503).json({ error: 'Database not connected. In Vercel open your project → Storage → Create Database → Upstash for Redis → Connect to this project, then Deployments → Redeploy.' });
    }
    next();
});

app.get('/api/content', h(async (req, res) => {
    const W = await loadWorld();
    const c = C(W);
    res.json({
        version: W.config.contentVersion,
        text: c.text, units: c.units, tags: c.tags, puzzle: c.puzzle, evalQuestions: c.evalQuestions,
        games: c.games.map(g => ({
            id: g.id, unit: g.unit, type: g.type, enabled: g.enabled !== false, en: g.en, ar: g.ar,
            count: g.type === 'puzzle' ? c.puzzle.en.length : activeQuestions(g).length,
            questions: activeQuestions(g).map(q => ({ id: q.id, tag: q.tag, en: { q: q.en.q, o: q.en.o }, ar: { q: q.ar.q, o: q.ar.o } }))
        }))
    });
}));

// Polled by iPads (with station/device) and big screens about once a second.
app.get('/api/state', h(async (req, res) => {
    const st = clean(req.query.station, 4);
    const dev = slotOf(req.query.device);
    if (st && dev && req.query.beat) store.hset('seen', `${st}-${dev}`, String(Date.now())).catch(() => {});
    const pub = await readPub();
    res.set('Cache-Control', 'no-store');
    res.json({ ...pub, serverNow: Date.now() });
}));

// Player actions -----------------------------------------------------------------
function ctx(W, body) {
    const id = clean(body.station, 4);
    const slot = slotOf(body.device);
    if (!id || !slot || !W.stations[id]) bad('Unknown station or device');
    const st = W.stations[id];
    return { st, slot, me: st.devices[slot], other: SLOTS.find(s => s !== slot) };
}

app.post('/api/login', h(async (req, res) => {
    const out = await mutate((W, t) => {
        const c = ctx(W, req.body);
        const name = clean(req.body.name, 60);
        const empId = cleanId(req.body.empId);
        if (name.length < 2 || !empId) bad('Name and employee ID are required');
        if (c.st.devices[c.other] && c.st.devices[c.other].empId === empId) bad('This employee ID is already signed in on the other iPad', 409);
        const iso = new Date(t).toISOString();
        let p = W.db.players[empId];
        const returning = Boolean(p);
        if (!p) p = W.db.players[empId] = { empId, name, station: c.st.id, matches: [], adjustments: [], createdAt: iso };
        p.name = name;
        p.station = c.st.id;
        p.updatedAt = iso;
        if (c.st.match && c.st.match.phase !== 'done' && c.me && c.me.empId !== empId) c.st.match = null;
        c.st.devices[c.slot] = { empId, name, since: t };
        if (c.st.proposal && c.st.proposal.by === c.slot) c.st.proposal = null;
        const ranks = Object.fromEntries(leaderboard(W).map(r => [r.empId, r.rank]));
        return { player: publicPlayer(W, p, ranks), returning };
    });
    res.json(out);
}));

app.post('/api/logout', h(async (req, res) => {
    await mutate((W) => {
        const c = ctx(W, req.body);
        if (c.st.match && c.st.match.phase !== 'done' && c.st.match.players.some(p => p.slot === c.slot)) c.st.match = null;
        c.st.devices[c.slot] = null;
        c.st.proposal = null;
    });
    res.json({ ok: true });
}));

app.post('/api/propose', h(async (req, res) => {
    await mutate((W, t) => {
        const c = ctx(W, req.body);
        if (!c.me) bad('Sign in first');
        const g = gameById(W, req.body.game);
        if (!g || g.enabled === false) bad('Game not available');
        if (c.st.match && c.st.match.phase !== 'done') bad('A match is already running', 409);
        const solo = Boolean(req.body.solo) || !c.st.devices[c.other];
        if (solo) {
            if (!S(W).allowSolo && !c.st.devices[c.other]) bad('Waiting for an opponent', 409);
            const err = startMatch(W, c.st, g.id, [c.slot], t);
            if (err) bad(err);
        } else {
            c.st.proposal = { game: g.id, by: c.slot, at: t };
            if (c.st.match && c.st.match.phase === 'done') c.st.match = null;
        }
    });
    res.json({ ok: true });
}));

app.post('/api/respond', h(async (req, res) => {
    await mutate((W, t) => {
        const c = ctx(W, req.body);
        const p = c.st.proposal;
        if (!p || p.by === c.slot) bad('Nothing to respond to');
        if (req.body.accept) {
            const err = startMatch(W, c.st, p.game, SLOTS, t);
            if (err) bad(err);
        } else c.st.proposal = null;
    });
    res.json({ ok: true });
}));

app.post('/api/cancel-proposal', h(async (req, res) => {
    await mutate((W) => {
        const c = ctx(W, req.body);
        if (c.st.proposal && c.st.proposal.by === c.slot) c.st.proposal = null;
    });
    res.json({ ok: true });
}));

app.post('/api/answer', h(async (req, res) => {
    await mutate((W, t) => {
        const c = ctx(W, req.body);
        const m = c.st.match;
        if (!m || m.phase !== 'question' || Number(req.body.qIndex) !== m.qIndex) bad('Too late', 409);
        if (!m.players.some(p => p.slot === c.slot) || m.answers[c.slot]) bad('Already answered', 409);
        m.answers[c.slot] = { opt: Number(req.body.opt), ms: t - m.phaseStart };
        if (m.players.every(p => m.answers[p.slot])) revealQuestion(W, c.st, t);
    });
    res.json({ ok: true });
}));

app.post('/api/puzzle', h(async (req, res) => {
    await mutate((W, t) => {
        const c = ctx(W, req.body);
        const m = c.st.match;
        if (!m || m.phase !== 'puzzle' || !m.puzzle[c.slot]) bad('No puzzle running', 409);
        const ps = m.puzzle[c.slot];
        if (ps.done) return;
        ps.w = Math.max(ps.w, Math.min(50, Number(req.body.w) || 0));
        ps.mistakes = Math.max(ps.mistakes, Number(req.body.mistakes) || 0);
        ps.hints = Math.max(ps.hints, Number(req.body.hints) || 0);
        if (req.body.done) {
            ps.done = true;
            ps.w = Number(req.body.words) || ps.w;
            ps.finishMs = t - m.phaseStart;
            ps.points = puzzlePoints(W, ps);
        }
        if (m.players.every(p => m.puzzle[p.slot].done)) finishMatch(W, c.st, t);
    });
    res.json({ ok: true });
}));

app.post('/api/evaluation', h(async (req, res) => {
    const out = await mutate((W, t) => {
        const empId = cleanId(req.body.empId);
        const p = W.db.players[empId];
        if (!p) bad('Unknown player');
        const ratings = {};
        for (const q of C(W).evalQuestions) {
            const v = Math.round(Number(req.body.ratings && req.body.ratings[q.id]));
            if (!(v >= 1 && v <= 5)) bad('Please rate every question');
            ratings[q.id] = v;
        }
        const iso = new Date(t).toISOString();
        W.db.evaluations[empId] = { empId, ratings, comment: clean(req.body.comment, 1000), at: iso };
        p.updatedAt = iso;
        const lb = leaderboard(W);
        return { ok: true, rank: (lb.find(r => r.empId === empId) || {}).rank || null, total: playerTotals(W, p).score, players: lb.length };
    });
    res.json(out);
}));

/* ═════════════════════════ Admin API ═════════════════════════ */

const admin = express.Router();
admin.use((req, res, next) => {
    const pin = String(req.get('x-admin-pin') || req.query.pin || '');
    loadWorld()
        .then(W => (pin && pin === String(S(W).adminPin) ? next() : res.status(401).json({ error: 'Wrong PIN' })))
        .catch(err => { console.error(err); res.status(err.status || 500).json({ error: err.status ? err.message : `Server error: ${err.message}` }); });
});

function lanIps() {
    return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}
function deviceLinks(W, base) {
    const out = [];
    for (let i = 1; i <= S(W).stations; i++) {
        for (const s of SLOTS) out.push([`Screen ${i} · iPad ${s}`, `/?station=${i}&device=${s}`]);
        out.push([`Big screen ${i}`, `/screen.html?station=${i}`]);
    }
    return out.map(([label, p]) => ({ label, url: base + p }));
}
function baseUrl(req) {
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
    const host = req.get('x-forwarded-host') || req.get('host') || '';
    if (/^(localhost|127\.|\[::1\])/.test(host)) return `http://${lanIps()[0] || 'localhost'}:${host.split(':')[1] || 80}`;
    return `${req.protocol}://${host}`;
}

admin.get('/state', h(async (req, res) => {
    const W = await mutate(W => W); // also catches up on timers
    const seen = await store.hgetall('seen');
    const lb = leaderboard(W);
    const ranks = Object.fromEntries(lb.map(r => [r.empId, r.rank]));
    const links = req.query.links ? await Promise.all(deviceLinks(W, baseUrl(req)).map(async l => ({ ...l, qr: await QRCode.toString(l.url, { type: 'svg', margin: 1 }) }))) : null;
    res.json({
        serverNow: Date.now(),
        storage: store.kind,
        pinFromEnv: Boolean(ENV_PIN),
        settings: S(W),
        content: C(W),
        links,
        leaderboard: lb,
        stations: Object.fromEntries(Object.values(W.stations).map(st => [st.id, publicStation(W, st, ranks, seen)])),
        players: Object.values(W.db.players).map(p => ({
            ...publicPlayer(W, p, ranks), station: p.station,
            adjust: playerTotals(W, p).adjust, adjustments: p.adjustments || [], matches: p.matches || [],
            evaluated: Boolean(W.db.evaluations[p.empId]), evaluation: W.db.evaluations[p.empId] || null,
            createdAt: p.createdAt, updatedAt: p.updatedAt
        })),
        matches: W.db.matches.slice(-200).reverse(),
        evaluations: Object.keys(W.db.evaluations).length
    });
}));

admin.put('/settings', h(async (req, res) => {
    const settings = await mutate((W) => {
        const next = { ...S(W) };
        for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
            if (!(k in req.body)) continue;
            const v = req.body[k];
            if (typeof def === 'number') { const n = Number(v); if (Number.isFinite(n) && n >= 0) next[k] = n; }
            else if (typeof def === 'boolean') next[k] = Boolean(v);
            else next[k] = clean(v, 40);
        }
        if (!next.adminPin || ENV_PIN) next.adminPin = ENV_PIN || S(W).adminPin;
        next.stations = Math.max(1, Math.min(8, Math.round(next.stations)));
        next.pollMs = Math.max(500, Math.min(5000, Math.round(next.pollMs)));
        if (!['best', 'sum'].includes(next.scoreMode)) next.scoreMode = 'best';
        if (!['en', 'ar'].includes(next.defaultLang)) next.defaultLang = 'en';
        W.config.settings = next;
        for (let i = 1; i <= next.stations; i++) station(W, i);
        return next;
    });
    res.json({ ok: true, settings });
}));

admin.put('/content', h(async (req, res) => {
    const c = req.body;
    const err = validateContent(c);
    if (err) bad(err);
    await mutate((W) => { W.config.content = c; W.config.contentVersion = Date.now(); });
    res.json({ ok: true, content: c });
}));

admin.post('/content/restore', h(async (req, res) => {
    await mutate((W) => { W.config.content = defaultContent(); W.config.contentVersion = Date.now(); });
    res.json({ ok: true });
}));

const withPlayer = (W, empId) => {
    const p = W.db.players[cleanId(empId)];
    if (!p) bad('Unknown player');
    return p;
};

admin.post('/player/update', h(async (req, res) => {
    await mutate((W, t) => {
        const id = cleanId(req.body.empId);
        const p = withPlayer(W, id);
        const name = clean(req.body.name, 60);
        const newId = cleanId(req.body.newEmpId || id);
        if (name.length >= 2) p.name = name;
        if (newId && newId !== id) {
            if (W.db.players[newId]) bad('That employee ID already exists');
            p.empId = newId;
            W.db.players[newId] = p;
            delete W.db.players[id];
            if (W.db.evaluations[id]) { W.db.evaluations[newId] = { ...W.db.evaluations[id], empId: newId }; delete W.db.evaluations[id]; }
            for (const m of W.db.matches) for (const mp of m.players) if (mp.empId === id) mp.empId = newId;
        }
        for (const st of Object.values(W.stations)) for (const s of SLOTS) {
            const d = st.devices[s];
            if (d && d.empId === id) { d.empId = p.empId; d.name = p.name; }
        }
        p.updatedAt = new Date(t).toISOString();
    });
    res.json({ ok: true });
}));

admin.post('/player/adjust', h(async (req, res) => {
    await mutate((W, t) => {
        const p = withPlayer(W, req.body.empId);
        const delta = Math.round(Number(req.body.delta));
        if (!Number.isFinite(delta) || !delta) bad('Enter a points value');
        p.adjustments = p.adjustments || [];
        p.adjustments.push({ delta, reason: clean(req.body.reason, 120), at: new Date(t).toISOString() });
        p.updatedAt = new Date(t).toISOString();
    });
    res.json({ ok: true });
}));

admin.post('/player/clear-adjustments', h(async (req, res) => {
    await mutate((W) => { withPlayer(W, req.body.empId).adjustments = []; });
    res.json({ ok: true });
}));

admin.post('/player/reset-scores', h(async (req, res) => {
    await mutate((W) => { const p = withPlayer(W, req.body.empId); p.matches = []; p.adjustments = []; });
    res.json({ ok: true });
}));

admin.post('/player/delete', h(async (req, res) => {
    await mutate((W) => {
        const id = cleanId(req.body.empId);
        delete W.db.players[id];
        delete W.db.evaluations[id];
        for (const st of Object.values(W.stations)) for (const s of SLOTS) if (st.devices[s] && st.devices[s].empId === id) st.devices[s] = null;
    });
    res.json({ ok: true });
}));

admin.post('/player/add', h(async (req, res) => {
    await mutate((W, t) => {
        const name = clean(req.body.name, 60);
        const empId = cleanId(req.body.empId);
        if (name.length < 2 || !empId) bad('Name and employee ID are required');
        if (W.db.players[empId]) bad('That employee ID already exists');
        const iso = new Date(t).toISOString();
        W.db.players[empId] = { empId, name, station: '', matches: [], adjustments: [], createdAt: iso, updatedAt: iso };
    });
    res.json({ ok: true });
}));

admin.post('/match/delete', h(async (req, res) => {
    await mutate((W) => {
        const id = String(req.body.id);
        W.db.matches = W.db.matches.filter(m => m.id !== id);
        for (const p of Object.values(W.db.players)) p.matches = (p.matches || []).filter(m => m.id !== id);
    });
    res.json({ ok: true });
}));

admin.post('/evaluation/delete', h(async (req, res) => {
    await mutate((W) => { delete W.db.evaluations[cleanId(req.body.empId)]; });
    res.json({ ok: true });
}));

admin.post('/station', h(async (req, res) => {
    await mutate((W, t) => {
        const st = W.stations[clean(req.body.station, 4)];
        if (!st) bad('Unknown station');
        const m = st.match;
        switch (req.body.action) {
            case 'start': { const err = startMatch(W, st, req.body.game, SLOTS, t); if (err) bad(err); break; }
            case 'skip':
                if (!m) bad('No match running');
                m.deadline = t;           // the next advance runs this phase's transition now
                advanceStation(W, st, t);
                break;
            case 'extend':
                if (!m || m.phase === 'done') bad('Nothing to extend');
                m.deadline += 15000;
                break;
            case 'finish':
                if (!m) bad('No match running');
                if (m.type !== 'puzzle' && m.phase === 'question') revealQuestion(W, st, t);
                finishMatch(W, st, t);
                break;
            case 'abort': st.match = null; break;
            case 'kick': {
                const s = slotOf(req.body.slot);
                if (!s) bad('Pick a device');
                if (m && m.players.some(p => p.slot === s) && m.phase !== 'done') st.match = null;
                st.devices[s] = null;
                st.proposal = null;
                break;
            }
            case 'reset': st.match = null; st.devices = { A: null, B: null }; st.proposal = null; break;
            case 'clearProposal': st.proposal = null; break;
            default: bad('Unknown action');
        }
    });
    res.json({ ok: true });
}));

async function sendWorkbook(res, opts) {
    const W = await loadWorld();
    const wb = await buildWorkbook(W, opts);
    const stamp = new Date(Date.now() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 16).replace(/[:T]/g, '-');
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Roadshow Results ${stamp}.xlsx"`
    });
    res.send(Buffer.from(await wb.xlsx.writeBuffer()));
}

admin.get('/export.xlsx', h(async (req, res) => sendWorkbook(res)));
admin.post('/export.xlsx', h(async (req, res) => {
    const exclude = Array.isArray(req.body.exclude) ? req.body.exclude.map(cleanId) : [];
    const extra = (Array.isArray(req.body.extra) ? req.body.extra : [])
        .map(x => ({ name: clean(x.name, 60), empId: cleanId(x.empId), points: Math.round(Number(x.points) || 0) }))
        .filter(x => x.name.length >= 1)
        .slice(0, 500);
    return sendWorkbook(res, { exclude, extra });
}));

admin.post('/reset', h(async (req, res) => {
    const backup = `backup:${Date.now()}`;
    await mutate(async (W) => {
        await store.mset({ [backup]: JSON.stringify(W.db) });
        W.db = { players: {}, evaluations: {}, matches: [] };
        for (const st of Object.values(W.stations)) { st.match = null; st.devices = { A: null, B: null }; st.proposal = null; }
    });
    res.json({ ok: true, backup });
}));

admin.get('/backups', h(async (req, res) => {
    const keys = (await store.keys('backup:*')).sort().reverse().slice(0, 30);
    const values = keys.length ? await store.mget(keys) : [];
    res.json({
        backups: keys.map((key, i) => {
            let db = {};
            try { db = JSON.parse(values[i]) || {}; } catch (e) { /* skip */ }
            const players = Object.values(db.players || {});
            return {
                key, at: new Date(Number(key.split(':').pop())).toISOString(),
                players: players.length, matches: (db.matches || []).length, evaluations: Object.keys(db.evaluations || {}).length,
                names: players.map(p => p.name)
            };
        })
    });
}));

// Bring a backup back by merging it into the current results (anything played since is kept).
admin.post('/restore', h(async (req, res) => {
    const key = String(req.body.key || '');
    if (!/^backup:\d+$/.test(key)) bad('Pick a backup');
    const exclude = new Set((Array.isArray(req.body.exclude) ? req.body.exclude : []).map(cleanId));
    const [raw] = await store.mget([key]);
    if (!raw) bad('Backup not found', 404);
    const old = JSON.parse(raw);
    const out = await mutate((W) => {
        let players = 0, matches = 0, evaluations = 0;
        for (const p of Object.values(old.players || {})) {
            if (exclude.has(p.empId)) continue;
            const cur = W.db.players[p.empId];
            if (!cur) { W.db.players[p.empId] = p; players++; continue; }
            const have = new Set((cur.matches || []).map(m => m.id));
            cur.matches = [...(cur.matches || []), ...(p.matches || []).filter(m => !have.has(m.id))];
            const haveAdj = new Set((cur.adjustments || []).map(a => a.at + a.delta));
            cur.adjustments = [...(cur.adjustments || []), ...(p.adjustments || []).filter(a => !haveAdj.has(a.at + a.delta))];
            if (p.createdAt && (!cur.createdAt || p.createdAt < cur.createdAt)) cur.createdAt = p.createdAt;
            players++;
        }
        for (const [id, e] of Object.entries(old.evaluations || {})) {
            if (exclude.has(id) || W.db.evaluations[id]) continue;
            W.db.evaluations[id] = e;
            evaluations++;
        }
        const have = new Set(W.db.matches.map(m => m.id));
        for (const m of old.matches || []) {
            if (have.has(m.id) || m.players.every(p => exclude.has(p.empId))) continue;
            W.db.matches.push(m);
            matches++;
        }
        W.db.matches.sort((a, b) => String(a.at).localeCompare(String(b.at)));
        return { players, matches, evaluations };
    });
    res.json({ ok: true, restored: out });
}));

app.use('/api/admin', admin);

module.exports = { app, store, loadWorld, buildWorkbook, deviceLinks, lanIps, setOnDbSaved: (fn) => { onDbSaved = fn; } };
