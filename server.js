// Compliance Roadshow Games — booth server.
// One laptop runs this; iPads, big screens and the admin panel connect over Wi-Fi.
//   iPad:   /?station=1&device=A        Big screen: /screen.html?station=1
//   Admin:  /admin.html

const express = require('express');
const ExcelJS = require('exceljs');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const XLSX_FILE = path.join(DATA_DIR, 'Roadshow Results.xlsx');
const SLOTS = ['A', 'B'];

fs.mkdirSync(DATA_DIR, { recursive: true });

/* ═════════════════════════ Config: settings + editable content ═════════════════════════ */

const uid = (p = '') => p + crypto.randomBytes(4).toString('hex');

const DEFAULT_SETTINGS = {
    adminPin: process.env.ADMIN_PIN || '2026',
    stations: 2,
    // Scoring
    pointsPerCorrect: 10,
    speedBonus: 5,           // extra points for answering instantly, scaled down to 0 at the time limit
    winBonus: 20,
    drawBonus: 10,
    scoreMode: 'best',       // 'best' = best result per game counts, 'sum' = every match adds up
    // Timing
    countdownSeconds: 3,
    questionSeconds: 20,
    revealSeconds: 5,
    resultSeconds: 20,
    // Match rules
    questionsPerMatch: 0,    // 0 = all questions in the game
    shuffleQuestions: false,
    shuffleOptions: true,
    allowSolo: true,
    // Puzzle
    puzzleMax: 100,
    puzzleMin: 20,
    puzzleMistakePenalty: 5,
    puzzleHintPenalty: 10,
    puzzleFreeSeconds: 60,
    puzzleSecondsPerPoint: 5,
    puzzleSeconds: 240,
    puzzlePointsPerWord: 10, // for words solved when time runs out
    // Session
    requireEvaluation: true,
    thanksSeconds: 20,
    showArabic: false,
    defaultLang: 'en',
    // Leaderboard
    leaderboardRows: 7,
    showLeaderboard: true,
    showEmployeeIds: true
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

function readJson(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeJson(file, data) {
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

let config = readJson(CONFIG_FILE, null);
if (!config) config = { settings: { ...DEFAULT_SETTINGS }, content: defaultContent() };
config.settings = { ...DEFAULT_SETTINGS, ...config.settings };
let contentVersion = Date.now();
const saveConfig = () => writeJson(CONFIG_FILE, config);
saveConfig();

const S = () => config.settings;
const C = () => config.content;
const gameById = (id) => C().games.find(g => g.id === id);
const unitById = (id) => C().units.find(u => u.id === id);
const gameLabel = (g) => {
    const unit = unitById(g.unit);
    const u = unit ? unit.en.title : '';
    return !u || u === g.en.title ? g.en.title : `${u} – ${g.en.title}`;
};
const activeQuestions = (g) => (g.questions || []).filter(q => q.enabled !== false);

/* ═════════════════════════ Players database ═════════════════════════ */

function emptyDb() { return { players: {}, evaluations: {}, matches: [] }; }
let db = { ...emptyDb(), ...readJson(DB_FILE, {}) };

let excelTimer = null;
function saveDb() {
    writeJson(DB_FILE, db);
    clearTimeout(excelTimer);
    excelTimer = setTimeout(writeExcel, 800);
}

function playerTotals(p) {
    const byGame = {};
    for (const m of p.matches || []) {
        if (S().scoreMode === 'sum') byGame[m.game] = (byGame[m.game] || 0) + m.points;
        else byGame[m.game] = Math.max(byGame[m.game] ?? -Infinity, m.points);
    }
    const adjust = (p.adjustments || []).reduce((n, a) => n + a.delta, 0);
    const score = Object.values(byGame).reduce((n, v) => n + v, 0) + adjust;
    const ms = p.matches || [];
    return {
        score, adjust, byGame,
        played: ms.length,
        wins: ms.filter(m => m.outcome === 'win').length,
        losses: ms.filter(m => m.outcome === 'loss').length,
        draws: ms.filter(m => m.outcome === 'draw').length,
        time: ms.reduce((n, m) => n + (m.timeMs || 0), 0)
    };
}

function leaderboard() {
    return Object.values(db.players)
        .map(p => ({ empId: p.empId, name: p.name, station: p.station, ...playerTotals(p) }))
        .filter(r => r.played > 0 || r.adjust !== 0)
        .sort((a, b) => b.score - a.score || b.wins - a.wins || a.time - b.time || a.name.localeCompare(b.name))
        .map((r, i) => ({ ...r, rank: i + 1 }));
}
const rankOf = (empId) => (leaderboard().find(r => r.empId === empId) || {}).rank || null;

function publicPlayer(p) {
    if (!p) return null;
    const t = playerTotals(p);
    return { empId: p.empId, name: p.name, total: t.score, played: t.played, wins: t.wins, losses: t.losses, draws: t.draws, byGame: t.byGame, rank: rankOf(p.empId) };
}

/* ═════════════════════════ Stations & match engine ═════════════════════════ */

const stations = {};
function station(id) {
    id = String(id);
    if (!stations[id]) stations[id] = { id, devices: { A: null, B: null }, proposal: null, match: null };
    return stations[id];
}
for (let i = 1; i <= S().stations; i++) station(i);

const now = () => Date.now();
const iso = () => new Date().toISOString();
const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

function clearTimer(st) { if (st.timer) { clearTimeout(st.timer); st.timer = null; } }
function schedule(st, ms, fn) { clearTimer(st); st.timer = setTimeout(() => { st.timer = null; fn(); broadcast(); }, Math.max(0, ms)); }

function startMatch(st, gameId, slots) {
    const g = gameById(gameId);
    if (!g || g.enabled === false) return 'Game not available';
    const players = slots.filter(s => st.devices[s]);
    if (!players.length) return 'No players at this station';

    let questions = [];
    if (g.type !== 'puzzle') {
        let qs = activeQuestions(g);
        if (!qs.length) return 'This game has no questions';
        if (S().shuffleQuestions) qs = shuffle(qs);
        if (S().questionsPerMatch > 0) qs = qs.slice(0, S().questionsPerMatch);
        questions = qs.map(q => {
            const idx = q.en.o.map((_, i) => i);
            return { qid: q.id, order: q.fixed || !S().shuffleOptions ? idx : shuffle(idx) };
        });
    }

    clearTimer(st);
    st.proposal = null;
    st.match = {
        id: uid('m'),
        game: g.id,
        type: g.type,
        players: players.map(s => ({ slot: s, empId: st.devices[s].empId, name: st.devices[s].name })),
        questions,
        qIndex: -1,
        phase: 'countdown',
        phaseStart: now(),
        deadline: now() + S().countdownSeconds * 1000,
        startedAt: now(),
        scores: Object.fromEntries(players.map(s => [s, 0])),
        correct: Object.fromEntries(players.map(s => [s, 0])),
        answers: {},
        reveal: null,
        puzzle: g.type === 'puzzle' ? Object.fromEntries(players.map(s => [s, { w: 0, mistakes: 0, hints: 0, done: false, finishMs: null, points: 0 }])) : null,
        result: null
    };
    schedule(st, S().countdownSeconds * 1000, () => (g.type === 'puzzle' ? startPuzzle(st) : nextQuestion(st)));
    return null;
}

function nextQuestion(st) {
    const m = st.match;
    if (!m) return;
    m.qIndex++;
    if (m.qIndex >= m.questions.length) return finishMatch(st);
    m.phase = 'question';
    m.answers = {};
    m.reveal = null;
    m.phaseStart = now();
    m.deadline = now() + S().questionSeconds * 1000;
    schedule(st, S().questionSeconds * 1000, () => revealQuestion(st));
}

function revealQuestion(st) {
    const m = st.match;
    if (!m || m.phase !== 'question') return;
    const g = gameById(m.game);
    const q = g && g.questions.find(x => x.id === m.questions[m.qIndex].qid);
    const limit = S().questionSeconds * 1000;
    const gained = {};
    for (const p of m.players) {
        const ans = m.answers[p.slot];
        const ok = ans && q && ans.opt === q.a;
        gained[p.slot] = ok ? S().pointsPerCorrect + Math.round(S().speedBonus * Math.max(0, 1 - ans.ms / limit)) : 0;
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
    m.phaseStart = now();
    m.deadline = now() + S().revealSeconds * 1000;
    schedule(st, S().revealSeconds * 1000, () => nextQuestion(st));
}

function startPuzzle(st) {
    const m = st.match;
    if (!m) return;
    m.phase = 'puzzle';
    m.phaseStart = now();
    m.deadline = now() + S().puzzleSeconds * 1000;
    schedule(st, S().puzzleSeconds * 1000, () => finishMatch(st));
}

function puzzlePoints(ps, words) {
    const s = S();
    if (!ps.done) return Math.min(s.puzzleMax, ps.w * s.puzzlePointsPerWord);
    const secs = Math.floor(ps.finishMs / 1000);
    const timePenalty = Math.floor(Math.max(0, secs - s.puzzleFreeSeconds) / Math.max(1, s.puzzleSecondsPerPoint));
    return Math.max(s.puzzleMin, s.puzzleMax - ps.mistakes * s.puzzleMistakePenalty - ps.hints * s.puzzleHintPenalty - timePenalty);
}

function finishMatch(st, { record = true } = {}) {
    const m = st.match;
    if (!m || m.phase === 'done') return;
    clearTimer(st);
    if (m.type === 'puzzle') {
        for (const p of m.players) {
            const ps = m.puzzle[p.slot];
            ps.points = puzzlePoints(ps);
            m.scores[p.slot] = ps.points;
        }
    }
    const base = { ...m.scores };
    let winner = null;
    if (m.players.length === 2) {
        const [a, b] = m.players.map(p => p.slot);
        if (base[a] === base[b]) {
            // Tie-break the puzzle on finishing time
            if (m.type === 'puzzle' && m.puzzle[a].done && m.puzzle[b].done && m.puzzle[a].finishMs !== m.puzzle[b].finishMs) {
                winner = m.puzzle[a].finishMs < m.puzzle[b].finishMs ? a : b;
            } else winner = 'draw';
        } else winner = base[a] > base[b] ? a : b;
    }
    const bonus = {};
    for (const p of m.players) {
        bonus[p.slot] = winner === p.slot ? S().winBonus : winner === 'draw' ? S().drawBonus : 0;
    }
    const final = Object.fromEntries(m.players.map(p => [p.slot, base[p.slot] + bonus[p.slot]]));
    m.phase = 'done';
    m.result = { winner, base, bonus, final, recorded: record };
    m.phaseStart = now();
    m.deadline = now() + S().resultSeconds * 1000;

    if (record) {
        const timeMs = now() - m.startedAt;
        const entry = {
            id: m.id, game: m.game, station: st.id, at: iso(), timeMs,
            players: m.players.map(p => ({
                slot: p.slot, empId: p.empId, name: p.name,
                points: final[p.slot], base: base[p.slot], bonus: bonus[p.slot],
                correct: m.type === 'puzzle' ? null : m.correct[p.slot],
                total: m.type === 'puzzle' ? null : m.questions.length,
                outcome: m.players.length < 2 ? 'solo' : winner === 'draw' ? 'draw' : winner === p.slot ? 'win' : 'loss'
            }))
        };
        db.matches.push(entry);
        for (const p of entry.players) {
            const pl = db.players[p.empId];
            if (!pl) continue;
            pl.matches = pl.matches || [];
            const opp = entry.players.find(o => o.empId !== p.empId);
            pl.matches.push({ id: entry.id, game: entry.game, points: p.points, outcome: p.outcome, opponent: opp ? opp.name : null, timeMs, at: entry.at });
            pl.updatedAt = iso();
        }
        saveDb();
    }
    schedule(st, S().resultSeconds * 1000, () => { if (st.match && st.match.id === m.id) st.match = null; });
}

function abortMatch(st) {
    clearTimer(st);
    st.match = null;
}

/* Public view of a station — hides answers until they are revealed. */
function publicStation(st) {
    const devices = {};
    for (const s of SLOTS) {
        const d = st.devices[s];
        devices[s] = d ? { ...publicPlayer(db.players[d.empId]), empId: d.empId, name: d.name, online: (conns[`${st.id}-${s}`] || 0) > 0 } : null;
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
            puzzle: m.puzzle ? Object.fromEntries(Object.entries(m.puzzle).map(([k, v]) => [k, { w: v.w, mistakes: v.mistakes, hints: v.hints, done: v.done, finishMs: v.finishMs, points: v.points }])) : null,
            result: m.result
        };
    }
    return { id: st.id, devices, proposal: st.proposal, match };
}

/* ═════════════════════════ Live updates (Server-Sent Events) ═════════════════════════ */

const clients = new Set();
const conns = {}; // "station-slot" -> open iPad streams
let pushTimer = null;

function publicSettings() {
    const s = S();
    return {
        pointsPerCorrect: s.pointsPerCorrect, speedBonus: s.speedBonus, winBonus: s.winBonus, drawBonus: s.drawBonus,
        questionSeconds: s.questionSeconds, revealSeconds: s.revealSeconds, puzzleSeconds: s.puzzleSeconds,
        puzzleMax: s.puzzleMax, allowSolo: s.allowSolo, requireEvaluation: s.requireEvaluation,
        thanksSeconds: s.thanksSeconds, showArabic: s.showArabic, defaultLang: s.defaultLang,
        leaderboardRows: s.leaderboardRows, showLeaderboard: s.showLeaderboard, showEmployeeIds: s.showEmployeeIds,
        stations: s.stations
    };
}

function snapshot() {
    return {
        serverNow: now(),
        contentVersion,
        settings: publicSettings(),
        stations: Object.fromEntries(Object.values(stations).map(st => [st.id, publicStation(st)])),
        leaderboard: leaderboard(),
        players: Object.keys(db.players).length
    };
}

function broadcast() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
        const msg = `data: ${JSON.stringify(snapshot())}\n\n`;
        for (const c of clients) c.res.write(msg);
    }, 40);
}

/* ═════════════════════════ Excel ═════════════════════════ */

const fmtTime = (ms) => {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
// ExcelJS stores dates as UTC; shift so Excel shows the laptop's local time.
const xlDate = (v) => { if (!v) return null; const d = new Date(v); return new Date(d.getTime() - d.getTimezoneOffset() * 60000); };

async function buildWorkbook({ exclude = [], extra = [] } = {}) {
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
    const games = C().games;

    const ws = wb.addWorksheet('Results');
    ws.columns = [
        { header: 'Rank', key: 'rank', width: 7 },
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Employee ID', key: 'empId', width: 15 },
        { header: 'Screen', key: 'station', width: 9 },
        ...games.map(g => ({ header: gameLabel(g), key: `g_${g.id}`, width: 22 })),
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
    // Players left out of this export, plus names typed in by the admin just for the sheet.
    const rows = Object.values(db.players).filter(p => !excluded.has(p.empId)).map(p => {
        const t = playerTotals(p);
        const row = {
            name: p.name, empId: p.empId, station: p.station || '',
            adjust: t.adjust || '', total: t.score, played: t.played, wins: t.wins, losses: t.losses, draws: t.draws,
            evaluated: db.evaluations[p.empId] ? 'Yes' : 'No', created: xlDate(p.createdAt), updated: xlDate(p.updatedAt),
            _time: t.time, _ranked: t.played > 0 || t.adjust !== 0
        };
        for (const g of games) row[`g_${g.id}`] = t.byGame[g.id] ?? '';
        return row;
    });
    for (const x of extra) {
        rows.push({ name: x.name, empId: x.empId, station: '', total: x.points, played: '', wins: '', losses: '', draws: '', evaluated: '', _time: 0, _ranked: true });
    }
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
    const eq = C().evalQuestions;
    ev.columns = [
        { header: 'Name', key: 'name', width: 28 },
        { header: 'Employee ID', key: 'empId', width: 15 },
        { header: 'Screen', key: 'station', width: 9 },
        ...eq.map(q => ({ header: `${q.en} (1–5)`, key: `r_${q.id}`, width: 30 })),
        { header: 'Average', key: 'avg', width: 10 },
        { header: 'Comments', key: 'comment', width: 50 },
        { header: 'Submitted', key: 'at', width: 20 }
    ];
    for (const e of Object.values(db.evaluations).filter(e => !excluded.has(e.empId)).sort((a, b) => a.at.localeCompare(b.at))) {
        const p = db.players[e.empId] || {};
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
    for (const m of db.matches.filter(m => m.players.some(p => !excluded.has(p.empId)))) {
        const [a, b] = m.players;
        const g = gameById(m.game);
        const w = m.players.find(p => p.outcome === 'win');
        mt.addRow({
            at: xlDate(m.at), station: m.station, game: g ? gameLabel(g) : m.game,
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
    for (const p of Object.values(db.players).filter(p => !excluded.has(p.empId))) for (const a of p.adjustments || []) adj.addRow({ at: xlDate(a.at), name: p.name, empId: p.empId, delta: a.delta, reason: a.reason || '' });
    adj.getColumn('at').numFmt = 'yyyy-mm-dd hh:mm';
    styleHeader(adj);
    return wb;
}

async function writeExcel() {
    try {
        await (await buildWorkbook()).xlsx.writeFile(XLSX_FILE);
    } catch (err) {
        console.warn(`Could not update "${path.basename(XLSX_FILE)}" (${err.code || err.message}). Close it in Excel; it refreshes on the next result.`);
    }
}

/* ═════════════════════════ HTTP ═════════════════════════ */

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const clean = (v, max = 80) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (v) => clean(v, 30).replace(/[^\p{L}\p{N}\-_]/gu, '');
const slotOf = (v) => (SLOTS.includes(String(v).toUpperCase()) ? String(v).toUpperCase() : null);
const fail = (res, msg, code = 400) => res.status(code).json({ error: msg });

// Public content: everything the iPads need to render, minus the answers.
app.get('/api/content', (req, res) => {
    const c = C();
    res.json({
        version: contentVersion,
        text: c.text, units: c.units, tags: c.tags, puzzle: c.puzzle, evalQuestions: c.evalQuestions,
        games: c.games.map(g => ({
            id: g.id, unit: g.unit, type: g.type, enabled: g.enabled !== false, en: g.en, ar: g.ar,
            count: g.type === 'puzzle' ? c.puzzle.en.length : activeQuestions(g).length,
            questions: activeQuestions(g).map(q => ({ id: q.id, tag: q.tag, en: { q: q.en.q, o: q.en.o }, ar: { q: q.ar.q, o: q.ar.o } }))
        }))
    });
});

app.get('/api/state', (req, res) => res.json(snapshot()));

app.get('/api/stream', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const key = req.query.station && slotOf(req.query.device) ? `${clean(req.query.station, 4)}-${slotOf(req.query.device)}` : null;
    const client = { res, key };
    clients.add(client);
    if (key) { conns[key] = (conns[key] || 0) + 1; broadcast(); }
    res.write(`data: ${JSON.stringify(snapshot())}\n\n`);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
        clearInterval(ping);
        clients.delete(client);
        if (key) { conns[key] = Math.max(0, (conns[key] || 1) - 1); broadcast(); }
    });
});

/* Player actions */
function ctx(req, res) {
    const st = stations[clean(req.body.station, 4)];
    const slot = slotOf(req.body.device);
    if (!st || !slot) { fail(res, 'Unknown station or device'); return null; }
    return { st, slot, me: st.devices[slot] };
}

app.post('/api/login', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    const name = clean(req.body.name, 60);
    const empId = cleanId(req.body.empId);
    if (name.length < 2 || !empId) return fail(res, 'Name and employee ID are required');
    const other = SLOTS.find(s => s !== c.slot);
    if (c.st.devices[other] && c.st.devices[other].empId === empId) return fail(res, 'This employee ID is already signed in on the other iPad', 409);

    let p = db.players[empId];
    const returning = Boolean(p);
    if (!p) p = db.players[empId] = { empId, name, station: c.st.id, matches: [], adjustments: [], createdAt: iso() };
    p.name = name;
    p.station = c.st.id;
    p.updatedAt = iso();
    saveDb();

    if (c.st.match && c.st.match.phase !== 'done' && c.me && c.me.empId !== empId) abortMatch(c.st);
    c.st.devices[c.slot] = { empId, name, since: now() };
    if (c.st.proposal && c.st.proposal.by === c.slot) c.st.proposal = null;
    broadcast();
    res.json({ player: publicPlayer(p), returning });
});

app.post('/api/logout', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    if (c.st.match && c.st.match.phase !== 'done' && c.st.match.players.some(p => p.slot === c.slot)) abortMatch(c.st);
    c.st.devices[c.slot] = null;
    c.st.proposal = null;
    broadcast();
    res.json({ ok: true });
});

app.post('/api/propose', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    if (!c.me) return fail(res, 'Sign in first');
    const g = gameById(req.body.game);
    if (!g || g.enabled === false) return fail(res, 'Game not available');
    if (c.st.match && c.st.match.phase !== 'done') return fail(res, 'A match is already running', 409);
    const other = SLOTS.find(s => s !== c.slot);
    const solo = Boolean(req.body.solo) || !c.st.devices[other];
    if (solo) {
        if (!S().allowSolo && !c.st.devices[other]) return fail(res, 'Waiting for an opponent', 409);
        const err = startMatch(c.st, g.id, [c.slot]);
        if (err) return fail(res, err);
    } else {
        c.st.proposal = { game: g.id, by: c.slot, at: now() };
        if (c.st.match && c.st.match.phase === 'done') c.st.match = null;
    }
    broadcast();
    res.json({ ok: true });
});

app.post('/api/respond', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    const p = c.st.proposal;
    if (!p || p.by === c.slot) return fail(res, 'Nothing to respond to');
    if (req.body.accept) {
        const err = startMatch(c.st, p.game, SLOTS);
        if (err) return fail(res, err);
    } else {
        c.st.proposal = null;
    }
    broadcast();
    res.json({ ok: true });
});

app.post('/api/cancel-proposal', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    if (c.st.proposal && c.st.proposal.by === c.slot) c.st.proposal = null;
    broadcast();
    res.json({ ok: true });
});

app.post('/api/answer', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    const m = c.st.match;
    if (!m || m.phase !== 'question' || Number(req.body.qIndex) !== m.qIndex) return fail(res, 'Too late', 409);
    if (!m.players.some(p => p.slot === c.slot) || m.answers[c.slot]) return fail(res, 'Already answered', 409);
    const opt = Number(req.body.opt);
    m.answers[c.slot] = { opt, ms: now() - m.phaseStart };
    if (m.players.every(p => m.answers[p.slot])) revealQuestion(c.st);
    broadcast();
    res.json({ ok: true });
});

app.post('/api/puzzle', (req, res) => {
    const c = ctx(req, res); if (!c) return;
    const m = c.st.match;
    if (!m || m.phase !== 'puzzle' || !m.puzzle[c.slot]) return fail(res, 'No puzzle running', 409);
    const ps = m.puzzle[c.slot];
    if (ps.done) return res.json({ ok: true });
    // Each player may play the puzzle in a different language, so word counts can differ.
    ps.w = Math.max(ps.w, Math.min(50, Number(req.body.w) || 0));
    ps.mistakes = Math.max(ps.mistakes, Number(req.body.mistakes) || 0);
    ps.hints = Math.max(ps.hints, Number(req.body.hints) || 0);
    if (req.body.done) {
        ps.done = true;
        ps.w = Number(req.body.words) || ps.w;
        ps.finishMs = now() - m.phaseStart;
        ps.points = puzzlePoints(ps);
    }
    if (m.players.every(p => m.puzzle[p.slot].done)) finishMatch(c.st);
    broadcast();
    res.json({ ok: true });
});

app.post('/api/evaluation', (req, res) => {
    const empId = cleanId(req.body.empId);
    const p = db.players[empId];
    if (!p) return fail(res, 'Unknown player');
    const ratings = {};
    for (const q of C().evalQuestions) {
        const v = Math.round(Number(req.body.ratings && req.body.ratings[q.id]));
        if (!(v >= 1 && v <= 5)) return fail(res, 'Please rate every question');
        ratings[q.id] = v;
    }
    db.evaluations[empId] = { empId, ratings, comment: clean(req.body.comment, 1000), at: iso() };
    p.updatedAt = iso();
    saveDb();
    broadcast();
    res.json({ ok: true, rank: rankOf(empId), total: playerTotals(p).score, players: leaderboard().length });
});

/* ═════════════════════════ Admin API ═════════════════════════ */

const admin = express.Router();
admin.use((req, res, next) => {
    const pin = req.get('x-admin-pin') || req.query.pin;
    if (String(pin) !== String(S().adminPin)) return fail(res, 'Wrong PIN', 401);
    next();
});

function lanIps() {
    return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
}

function deviceLinks(base) {
    const out = [];
    for (let i = 1; i <= S().stations; i++) {
        for (const s of SLOTS) out.push([`Screen ${i} · iPad ${s}`, `/?station=${i}&device=${s}`]);
        out.push([`Big screen ${i}`, `/screen.html?station=${i}`]);
    }
    return out.map(([label, p]) => ({ label, url: base + p }));
}

admin.get('/state', async (req, res) => {
    const host = req.get('host') || '';
    const isLocal = /^(localhost|127\.|\[::1\])/.test(host);
    const base = process.env.PUBLIC_URL || (isLocal ? `http://${lanIps()[0] || 'localhost'}:${PORT}` : `${req.protocol}://${host}`);
    const links = await Promise.all(deviceLinks(base).map(async l => ({ ...l, qr: await QRCode.toString(l.url, { type: 'svg', margin: 1 }) })));
    const lb = Object.fromEntries(leaderboard().map(r => [r.empId, r.rank]));
    res.json({
        serverNow: now(),
        settings: S(),
        content: C(),
        links,
        leaderboard: leaderboard(),
        stations: Object.fromEntries(Object.values(stations).map(st => [st.id, publicStation(st)])),
        players: Object.values(db.players).map(p => ({
            ...publicPlayer(p), station: p.station, rank: lb[p.empId] || null,
            adjust: playerTotals(p).adjust, adjustments: p.adjustments || [], matches: p.matches || [],
            evaluated: Boolean(db.evaluations[p.empId]), evaluation: db.evaluations[p.empId] || null,
            createdAt: p.createdAt, updatedAt: p.updatedAt
        })),
        matches: db.matches.slice(-200).reverse(),
        evaluations: Object.keys(db.evaluations).length
    });
});

admin.put('/settings', (req, res) => {
    const next = { ...S() };
    for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
        if (!(k in req.body)) continue;
        const v = req.body[k];
        if (typeof def === 'number') { const n = Number(v); if (Number.isFinite(n) && n >= 0) next[k] = n; }
        else if (typeof def === 'boolean') next[k] = Boolean(v);
        else next[k] = clean(v, 40);
    }
    if (!next.adminPin) next.adminPin = S().adminPin;
    next.stations = Math.max(1, Math.min(8, Math.round(next.stations)));
    if (!['best', 'sum'].includes(next.scoreMode)) next.scoreMode = 'best';
    if (!['en', 'ar'].includes(next.defaultLang)) next.defaultLang = 'en';
    config.settings = next;
    for (let i = 1; i <= next.stations; i++) station(i);
    saveConfig();
    saveDb();
    broadcast();
    res.json({ ok: true, settings: next });
});

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

admin.put('/content', (req, res) => {
    const c = req.body;
    const err = validateContent(c);
    if (err) return fail(res, err);
    config.content = c;
    contentVersion = Date.now();
    saveConfig();
    broadcast();
    res.json({ ok: true, content: c });
});

admin.post('/content/restore', (req, res) => {
    config.content = defaultContent();
    contentVersion = Date.now();
    saveConfig();
    broadcast();
    res.json({ ok: true });
});

/* Players */
admin.post('/player/update', (req, res) => {
    const id = cleanId(req.body.empId);
    const p = db.players[id];
    if (!p) return fail(res, 'Unknown player');
    const name = clean(req.body.name, 60);
    const newId = cleanId(req.body.newEmpId || id);
    if (name.length >= 2) p.name = name;
    if (newId && newId !== id) {
        if (db.players[newId]) return fail(res, 'That employee ID already exists');
        p.empId = newId;
        db.players[newId] = p;
        delete db.players[id];
        if (db.evaluations[id]) { db.evaluations[newId] = { ...db.evaluations[id], empId: newId }; delete db.evaluations[id]; }
        for (const m of db.matches) for (const mp of m.players) if (mp.empId === id) mp.empId = newId;
    }
    for (const st of Object.values(stations)) for (const s of SLOTS) {
        const d = st.devices[s];
        if (d && (d.empId === id)) { d.empId = p.empId; d.name = p.name; }
    }
    p.updatedAt = iso();
    saveDb();
    broadcast();
    res.json({ ok: true });
});

admin.post('/player/adjust', (req, res) => {
    const p = db.players[cleanId(req.body.empId)];
    const delta = Math.round(Number(req.body.delta));
    if (!p || !Number.isFinite(delta) || !delta) return fail(res, 'Enter a points value');
    p.adjustments = p.adjustments || [];
    p.adjustments.push({ delta, reason: clean(req.body.reason, 120), at: iso() });
    p.updatedAt = iso();
    saveDb();
    broadcast();
    res.json({ ok: true });
});

admin.post('/player/clear-adjustments', (req, res) => {
    const p = db.players[cleanId(req.body.empId)];
    if (!p) return fail(res, 'Unknown player');
    p.adjustments = [];
    saveDb(); broadcast();
    res.json({ ok: true });
});

admin.post('/player/reset-scores', (req, res) => {
    const p = db.players[cleanId(req.body.empId)];
    if (!p) return fail(res, 'Unknown player');
    p.matches = [];
    p.adjustments = [];
    saveDb(); broadcast();
    res.json({ ok: true });
});

admin.post('/player/delete', (req, res) => {
    const id = cleanId(req.body.empId);
    delete db.players[id];
    delete db.evaluations[id];
    for (const st of Object.values(stations)) for (const s of SLOTS) if (st.devices[s] && st.devices[s].empId === id) st.devices[s] = null;
    saveDb(); broadcast();
    res.json({ ok: true });
});

admin.post('/player/add', (req, res) => {
    const name = clean(req.body.name, 60);
    const empId = cleanId(req.body.empId);
    if (name.length < 2 || !empId) return fail(res, 'Name and employee ID are required');
    if (db.players[empId]) return fail(res, 'That employee ID already exists');
    db.players[empId] = { empId, name, station: '', matches: [], adjustments: [], createdAt: iso(), updatedAt: iso() };
    saveDb(); broadcast();
    res.json({ ok: true });
});

admin.post('/match/delete', (req, res) => {
    const id = String(req.body.id);
    db.matches = db.matches.filter(m => m.id !== id);
    for (const p of Object.values(db.players)) p.matches = (p.matches || []).filter(m => m.id !== id);
    saveDb(); broadcast();
    res.json({ ok: true });
});

/* Live station control */
admin.post('/station', (req, res) => {
    const st = stations[clean(req.body.station, 4)];
    if (!st) return fail(res, 'Unknown station');
    const action = req.body.action;
    const m = st.match;
    switch (action) {
        case 'start': {
            const err = startMatch(st, req.body.game, SLOTS);
            if (err) return fail(res, err);
            break;
        }
        case 'skip':
            if (!m) return fail(res, 'No match running');
            if (m.phase === 'countdown') { clearTimer(st); m.type === 'puzzle' ? startPuzzle(st) : nextQuestion(st); }
            else if (m.phase === 'question') revealQuestion(st);
            else if (m.phase === 'reveal') { clearTimer(st); nextQuestion(st); }
            else if (m.phase === 'puzzle') finishMatch(st);
            break;
        case 'extend':
            if (!m || !['question', 'puzzle', 'countdown', 'reveal'].includes(m.phase)) return fail(res, 'Nothing to extend');
            m.deadline += 15000;
            {
                const phase = m.phase;
                schedule(st, m.deadline - now(), () => {
                    if (phase === 'question') revealQuestion(st);
                    else if (phase === 'reveal') nextQuestion(st);
                    else if (phase === 'countdown') (m.type === 'puzzle' ? startPuzzle(st) : nextQuestion(st));
                    else finishMatch(st);
                });
            }
            break;
        case 'finish':
            if (!m) return fail(res, 'No match running');
            if (m.type !== 'puzzle' && m.phase === 'question') revealQuestion(st);
            finishMatch(st);
            break;
        case 'abort':
            abortMatch(st);
            break;
        case 'kick': {
            const s = slotOf(req.body.slot);
            if (!s) return fail(res, 'Pick a device');
            if (m && m.players.some(p => p.slot === s) && m.phase !== 'done') abortMatch(st);
            st.devices[s] = null;
            st.proposal = null;
            break;
        }
        case 'reset':
            abortMatch(st);
            st.devices = { A: null, B: null };
            st.proposal = null;
            break;
        case 'clearProposal':
            st.proposal = null;
            break;
        default:
            return fail(res, 'Unknown action');
    }
    broadcast();
    res.json({ ok: true });
});

async function sendWorkbook(res, opts) {
    const wb = await buildWorkbook(opts);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Roadshow Results ${stamp}.xlsx"`
    });
    await wb.xlsx.write(res);
    res.end();
}

admin.get('/export.xlsx', (req, res) => sendWorkbook(res));

// Custom export: leave some players out and/or add names that only appear in this sheet.
admin.post('/export.xlsx', (req, res) => {
    const exclude = Array.isArray(req.body.exclude) ? req.body.exclude.map(cleanId) : [];
    const extra = (Array.isArray(req.body.extra) ? req.body.extra : [])
        .map(x => ({ name: clean(x.name, 60), empId: cleanId(x.empId), points: Math.round(Number(x.points) || 0) }))
        .filter(x => x.name.length >= 1)
        .slice(0, 500);
    return sendWorkbook(res, { exclude, extra });
});

admin.post('/reset', (req, res) => {
    const backup = path.join(DATA_DIR, `backup-${Date.now()}.json`);
    writeJson(backup, db);
    db = emptyDb();
    for (const st of Object.values(stations)) { abortMatch(st); st.devices = { A: null, B: null }; st.proposal = null; }
    saveDb(); broadcast();
    res.json({ ok: true, backup: path.basename(backup) });
});

admin.post('/evaluation/delete', (req, res) => {
    delete db.evaluations[cleanId(req.body.empId)];
    saveDb(); broadcast();
    res.json({ ok: true });
});

app.use('/api/admin', admin);

app.listen(PORT, '0.0.0.0', () => {
    const host = lanIps()[0] || 'localhost';
    const line = '─'.repeat(66);
    console.log(`\n${line}\n  Compliance Roadshow Games is running\n${line}`);
    for (const l of deviceLinks(`http://${host}:${PORT}`)) console.log(`  ${l.label.padEnd(20)} ${l.url}`);
    console.log(`  ${'Admin panel'.padEnd(20)} http://${host}:${PORT}/admin.html   (PIN ${S().adminPin})`);
    console.log(`  ${'Excel file (auto)'.padEnd(20)} ${XLSX_FILE}\n${line}\n`);
    writeExcel();
});
