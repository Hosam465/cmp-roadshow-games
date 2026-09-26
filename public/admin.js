(() => {
    const app = document.getElementById('app');
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const fmtTime = (ms) => { if (!ms) return '–'; const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–');
    const uid = (p) => p + Math.random().toString(16).slice(2, 10);

    let pin = '';
    try { pin = sessionStorage.getItem('roadshow-pin') || ''; } catch (e) {}
    let data = null;
    let draft = { c: null, s: null };
    let offset = 0;
    let tab = 'live';
    try { tab = sessionStorage.getItem('roadshow-admin-tab') || 'live'; } catch (e) {}
    let selGame = null;
    let expanded = null;
    let armed = null;
    let armTimer = null;
    let search = '';
    let saveError = '';
    let pollTimer = null;

    const TABS = [
        ['live', 'Live control'], ['players', 'Players & scores'], ['content', 'Games & questions'],
        ['rules', 'Scoring & rules'], ['text', 'Text & evaluation'], ['data', 'Devices & data']
    ];
    const ICONS = ['megaphone', 'shield', 'scale', 'puzzle', 'star4'];
    const TYPES = { quiz: 'Quick Quiz', wwyd: 'What Would You Do?', puzzle: 'Puzzle' };

    /* ───────── API ───────── */
    async function api(path, opts = {}) {
        const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin } });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { const e = new Error('pin'); e.pin = true; throw e; }
        if (!res.ok) throw new Error(body.error || 'Request failed');
        return body;
    }
    const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body || {}) });
    const put = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body || {}) });

    function toast(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toast.t);
        toast.t = setTimeout(() => el.classList.remove('show'), 2600);
    }

    const contentDirty = () => data && draft.c && !same(draft.c, data.content);
    const settingsDirty = () => data && draft.s && !same(draft.s, data.settings);

    async function load(force) {
        try {
            const fresh = await api('/api/admin/state');
            // Keep the admin's unsaved edits; otherwise follow the server.
            const cDirty = contentDirty(), sDirty = settingsDirty();
            data = fresh;
            offset = fresh.serverNow - Date.now();
            if (!draft.c || !cDirty || force === 'content') draft.c = clone(fresh.content);
            if (!draft.s || !sDirty || force === 'settings') draft.s = clone(fresh.settings);
            const el = document.activeElement;
            const typing = el && app.contains(el) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
            if (!typing || force) render();
            else updateSaveBar();
        } catch (e) {
            if (e.pin) { pin = ''; gate('Wrong PIN.'); }
        }
    }

    function arm(key) {
        if (armed === key) { armed = null; return true; }
        armed = key;
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { armed = null; render(); }, 4000);
        render();
        return false;
    }
    const armLabel = (key, label, confirm = 'Confirm?') => (armed === key ? confirm : label);

    /* ───────── Paths for two-way binding ───────── */
    function getPath(root, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), root); }
    function setPath(root, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const obj = keys.reduce((o, k) => o[k], root);
        obj[last] = value;
    }
    const rootOf = (b) => (b.startsWith('s:') ? draft.s : draft.c);
    const pathOf = (b) => b.slice(2);

    /* ───────── Gate ───────── */
    function gate(err) {
        clearInterval(pollTimer);
        document.getElementById('lockBtn').hidden = true;
        document.getElementById('excelBtn').hidden = true;
        app.innerHTML = `
        <form class="auth panel gate" id="pinForm">
            <img src="assets/logo.webp" alt="SAB" class="auth-logo">
            <h1 class="auth-title">Admin panel</h1>
            <p class="auth-lead">Enter the admin PIN to control the games.</p>
            <label class="field"><span class="field-label">PIN</span>
                <span class="field-box"><input id="pin" type="password" inputmode="numeric" autocomplete="off" required></span></label>
            ${err ? `<p class="form-error">${esc(err)}</p>` : ''}
            <button class="btn wide" type="submit">Unlock</button>
        </form>`;
        document.getElementById('pin').focus();
    }

    function start() {
        document.getElementById('lockBtn').hidden = false;
        const x = document.getElementById('excelBtn');
        x.hidden = false;
        x.href = `/api/admin/export.xlsx?pin=${encodeURIComponent(pin)}`;
        load(true);
        clearInterval(pollTimer);
        pollTimer = setInterval(() => load(), 2500);
    }

    /* ───────── Render ───────── */
    function render() {
        if (!data) return;
        const y = window.scrollY;
        const body = {
            live: renderLive, players: renderPlayers, content: renderContent,
            rules: renderRules, text: renderText, data: renderData
        }[tab]();
        const live = Object.values(data.stations).filter(s => s.match && s.match.phase !== 'done').length;
        app.innerHTML = `
        <div class="admin-top">
            <div><h1>Roadshow control room</h1><p>Everything here updates the iPads and big screens instantly.</p></div>
        </div>
        <div class="kpis">
            <div class="kpi panel"><small>Players</small><b>${data.players.length}</b></div>
            <div class="kpi panel"><small>Matches played</small><b>${data.matches.length}</b></div>
            <div class="kpi panel"><small>Live matches</small><b>${live}</b></div>
            <div class="kpi panel"><small>Evaluations</small><b>${data.evaluations}</b></div>
        </div>
        <nav class="tabs">${TABS.map(([id, label]) => `<button class="tab ${tab === id ? 'on' : ''}" data-tab="${id}">${label}${(id === 'content' || id === 'text') && contentDirty() ? '<span class="dot"></span>' : ''}${id === 'rules' && settingsDirty() ? '<span class="dot"></span>' : ''}</button>`).join('')}</nav>
        ${body}
        <div id="saveBarHost"></div>`;
        updateSaveBar();
        window.scrollTo(0, y);
        tick();
    }

    function updateSaveBar() {
        const host = document.getElementById('saveBarHost');
        if (!host) return;
        const c = contentDirty(), s = settingsDirty();
        if (!c && !s) { host.innerHTML = ''; return; }
        host.innerHTML = `
        <div class="save-bar">
            <span>${c && s ? 'Unsaved content & settings' : c ? 'Unsaved content changes' : 'Unsaved settings'}</span>
            ${saveError ? `<span style="color:#C3121A">${esc(saveError)}</span>` : ''}
            <button class="b" data-act="discard">Discard</button>
            <button class="b red" data-act="save">Save & publish</button>
        </div>`;
    }

    /* ═════════ Live ═════════ */
    function gameOptions(selected) {
        return data.content.games.filter(g => g.enabled !== false).map(g => {
            const u = data.content.units.find(x => x.id === g.unit);
            return `<option value="${esc(g.id)}" ${g.id === selected ? 'selected' : ''}>${esc(u ? `${u.en.title} – ${g.en.title}` : g.en.title)}</option>`;
        }).join('');
    }
    const gameLabel = (id) => {
        const g = data.content.games.find(x => x.id === id);
        if (!g) return id;
        const u = data.content.units.find(x => x.id === g.unit);
        return u && u.en.title !== g.en.title ? `${u.en.title} – ${g.en.title}` : g.en.title;
    };

    function renderLive() {
        const cards = Object.values(data.stations).map(st => {
            const dev = (slot) => {
                const d = st.devices[slot];
                if (!d) return `<div class="dev"><span class="av empty">${slot}</span><div class="inf"><b style="color:var(--text-3)">iPad ${slot} — empty</b><small>Waiting for sign-in</small></div></div>`;
                return `
                <div class="dev">
                    <span class="av">${esc((d.name[0] || '?').toUpperCase())}</span>
                    <div class="inf"><b>${esc(d.name)} <span class="odot ${d.online ? 'on' : ''}" title="${d.online ? 'Connected' : 'Offline'}"></span></b>
                        <small>iPad ${slot} · #${esc(d.empId)} · ${d.total || 0} pts · ${d.wins || 0}W ${d.losses || 0}L</small></div>
                    <button class="b danger" data-act="kick" data-st="${st.id}" data-slot="${slot}">${armLabel(`kick-${st.id}-${slot}`, 'Sign out')}</button>
                </div>`;
            };
            const m = st.match;
            let matchBox = '';
            if (m) {
                const phase = { countdown: 'Starting', question: `Question ${m.qIndex + 1}/${m.qTotal}`, reveal: `Answer shown ${m.qIndex + 1}/${m.qTotal}`, puzzle: 'Puzzle race', done: 'Finished' }[m.phase];
                matchBox = `
                <div class="match-box">
                    <div class="mh"><span>${esc(gameLabel(m.game))}</span><span class="pill live">${esc(phase)}</span></div>
                    <div class="scores">${m.players.map(p => `<span>${esc(p.name.split(' ')[0])}<b>${m.result ? m.result.final[p.slot] : m.type === 'puzzle' ? (m.puzzle[p.slot].done ? m.puzzle[p.slot].points : `${m.puzzle[p.slot].w}w`) : m.scores[p.slot]}</b></span>`).join('')}
                        ${m.phase !== 'done' ? `<span>⏱ <b class="tnum" data-deadline="${m.deadline}">–</b></span>` : ''}</div>
                    ${m.phase !== 'done' ? `
                    <div class="btns">
                        <button class="b" data-act="station" data-st="${st.id}" data-a="skip">${m.phase === 'question' ? 'Reveal answer now' : m.phase === 'puzzle' ? 'End puzzle now' : 'Skip ahead'}</button>
                        <button class="b" data-act="station" data-st="${st.id}" data-a="extend">+15 seconds</button>
                        <button class="b ok" data-act="station" data-st="${st.id}" data-a="finish">Finish & record</button>
                        <button class="b danger" data-act="abort" data-st="${st.id}">${armLabel(`abort-${st.id}`, 'Cancel match (no points)')}</button>
                    </div>` : `<div class="btns"><button class="b" data-act="station" data-st="${st.id}" data-a="abort">Clear result screen</button></div>`}
                </div>`;
            }
            const prop = st.proposal ? `<div class="dev"><div class="inf"><b>Challenge pending</b><small>iPad ${st.proposal.by} wants to play ${esc(gameLabel(st.proposal.game))}</small></div><button class="b" data-act="station" data-st="${st.id}" data-a="clearProposal">Clear</button></div>` : '';
            const canStart = (st.devices.A || st.devices.B) && !(m && m.phase !== 'done');
            return `
            <div class="st-card panel">
                <div class="st-head"><h3>Screen ${st.id}</h3>
                    <button class="b danger" data-act="reset-station" data-st="${st.id}">${armLabel(`reset-${st.id}`, 'Reset screen', 'Sign out both?')}</button></div>
                ${dev('A')}${dev('B')}${prop}${matchBox}
                <div class="start-row">
                    <select class="sel" id="start-${st.id}" ${canStart ? '' : 'disabled'}>${gameOptions()}</select>
                    <button class="b red" data-act="start" data-st="${st.id}" ${canStart ? '' : 'disabled'}>Start game</button>
                </div>
                <p class="hint">Starts the chosen game for whoever is signed in at this screen.</p>
            </div>`;
        }).join('');

        const lb = data.leaderboard.slice(0, 10).map(r => `
            <tr><td class="num">${r.rank}</td><td>${esc(r.name)}</td><td>#${esc(r.empId)}</td><td class="num">${r.wins}-${r.losses}-${r.draws}</td><td class="num"><b>${r.score}</b></td></tr>`).join('');

        const recent = data.matches.slice(0, 8).map(m => `
            <div><span>${esc(gameLabel(m.game))} · Screen ${esc(m.station)}</span><span>${m.players.map(p => `${esc(p.name.split(' ')[0])} <b>${p.points}</b>${p.outcome === 'win' ? ' 🏆' : ''}`).join(' vs ')}</span></div>`).join('');

        return `
        <div class="grid-2">${cards}</div>
        <div class="grid-2">
            <div class="box panel"><h2>Leaderboard — top 10</h2><p class="sub">Wins-Losses-Draws. Edit points in “Players & scores”.</p>
                <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>Name</th><th>ID</th><th class="num">W-L-D</th><th class="num">Points</th></tr></thead><tbody>${lb || '<tr><td colspan="5" style="color:var(--text-3)">No results yet.</td></tr>'}</tbody></table></div></div>
            <div class="box panel"><h2>Latest matches</h2><p class="sub">Full history is in “Devices & data” and the Excel file.</p>
                <div class="mini-list">${recent || '<div style="color:var(--text-3)">No matches yet.</div>'}</div></div>
        </div>`;
    }

    /* ═════════ Players ═════════ */
    function renderPlayers() {
        const q = search.trim().toLowerCase();
        const players = data.players
            .filter(p => !q || p.name.toLowerCase().includes(q) || String(p.empId).toLowerCase().includes(q))
            .sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9) || a.name.localeCompare(b.name));

        const rows = players.map(p => {
            const id = esc(p.empId);
            const open = expanded === p.empId;
            const detail = open ? `
            <tr class="detail"><td colspan="9">
                <div class="grid-3">
                    <div><div class="lbl">Matches (${p.matches.length})</div><div class="mini-list">${p.matches.slice().reverse().map(m => `
                        <div><span>${esc(gameLabel(m.game))}${m.opponent ? ` vs ${esc(m.opponent)}` : ' (solo)'} · ${fmtDate(m.at)}</span>
                        <span><b>${m.points}</b> ${m.outcome} <button class="b icon danger" data-act="del-match" data-id="${esc(m.id)}">${armLabel(`m-${m.id}`, '✕', 'Delete?')}</button></span></div>`).join('') || '<div>None</div>'}</div></div>
                    <div><div class="lbl">Point adjustments</div><div class="mini-list">${p.adjustments.map(a => `<div><span>${esc(a.reason || 'Manual')} · ${fmtDate(a.at)}</span><b>${a.delta > 0 ? '+' : ''}${a.delta}</b></div>`).join('') || '<div>None</div>'}</div>
                        ${p.adjustments.length ? `<div class="btns" style="margin-top:8px"><button class="b danger" data-act="clear-adj" data-id="${id}">${armLabel(`ca-${p.empId}`, 'Remove all adjustments')}</button></div>` : ''}</div>
                    <div><div class="lbl">Evaluation</div>${p.evaluation ? `<div class="mini-list">${data.content.evalQuestions.map(q => `<div><span>${esc(q.en)}</span><b>${p.evaluation.ratings[q.id] ?? '–'}/5</b></div>`).join('')}${p.evaluation.comment ? `<div><span>“${esc(p.evaluation.comment)}”</span></div>` : ''}</div>
                        <div class="btns" style="margin-top:8px"><button class="b danger" data-act="del-eval" data-id="${id}">${armLabel(`de-${p.empId}`, 'Delete evaluation')}</button></div>` : '<div class="mini-list"><div>Not submitted</div></div>'}</div>
                </div>
            </td></tr>` : '';
            return `
            <tr data-row="${id}">
                <td class="num">${p.rank || '–'}</td>
                <td><input class="in sm" data-field="name" value="${esc(p.name)}"></td>
                <td><input class="in sm" data-field="empId" value="${id}" style="min-width:100px"></td>
                <td class="num"><b>${p.total}</b>${p.adjust ? `<br><small style="color:var(--text-3)">${p.adjust > 0 ? '+' : ''}${p.adjust} adj.</small>` : ''}</td>
                <td class="num">${p.wins}-${p.losses}-${p.draws}</td>
                <td>${p.evaluated ? '<span class="pill on">Rated</span>' : '<span class="pill off">No</span>'}</td>
                <td><div class="adj-form"><input class="in sm" data-field="delta" type="number" placeholder="±pts"><input class="in sm reason" data-field="reason" placeholder="Reason"><button class="b" data-act="adjust" data-id="${id}">Apply</button></div></td>
                <td><div class="btns">
                    <button class="b" data-act="save-player" data-id="${id}">Save</button>
                    <button class="b" data-act="expand" data-id="${id}">${open ? 'Hide' : 'Details'}</button>
                    <button class="b danger" data-act="reset-player" data-id="${id}">${armLabel(`rp-${p.empId}`, 'Zero scores')}</button>
                    <button class="b danger" data-act="del-player" data-id="${id}">${armLabel(`dp-${p.empId}`, 'Delete')}</button>
                </div></td>
            </tr>${detail}`;
        }).join('');

        return `
        <div class="box panel">
            <h2>Players <span class="pill">${data.players.length}</span></h2>
            <p class="sub">Rename players, fix employee IDs, add or remove points (with a reason), zero their scores or delete them. Changes show on the leaderboard immediately.</p>
            <div class="btns" style="margin-bottom:14px">
                <input class="in search" id="search" placeholder="Search name or ID" value="${esc(search)}">
            </div>
            <div class="table-wrap"><table>
                <thead><tr><th class="num">#</th><th>Name</th><th>Employee ID</th><th class="num">Points</th><th class="num">W-L-D</th><th>Rated</th><th>Adjust points</th><th></th></tr></thead>
                <tbody>${rows || '<tr><td colspan="8" style="color:var(--text-3)">No players found.</td></tr>'}</tbody>
            </table></div>
        </div>
        <div class="box panel">
            <h2>Add a player manually</h2>
            <p class="sub">Useful for walk-in scores or corrections.</p>
            <div class="btns"><input class="in" id="np-name" placeholder="Full name" style="max-width:260px"><input class="in" id="np-id" placeholder="Employee ID" style="max-width:180px"><button class="b red" data-act="add-player">Add player</button></div>
        </div>`;
    }

    /* ═════════ Content ═════════ */
    function inp(bind, value, opts = {}) {
        const dir = opts.ar ? 'rtl' : 'ltr';
        if (opts.area) return `<textarea class="ta" data-bind="${bind}" dir="${dir}" rows="${opts.rows || 2}" placeholder="${esc(opts.ph || '')}">${esc(value)}</textarea>`;
        return `<input class="in ${opts.sm ? 'sm' : ''}" data-bind="${bind}" dir="${dir}" value="${esc(value)}" placeholder="${esc(opts.ph || '')}" ${opts.type ? `type="${opts.type}"` : ''}>`;
    }
    function sw(bind, checked, label) {
        return `<label class="switch"><input type="checkbox" data-bind="${bind}" ${checked ? 'checked' : ''}><span class="tr"></span>${esc(label)}</label>`;
    }

    function renderContent() {
        const c = draft.c;
        if (!selGame || !c.games.some(g => g.id === selGame)) selGame = c.games[0] && c.games[0].id;
        const tree = c.units.map((u, ui) => `
            <div class="u">
                <div class="u-t"><span>${esc(u.en.title)}</span><button class="b icon" data-act="unit-edit" data-ui="${ui}" title="Edit unit">✎</button></div>
                ${c.games.map((g, gi) => g.unit !== u.id ? '' : `
                <button class="g ${g.id === selGame ? 'on' : ''} ${g.enabled === false ? 'off' : ''}" data-act="sel-game" data-id="${esc(g.id)}">
                    <span>${esc(g.en.title)}</span><small>${g.type === 'puzzle' ? 'puzzle' : `${(g.questions || []).length} q`}</small></button>`).join('')}
                <button class="g" data-act="game-add" data-unit="${esc(u.id)}" style="color:var(--text-3)">+ Add game</button>
            </div>`).join('');

        const gi = c.games.findIndex(g => g.id === selGame);
        const g = c.games[gi];
        let editor = '<div class="box panel"><p class="sub">Pick a game on the left.</p></div>';
        if (typeof selGame === 'string' && selGame.startsWith('unit:')) editor = renderUnitEditor(Number(selGame.split(':')[1]));
        else if (g) editor = renderGameEditor(g, gi);

        return `
        <div class="editor">
            <div class="tree panel">
                ${tree}
                <button class="b" data-act="unit-add" style="width:100%;margin-top:6px">+ Add unit</button>
            </div>
            <div>${editor}</div>
        </div>`;
    }

    function renderUnitEditor(ui) {
        const u = draft.c.units[ui];
        if (!u) return '';
        const games = draft.c.games.filter(g => g.unit === u.id).length;
        return `
        <div class="box panel">
            <h2>Unit: ${esc(u.en.title)}</h2>
            <p class="sub">Units group games on the iPads.</p>
            <div class="row2"><div class="fld"><span class="lbl">Title (English)</span>${inp(`c:units.${ui}.en.title`, u.en.title)}</div><div class="fld"><span class="lbl">Title (Arabic)</span>${inp(`c:units.${ui}.ar.title`, u.ar.title, { ar: true })}</div></div>
            <div class="row2"><div class="fld"><span class="lbl">Subtitle (English)</span>${inp(`c:units.${ui}.en.sub`, u.en.sub)}</div><div class="fld"><span class="lbl">Subtitle (Arabic)</span>${inp(`c:units.${ui}.ar.sub`, u.ar.sub, { ar: true })}</div></div>
            <div class="row2">
                <div class="fld"><span class="lbl">Icon</span><select class="sel" data-bind="c:units.${ui}.icon">${ICONS.map(i => `<option ${u.icon === i ? 'selected' : ''}>${i}</option>`).join('')}</select></div>
                <div class="fld"><span class="lbl">Visible</span>${sw(`c:units.${ui}.enabled`, u.enabled !== false, 'Show this unit on the iPads')}</div>
            </div>
            <div class="btns">
                <button class="b" data-act="unit-move" data-ui="${ui}" data-d="-1">Move up</button>
                <button class="b" data-act="unit-move" data-ui="${ui}" data-d="1">Move down</button>
                <button class="b danger" data-act="unit-del" data-ui="${ui}">${armLabel(`ud-${ui}`, `Delete unit${games ? ` and its ${games} game(s)` : ''}`)}</button>
            </div>
        </div>`;
    }

    function renderGameEditor(g, gi) {
        const base = `c:games.${gi}`;
        const unitOpts = draft.c.units.map(u => `<option value="${esc(u.id)}" ${u.id === g.unit ? 'selected' : ''}>${esc(u.en.title)}</option>`).join('');
        const head = `
        <div class="box panel">
            <h2>${esc(g.en.title)} <span class="pill">${TYPES[g.type] || g.type}</span></h2>
            <p class="sub">Rename, move or hide this game. Players pick it from the iPad lobby.</p>
            <div class="row2"><div class="fld"><span class="lbl">Game name (English)</span>${inp(`${base}.en.title`, g.en.title)}</div><div class="fld"><span class="lbl">Game name (Arabic)</span>${inp(`${base}.ar.title`, g.ar.title, { ar: true })}</div></div>
            <div class="row2">
                <div class="fld"><span class="lbl">Unit</span><select class="sel" data-bind="${base}.unit">${unitOpts}</select></div>
                <div class="fld"><span class="lbl">Style</span><select class="sel" data-bind="${base}.type" ${g.type === 'puzzle' ? 'disabled' : ''}>${Object.entries(TYPES).filter(([k]) => g.type === 'puzzle' || k !== 'puzzle').map(([k, v]) => `<option value="${k}" ${g.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            </div>
            <div class="btns" style="align-items:center">
                ${sw(`${base}.enabled`, g.enabled !== false, 'Available to play')}
                <span style="flex:1"></span>
                <button class="b danger" data-act="game-del" data-gi="${gi}">${armLabel(`gd-${gi}`, 'Delete game')}</button>
            </div>
        </div>`;

        if (g.type === 'puzzle') {
            return head + `
            <div class="box panel">
                <h2>Puzzle message</h2>
                <p class="sub">Players unscramble these words letter by letter. Separate words with spaces.</p>
                <div class="fld"><span class="lbl">English words</span><input class="in" data-words="c:puzzle.en" value="${esc(draft.c.puzzle.en.join(' '))}"></div>
                <div class="fld"><span class="lbl">Arabic words</span><input class="in" dir="rtl" data-words="c:puzzle.ar" value="${esc(draft.c.puzzle.ar.join(' '))}"></div>
                <p class="hint">Points and time limit for the puzzle are in “Scoring & rules”.</p>
            </div>`;
        }

        const tags = draft.c.tags || {};
        const qs = (g.questions || []).map((q, qi) => {
            const qb = `${base}.questions.${qi}`;
            const opts = q.en.o.map((o, oi) => `
                <div class="opt-row">
                    <button class="radio ${q.a === oi ? 'on' : ''}" data-act="opt-correct" data-gi="${gi}" data-qi="${qi}" data-oi="${oi}" title="Mark as the correct answer"></button>
                    ${inp(`${qb}.en.o.${oi}`, o, { ph: `Answer ${oi + 1} (English)` })}
                    <div class="ar-o">${inp(`${qb}.ar.o.${oi}`, (q.ar.o || [])[oi] || '', { ar: true, ph: 'الإجابة بالعربية' })}</div>
                    <button class="b icon danger" data-act="opt-del" data-gi="${gi}" data-qi="${qi}" data-oi="${oi}" ${q.en.o.length <= 2 ? 'disabled' : ''} title="Remove answer">✕</button>
                </div>`).join('');
            return `
            <div class="q-card ${q.enabled === false ? 'disabled' : ''}">
                <div class="q-head">
                    <span class="q-num">Question ${qi + 1}</span>
                    <div class="btns" style="align-items:center">
                        ${sw(`${qb}.enabled`, q.enabled !== false, 'In play')}
                        <button class="b icon" data-act="q-move" data-gi="${gi}" data-qi="${qi}" data-d="-1" title="Move up">↑</button>
                        <button class="b icon" data-act="q-move" data-gi="${gi}" data-qi="${qi}" data-d="1" title="Move down">↓</button>
                        <button class="b" data-act="q-dup" data-gi="${gi}" data-qi="${qi}">Duplicate</button>
                        <button class="b danger" data-act="q-del" data-gi="${gi}" data-qi="${qi}">${armLabel(`qd-${gi}-${qi}`, 'Delete')}</button>
                    </div>
                </div>
                <div class="row2">
                    <div class="fld"><span class="lbl">Question (English)</span>${inp(`${qb}.en.q`, q.en.q, { area: true, rows: 3 })}</div>
                    <div class="fld"><span class="lbl">Question (Arabic)</span>${inp(`${qb}.ar.q`, q.ar.q, { area: true, rows: 3, ar: true })}</div>
                </div>
                <span class="lbl">Answers — tap the circle to mark the correct one</span>
                ${opts}
                <div class="btns" style="margin:4px 0 14px"><button class="b" data-act="opt-add" data-gi="${gi}" data-qi="${qi}" ${q.en.o.length >= 6 ? 'disabled' : ''}>+ Add answer</button></div>
                <div class="row2">
                    <div class="fld"><span class="lbl">Explanation after answering (English, optional)</span>${inp(`${qb}.en.e`, q.en.e || '', { area: true })}</div>
                    <div class="fld"><span class="lbl">Explanation (Arabic, optional)</span>${inp(`${qb}.ar.e`, q.ar.e || '', { area: true, ar: true })}</div>
                </div>
                <div class="btns" style="align-items:center">
                    <span class="lbl" style="margin:0">Label</span>
                    <select class="sel" data-bind="${qb}.tag" style="max-width:220px"><option value="">None</option>${Object.entries(tags).map(([k, v]) => `<option value="${k}" ${q.tag === k ? 'selected' : ''}>${esc(v.en)}</option>`).join('')}</select>
                    ${sw(`${qb}.fixed`, q.fixed, 'Keep answer order (no shuffle)')}
                </div>
            </div>`;
        }).join('');

        return head + `
        <div class="box panel">
            <h2>Questions <span class="pill">${(g.questions || []).length}</span></h2>
            <p class="sub">Edit wording in both languages, change the correct answer, add or remove answers and questions. Arabic left blank falls back to English.</p>
            ${qs}
            <div class="btns"><button class="b red" data-act="q-add" data-gi="${gi}">+ Add question</button><button class="b" data-act="q-add-tf" data-gi="${gi}">+ Add True/False question</button></div>
        </div>`;
    }

    /* ═════════ Rules ═════════ */
    function num(key, label, hint, step = 1) {
        return `<div class="set-item"><span class="lbl">${esc(label)}</span><input class="in" type="number" min="0" step="${step}" data-bind="s:${key}" data-num value="${esc(draft.s[key])}">${hint ? `<p class="hint">${esc(hint)}</p>` : ''}</div>`;
    }
    function tog(key, label, hint) {
        return `<div class="set-item">${sw(`s:${key}`, draft.s[key], label)}${hint ? `<p class="hint">${esc(hint)}</p>` : ''}</div>`;
    }
    function renderRules() {
        const s = draft.s;
        return `
        <div class="box panel"><h2>Points</h2><p class="sub">Applies to every new match. Existing scores are not recalculated.</p>
            <div class="set-grid">
                ${num('pointsPerCorrect', 'Points per correct answer', '')}
                ${num('speedBonus', 'Speed bonus (max)', 'Extra points for answering instantly, sliding to 0 at the time limit.')}
                ${num('winBonus', 'Win bonus', 'Added to the winner of a 1v1 match.')}
                ${num('drawBonus', 'Draw bonus', 'Added to both players on a tie.')}
                <div class="set-item"><span class="lbl">How totals are counted</span>
                    <select class="sel" data-bind="s:scoreMode"><option value="best" ${s.scoreMode === 'best' ? 'selected' : ''}>Best result per game</option><option value="sum" ${s.scoreMode === 'sum' ? 'selected' : ''}>Add up every match</option></select>
                    <p class="hint">“Best” stops players farming points by replaying the same game.</p></div>
            </div></div>
        <div class="box panel"><h2>Timing</h2><p class="sub">Seconds.</p>
            <div class="set-grid">
                ${num('questionSeconds', 'Time per question', '')}
                ${num('countdownSeconds', 'Countdown before a match', '')}
                ${num('revealSeconds', 'Show the answer for', 'Pause between questions.')}
                ${num('resultSeconds', 'Show match result for', 'Then the iPads return to the lobby.')}
                ${num('thanksSeconds', 'Thank-you screen', 'Before the iPad resets for the next player.')}
            </div></div>
        <div class="box panel"><h2>Match rules</h2>
            <div class="set-grid">
                ${num('questionsPerMatch', 'Questions per match', '0 = use every question in the game.')}
                ${tog('shuffleQuestions', 'Shuffle question order', 'Different order every match.')}
                ${tog('shuffleOptions', 'Shuffle answer order', 'Except questions marked “keep order”.')}
                ${tog('allowSolo', 'Allow solo play', 'Let a player play alone when no opponent is signed in.')}
                ${tog('requireEvaluation', 'Evaluation is required', 'Off = players can skip the rating when they finish.')}
            </div></div>
        <div class="box panel"><h2>Puzzle scoring</h2>
            <div class="set-grid">
                ${num('puzzleMax', 'Max points', '')}
                ${num('puzzleMin', 'Minimum points for finishing', '')}
                ${num('puzzleMistakePenalty', 'Penalty per wrong letter', '')}
                ${num('puzzleHintPenalty', 'Penalty per hint', '')}
                ${num('puzzleFreeSeconds', 'Free seconds before time penalty', '')}
                ${num('puzzleSecondsPerPoint', 'Then lose 1 point every … seconds', '')}
                ${num('puzzleSeconds', 'Time limit (seconds)', '')}
                ${num('puzzlePointsPerWord', 'Points per word if time runs out', '')}
            </div></div>
        <div class="box panel"><h2>Screens & leaderboard</h2>
            <div class="set-grid">
                ${num('stations', 'Number of screens', 'Each screen has iPad A and iPad B.')}
                ${num('leaderboardRows', 'Rows under the podium', 'On the big screen.')}
                ${tog('showLeaderboard', 'Show leaderboard on big screens', 'Turn off to hide results until the end.')}
                ${tog('showEmployeeIds', 'Show employee IDs on big screens', '')}
                ${tog('showArabic', 'Show the Arabic language button', '')}
                <div class="set-item"><span class="lbl">Default language</span><select class="sel" data-bind="s:defaultLang"><option value="en" ${s.defaultLang === 'en' ? 'selected' : ''}>English</option><option value="ar" ${s.defaultLang === 'ar' ? 'selected' : ''}>Arabic</option></select></div>
            </div></div>
        <div class="box panel"><h2>Security</h2>
            <div class="set-grid"><div class="set-item"><span class="lbl">Admin PIN</span>${inp('s:adminPin', s.adminPin)}<p class="hint">You'll need the new PIN next time you unlock.</p></div></div></div>`;
    }

    /* ═════════ Text & evaluation ═════════ */
    function renderText() {
        const c = draft.c;
        const tx = c.text;
        const eq = c.evalQuestions.map((q, i) => `
            <div class="q-card">
                <div class="q-head"><span class="q-num">Rating question ${i + 1}</span>
                    <div class="btns"><button class="b icon" data-act="eval-move" data-i="${i}" data-d="-1">↑</button><button class="b icon" data-act="eval-move" data-i="${i}" data-d="1">↓</button>
                    <button class="b danger" data-act="eval-del" data-i="${i}" ${c.evalQuestions.length <= 1 ? 'disabled' : ''}>${armLabel(`ed-${i}`, 'Delete')}</button></div></div>
                <div class="row2">${inp(`c:evalQuestions.${i}.en`, q.en, { ph: 'Question in English' })}${inp(`c:evalQuestions.${i}.ar`, q.ar, { ar: true, ph: 'السؤال بالعربية' })}</div>
            </div>`).join('');
        return `
        <div class="box panel"><h2>Event text</h2><p class="sub">Shown on the iPad sign-in and lobby screens.</p>
            <div class="row2"><div class="fld"><span class="lbl">Event name (English)</span>${inp('c:text.en.eventName', tx.en.eventName)}</div><div class="fld"><span class="lbl">Event name (Arabic)</span>${inp('c:text.ar.eventName', tx.ar.eventName, { ar: true })}</div></div>
        </div>
        <div class="box panel"><h2>Evaluation questions</h2><p class="sub">Players rate each from 1 to 5 stars when they finish. Results go to the “Evaluations” sheet in Excel.</p>
            ${eq}
            <button class="b red" data-act="eval-add">+ Add rating question</button>
        </div>
        <div class="box panel"><h2>Question labels</h2><p class="sub">Small tags shown above a question (e.g. “AML”).</p>
            ${Object.entries(c.tags || {}).map(([k, v]) => `<div class="row2 fld">${inp(`c:tags.${k}.en`, v.en)}${inp(`c:tags.${k}.ar`, v.ar, { ar: true })}</div>`).join('')}
        </div>`;
    }

    /* ═════════ Devices & data ═════════ */
    function renderData() {
        const links = data.links.map(l => `
            <div class="link"><div class="qr">${l.qr}</div>
                <div class="link-text"><b>${esc(l.label)}</b><code>${esc(l.url)}</code><a href="${esc(l.url)}" target="_blank" rel="noopener">Open</a></div></div>`).join('');
        const log = data.matches.map(m => `
            <tr><td>${fmtDate(m.at)}</td><td>${esc(m.station)}</td><td>${esc(gameLabel(m.game))}</td>
                <td>${m.players.map(p => `${esc(p.name)} <b>${p.points}</b>${p.outcome === 'win' ? ' 🏆' : ''}`).join(' vs ')}</td><td class="num">${fmtTime(m.timeMs)}</td>
                <td><button class="b icon danger" data-act="del-match" data-id="${esc(m.id)}">${armLabel(`m-${m.id}`, 'Delete', 'Confirm?')}</button></td></tr>`).join('');
        return `
        <div class="box panel"><h2>Device links</h2><p class="sub">Scan each QR code with the matching iPad, or open the big-screen links on the TVs (press F11 for full screen).</p>
            <div class="grid-3">${links}</div></div>
        <div class="box panel"><h2>Excel</h2><p class="sub">Sheets: Results, Evaluations, Matches, Adjustments. A copy is also saved automatically on the laptop after every result.</p>
            <a class="btn" href="/api/admin/export.xlsx?pin=${encodeURIComponent(pin)}">Download Excel</a></div>
        <div class="box panel"><h2>Match history <span class="pill">${data.matches.length}</span></h2><p class="sub">Deleting a match removes its points from both players.</p>
            <div class="table-wrap"><table><thead><tr><th>When</th><th>Screen</th><th>Game</th><th>Players</th><th class="num">Time</th><th></th></tr></thead><tbody>${log || '<tr><td colspan="6" style="color:var(--text-3)">No matches yet.</td></tr>'}</tbody></table></div></div>
        <div class="box panel" style="border:1px solid rgba(227,27,35,.5)"><h2>Danger zone</h2>
            <p class="sub">Reset clears all players, matches and evaluations (a backup is saved in the data folder). Restore puts the original questions back.</p>
            <div class="btns">
                <input class="in" id="resetConfirm" placeholder="Type RESET to confirm" style="max-width:230px">
                <button class="b danger" data-act="reset-all">Reset all results</button>
                <button class="b danger" data-act="restore-content">${armLabel('restore', 'Restore original questions')}</button>
            </div></div>`;
    }

    /* ───────── Timers ───────── */
    function tick() {
        app.querySelectorAll('[data-deadline]').forEach(el => {
            el.textContent = `${Math.max(0, Math.ceil((Number(el.dataset.deadline) - (Date.now() + offset)) / 1000))}s`;
        });
    }
    setInterval(tick, 500);

    /* ───────── Events ───────── */
    app.addEventListener('input', (e) => {
        const el = e.target;
        if (el.id === 'search') { search = el.value; const pos = el.selectionStart; render(); const s = document.getElementById('search'); s.focus(); s.setSelectionRange(pos, pos); return; }
        if (el.dataset.words) {
            setPath(rootOf(el.dataset.words), pathOf(el.dataset.words), el.value.split(/\s+/).filter(Boolean));
        } else if (el.dataset.bind) {
            let v = el.type === 'checkbox' ? el.checked : el.value;
            if (el.dataset.num !== undefined) v = Number(v);
            setPath(rootOf(el.dataset.bind), pathOf(el.dataset.bind), v);
            if (el.type === 'checkbox' || el.tagName === 'SELECT') { render(); return; }
        }
        saveError = '';
        updateSaveBar();
    });
    app.addEventListener('submit', (e) => {
        e.preventDefault();
        if (e.target.id === 'pinForm') {
            pin = document.getElementById('pin').value.trim();
            try { sessionStorage.setItem('roadshow-pin', pin); } catch (err) {}
            start();
        }
    });

    async function run(fn, okMsg) {
        try { await fn(); if (okMsg) toast(okMsg); await load(true); }
        catch (err) { if (err.pin) gate('Wrong PIN.'); else toast(err.message); }
    }

    app.addEventListener('click', async (e) => {
        const el = e.target.closest('[data-act],[data-tab]');
        if (!el || el.disabled) return;
        if (el.dataset.tab) {
            tab = el.dataset.tab;
            try { sessionStorage.setItem('roadshow-admin-tab', tab); } catch (err) {}
            render();
            window.scrollTo(0, 0);
            return;
        }
        const d = el.dataset;
        const c = draft.c;
        const q = (gi, qi) => c.games[gi].questions[qi];
        switch (d.act) {
            case 'save': return save();
            case 'discard': draft.c = clone(data.content); draft.s = clone(data.settings); saveError = ''; return render();

            /* live */
            case 'station': return run(() => post('/api/admin/station', { station: d.st, action: d.a }));
            case 'start': return run(() => post('/api/admin/station', { station: d.st, action: 'start', game: document.getElementById(`start-${d.st}`).value }), 'Game started');
            case 'kick': if (arm(`kick-${d.st}-${d.slot}`)) run(() => post('/api/admin/station', { station: d.st, action: 'kick', slot: d.slot }), 'Signed out'); return;
            case 'abort': if (arm(`abort-${d.st}`)) run(() => post('/api/admin/station', { station: d.st, action: 'abort' }), 'Match cancelled'); return;
            case 'reset-station': if (arm(`reset-${d.st}`)) run(() => post('/api/admin/station', { station: d.st, action: 'reset' }), 'Screen reset'); return;

            /* players */
            case 'save-player': {
                const row = app.querySelector(`[data-row="${CSS.escape(d.id)}"]`);
                const name = row.querySelector('[data-field="name"]').value;
                const newEmpId = row.querySelector('[data-field="empId"]').value;
                return run(() => post('/api/admin/player/update', { empId: d.id, name, newEmpId }), 'Player saved');
            }
            case 'adjust': {
                const row = app.querySelector(`[data-row="${CSS.escape(d.id)}"]`);
                const delta = Number(row.querySelector('[data-field="delta"]').value);
                const reason = row.querySelector('[data-field="reason"]').value;
                if (!delta) return toast('Enter points, e.g. 10 or -5');
                return run(() => post('/api/admin/player/adjust', { empId: d.id, delta, reason }), `${delta > 0 ? '+' : ''}${delta} points applied`);
            }
            case 'expand': expanded = expanded === d.id ? null : d.id; return render();
            case 'reset-player': if (arm(`rp-${d.id}`)) run(() => post('/api/admin/player/reset-scores', { empId: d.id }), 'Scores cleared'); return;
            case 'del-player': if (arm(`dp-${d.id}`)) run(() => post('/api/admin/player/delete', { empId: d.id }), 'Player deleted'); return;
            case 'clear-adj': if (arm(`ca-${d.id}`)) run(() => post('/api/admin/player/clear-adjustments', { empId: d.id }), 'Adjustments removed'); return;
            case 'del-eval': if (arm(`de-${d.id}`)) run(() => post('/api/admin/evaluation/delete', { empId: d.id }), 'Evaluation deleted'); return;
            case 'del-match': if (arm(`m-${d.id}`)) run(() => post('/api/admin/match/delete', { id: d.id }), 'Match deleted'); return;
            case 'add-player': {
                const name = document.getElementById('np-name').value;
                const empId = document.getElementById('np-id').value;
                return run(() => post('/api/admin/player/add', { name, empId }), 'Player added');
            }

            /* content */
            case 'sel-game': selGame = d.id; render(); window.scrollTo(0, 0); return;
            case 'unit-edit': selGame = `unit:${d.ui}`; return render();
            case 'unit-add': {
                c.units.push({ id: uid('u'), icon: 'star4', enabled: true, en: { title: 'New unit', sub: '' }, ar: { title: 'وحدة جديدة', sub: '' } });
                selGame = `unit:${c.units.length - 1}`;
                return render();
            }
            case 'unit-move': {
                const i = Number(d.ui), j = i + Number(d.d);
                if (j < 0 || j >= c.units.length) return;
                [c.units[i], c.units[j]] = [c.units[j], c.units[i]];
                selGame = `unit:${j}`;
                return render();
            }
            case 'unit-del': {
                if (!arm(`ud-${d.ui}`)) return;
                const u = c.units[Number(d.ui)];
                c.games = c.games.filter(g => g.unit !== u.id);
                c.units.splice(Number(d.ui), 1);
                selGame = null;
                return render();
            }
            case 'game-add': {
                const g = { id: uid('g'), unit: d.unit, type: 'quiz', enabled: true, en: { title: 'New game' }, ar: { title: 'لعبة جديدة' }, questions: [] };
                g.questions.push(blankQuestion());
                c.games.push(g);
                selGame = g.id;
                return render();
            }
            case 'game-del': {
                if (!arm(`gd-${d.gi}`)) return;
                const g = c.games[Number(d.gi)];
                if (g.type === 'puzzle' && c.games.filter(x => x.type === 'puzzle').length === 1) { toast('Hide the puzzle instead — it can’t be deleted.'); return render(); }
                c.games.splice(Number(d.gi), 1);
                selGame = null;
                return render();
            }
            case 'q-add': c.games[d.gi].questions.push(blankQuestion()); render(); return scrollLast();
            case 'q-add-tf': {
                const nq = blankQuestion();
                nq.en.o = ['True', 'False']; nq.ar.o = ['صح', 'خطأ']; nq.fixed = true; nq.tag = c.tags && c.tags.tf ? 'tf' : '';
                c.games[d.gi].questions.push(nq);
                render();
                return scrollLast();
            }
            case 'q-del': if (arm(`qd-${d.gi}-${d.qi}`)) { c.games[d.gi].questions.splice(Number(d.qi), 1); render(); } return;
            case 'q-dup': {
                const copy = clone(q(d.gi, d.qi));
                copy.id = uid('q');
                c.games[d.gi].questions.splice(Number(d.qi) + 1, 0, copy);
                return render();
            }
            case 'q-move': {
                const list = c.games[d.gi].questions;
                const i = Number(d.qi), j = i + Number(d.d);
                if (j < 0 || j >= list.length) return;
                [list[i], list[j]] = [list[j], list[i]];
                return render();
            }
            case 'opt-correct': q(d.gi, d.qi).a = Number(d.oi); return render();
            case 'opt-add': { const qq = q(d.gi, d.qi); qq.en.o.push(''); qq.ar.o.push(''); return render(); }
            case 'opt-del': {
                const qq = q(d.gi, d.qi);
                const oi = Number(d.oi);
                qq.en.o.splice(oi, 1); qq.ar.o.splice(oi, 1);
                if (qq.a === oi) qq.a = 0; else if (qq.a > oi) qq.a--;
                return render();
            }

            /* text */
            case 'eval-add': c.evalQuestions.push({ id: uid('e'), en: '', ar: '' }); return render();
            case 'eval-del': if (arm(`ed-${d.i}`)) { c.evalQuestions.splice(Number(d.i), 1); render(); } return;
            case 'eval-move': {
                const i = Number(d.i), j = i + Number(d.d);
                if (j < 0 || j >= c.evalQuestions.length) return;
                [c.evalQuestions[i], c.evalQuestions[j]] = [c.evalQuestions[j], c.evalQuestions[i]];
                return render();
            }

            /* data */
            case 'reset-all': {
                if (document.getElementById('resetConfirm').value.trim().toUpperCase() !== 'RESET') return toast('Type RESET in the box first');
                return run(async () => { const r = await post('/api/admin/reset'); toast(`All results cleared. Backup: ${r.backup}`); });
            }
            case 'restore-content': if (arm('restore')) run(() => post('/api/admin/content/restore'), 'Original questions restored').then(() => { draft.c = clone(data.content); render(); }); return;
        }
    });

    function blankQuestion() {
        return { id: uid('q'), a: 0, fixed: false, tag: '', enabled: true, en: { q: '', o: ['', '', '', ''], e: '' }, ar: { q: '', o: ['', '', '', ''], e: '' } };
    }
    function scrollLast() {
        const cards = app.querySelectorAll('.q-card');
        if (cards.length) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function save() {
        saveError = '';
        try {
            if (settingsDirty()) {
                const r = await put('/api/admin/settings', draft.s);
                if (r.settings.adminPin !== pin) { pin = r.settings.adminPin; try { sessionStorage.setItem('roadshow-pin', pin); } catch (e) {} }
            }
            if (contentDirty()) await put('/api/admin/content', draft.c);
            toast('Saved — iPads and screens updated');
            await load('content');
            draft.s = clone(data.settings);
            render();
        } catch (err) {
            saveError = err.message;
            updateSaveBar();
            toast(err.message);
        }
    }

    document.getElementById('lockBtn').addEventListener('click', () => {
        pin = '';
        try { sessionStorage.removeItem('roadshow-pin'); } catch (e) {}
        gate();
    });

    window.addEventListener('beforeunload', (e) => { if (contentDirty() || settingsDirty()) { e.preventDefault(); e.returnValue = ''; } });

    if (pin) start(); else gate();
})();
