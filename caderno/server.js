const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const seed = require('./seed.json');

const PUB = path.join(__dirname, 'public');
const FILES = path.join(__dirname, 'arquivos');
fs.mkdirSync(FILES, { recursive: true });

const db = new DatabaseSync(path.join(__dirname, 'caderno.db'));
db.exec(`
pragma journal_mode = wal;
create table if not exists subjects (id integer primary key autoincrement, name text not null, icon text default '', color text default '#3b5bdb', description text default '');
create table if not exists exams (id integer primary key autoincrement, subject_id integer not null, title text not null, date text not null, note text default '');
create table if not exists sessions (id integer primary key autoincrement, subject_id integer not null, date text not null, title text not null, minutes integer default 60, theory text default '', search text default '[]', plan text default '', essentials text default '', extra text default '', answers text default '', status text default 'todo', studied integer default 0, notes text default '');
create table if not exists exercises (id integer primary key autoincrement, subject_id integer not null, list text default '', q text default '', topic text default '', date text default '', prio text default 'Essencial', statement text default '', answer text default '', link text default '', status text default 'todo', correct text default '', note text default '');
create table if not exists errors (id integer primary key autoincrement, subject_id integer not null, date text default '', ref text default '', kind text default '', did text default '', fix text default '', review text default '', reviewed integer default 0);
create table if not exists formulas (id integer primary key autoincrement, subject_id integer not null, topic text default '', rule text default '', care text default '');
create table if not exists notes (id integer primary key autoincrement, subject_id integer, title text default '', body text default '');
create table if not exists materials (id integer primary key autoincrement, subject_id integer not null, title text default '', kind text default 'Arquivo', file text default '');
create table if not exists config (key text primary key, value text);
`);

const TABLES = ['subjects', 'exams', 'sessions', 'exercises', 'errors', 'formulas', 'notes', 'materials'];
const COLS = Object.fromEntries(TABLES.map(t => [t, db.prepare(`pragma table_info(${t})`).all().map(c => c.name).filter(n => n !== 'id')]));
const val = v => (v === undefined ? null : typeof v === 'object' && v !== null ? JSON.stringify(v) : v);

const insert = (t, row) => {
  const k = COLS[t].filter(c => c in row);
  const r = db.prepare(`insert into ${t} (${k.join(',')}) values (${k.map(() => '?').join(',')})`).run(...k.map(c => val(row[c])));
  return Number(r.lastInsertRowid);
};

const update = (t, id, row) => {
  const k = COLS[t].filter(c => c in row);
  if (k.length) db.prepare(`update ${t} set ${k.map(c => c + '=?').join(',')} where id=?`).run(...k.map(c => val(row[c])), id);
};

const tx = fn => {
  db.exec('begin');
  try {
    const r = fn();
    db.exec('commit');
    return r;
  } catch (e) {
    db.exec('rollback');
    throw e;
  }
};

const setConfig = (k, v) => db.prepare('insert into config (key,value) values (?,?) on conflict(key) do update set value=excluded.value').run(k, String(v));

if (!db.prepare("select 1 from config where key='seeded'").get()) {
  tx(() => {
    ['subjects', 'exams', 'sessions', 'exercises', 'formulas', 'notes', 'materials'].forEach(t => seed[t].forEach(r => insert(t, r)));
    Object.entries(seed.config).forEach(([k, v]) => setConfig(k, v));
    setConfig('seeded', 1);
  });
}

if (!db.prepare("select 1 from config where key='palette'").get()) {
  db.prepare("update subjects set color='#2b50e6' where color='#3b5bdb'").run();
  db.prepare("update subjects set color='#4b5563' where color='#0ca678'").run();
  setConfig('palette', 1);
}

const all = () => ({
  ...Object.fromEntries(TABLES.map(t => [t, db.prepare(`select * from ${t} order by ${t === 'sessions' ? 'date, id' : 'id'}`).all()])),
  config: Object.fromEntries(db.prepare('select * from config').all().map(r => [r.key, r.value]))
});

const strip = r => {
  const { id, subject_id, ...rest } = r;
  return rest;
};

const exportSubject = id => {
  const subject = db.prepare('select * from subjects where id=?').get(id);
  if (!subject) return null;
  const rows = t => db.prepare(`select * from ${t} where subject_id=? order by id`).all(id).map(strip);
  return { caderno: 1, subject: strip(subject), exams: rows('exams'), sessions: rows('sessions'), exercises: rows('exercises'), formulas: rows('formulas'), notes: rows('notes') };
};

const importSubject = d => tx(() => {
  const id = insert('subjects', d.subject || {});
  ['exams', 'sessions', 'exercises', 'formulas', 'notes'].forEach(t => (d[t] || []).forEach(r => insert(t, { ...r, subject_id: id })));
  return id;
});

const dropFiles = names => names.forEach(f => {
  if (!db.prepare('select 1 from materials where file=?').get(f)) fs.rm(path.join(FILES, path.basename(f)), { force: true }, () => {});
});

const removeRow = (t, id) => {
  if (t === 'subjects') {
    const files = db.prepare('select file from materials where subject_id=?').all(id).map(r => r.file);
    tx(() => {
      ['exams', 'sessions', 'exercises', 'errors', 'formulas', 'notes', 'materials'].forEach(c => db.prepare(`delete from ${c} where subject_id=?`).run(id));
      db.prepare('delete from subjects where id=?').run(id);
    });
    dropFiles(files);
    return;
  }
  const row = t === 'materials' ? db.prepare('select file from materials where id=?').get(id) : null;
  db.prepare(`delete from ${t} where id=?`).run(id);
  if (row) dropFiles([row.file]);
};

const send = (res, code, data, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
};

const readBody = (req, limit) => new Promise((resolve, reject) => {
  const chunks = [];
  let n = 0;
  req.on('data', d => {
    n += d.length;
    if (n > limit) {
      reject(new Error('Arquivo grande demais'));
      req.destroy();
    } else chunks.push(d);
  });
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const json = async req => JSON.parse((await readBody(req, 5e6)).toString() || '{}');

const safeName = n => {
  const base = path.basename(n).replace(/[^\w.\-]+/g, '_').slice(-80) || 'arquivo';
  return fs.existsSync(path.join(FILES, base)) ? `${Date.now()}-${base}` : base;
};

async function api(req, res, url) {
  const [, , a, b] = url.pathname.split('/');
  const m = req.method;
  if (m === 'GET' && a === 'all') return send(res, 200, all());
  if (m === 'GET' && a === 'export') {
    const d = exportSubject(Number(b));
    return d ? send(res, 200, d) : send(res, 404, { error: 'Matéria não encontrada' });
  }
  if (m === 'PUT' && a === 'config') {
    Object.entries(await json(req)).forEach(([k, v]) => setConfig(k, v));
    return send(res, 200, { ok: true });
  }
  if (m === 'POST' && a === 'import') {
    const d = await json(req);
    if (!d.subject || !d.subject.name) return send(res, 400, { error: 'Arquivo inválido: falta a matéria' });
    return send(res, 200, { id: importSubject(d) });
  }
  if (m === 'POST' && a === 'upload') {
    const name = safeName(decodeURIComponent(req.headers['x-filename'] || 'arquivo'));
    fs.writeFileSync(path.join(FILES, name), await readBody(req, 60e6));
    const id = insert('materials', {
      subject_id: Number(url.searchParams.get('subject')), title: url.searchParams.get('title') || name,
      kind: url.searchParams.get('kind') || 'Arquivo', file: name
    });
    return send(res, 200, { id });
  }
  if (TABLES.includes(a)) {
    if (m === 'POST') return send(res, 200, { id: insert(a, await json(req)) });
    if (m === 'PUT') return update(a, Number(b), await json(req)), send(res, 200, { ok: true });
    if (m === 'DELETE') return removeRow(a, Number(b)), send(res, 200, { ok: true });
  }
  send(res, 404, { error: 'Rota não encontrada' });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'
};

function serve(res, url) {
  const isFile = url.pathname.startsWith('/arquivos/');
  const base = isFile ? FILES : PUB;
  let rel;
  try {
    rel = decodeURIComponent(isFile ? url.pathname.slice(10) : url.pathname.slice(1)) || 'index.html';
  } catch {
    return send(res, 400, 'Endereço inválido', 'text/plain; charset=utf-8');
  }
  const file = path.resolve(base, rel);
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return send(res, 404, 'Não encontrado', 'text/plain; charset=utf-8');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '')) return send(res, 403, { error: 'Host não permitido' });
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(res, 403, { error: 'Origem não permitida' });
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      const ct = req.headers['content-type'] || '';
      if (!['GET', 'HEAD'].includes(req.method) && !/^application\/(json|octet-stream)/.test(ct)) return send(res, 415, { error: 'Tipo não suportado' });
      return await api(req, res, url);
    }
    if (!['GET', 'HEAD'].includes(req.method)) return send(res, 405, 'Método não permitido', 'text/plain; charset=utf-8');
    serve(res, url);
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

const port = Number(process.env.PORT) || 3000;
server.on('error', e => {
  console.error(e.code === 'EADDRINUSE' ? `A porta ${port} já está em uso. Feche o outro terminal ou rode com PORT=3001.` : e.message);
  process.exit(1);
});
server.listen(port, '0.0.0.0', () => {
  console.log(`Caderno no ar na porta ${port}`);
});