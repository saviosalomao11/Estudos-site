const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const seed = require('./seed.json');

const db = new DatabaseSync(path.join(__dirname, 'estudos.db'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
create table if not exists days (
  n integer primary key, date text, wd text, phase integer, exam text, calc text, alg text,
  calc_done text default 'Não', alg_done text default 'Não', notes text default ''
);
create table if not exists exercises (
  id integer primary key, list text, q text, subject text, date text, prio text, gab text, resp text,
  status text default 'Não feito', correct text default '', note text default ''
);
create table if not exists errors (
  id integer primary key autoincrement, date text, subject text, ref text, kind text,
  did text, fix text, review text, reviewed text default 'Não'
);
create table if not exists formulas (id integer primary key autoincrement, subject text, rule text, care text);
create table if not exists info (id integer primary key autoincrement, title text, lines text);
create table if not exists config (key text primary key, value text);
`);

if (!db.prepare('select count(*) c from days').get().c) {
  const insDay = db.prepare('insert into days (n,date,wd,phase,exam,calc,alg) values (?,?,?,?,?,?,?)');
  const insEx = db.prepare('insert into exercises (id,list,q,subject,date,prio,gab,resp) values (?,?,?,?,?,?,?,?)');
  const insF = db.prepare('insert into formulas (subject,rule,care) values (?,?,?)');
  const insI = db.prepare('insert into info (title,lines) values (?,?)');
  const insC = db.prepare('insert or ignore into config (key,value) values (?,?)');
  db.exec('BEGIN');
  {
    seed.days.forEach(d => insDay.run(d.n, d.date, d.wd, d.phase, d.exam, JSON.stringify(d.calc), JSON.stringify(d.alg)));
    seed.exercises.forEach(e => insEx.run(e.id, e.list, e.q, e.subject, e.date, e.prio, e.gab, e.resp));
    seed.formulas.forEach(f => insF.run(f.subject, f.rule, f.care));
    seed.info.forEach(i => insI.run(i.title, JSON.stringify(i.lines)));
    insC.run('prova_calculo1', '2026-10-23');
    insC.run('prova_algoritmos', '2026-11-04');
    insC.run('prova_calculo2', '');
    insC.run('linguagem', '');
  }
  db.exec('COMMIT');
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', (req, res) => {
  const days = db.prepare('select * from days order by n').all().map(d => ({ ...d, calc: JSON.parse(d.calc), alg: JSON.parse(d.alg) }));
  const info = db.prepare('select * from info order by id').all().map(i => ({ ...i, lines: JSON.parse(i.lines) }));
  const config = Object.fromEntries(db.prepare('select * from config').all().map(r => [r.key, r.value]));
  res.json({
    days,
    info,
    config,
    exercises: db.prepare('select * from exercises order by id').all(),
    errors: db.prepare('select * from errors order by id desc').all(),
    formulas: db.prepare('select * from formulas order by id').all()
  });
});

const pick = (body, fields) => fields.filter(f => f in body);

app.put('/api/days/:n', (req, res) => {
  const f = pick(req.body, ['calc_done', 'alg_done', 'notes']);
  if (f.length) db.prepare(`update days set ${f.map(k => k + '=?').join(',')} where n=?`).run(...f.map(k => req.body[k]), req.params.n);
  res.json({ ok: true });
});

app.put('/api/exercises/:id', (req, res) => {
  const f = pick(req.body, ['status', 'correct', 'note']);
  if (f.length) db.prepare(`update exercises set ${f.map(k => k + '=?').join(',')} where id=?`).run(...f.map(k => req.body[k]), req.params.id);
  res.json({ ok: true });
});

app.post('/api/errors', (req, res) => {
  const b = req.body;
  const r = db.prepare('insert into errors (date,subject,ref,kind,did,fix,review) values (?,?,?,?,?,?,?)')
    .run(b.date || '', b.subject || '', b.ref || '', b.kind || '', b.did || '', b.fix || '', b.review || '');
  res.json({ id: r.lastInsertRowid });
});

app.put('/api/errors/:id', (req, res) => {
  const f = pick(req.body, ['reviewed']);
  if (f.length) db.prepare('update errors set reviewed=? where id=?').run(req.body.reviewed, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/errors/:id', (req, res) => {
  db.prepare('delete from errors where id=?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/config', (req, res) => {
  const up = db.prepare('insert into config (key,value) values (?,?) on conflict(key) do update set value=excluded.value');
  Object.entries(req.body).forEach(([k, v]) => up.run(k, String(v)));
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, '127.0.0.1', () => console.log(`Site no ar: http://localhost:${port}`));
