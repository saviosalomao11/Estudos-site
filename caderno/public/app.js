const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  exercise: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12l3 3 5-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
  formula: '<path d="M18 5H6l7 7-7 7h12"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play: '<path d="M7 5l12 7-12 7z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  out: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4"/>',
  edit: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>'
};
const ic = (n, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const LOGO = '<svg width="28" height="28" viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" style="fill:var(--ink)"/><path d="M9 7v12" stroke="#4f73ff" stroke-width="1.5"/><path d="M12 9h7M12 13h7M12 17h5" style="stroke:var(--paper)" stroke-width="1.6" stroke-linecap="round"/></svg>';

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const pd = s => new Date(`${s}T00:00:00`);
const dd = s => `${pad(pd(s).getDate())}/${pad(pd(s).getMonth() + 1)}`;
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WDF = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MON = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const wd = s => WD[pd(s).getDay()];
const daysTo = s => Math.round((pd(s) - pd(today())) / 864e5);
const addDays = (s, n) => {
  const d = pd(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const monday = s => addDays(s, -((pd(s).getDay() + 6) % 7));
const rel = s => {
  const n = daysTo(s);
  return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : n === -1 ? 'ontem' : n > 0 ? `em ${n} dias` : `há ${-n} dias`;
};
const hm = m => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ''}` : `${m} min`);

const COLORS = ['#2b50e6', '#4b5563', '#0ea5e9', '#4f46e5', '#111827', '#94a3b8', '#0891b2', '#7c3aed'];
const SS = { todo: 'A fazer', partial: 'Em andamento', done: 'Concluída' };
const ES = { todo: 'A fazer', done: 'Feito', redo: 'Refazer' };
const KINDS = ['Conta', 'Conceito', 'Pegadinha', 'Fórmula', 'Interpretação', 'Distração'];

let S;
let Q = {};
let OPEN = new Set();
let cal = { y: new Date().getFullYear(), m: new Date().getMonth() };
const T = { sid: 0, t0: 0, acc: 0, on: false, iv: 0 };

const view = $('#view');
const sub = id => S.subjects.find(b => b.id === Number(id)) || { id: 0, name: 'Geral', color: '#868e96', icon: '·' };
const sessOf = id => S.sessions.filter(s => s.subject_id === id);
const sc = s => (s.status === 'done' ? 1 : s.status === 'partial' ? 0.5 : 0);
const pct = list => (list.length ? Math.round((100 * list.reduce((a, s) => a + sc(s), 0)) / list.length) : 0);
const opt = (list, cur) => list.map(o => {
  const [v, l] = Array.isArray(o) ? o : [o, o];
  return `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`;
}).join('');
const dark = () => document.documentElement.dataset.theme === 'dark';

const toast = m => {
  const n = $('#toast');
  n.textContent = m;
  n.classList.add('on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => n.classList.remove('on'), 3600);
};

const api = async (m, u, b) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b === undefined ? undefined : JSON.stringify(b) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    toast(d.error || 'Algo deu errado. Tente de novo.');
    throw new Error(d.error);
  }
  return d;
};
const reload = async () => {
  S = await api('GET', '/api/all');
};
const create = async (t, row) => {
  const r = await api('POST', `/api/${t}`, row);
  await reload();
  render();
  return r.id;
};
const commit = (t, id, patch) => {
  Object.assign(S[t].find(x => x.id === Number(id)), patch);
  api('PUT', `/api/${t}/${id}`, patch).catch(reload);
  render();
};
const remove = async (t, id) => {
  await api('DELETE', `/api/${t}/${id}`);
  await reload();
};

const rich = t => {
  const out = [];
  let ul = false;
  String(t || '').split('\n').forEach(l => {
    const li = l.match(/^\s*[•\-]\s+(.*)/);
    const h = l.match(/^\[(.+)\]$/);
    if (li) {
      if (!ul) out.push('<ul>');
      ul = true;
      out.push(`<li>${esc(li[1])}</li>`);
      return;
    }
    if (ul) out.push('</ul>');
    ul = false;
    if (h) out.push(`<h4>${esc(h[1])}</h4>`);
    else if (l.trim()) out.push(`<p>${esc(l)}</p>`);
  });
  if (ul) out.push('</ul>');
  return out.join('');
};

const empty = (t, d, btn = '') => `<div class="empty"><h3>${t}</h3><p>${d}</p>${btn}</div>`;
const head = (title, sub = '', acts = '') => `<header class="ph"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div><div class="acts">${acts}</div></header>`;
const chip = b => `<span class="chip" style="--c:${b.color}">${esc(b.name)}</span>`;

const streak = () => {
  const t = today();
  const days = [...new Set(S.sessions.filter(s => s.date <= t).map(s => s.date))].sort().reverse();
  let n = 0;
  for (let i = 0; i < days.length; i++) {
    if (S.sessions.filter(s => s.date === days[i]).every(s => s.status === 'done')) n++;
    else if (!(i === 0 && days[i] === t)) break;
  }
  return n;
};
const studyMin = () => S.sessions.reduce((a, s) => a + (s.status === 'done' ? Math.max(s.minutes, s.studied) : s.studied), 0);

const srow = (s, o = {}) => {
  const b = sub(s.subject_id);
  return `<div class="srow ${s.status}" style="--c:${b.color}">
    <button class="mark" data-act="tog" data-id="${s.id}" aria-label="Marcar sessão: ${esc(SS[s.status])}">${s.status === 'done' ? ic('check', 14) : ''}</button>
    <a href="#/sessao/${s.id}"><b>${esc(s.title)}</b></a>
    <span class="meta">${o.sub === false ? '' : `<span class="hide-s">${chip(b)}</span>`}${o.date === false ? '' : `<span>${wd(s.date)} ${dd(s.date)}</span>`}<span>${hm(s.minutes)}</span></span>
    ${s.date === today() && o.now !== false ? '<span class="now">hoje</span>' : ''}</div>`;
};

const segs = (b, until) => `<div class="segs" style="--c:${b.color}">${sessOf(b.id).filter(s => s.date <= until).map(s => `<i class="${s.status}" title="${esc(s.title)} (${dd(s.date)})"></i>`).join('')}</div>`;

const examCard = e => {
  const b = sub(e.subject_id);
  const n = daysTo(e.date);
  const ss = sessOf(b.id).filter(s => s.date <= e.date);
  const done = ss.filter(s => s.status === 'done').length;
  return `<article class="card exam" style="--c:${b.color}">
    <div class="top"><div class="count"><b>${n === 0 ? 'Hoje' : n}</b>${n === 0 ? '' : `<span>${n === 1 ? 'dia' : 'dias'}</span>`}</div>
    <div class="grow"><h3>${esc(e.title)}</h3><p class="muted">${WDF[pd(e.date).getDay()]}, ${dd(e.date)}</p>${e.note ? `<p class="small">${esc(e.note)}</p>` : ''}${chip(b)}</div></div>
    ${ss.length ? `${segs(b, e.date)}<p class="muted small">${done} de ${ss.length} sessões concluídas até a prova</p>` : ''}</article>`;
};

const planMap = () => {
  const dates = S.sessions.map(s => s.date).concat(S.exams.map(e => e.date)).sort();
  if (!dates.length) return '';
  const t = today();
  const cells = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<span class="wd">${d}</span>`);
  for (let d = monday(dates[0]); d <= dates[dates.length - 1]; d = addDays(d, 1)) {
    const ss = S.sessions.filter(s => s.date === d);
    const ex = S.exams.filter(e => e.date === d);
    let c = '';
    if (ex.length) c = 'xm';
    else if (ss.length) c = ss.every(s => s.status === 'done') ? 'full' : ss.some(s => s.status !== 'todo') ? 'part' : d < t ? 'late' : 'todo';
    const label = `${wd(d)} ${dd(d)}: ${ex.map(e => e.title).concat(ss.map(s => s.title)).join(', ') || 'sem sessões'}`;
    const cls = `${c}${d === t ? ' tdy' : ''}`;
    const n = pd(d).getDate();
    cells.push(ss.length ? `<a class="${cls}" href="#/sessao/${ss[0].id}" title="${esc(label)}">${n}</a>` : `<i class="${cls}" title="${esc(label)}">${n}</i>`);
  }
  return `<div class="mapwrap"><div class="map">${cells.join('')}</div>
    <div class="legend"><span><i style="background:var(--ok)"></i>Dia concluído</span><span><i style="background:linear-gradient(135deg,var(--ok) 50%,var(--surface) 50%);border:1.5px solid var(--ok)"></i>Em andamento</span><span><i style="border:1.5px solid var(--line);background:var(--surface)"></i>A fazer</span><span><i style="background:var(--late)"></i>Atrasado</span><span><i style="background:var(--ink);border-radius:50%"></i>Dia de prova</span><span><i style="background:var(--acc)"></i>Hoje</span></div></div>`;
};

const scard = b => {
  const ss = sessOf(b.id);
  const nx = ss.find(s => s.date >= today() && s.status !== 'done');
  return `<a class="scard" href="#/materia/${b.id}" style="--c:${b.color}">
    <i class="tile lg">${esc(b.icon)}</i><h3>${esc(b.name)}</h3><p class="muted">${esc(b.description)}</p>
    <div class="bar"><i style="width:${pct(ss)}%"></i></div>
    <div class="pm"><span>${pct(ss)}% do plano</span><span>${ss.filter(s => s.status === 'done').length} de ${ss.length} sessões</span></div>
    ${nx ? `<small class="muted">Próxima: ${esc(nx.title)}, ${wd(nx.date)} ${dd(nx.date)}</small>` : ''}</a>`;
};

function pageHome() {
  const t = today();
  const now = new Date();
  const h = now.getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const td = S.sessions.filter(s => s.date === t);
  const nextS = S.sessions.filter(s => s.date > t && s.status !== 'done');
  const up = S.exams.filter(e => daysTo(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const minsToday = td.reduce((a, s) => a + s.minutes, 0);
  const line = td.length ? `${td.length} ${td.length > 1 ? 'sessões' : 'sessão'} hoje, ${hm(minsToday)} de estudo.` : 'Nada planejado para hoje.';
  const stats = [
    ['flame', 'Sequência de dias', `${streak()} ${streak() === 1 ? 'dia' : 'dias'}`],
    ['check', 'Sessões concluídas', `${S.sessions.filter(s => s.status === 'done').length} de ${S.sessions.length}`],
    ['clock', 'Tempo de estudo', hm(studyMin())],
    ['target', 'Exercícios feitos', `${S.exercises.filter(e => e.status === 'done').length} de ${S.exercises.length}`]
  ];
  return `${head(`${WDF[now.getDay()]}, ${now.getDate()} de ${MON[now.getMonth()]}`, `${hello}, ${esc(S.config.nome || 'estudante')}. ${line}`)}
  <div class="home">
    <div class="side-col">
      <section class="sheet"><h2><span class="mk">Hoje</span></h2><div class="body">
        ${td.length ? td.map(s => srow(s, { date: false, now: false })).join('') : `<p class="line">Nada marcado para hoje.</p>${nextS[0] ? `<p class="line">Próxima: <a href="#/sessao/${nextS[0].id}">${esc(nextS[0].title)}</a>, ${rel(nextS[0].date)}</p>` : ''}`}
      </div></section>
      ${nextS.length ? `<section class="card"><h3>Próximas sessões</h3>${nextS.slice(0, 5).map(s => srow(s)).join('')}</section>` : ''}
    </div>
    <div class="exams">
      ${up.length ? up.map(examCard).join('') : empty('Nenhuma prova marcada', 'Cadastre uma prova para ver a contagem regressiva aqui.')}
      <button class="btn" data-act="new-exam">${ic('plus', 16)} Adicionar prova</button>
    </div>
  </div>
  <section class="stats">${stats.map(([i, l, v]) => `<div>${ic(i, 20)}<b>${v}</b><span>${l}</span></div>`).join('')}</section>
  <section class="sec"><header><h2>Mapa do plano</h2></header><div class="card">${planMap() || '<p class="muted">Crie sessões para ver o plano aqui.</p>'}</div></section>
  <section class="sec"><header><h2>Matérias</h2></header><div class="sgrid">${S.subjects.map(scard).join('')}<button class="scard add" data-act="new-subject">${ic('plus', 26)}<b>Nova matéria</b><small>Monte o plano de outra disciplina</small></button></div></section>`;
}

const exRow = (e, showSub) => {
  const b = sub(e.subject_id);
  return `<article class="ex ${e.status}">
    <button class="chk ${e.status}" data-act="cycle" data-id="${e.id}" aria-label="Status: ${ES[e.status]}. Clique para alterar">${e.status === 'done' ? ic('check', 14) : e.status === 'redo' ? '↺' : ''}</button>
    <div class="t">${esc(e.q)}<span>${esc(e.list)}</span>${showSub ? ` ${chip(b)}` : ''}<div class="muted small" style="font-weight:400">${esc(e.topic)}</div></div>
    <span class="tag ${esc(e.prio)}">${esc(e.prio)}</span>
    <details data-ex="${e.id}"${OPEN.has(String(e.id)) ? ' open' : ''}><summary class="small">Enunciado e resposta</summary><div class="more">
      ${e.statement ? `<div class="stmt rich">${rich(e.statement)}</div>` : ''}
      <div><b>Resposta:</b> ${esc(e.answer || 'Confira no gabarito da lista.')}</div>
      <div class="row">${e.link ? `<a class="btn sm" href="/arquivos/${esc(e.link)}" target="_blank" rel="noopener">${ic('out', 14)} Abrir a lista em PDF</a>` : ''}
        <label>Acertei? <select data-t="exercises" data-id="${e.id}" data-k="correct">${opt(['', 'Sim', 'Parcial', 'Não'], e.correct)}</select></label>
        <input data-t="exercises" data-id="${e.id}" data-k="note" placeholder="Anotação" value="${esc(e.note)}">
        <button class="btn sm" data-act="edit-exercise" data-id="${e.id}">${ic('edit', 14)} Editar</button></div>
    </div></details></article>`;
};

const exItems = sid => {
  const q = (Q.q || '').toLowerCase();
  const subId = sid || Number(Q.sub) || 0;
  const list = S.exercises.filter(e => (!subId || e.subject_id === subId) && (!Q.list || e.list === Q.list) && (!Q.prio || e.prio === Q.prio) && (!Q.status || e.status === Q.status) && (!q || `${e.q} ${e.topic} ${e.list}`.toLowerCase().includes(q)));
  const done = list.filter(e => e.status === 'done').length;
  return `<p class="muted small" style="margin-bottom:8px">${list.length} exercícios, ${done} feitos</p>${list.length ? `<div class="exl">${list.map(e => exRow(e, !sid)).join('')}</div>` : empty('Nenhum exercício encontrado', 'Mude os filtros ou crie um exercício novo.')}`;
};

const exPanel = sid => {
  const subId = sid || Number(Q.sub) || 0;
  const lists = [...new Set(S.exercises.filter(e => !subId || e.subject_id === subId).map(e => e.list))];
  return `<div class="filters">
    ${sid ? '' : `<select data-q="sub" aria-label="Matéria">${opt([['', 'Todas as matérias'], ...S.subjects.map(b => [b.id, b.name])], Q.sub)}</select>`}
    <select data-q="list" aria-label="Lista">${opt([['', 'Todas as listas'], ...lists], Q.list)}</select>
    <select data-q="prio" aria-label="Prioridade">${opt([['', 'Toda prioridade'], 'Essencial', 'Reforço', 'Desafio'], Q.prio)}</select>
    <select data-q="status" aria-label="Status">${opt([['', 'Qualquer status'], ['todo', 'A fazer'], ['done', 'Feito'], ['redo', 'Refazer']], Q.status)}</select>
    <input type="search" data-q="q" placeholder="Buscar exercício" value="${esc(Q.q)}" aria-label="Buscar">
    <button class="btn primary sm" data-act="new-exercise" data-s="${sid || ''}">${ic('plus', 16)} Exercício</button></div>
    <div data-live="ex" data-sid="${sid || ''}">${exItems(sid)}</div>`;
};

const formItems = sid => {
  const q = (Q.q || '').toLowerCase();
  const subId = sid || Number(Q.sub) || 0;
  const list = S.formulas.filter(f => (!subId || f.subject_id === subId) && (!q || `${f.topic} ${f.rule} ${f.care}`.toLowerCase().includes(q)));
  return list.length ? `<div class="cards">${list.map(f => `<article class="card fcard"><div class="cardhead"><h3>${esc(f.topic)}</h3>${sid ? '' : chip(sub(f.subject_id))}<button class="icon-btn sm" data-act="del" data-t="formulas" data-id="${f.id}" aria-label="Apagar fórmula">${ic('trash', 16)}</button></div><p class="rule">${esc(f.rule)}</p>${f.care ? `<p class="care">${esc(f.care)}</p>` : ''}</article>`).join('')}</div>` : empty('Nenhuma fórmula', 'Anote as fórmulas e os cuidados que mais caem na prova.');
};

const formPanel = sid => `<div class="filters">
  ${sid ? '' : `<select data-q="sub" aria-label="Matéria">${opt([['', 'Todas as matérias'], ...S.subjects.map(b => [b.id, b.name])], Q.sub)}</select>`}
  <input type="search" data-q="q" placeholder="Buscar fórmula" value="${esc(Q.q)}" aria-label="Buscar">
  <button class="btn primary sm" data-act="new-formula" data-s="${sid || ''}">${ic('plus', 16)} Fórmula</button></div>
  <div data-live="form" data-sid="${sid || ''}">${formItems(sid)}</div>`;

const errItems = sid => {
  const q = (Q.q || '').toLowerCase();
  const subId = sid || Number(Q.sub) || 0;
  const list = S.errors.filter(e => (!subId || e.subject_id === subId) && (!q || `${e.ref} ${e.did} ${e.fix} ${e.kind}`.toLowerCase().includes(q))).sort((a, b) => b.id - a.id);
  return list.length ? `<div class="cards" style="grid-template-columns:1fr">${list.map(e => `<article class="card ecard${e.reviewed ? ' ok' : ''}">
    <div class="cardhead"><div class="row" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3>${esc(e.ref || 'Sem referência')}</h3>${sid ? '' : chip(sub(e.subject_id))}${e.kind ? `<span class="tag">${esc(e.kind)}</span>` : ''}<span class="muted small">${e.date ? dd(e.date) : ''}</span></div>
    <div class="acts"><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-act="flip" data-t="errors" data-id="${e.id}" data-k="reviewed"${e.reviewed ? ' checked' : ''}> Revisado</label><button class="icon-btn sm" data-act="del" data-t="errors" data-id="${e.id}" aria-label="Apagar erro">${ic('trash', 16)}</button></div></div>
    <div class="two"><div><h4>O que eu fiz</h4><p>${esc(e.did) || '-'}</p></div><div><h4>Como resolver certo</h4><p>${esc(e.fix) || '-'}</p></div></div>
    ${e.review ? `<p class="muted small">Revisar em ${dd(e.review)} (${rel(e.review)})</p>` : ''}</article>`).join('')}</div>` : empty('Nenhum erro anotado', 'Anote o motivo de cada erro. Revisar os erros é o que mais ajuda antes da prova.');
};

const errPanel = sid => `<div class="filters">
  ${sid ? '' : `<select data-q="sub" aria-label="Matéria">${opt([['', 'Todas as matérias'], ...S.subjects.map(b => [b.id, b.name])], Q.sub)}</select>`}
  <input type="search" data-q="q" placeholder="Buscar erro" value="${esc(Q.q)}" aria-label="Buscar">
  <button class="btn primary sm" data-act="new-error" data-s="${sid || ''}">${ic('plus', 16)} Registrar erro</button></div>
  <div data-live="err" data-sid="${sid || ''}">${errItems(sid)}</div>`;

const matPanel = sid => {
  const list = S.materials.filter(m => m.subject_id === sid);
  return `<div class="filters"><button class="btn primary sm" data-act="new-material" data-s="${sid}">${ic('upload', 16)} Enviar arquivo</button></div>
  ${list.length ? `<div class="exl">${list.map(m => `<div class="file">${ic('file', 22)}<div class="grow"><b>${esc(m.title)}</b><div class="muted small">${esc(m.kind)}</div></div><a class="btn sm" href="/arquivos/${esc(m.file)}" target="_blank" rel="noopener">${ic('out', 14)} Abrir</a><button class="icon-btn sm" data-act="del" data-t="materials" data-id="${m.id}" aria-label="Apagar arquivo">${ic('trash', 16)}</button></div>`).join('')}</div>` : empty('Nenhum material', 'Envie PDFs, listas e resumos desta matéria para ter tudo no mesmo lugar.')}`;
};

function pageSubject(r) {
  const b = S.subjects.find(x => x.id === r.id);
  if (!b) return empty('Matéria não encontrada', 'Ela pode ter sido excluída.', '<a class="btn" href="#/">Voltar ao início</a>');
  const tab = r.tab || 'plano';
  const ss = sessOf(b.id);
  const exams = S.exams.filter(e => e.subject_id === b.id).sort((a, c) => a.date.localeCompare(c.date));
  const nx = exams.find(e => daysTo(e.date) >= 0);
  const tabs = [['plano', 'Plano', ss.length], ['exercicios', 'Exercícios', S.exercises.filter(e => e.subject_id === b.id).length], ['formulas', 'Fórmulas', S.formulas.filter(e => e.subject_id === b.id).length], ['erros', 'Erros', S.errors.filter(e => e.subject_id === b.id).length], ['materiais', 'Materiais', S.materials.filter(e => e.subject_id === b.id).length]];
  let body = '';
  if (tab === 'exercicios') body = exPanel(b.id);
  else if (tab === 'formulas') body = formPanel(b.id);
  else if (tab === 'erros') body = errPanel(b.id);
  else if (tab === 'materiais') body = matPanel(b.id);
  else {
    const weeks = {};
    ss.forEach(s => (weeks[monday(s.date)] = weeks[monday(s.date)] || []).push(s));
    body = `<div class="exchips">${exams.map(e => `<button class="chip" style="--c:${b.color}" data-act="edit-exam" data-id="${e.id}">${esc(e.title)}, ${dd(e.date)}</button>`).join('')}
      <button class="btn sm" data-act="new-exam" data-s="${b.id}">${ic('plus', 14)} Prova</button><button class="btn sm primary" data-act="new-session" data-s="${b.id}">${ic('plus', 14)} Sessão</button></div>
      ${ss.length ? Object.keys(weeks).sort().map(w => `<section class="week${monday(today()) === w ? ' cur' : ''}"><h3><span>Semana de ${dd(w)}${monday(today()) === w ? ' (esta semana)' : ''}</span><span>${weeks[w].filter(s => s.status === 'done').length} de ${weeks[w].length}</span></h3><div class="box">${weeks[w].map(s => srow(s, { sub: false })).join('')}</div></section>`).join('') : empty('Nenhuma sessão ainda', 'Crie a primeira sessão para começar o plano desta matéria.', `<button class="btn primary" data-act="new-session" data-s="${b.id}">${ic('plus', 16)} Nova sessão</button>`)}`;
  }
  return `<section class="shead" style="--c:${b.color}"><i class="tile xl">${esc(b.icon)}</i>
    <div class="grow"><h1>${esc(b.name)}</h1><p class="sub">${esc(b.description)}</p><div class="bar"><i style="width:${pct(ss)}%"></i></div><small class="muted">${pct(ss)}% do plano, ${ss.filter(s => s.status === 'done').length} de ${ss.length} sessões</small></div>
    ${nx ? `<div class="count"><b>${daysTo(nx.date) || 'Hoje'}</b>${daysTo(nx.date) ? `<span>dias para a prova</span>` : ''}</div>` : ''}
    <div class="acts"><button class="btn sm" data-act="export" data-id="${b.id}">${ic('download', 14)} Exportar</button><button class="btn sm" data-act="edit-subject" data-id="${b.id}">${ic('edit', 14)} Editar</button></div></section>
    <nav class="tabs" style="--c:${b.color}">${tabs.map(([k, l, n]) => `<a class="${k === tab ? 'on' : ''}" href="#/materia/${b.id}/${k}">${l}<small>${n}</small></a>`).join('')}</nav>${body}`;
}

const steps = t => `<ol class="steps">${String(t).split('\n').filter(l => l.trim()).map(l => {
  const m = l.match(/^(\d+-\d+ min)\s+(.*)$/);
  return m ? `<li><span class="when">${esc(m[1])}</span><span>${esc(m[2])}</span></li>` : `<li class="plain"><span>${esc(l)}</span></li>`;
}).join('')}</ol>`;

const tsec = () => T.acc + (T.on ? Math.floor((Date.now() - T.t0) / 1000) : 0);
const tfmt = n => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;

function pageSession(r) {
  const s = S.sessions.find(x => x.id === r.id);
  if (!s) return empty('Sessão não encontrada', 'Ela pode ter sido excluída.', '<a class="btn" href="#/">Voltar ao início</a>');
  const b = sub(s.subject_id);
  const exs = S.exercises.filter(e => e.subject_id === s.subject_id && e.date === s.date);
  let terms = [];
  try {
    terms = JSON.parse(s.search || '[]');
  } catch {
    terms = [];
  }
  const nxt = sessOf(s.subject_id).find(x => x.date > s.date || (x.date === s.date && x.id > s.id));
  const mine = T.sid === s.id;
  return `<a class="crumb" href="#/materia/${b.id}">${ic('left', 16)} ${esc(b.name)}</a>
  <div class="sess" style="--c:${b.color}"><div>
    <div class="stitle"><h1>${esc(s.title)}</h1><div class="meta"><span>${WDF[pd(s.date).getDay()]}, ${dd(s.date)}</span><span>${hm(s.minutes)} planejados</span>${chip(b)}</div></div>
    ${s.theory ? `<section class="card blk"><h3>O que estudar</h3><div class="rich">${rich(s.theory)}</div></section>` : ''}
    ${terms.length ? `<section class="card blk"><h3>O que pesquisar</h3><div class="links">${terms.map(t => `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(t)}" target="_blank" rel="noopener">${ic('out', 14)} ${esc(t)}</a>`).join('')}</div></section>` : ''}
    ${s.plan ? `<section class="card blk"><h3>Roteiro do dia</h3>${steps(s.plan)}</section>` : ''}
    ${s.essentials || s.extra || s.answers ? `<section class="card blk"><h3>Exercícios</h3>${s.essentials ? `<div class="rich">${rich(s.essentials)}</div>` : ''}${s.extra ? `<h4 style="margin:14px 0 4px;font-family:var(--body)">Reforço</h4><div class="rich muted">${rich(s.extra)}</div>` : ''}${s.answers ? `<details class="ans"><summary>Gabarito e respostas</summary><div class="rich" style="margin-top:10px">${rich(s.answers)}</div></details>` : ''}</section>` : ''}
    ${exs.length ? `<section class="blk"><h3 style="margin-bottom:10px">Questões das listas neste dia (${exs.length})</h3><div class="exl">${exs.map(e => exRow(e, false)).join('')}</div></section>` : ''}
  </div>
  <aside class="panel">
    <section class="card"><h3 style="margin-bottom:10px">Status</h3><div class="segctl">${Object.entries(SS).map(([k, l]) => `<button class="${s.status === k ? 'on' : ''}" data-act="set" data-t="sessions" data-id="${s.id}" data-k="status" data-v="${k}">${k === 'done' ? ic('check', 16) : k === 'partial' ? ic('clock', 16) : ic('target', 16)} ${l}</button>`).join('')}</div></section>
    <section class="card timer"><h3>Cronômetro</h3><b id="tm">${tfmt(mine ? tsec() : 0)}</b>
      <div class="acts"><button class="btn sm primary" data-act="tm" data-id="${s.id}">${mine && T.on ? ic('pause', 14) + ' Pausar' : ic('play', 14) + ' Iniciar'}</button>${mine && tsec() >= 30 ? `<button class="btn sm" data-act="tm-stop" data-id="${s.id}">Registrar</button>` : ''}</div>
      <p class="muted small" style="margin-top:10px">Tempo registrado: ${hm(s.studied)}</p></section>
    <section class="card"><h3 style="margin-bottom:8px">Anotações</h3><textarea rows="6" data-t="sessions" data-id="${s.id}" data-k="notes" placeholder="Dúvidas, macetes, o que errar">${esc(s.notes)}</textarea></section>
    <div class="acts">${nxt ? `<a class="btn hl" href="#/sessao/${nxt.id}">Próxima sessão ${ic('right', 16)}</a>` : ''}<button class="btn" data-act="edit-session" data-id="${s.id}">${ic('edit', 16)} Editar</button></div>
  </aside></div>`;
}

function pageCal() {
  const first = new Date(cal.y, cal.m, 1);
  const last = new Date(cal.y, cal.m + 1, 0);
  const start = iso(new Date(cal.y, cal.m, 1 - first.getDay()));
  const n = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  const cells = Array.from({ length: n }, (_, i) => {
    const d = addDays(start, i);
    return `<div class="c${pd(d).getMonth() === cal.m ? '' : ' out'}${d === today() ? ' tod' : ''}"><span class="n">${pd(d).getDate()}</span>
      ${S.exams.filter(e => e.date === d).map(e => `<span class="ci xm" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}
      ${S.sessions.filter(s => s.date === d).map(s => `<a class="ci ${s.status}" style="--c:${sub(s.subject_id).color}" href="#/sessao/${s.id}" title="${esc(s.title)}">${esc(s.title)}</a>`).join('')}</div>`;
  });
  return `${head(`<span class="mk">${MON[cal.m][0].toUpperCase() + MON[cal.m].slice(1)}</span> de ${cal.y}`, '', `<button class="icon-btn" data-act="cal" data-d="-1" aria-label="Mês anterior">${ic('left')}</button><button class="btn sm" data-act="cal" data-d="0">Hoje</button><button class="icon-btn" data-act="cal" data-d="1" aria-label="Próximo mês">${ic('right')}</button>`)}
    <div class="cal">${WD.map(d => `<div class="h">${d}</div>`).join('')}${cells.join('')}</div>
    <div class="legend row" style="margin-top:14px">${S.subjects.map(b => `<span><i style="background:${b.color}"></i>${esc(b.name)}</span>`).join('')}<span><i style="background:var(--ink)"></i>Prova</span></div>`;
}

const pageEx = () => head('Exercícios', 'Todas as questões das suas listas, com status e resposta.') + exPanel(0);
const pageErr = () => head('Caderno de erros', 'Anote o motivo de cada erro e revise antes da prova.') + errPanel(0);
const pageForm = () => head('Fórmulas', 'Regras e cuidados para consultar rápido.') + formPanel(0);
const pageNotes = () => head('Avisos', 'Premissas, materiais e pontos de atenção.', `<button class="btn primary sm" data-act="new-note">${ic('plus', 16)} Nota</button>`) +
  (S.notes.length ? `<div class="cards" style="grid-template-columns:1fr">${S.notes.map(n => `<article class="card ecard"><div class="cardhead"><div class="acts"><h3>${esc(n.title)}</h3>${n.subject_id ? chip(sub(n.subject_id)) : ''}</div><button class="icon-btn sm" data-act="del" data-t="notes" data-id="${n.id}" aria-label="Apagar nota">${ic('trash', 16)}</button></div><div class="rich">${rich(n.body)}</div></article>`).join('')}</div>` : empty('Nenhuma nota', 'Guarde aqui avisos e lembretes que não cabem em uma sessão.'));

const PAGES = { inicio: pageHome, calendario: pageCal, exercicios: pageEx, erros: pageErr, formulas: pageForm, avisos: pageNotes, materia: pageSubject, sessao: pageSession };
const TITLES = { inicio: 'Início', calendario: 'Calendário', exercicios: 'Exercícios', erros: 'Caderno de erros', formulas: 'Fórmulas', avisos: 'Avisos', materia: 'Matéria', sessao: 'Sessão' };
const route = () => {
  const [p, id, tab] = location.hash.slice(2).split('/');
  return { p: PAGES[p] ? p : 'inicio', id: Number(id) || 0, tab };
};

function sidebar() {
  const r = route();
  const cur = r.p === 'materia' ? r.id : r.p === 'sessao' ? (S.sessions.find(s => s.id === r.id) || {}).subject_id : 0;
  const nav = [['inicio', 'Início', 'home'], ['calendario', 'Calendário', 'calendar'], ['exercicios', 'Exercícios', 'exercise'], ['erros', 'Caderno de erros', 'alert'], ['formulas', 'Fórmulas', 'formula'], ['avisos', 'Avisos', 'info']];
  $('#side').innerHTML = `<a class="brand" href="#/">${LOGO}<span>Caderno</span></a>
    <nav>${nav.map(([k, l, i]) => `<a class="nav${r.p === k ? ' on' : ''}" href="#/${k === 'inicio' ? '' : k}">${ic(i)}<span>${l}</span></a>`).join('')}</nav>
    <div class="side-h"><span>Matérias</span><button class="icon-btn sm" data-act="new-subject" aria-label="Nova matéria">${ic('plus', 16)}</button></div>
    <nav>${S.subjects.map(b => `<a class="nav${cur === b.id ? ' on' : ''}" href="#/materia/${b.id}" style="--c:${b.color}"><i class="tile">${esc(b.icon)}</i><span>${esc(b.name)}</span><small>${pct(sessOf(b.id))}%</small></a>`).join('')}</nav>
    <div class="grow"></div>
    <button class="nav" data-act="import">${ic('upload')}<span>Importar matéria</span></button>
    <div class="me"><button class="who" data-act="profile"><i>${esc((S.config.nome || '?')[0].toUpperCase())}</i><span>${esc(S.config.nome || 'Seu nome')}</span></button><button class="icon-btn" data-act="theme" aria-label="Alternar tema">${ic(dark() ? 'sun' : 'moon')}</button></div>`;
}

let lastHash = null;
function render() {
  const r = route();
  const y = scrollY;
  view.innerHTML = PAGES[r.p](r);
  sidebar();
  document.title = `${TITLES[r.p]} | Caderno`;
  if (lastHash === location.hash) scrollTo(0, y);
  else scrollTo(0, 0);
  lastHash = location.hash;
}

const field = f => {
  const v = f.value ?? '';
  let c;
  if (f.type === 'textarea') c = `<textarea name="${f.name}" rows="${f.rows || 3}">${esc(v)}</textarea>`;
  else if (f.type === 'select') c = `<select name="${f.name}">${opt(f.options, v)}</select>`;
  else if (f.type === 'color') c = `<div class="sw">${COLORS.map(k => `<input type="radio" name="${f.name}" value="${k}" style="--c:${k}" aria-label="Cor ${k}"${k === v ? ' checked' : ''}>`).join('')}</div>`;
  else c = `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}"${f.required ? ' required' : ''}${f.maxlength ? ` maxlength="${f.maxlength}"` : ''}>`;
  return `<label class="${f.wide ? 'wide' : ''}"><span>${f.label}</span>${c}</label>`;
};

function modal(title, fields, onOk, extra = '') {
  $('.overlay')?.remove();
  const m = document.createElement('div');
  m.className = 'overlay';
  m.innerHTML = `<form class="modal" role="dialog" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Fechar">${ic('x')}</button></header>
    <div class="fields">${fields.map(field).join('')}</div><footer>${extra}<button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">Salvar</button></footer></form>`;
  m.addEventListener('mousedown', e => {
    if (e.target === m) m.remove();
  });
  m.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) m.remove();
  });
  m.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await onOk(Object.fromEntries(new FormData(e.target)));
      m.remove();
    } catch { }
  });
  document.body.append(m);
  m.querySelector('input:not([type=radio]),textarea,select')?.focus();
}

const subSelect = (value, general) => ({ name: 'subject_id', label: 'Matéria', type: 'select', options: (general ? [['', 'Geral']] : []).concat(S.subjects.map(b => [b.id, b.name])), value });
const delBtn = (t, id, label) => `<button type="button" class="btn danger" data-act="del-modal" data-t="${t}" data-id="${id}">${label}</button>`;

const subjectForm = b => modal(b ? 'Editar matéria' : 'Nova matéria', [
  { name: 'name', label: 'Nome', value: b?.name, required: true, wide: true },
  { name: 'icon', label: 'Símbolo (até 3 caracteres)', value: b?.icon || '', maxlength: 3 },
  { name: 'color', label: 'Cor', type: 'color', value: b?.color || COLORS[S.subjects.length % COLORS.length], wide: true },
  { name: 'description', label: 'Descrição', type: 'textarea', rows: 2, value: b?.description, wide: true }
], async d => {
  if (b) {
    Object.assign(b, d);
    await api('PUT', `/api/subjects/${b.id}`, d);
    render();
  } else {
    const id = await create('subjects', d);
    location.hash = `#/materia/${id}`;
  }
}, b ? delBtn('subjects', b.id, 'Excluir matéria') : '');

const sessionForm = (sid, s) => modal(s ? 'Editar sessão' : 'Nova sessão', [
  { name: 'title', label: 'Título', value: s?.title, required: true, wide: true },
  { name: 'date', label: 'Data', type: 'date', value: s?.date || today(), required: true },
  { name: 'minutes', label: 'Minutos planejados', type: 'number', value: s?.minutes ?? 60 },
  { name: 'theory', label: 'O que estudar', type: 'textarea', rows: 4, value: s?.theory, wide: true },
  { name: 'search', label: 'O que pesquisar (um termo por linha)', type: 'textarea', value: s ? JSON.parse(s.search || '[]').join('\n') : '', wide: true },
  { name: 'plan', label: 'Roteiro do dia (ex.: 0-30 min  Teoria)', type: 'textarea', value: s?.plan, wide: true },
  { name: 'essentials', label: 'Exercícios essenciais', type: 'textarea', value: s?.essentials, wide: true },
  { name: 'extra', label: 'Reforço', type: 'textarea', rows: 2, value: s?.extra, wide: true },
  { name: 'answers', label: 'Gabarito', type: 'textarea', rows: 2, value: s?.answers, wide: true }
], async d => {
  const row = { ...d, subject_id: sid, minutes: Number(d.minutes) || 0, search: JSON.stringify(d.search.split('\n').map(x => x.trim()).filter(Boolean)) };
  if (s) {
    Object.assign(s, row);
    await api('PUT', `/api/sessions/${s.id}`, row);
    render();
  } else {
    const id = await create('sessions', row);
    location.hash = `#/sessao/${id}`;
  }
}, s ? delBtn('sessions', s.id, 'Excluir sessão') : '');

const examForm = (sid, e) => modal(e ? 'Editar prova' : 'Nova prova', [
  ...(sid ? [] : [subSelect('')]),
  { name: 'title', label: 'Nome da prova', value: e?.title, required: true, wide: true },
  { name: 'date', label: 'Data', type: 'date', value: e?.date, required: true },
  { name: 'note', label: 'Conteúdo ou observação', value: e?.note }
], async d => {
  const row = { ...d, subject_id: sid || Number(d.subject_id) };
  if (e) {
    Object.assign(e, row);
    await api('PUT', `/api/exams/${e.id}`, row);
    render();
  } else await create('exams', row);
}, e ? delBtn('exams', e.id, 'Excluir prova') : '');

const exerciseForm = (sid, e) => modal(e ? 'Editar exercício' : 'Novo exercício', [
  ...(sid || e ? [] : [subSelect('')]),
  { name: 'q', label: 'Questão', value: e?.q, required: true },
  { name: 'list', label: 'Lista ou fonte', value: e?.list },
  { name: 'topic', label: 'Assunto', value: e?.topic },
  { name: 'date', label: 'Dia de estudo', type: 'date', value: e?.date },
  { name: 'prio', label: 'Prioridade', type: 'select', options: ['Essencial', 'Reforço', 'Desafio'], value: e?.prio || 'Essencial' },
  { name: 'statement', label: 'Enunciado', type: 'textarea', value: e?.statement, wide: true },
  { name: 'answer', label: 'Resposta', type: 'textarea', rows: 2, value: e?.answer, wide: true }
], async d => {
  const row = { ...d, subject_id: e ? e.subject_id : sid || Number(d.subject_id) };
  if (e) {
    Object.assign(e, row);
    await api('PUT', `/api/exercises/${e.id}`, row);
    render();
  } else await create('exercises', row);
}, e ? delBtn('exercises', e.id, 'Excluir exercício') : '');

const formulaForm = sid => modal('Nova fórmula', [
  ...(sid ? [] : [subSelect('')]),
  { name: 'topic', label: 'Assunto', required: true, wide: !sid },
  { name: 'rule', label: 'Fórmula ou regra', type: 'textarea', rows: 2, wide: true },
  { name: 'care', label: 'Cuidado', wide: true }
], d => create('formulas', { ...d, subject_id: sid || Number(d.subject_id) }));

const errorForm = sid => modal('Registrar erro', [
  ...(sid ? [] : [subSelect('')]),
  { name: 'ref', label: 'Lista e questão', required: true },
  { name: 'kind', label: 'Tipo de erro', type: 'select', options: KINDS },
  { name: 'date', label: 'Data', type: 'date', value: today() },
  { name: 'review', label: 'Revisar em', type: 'date', value: addDays(today(), 3) },
  { name: 'did', label: 'O que eu fiz', type: 'textarea', wide: true },
  { name: 'fix', label: 'Como resolver certo', type: 'textarea', wide: true }
], d => create('errors', { ...d, subject_id: sid || Number(d.subject_id) }));

const noteForm = () => modal('Nova nota', [
  subSelect('', true),
  { name: 'title', label: 'Título', required: true },
  { name: 'body', label: 'Texto', type: 'textarea', rows: 6, wide: true }
], d => create('notes', { ...d, subject_id: d.subject_id ? Number(d.subject_id) : null }));

const materialForm = sid => modal('Enviar arquivo', [
  { name: 'title', label: 'Título', required: true },
  { name: 'kind', label: 'Tipo', type: 'select', options: ['Lista', 'Resumo', 'Prova', 'Slides', 'Arquivo'] },
  { name: 'file', label: 'Arquivo (até 60 MB)', type: 'file', required: true, wide: true }
], async d => {
  const f = d.file;
  const r = await fetch(`/api/upload?subject=${sid}&title=${encodeURIComponent(d.title)}&kind=${encodeURIComponent(d.kind)}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(f.name) }, body: f });
  if (!r.ok) {
    toast((await r.json().catch(() => ({}))).error || 'Não foi possível enviar o arquivo');
    throw new Error('upload');
  }
  await reload();
  render();
});

const profileForm = () => modal('Seu perfil', [{ name: 'nome', label: 'Nome', value: S.config.nome, required: true, wide: true }], async d => {
  await api('PUT', '/api/config', d);
  S.config.nome = d.nome;
  render();
});

const ACT = {
  menu: () => document.body.classList.toggle('menu'),
  theme: () => {
    const t = dark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem('tema', t);
    } catch { }
    sidebar();
  },
  'new-subject': () => subjectForm(),
  'edit-subject': d => subjectForm(S.subjects.find(b => b.id === Number(d.id))),
  'new-session': d => sessionForm(Number(d.s)),
  'edit-session': d => {
    const s = S.sessions.find(x => x.id === Number(d.id));
    sessionForm(s.subject_id, s);
  },
  'new-exam': d => examForm(Number(d.s) || 0),
  'edit-exam': d => {
    const e = S.exams.find(x => x.id === Number(d.id));
    examForm(e.subject_id, e);
  },
  'new-exercise': d => exerciseForm(Number(d.s) || 0),
  'edit-exercise': d => exerciseForm(0, S.exercises.find(x => x.id === Number(d.id))),
  'new-formula': d => formulaForm(Number(d.s) || 0),
  'new-error': d => errorForm(Number(d.s) || 0),
  'new-note': noteForm,
  'new-material': d => materialForm(Number(d.s)),
  profile: profileForm,
  tog: d => {
    const s = S.sessions.find(x => x.id === Number(d.id));
    commit('sessions', s.id, { status: s.status === 'done' ? 'todo' : 'done' });
  },
  cycle: d => {
    const e = S.exercises.find(x => x.id === Number(d.id));
    commit('exercises', e.id, { status: { todo: 'done', done: 'redo', redo: 'todo' }[e.status] });
  },
  set: d => commit(d.t, d.id, { [d.k]: d.v }),
  flip: d => commit(d.t, d.id, { [d.k]: S[d.t].find(x => x.id === Number(d.id))[d.k] ? 0 : 1 }),
  del: async d => {
    if (!confirm('Apagar este item?')) return;
    await remove(d.t, d.id);
    render();
  },
  'del-modal': async d => {
    const what = { subjects: 'Excluir esta matéria apaga o plano, os exercícios e tudo que está nela. Continuar?', sessions: 'Excluir esta sessão?', exams: 'Excluir esta prova?', exercises: 'Excluir este exercício?' }[d.t];
    if (!confirm(what)) return;
    const back = d.t === 'sessions' ? `#/materia/${S.sessions.find(x => x.id === Number(d.id)).subject_id}` : d.t === 'subjects' ? '#/' : location.hash;
    await remove(d.t, d.id);
    $('.overlay')?.remove();
    location.hash = back;
    render();
  },
  cal: d => {
    const n = Number(d.d);
    const base = n === 0 ? new Date() : new Date(cal.y, cal.m + n, 1);
    cal = { y: base.getFullYear(), m: base.getMonth() };
    render();
  },
  tm: d => {
    const id = Number(d.id);
    if (T.sid !== id) {
      clearInterval(T.iv);
      Object.assign(T, { sid: id, acc: 0, on: false });
    }
    if (T.on) {
      T.acc = tsec();
      T.on = false;
      clearInterval(T.iv);
    } else {
      T.t0 = Date.now();
      T.on = true;
      T.iv = setInterval(() => {
        const n = $('#tm');
        if (n) n.textContent = tfmt(tsec());
      }, 500);
    }
    render();
  },
  'tm-stop': d => {
    const s = S.sessions.find(x => x.id === Number(d.id));
    const min = Math.max(1, Math.round(tsec() / 60));
    clearInterval(T.iv);
    Object.assign(T, { sid: 0, acc: 0, on: false });
    commit('sessions', s.id, { studied: s.studied + min });
    toast(`${min} min registrados`);
  },
  export: async d => {
    const data = await api('GET', `/api/export/${d.id}`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
    a.download = `${data.subject.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  import: () => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = '.json,application/json';
    i.onchange = async () => {
      try {
        const r = await api('POST', '/api/import', JSON.parse(await i.files[0].text()));
        await reload();
        location.hash = `#/materia/${r.id}`;
        render();
        toast('Matéria importada');
      } catch {
        toast('Não foi possível importar. Use um arquivo exportado pelo Caderno.');
      }
    };
    i.click();
  }
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a || a.tagName === 'INPUT') return;
  ACT[a.dataset.act]?.(a.dataset);
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.act === 'flip') return ACT.flip(el.dataset);
  if (el.dataset.t && el.dataset.k && el.dataset.act !== 'set') commit(el.dataset.t, el.dataset.id, { [el.dataset.k]: el.value });
});

const LIVE = { ex: exItems, form: formItems, err: errItems };
view.addEventListener('input', e => {
  const k = e.target.dataset.q;
  if (!k) return;
  Q[k] = e.target.value;
  if (k === 'sub') Q.list = '';
  if (e.target.type === 'search') document.querySelectorAll('[data-live]').forEach(n => (n.innerHTML = LIVE[n.dataset.live](Number(n.dataset.sid) || 0)));
  else render();
});

view.addEventListener('toggle', e => {
  const id = e.target.dataset?.ex;
  if (!id) return;
  if (e.target.open) OPEN.add(id);
  else OPEN.delete(id);
}, true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $('.overlay')?.remove();
});

window.addEventListener('hashchange', () => {
  Q = {};
  document.body.classList.remove('menu');
  render();
});

reload().then(render);
