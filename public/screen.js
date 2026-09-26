(() => {
    const params = new URLSearchParams(location.search);
    const stationId = params.get('station') || '1';

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const first = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).join(' ');
    const initial = (name) => (String(name || '?').trim()[0] || '?').toUpperCase();
    const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

    const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>';
    const TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';

    let content = null;
    let snap = null;
    let offset = 0;
    let prevScores = {};
    let lastLeft = '', lastRight = '';

    $('stationPill').innerHTML = `Screen ${esc(stationId)}`;

    const gameById = (id) => content && content.games.find(g => g.id === id);
    function gameName(id) {
        const g = gameById(id);
        if (!g) return '';
        const u = content.units.find(x => x.id === g.unit);
        return !u || u.en.title === g.en.title ? g.en.title : `${u.en.title} · ${g.en.title}`;
    }
    const serverNow = () => Date.now() + offset;

    /* ───────── Leaderboard ───────── */
    function boardHtml(lb, rowsCount, compact) {
        const S = snap.settings;
        if (!lb.length) {
            return `<div class="empty-board"><div><b>Be the first on the board!</b><span>Sign in on an iPad to start playing</span></div></div>`;
        }
        const changed = (r) => (prevScores[r.empId] !== undefined && prevScores[r.empId] !== r.score) || (prevScores[r.empId] === undefined && Object.keys(prevScores).length > 0);
        const idTxt = (r) => (S.showEmployeeIds ? `#${esc(r.empId)}` : '');
        if (compact) {
            return `<div class="rows">${lb.slice(0, rowsCount).map(r => `
                <div class="row">
                    <span class="rk">${r.rank}</span>
                    <span class="nm">${esc(r.name)}</span>
                    <span class="gm">${r.wins}W</span>
                    <span class="pts">${r.score}</span>
                </div>`).join('')}</div>`;
        }
        const pod = (r, place) => r ? `
            <div class="pod p${place} ${changed(r) ? 'flash' : ''}">
                <div class="medal">${place}</div>
                <div class="nm">${esc(first(r.name))}</div>
                <div class="id">${idTxt(r)}${idTxt(r) ? ' · ' : ''}${r.wins} wins</div>
                <div class="pts">${r.score}<small>pts</small></div>
            </div>` : `
            <div class="pod p${place} empty"><div class="medal">${place}</div><div class="nm">—</div><div class="pts">0<small>pts</small></div></div>`;
        const rows = lb.slice(3, 3 + rowsCount).map(r => `
            <div class="row ${changed(r) ? 'flash' : ''}">
                <span class="rk">${r.rank}</span>
                <span class="nm">${esc(r.name)}${S.showEmployeeIds ? `<small>#${esc(r.empId)}</small>` : ''}</span>
                <span class="gm">${r.wins}W · ${r.losses}L</span>
                <span class="pts">${r.score}</span>
            </div>`).join('');
        return `<div class="podium">${pod(lb[1], 2)}${pod(lb[0], 1)}${pod(lb[2], 3)}</div><div class="rows">${rows}</div>`;
    }

    /* ───────── Live match ───────── */
    function duelHtml(m, st) {
        const leader = m.players.length === 2 && m.scores[m.players[0].slot] !== m.scores[m.players[1].slot]
            ? (m.scores[m.players[0].slot] > m.scores[m.players[1].slot] ? m.players[0].slot : m.players[1].slot) : null;
        const f = (p, right) => {
            const ps = m.puzzle && m.puzzle[p.slot];
            const answered = m.phase === 'question' && m.answered[p.slot];
            const status = m.phase === 'question' ? (answered ? '✓ Answered' : 'Thinking…')
                : ps ? (ps.done ? `✓ Finished · ${ps.mistakes} mistakes` : `${ps.w} words · ${ps.mistakes} mistakes`)
                : `iPad ${p.slot}`;
            const score = m.type === 'puzzle' ? (ps && ps.done ? ps.points : '–') : m.scores[p.slot];
            return `
            <div class="fighter ${right ? 'right' : ''} ${answered ? 'answered' : ''} ${leader === p.slot ? 'lead' : ''}">
                <span class="avatar">${esc(initial(p.name))}</span>
                <div class="who-t"><div class="nm">${esc(first((st.devices[p.slot] || p).name))}</div><div class="st">${esc(status)}</div></div>
                <span class="sc">${score}</span>
            </div>`;
        };
        if (m.players.length < 2) return `<div class="duel solo">${f(m.players[0], false)}</div>`;
        return `<div class="duel">${f(m.players[0], false)}<span class="vsb">VS</span>${f(m.players[1], true)}</div>`;
    }

    function matchHtml(m, st) {
        const title = gameName(m.game);
        if (m.phase === 'countdown') {
            const names = m.players.map(p => esc(first(p.name))).join(' <em>vs</em> ');
            return `${duelHtml(m, st)}
            <div class="center-stage"><div>
                <div class="k">${esc(title)}</div>
                <h2>${names}</h2>
                <div class="bigc" data-deadline="${m.deadline}">${Math.max(0, Math.ceil((m.deadline - serverNow()) / 1000))}</div>
            </div></div>`;
        }
        if (m.phase === 'done') {
            const r = m.result;
            const solo = m.players.length < 2;
            const w = m.players.find(p => p.slot === r.winner);
            const head = solo ? 'Game complete' : r.winner === 'draw' ? "It's a draw!" : 'Winner';
            const boxes = m.players.map(p => `
                <div class="res-box ${r.winner === p.slot ? 'win' : ''}">
                    <b>${esc(first(p.name))}</b>
                    <div class="p">${r.final[p.slot]}</div>
                    <small>${r.base[p.slot]} pts${r.bonus[p.slot] ? ` + ${r.bonus[p.slot]} bonus` : ''}</small>
                </div>`).join('');
            return `
            <div class="center-stage"><div>
                <div class="k">${esc(title)}</div>
                <h2>${esc(head)}</h2>
                ${w ? `<div class="winner-name">${TROPHY.replace('<svg', '<svg width="0.8em" height="0.8em" style="vertical-align:-0.08em;margin-inline-end:.2em"')}${esc(first(w.name))}</div>` : ''}
                <div class="res-row">${boxes}</div>
            </div></div>`;
        }
        if (m.type === 'puzzle') {
            const words = content.puzzle.en.length;
            const lanes = m.players.map(p => {
                const ps = m.puzzle[p.slot] || { w: 0 };
                const pct = ps.done ? 100 : Math.round((ps.w / words) * 100);
                return `
                <div class="lane ${ps.done ? 'done' : ''}">
                    <div class="ln"><span>${esc(first(p.name))}</span><small>${ps.done ? `Finished in ${Math.round(ps.finishMs / 1000)}s` : `${ps.w} / ${words} words`}</small></div>
                    <div class="track"><span style="width:${pct}%"></span></div>
                </div>`;
            }).join('');
            return `${duelHtml(m, st)}
            <div class="qhead"><span>${esc(title)} · Puzzle race</span><span class="tnum" data-deadline="${m.deadline}" data-fmt="mmss"></span></div>
            <div class="tbar" data-deadline="${m.deadline}" data-total="${snap.settings.puzzleSeconds * 1000}"><span></span></div>
            <div class="center-stage"><div class="pz-lanes">${lanes}</div></div>`;
        }

        const g = gameById(m.game);
        const q = g && m.question && g.questions.find(x => x.id === m.question.qid);
        if (!q) return duelHtml(m, st);
        const rv = m.phase === 'reveal' ? m.reveal : null;
        const opts = m.question.order.map((oi, pos) => {
            let cls = 'opt';
            let who = '';
            if (rv) {
                cls += oi === rv.correct ? ' ok' : ' dim';
                who = m.players.filter(p => rv.picks[p.slot] === oi)
                    .map(p => `<span class="who ${oi === rv.correct ? '' : 'bad'}">${esc(first(p.name).split(' ')[0])}${rv.gained[p.slot] ? ` +${rv.gained[p.slot]}` : ''}</span>`).join('');
                if (rv.e && oi === rv.correct) { /* explanation shown on the iPads */ }
            }
            return `<div class="${cls}"><span class="k">${KEYS[pos]}</span><span class="tx">${esc(q.en.o[oi])}</span>${who}</div>`;
        }).join('');
        return `${duelHtml(m, st)}
        <div class="qhead">
            <span>${esc(title)} · Question <b>${m.qIndex + 1}</b> / ${m.qTotal}</span>
            ${rv ? '<span class="tnum">✓</span>' : `<span class="tnum" data-deadline="${m.deadline}" data-urgent></span>`}
        </div>
        ${rv ? '<div class="tbar"><span style="width:0"></span></div>' : `<div class="tbar" data-deadline="${m.deadline}" data-total="${snap.settings.questionSeconds * 1000}"><span></span></div>`}
        <div class="qtext">${esc(q.en.q)}</div>
        <div class="opts">${opts}</div>`;
    }

    /* ───────── Lobby (right column when idle) ───────── */
    function lobbyCard(st, slot) {
        const d = st.devices[slot];
        const head = `<div class="ipad-head"><span class="ipad-tag">iPad ${slot}</span>${d ? '<span class="live">READY</span>' : ''}</div>`;
        if (!d) {
            return `<div class="ipad panel">${head}
                <div class="idle"><div class="icon">${PLAY_ICON}</div><b>Waiting for a player</b><span>Sign in on this iPad to play</span></div></div>`;
        }
        const p = st.proposal;
        const chal = p && p.by === slot ? `<div class="challenge">Challenging to ${esc(gameName(p.game))}…</div>` : '';
        return `<div class="ipad panel">${head}
            <div class="who">
                <span class="avatar">${esc(initial(d.name))}</span>
                <div><div class="nm">${esc(first(d.name))}</div><div class="sub">${d.total || 0} pts · ${d.wins || 0}W ${d.losses || 0}L${d.rank ? ` · #${d.rank}` : ''}</div></div>
            </div>${chal}</div>`;
    }

    /* ───────── Render ───────── */
    function render() {
        if (!snap || !content) return;
        const st = snap.stations[stationId];
        const lb = snap.leaderboard || [];
        const m = st && st.match;
        const S = snap.settings;

        const titleEl = $('title');
        if (m) { titleEl.innerHTML = 'Live <em>match</em>'; $('titleAr').textContent = 'Same question · fastest correct answer wins'; }
        else { titleEl.innerHTML = 'Leader<em>board</em>'; $('titleAr').textContent = 'Compliance Roadshow'; }

        let left, right;
        if (m) {
            left = matchHtml(m, st);
            right = `<div class="section-label"><span>Leaderboard</span><span></span></div>
                <div class="mini panel">${S.showLeaderboard ? boardHtml(lb, 8, true) : '<div class="empty-board"><div><b>Stay tuned</b></div></div>'}</div>`;
        } else {
            left = `<div class="section-label"><span>Top players</span><span></span></div>
                ${S.showLeaderboard ? boardHtml(lb, S.leaderboardRows || 7, false) : '<div class="empty-board"><div><b>Results coming soon</b></div></div>'}`;
            right = `<div class="section-label"><span>At this screen</span><span></span></div>
                ${st ? lobbyCard(st, 'A') + lobbyCard(st, 'B') : ''}`;
        }
        if (left !== lastLeft) { $('left').innerHTML = left; lastLeft = left; }
        if (right !== lastRight) { $('right').innerHTML = right; lastRight = right; }
        $('right').style.gridTemplateRows = m ? 'auto 1fr' : 'auto 1fr 1fr';
        document.querySelector('main').classList.toggle('is-match', Boolean(m));

        $('count').textContent = lb.length;
        $('countLabel').textContent = lb.length === 1 ? 'player' : 'players';
        prevScores = Object.fromEntries(lb.map(r => [r.empId, r.score]));
        tick();
    }

    function tick() {
        document.querySelectorAll('[data-deadline]').forEach(el => {
            const left = Math.max(0, Number(el.dataset.deadline) - serverNow());
            if (el.classList.contains('tbar')) el.firstElementChild.style.width = `${(left / (Number(el.dataset.total) || 1)) * 100}%`;
            else if (el.dataset.fmt === 'mmss') { const s = Math.ceil(left / 1000); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
            else el.textContent = Math.ceil(left / 1000);
            if (el.dataset.urgent !== undefined) el.classList.toggle('urgent', left < 5000);
        });
    }
    setInterval(tick, 200);

    function setConn(ok) {
        $('dot').classList.toggle('off', !ok);
        $('conn').textContent = ok ? 'Live' : 'Reconnecting';
    }

    async function loadContent() {
        const res = await fetch('/api/content', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.games) {
            $('left').innerHTML = `<div class="empty-board"><div><b>Can't load the games</b><span>${esc(data.error || `HTTP ${res.status}`)}</span></div></div>`;
            throw new Error(data.error || 'load failed');
        }
        content = data;
        lastLeft = lastRight = '';
    }

    let fails = 0;
    async function poll() {
        try {
            const res = await fetch('/api/state', { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            fails = 0;
            setConn(true);
            offset = data.serverNow - Date.now();
            if (!content || content.version !== data.contentVersion) await loadContent();
            snap = data;
            render();
        } catch (e) {
            if (++fails >= 3) setConn(false);
        } finally {
            setTimeout(poll, (snap && snap.settings.pollMs) || 1000);
        }
    }
    function connect() { poll(); }

    function clock() { $('clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    clock();
    setInterval(clock, 10000);
    connect();
})();
