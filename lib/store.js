// Storage for the game state.
//  • On Vercel: Upstash Redis over its REST API (add "Upstash for Redis" in the Vercel dashboard
//    → Storage; it injects KV_REST_API_URL / KV_REST_API_TOKEN automatically).
//  • On a laptop: plain JSON files in ./data plus memory — no database needed.
// Values are JSON strings. withLock() serialises every change so two iPads can't overwrite each other.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREFIX = 'rs:';

class RedisStore {
    constructor(url, token) {
        this.url = url.replace(/\/$/, '');
        this.token = token;
        this.kind = 'redis';
    }

    async pipeline(cmds) {
        const res = await fetch(`${this.url}/pipeline`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cmds)
        });
        if (!res.ok) throw new Error(`Redis error ${res.status}: ${await res.text()}`);
        const out = await res.json();
        for (const r of out) if (r.error) throw new Error(`Redis error: ${r.error}`);
        return out.map(r => r.result);
    }

    async mget(keys) {
        const [values] = await this.pipeline([['MGET', ...keys.map(k => PREFIX + k)]]);
        return values;
    }

    async mset(obj) {
        const entries = Object.entries(obj);
        if (!entries.length) return;
        await this.pipeline(entries.map(([k, v]) => ['SET', PREFIX + k, v]));
    }

    async hset(key, field, value) { await this.pipeline([['HSET', PREFIX + key, field, value]]); }

    async hgetall(key) {
        const [flat] = await this.pipeline([['HGETALL', PREFIX + key]]);
        const out = {};
        for (let i = 0; flat && i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
        return out;
    }

    async withLock(fn) {
        const key = `${PREFIX}lock`;
        const token = crypto.randomBytes(8).toString('hex');
        const started = Date.now();
        for (;;) {
            const [ok] = await this.pipeline([['SET', key, token, 'NX', 'PX', '8000']]);
            if (ok === 'OK') break;
            if (Date.now() - started > 7000) throw new Error('Server busy, please try again');
            await new Promise(r => setTimeout(r, 40 + Math.random() * 60));
        }
        try {
            return await fn();
        } finally {
            await this.pipeline([['EVAL', "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", '1', key, token]]).catch(() => {});
        }
    }
}

class FileStore {
    constructor(dir) {
        this.dir = dir;
        this.kind = 'file';
        this.mem = {};
        this.hashes = {};
        this.queue = Promise.resolve();
        this.files = { config: 'config.json', db: 'db.json' };
        fs.mkdirSync(dir, { recursive: true });
        for (const [key, file] of Object.entries(this.files)) {
            try { this.mem[key] = fs.readFileSync(path.join(dir, file), 'utf8'); } catch (e) { /* first run */ }
        }
    }

    async mget(keys) { return keys.map(k => (k in this.mem ? this.mem[k] : null)); }

    async mset(obj) {
        for (const [k, v] of Object.entries(obj)) {
            this.mem[k] = v;
            const file = this.files[k] || (k.startsWith('backup:') ? `${k.replace(':', '-')}.json` : null);
            if (file) {
                const p = path.join(this.dir, file);
                fs.writeFileSync(p + '.tmp', v);
                fs.renameSync(p + '.tmp', p);
            }
        }
    }

    async hset(key, field, value) { (this.hashes[key] = this.hashes[key] || {})[field] = value; }
    async hgetall(key) { return { ...(this.hashes[key] || {}) }; }

    withLock(fn) {
        const run = this.queue.then(fn, fn);
        this.queue = run.catch(() => {});
        return run;
    }
}

function createStore() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) return new RedisStore(url, token);
    return new FileStore(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
}

module.exports = { createStore };
