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

// Direct Redis connection (REDIS_URL) — used when the Vercel database only provides a redis:// URL.
class TcpRedisStore {
    constructor(url) {
        this.url = url;
        this.kind = 'redis';
        this.clientPromise = null;
    }

    client() {
        if (!this.clientPromise) {
            const { createClient } = require('redis');
            const c = createClient({ url: this.url, socket: { connectTimeout: 8000, reconnectStrategy: (n) => Math.min(n * 200, 2000) } });
            c.on('error', (err) => console.error('Redis:', err.message));
            // Reused across requests while the Vercel function stays warm.
            this.clientPromise = c.connect().then(() => c).catch((err) => { this.clientPromise = null; throw err; });
        }
        return this.clientPromise;
    }

    async mget(keys) { return (await this.client()).mGet(keys.map(k => PREFIX + k)); }

    async mset(obj) {
        const entries = Object.entries(obj);
        if (!entries.length) return;
        const multi = (await this.client()).multi();
        for (const [k, v] of entries) multi.set(PREFIX + k, v);
        await multi.exec();
    }

    async hset(key, field, value) { await (await this.client()).hSet(PREFIX + key, field, value); }
    async hgetall(key) { return (await this.client()).hGetAll(PREFIX + key); }

    async withLock(fn) {
        const c = await this.client();
        const key = `${PREFIX}lock`;
        const token = crypto.randomBytes(8).toString('hex');
        const started = Date.now();
        for (;;) {
            if ((await c.set(key, token, { NX: true, PX: 8000 })) === 'OK') break;
            if (Date.now() - started > 7000) throw new Error('Server busy, please try again');
            await new Promise(r => setTimeout(r, 40 + Math.random() * 60));
        }
        try {
            return await fn();
        } finally {
            await c.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", { keys: [key], arguments: [token] }).catch(() => {});
        }
    }
}

// Used on Vercel when no database is connected: every request explains how to fix it.
class MissingStore {
    constructor() { this.kind = 'missing'; }
    fail() {
        const e = new Error('Database not connected. In Vercel open your project → Storage → Create Database → Upstash for Redis → Connect to this project, then Deployments → Redeploy.');
        e.status = 503;
        throw e;
    }
    async mget() { this.fail(); }
    async mset() { this.fail(); }
    async hset() { this.fail(); }
    async hgetall() { this.fail(); }
    async withLock() { this.fail(); }
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

// Every env var name the Vercel / Upstash integrations are known to use (a custom prefix is also detected).
function findEnv(suffix) {
    const exact = [`KV_${suffix}`, `UPSTASH_REDIS_${suffix}`, `STORAGE_${suffix}`];
    for (const k of exact) if (process.env[k]) return process.env[k];
    const any = Object.keys(process.env).find(k => k.endsWith(`_${suffix}`) && !k.includes('READ_ONLY'));
    return any ? process.env[any] : null;
}

function createStore() {
    const url = findEnv('REST_API_URL') || process.env.UPSTASH_REDIS_REST_URL;
    const token = findEnv('REST_API_TOKEN') || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) return new RedisStore(url, token);
    const redisUrl = process.env.REDIS_URL || process.env.KV_URL || findEnv('REDIS_URL');
    if (redisUrl) return new TcpRedisStore(redisUrl);
    if (process.env.VERCEL) return new MissingStore();
    return new FileStore(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
}

// Names only (never values) — for the /api/health diagnostics.
function storageEnvNames() {
    return Object.keys(process.env).filter(k => /REDIS|KV_|UPSTASH/.test(k)).sort();
}

module.exports = { createStore, storageEnvNames };
