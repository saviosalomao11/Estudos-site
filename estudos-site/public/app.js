let S = null;
let tab = 'dia';
let sel = null;
const filters = { list: '', prio: '', status: '', q: '' };
const view = document.getElementById('view');

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = (m, u, b) => fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }).then(r => r.json());
const todayIso = () => new Date().toLocaleDateString('sv');
const fmt = iso => (iso ? iso.split('-').reverse().join('/') : '');
const diffDays = iso => Math.round((new Date(iso + 'T00:00:00') - new Date(todayIso() + 'T00:00:00')) / 86400000);
const opts = (list, cur) => list.map(o => `<option${o === cur ? ' selected' : ''}>${esc(o)}</option>`).join('');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const rowClass = e => (e.status === 'Feito' ? 'done' : e.status === 'Refazer' ? 'redo' : '');
const todayDay = () => (S.days.find(d => d.date >= todayIso()) || S.days[S.days.length - 1]).n;

function counts() {
  const c = S.config;
  const items = [['Cálculo 1', c.prova_calculo1], ['Algoritmos', c.prova_algoritmos], ['Próx. Cálculo', c.prova_calculo2]]
    .filter(([, d]) => d)
    .map(([n, d]) => {
      const k = diffDays(d);
      return `<span>${n}: ${k > 0 ? k + ' dias' : k === 0 ? 'hoje' : 'passou'}</span>`;
    });
  document.getElementById('counts').innerHTML = items.join('');
}

function sec(title, text) {
  return text ? `<h3>${title}</h3><div class="pre">${esc(text)}</div>` : '';
}

function links(arr) {
  if (!arr.length) return '';
  return '<h3>O que pesquisar (abre no YouTube)</h3><div class="links">' +
    arr.map(t => `<a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(t)}">${esc(t)}</a>`).join('') + '</div>';
}

function exTable(list) {
  if (!list.length) return '<p class="muted">Nenhum exercício.</p>';
  return '<div class="scroll"><table><tr><th>Lista</th><th>Questão</th><th>Assunto</th><th>Prio.</th><th>Resposta</th><th>Status</th><th>Acertei?</th><th>Obs.</th></tr>' +
    list.map(e => `<tr class="${rowClass(e)}" data-ex="${e.id}">
      <td>${esc(e.list)}</td><td>${esc(e.q)}</td><td>${esc(e.subject)}</td><td>${esc(e.prio)}</td>
      <td><details><summary>ver</summary>${esc(e.resp || 'Veja o gabarito no PDF')}<div class="muted">Gabarito no PDF: ${esc(e.gab)}</div></details></td>
      <td><select data-f="status">${opts(['Não feito', 'Feito', 'Refazer'], e.status)}</select></td>
      <td><select data-f="correct">${opts(['', 'Sim', 'Parcial', 'Não'], e.correct)}</select></td>
      <td><input data-f="note" value="${esc(e.note)}" size="14"></td></tr>`).join('') + '</table></div>';
}

function dia() {
  const d = S.days.find(x => x.n === sel);
  const c = d.calc;
  const a = d.alg;
  const exs = S.exercises.filter(e => e.date === d.date);
  return `<div data-day="${d.n}">
    <div class="row">
      <button class="btn alt" data-go="${d.n - 1}"${d.n === 1 ? ' disabled' : ''}>‹ Anterior</button>
      <h2 class="grow">Dia ${d.n} de ${S.days.length}: ${d.wd}, ${fmt(d.date)} ${d.exam ? `<span class="tag exam">PROVA DE ${esc(d.exam.toUpperCase())}</span>` : ''}</h2>
      <button class="btn alt" data-go="${d.n + 1}"${d.n === S.days.length ? ' disabled' : ''}>Próximo ›</button>
    </div>
    <div class="grid2">
      <div class="card">
        <div class="row"><h2 class="grow">Cálculo: ${esc(c.topic)}</h2><span class="tag">${c.min} min</span></div>
        ${sec('O que estudar', c.teoria)}${links(c.pesq)}${sec('Roteiro do dia', c.roteiro)}${sec('Exercícios essenciais', c.ess)}${sec('Reforço', c.ref)}
        ${c.gab ? `<details><summary>Gabarito e respostas</summary><div class="pre">${esc(c.gab)}</div></details>` : ''}
        <div class="row" style="margin-top:12px"><label>Feito? <select data-f="calc_done">${opts(['Não', 'Parcial', 'Sim'], d.calc_done)}</select></label></div>
      </div>
      <div class="card">
        <div class="row"><h2 class="grow">Algoritmos: ${esc(a.topic)}</h2><span class="tag">${a.min} min</span></div>
        ${sec('O que estudar', a.teoria)}${links(a.pesq)}${sec('Roteiro do dia', a.roteiro)}${sec('Exercícios sugeridos', a.ex)}
        <div class="row" style="margin-top:12px"><label>Feito? <select data-f="alg_done">${opts(['Não', 'Parcial', 'Sim'], d.alg_done)}</select></label></div>
      </div>
    </div>
    <div class="card"><h2>Exercícios das listas neste dia (${exs.length})</h2>${exTable(exs)}</div>
    <div class="card"><h2>Anotações do dia</h2><textarea data-f="notes">${esc(d.notes)}</textarea></div>
  </div>`;
}

function cronograma() {
  const t = todayIso();
  return '<div class="scroll"><table><tr><th>Dia</th><th>Data</th><th>Cálculo</th><th>Min</th><th>Algoritmos</th><th>Min</th><th>Cálculo feito</th><th>Alg. feito</th></tr>' +
    S.days.map(d => `<tr data-go="${d.n}" class="p${d.phase}${d.date === t ? ' today' : ''}" style="cursor:pointer">
      <td class="d">${d.n}</td><td class="d">${d.wd} ${fmt(d.date)}</td><td>${esc(d.calc.topic)}</td><td>${d.calc.min}</td>
      <td>${esc(d.alg.topic)}</td><td>${d.alg.min}</td><td>${esc(d.calc_done)}</td><td>${esc(d.alg_done)}</td></tr>`).join('') +
    '</table></div><p class="muted">Clique em uma linha para abrir o dia. Azul: Fase 1 (foco em Cálculo 1). Verde: Fase 2 (foco em Algoritmos). Borda amarela: hoje.</p>';
}

function filtered() {
  const q = filters.q.toLowerCase();
  return S.exercises.filter(e =>
    (!filters.list || e.list === filters.list) && (!filters.prio || e.prio === filters.prio) &&
    (!filters.status || e.status === filters.status) &&
    (!q || (e.q + ' ' + e.subject + ' ' + e.list).toLowerCase().includes(q)));
}

function exercicios() {
  const lists = [...new Set(S.exercises.map(e => e.list))];
  return `<div class="row">
    <select data-filter="list"><option value="">Todas as listas</option>${opts(lists, filters.list)}</select>
    <select data-filter="prio"><option value="">Toda prioridade</option>${opts(['Essencial', 'Reforço', 'Desafio'], filters.prio)}</select>
    <select data-filter="status"><option value="">Todo status</option>${opts(['Não feito', 'Feito', 'Refazer'], filters.status)}</select>
    <input data-filter="q" placeholder="Buscar" value="${esc(filters.q)}">
  </div><div id="extable">${exTable(filtered())}</div>`;
}

function erros() {
  return `<div class="card"><h2>Novo erro</h2>
    <div class="row">
      <input type="date" id="e-date" value="${todayIso()}">
      <select id="e-subject"><option>Cálculo</option><option>Algoritmos</option></select>
      <input id="e-ref" placeholder="Lista / questão">
      <select id="e-kind">${opts(['Conta', 'Conceito', 'Pegadinha', 'Fórmula', 'Interpretação', 'Distração'], '')}</select>
      <label>Revisar em <input type="date" id="e-review"></label>
    </div>
    <div class="row"><textarea id="e-did" placeholder="O que eu fiz"></textarea></div>
    <div class="row"><textarea id="e-fix" placeholder="Como resolver certo"></textarea></div>
    <button class="btn" id="e-add">Salvar erro</button></div>
    ${S.errors.length ? '<div class="scroll"><table><tr><th>Data</th><th>Matéria</th><th>Questão</th><th>Tipo</th><th>O que fiz</th><th>Certo</th><th>Revisar</th><th>Revisado</th><th></th></tr>' +
      S.errors.map(e => `<tr data-err="${e.id}"><td>${fmt(e.date)}</td><td>${esc(e.subject)}</td><td>${esc(e.ref)}</td><td>${esc(e.kind)}</td>
        <td>${esc(e.did)}</td><td>${esc(e.fix)}</td><td>${fmt(e.review)}</td>
        <td><select data-f="reviewed">${opts(['Não', 'Sim'], e.reviewed)}</select></td><td><button class="btn alt" data-del="${e.id}">Apagar</button></td></tr>`).join('') + '</table></div>'
      : '<p class="muted">Nenhum erro anotado ainda.</p>'}`;
}

function formulas() {
  return '<div class="scroll"><table><tr><th>Assunto</th><th>Fórmula / regra</th><th>Cuidado</th></tr>' +
    S.formulas.map(f => `<tr><td><b>${esc(f.subject)}</b></td><td>${esc(f.rule)}</td><td>${esc(f.care)}</td></tr>`).join('') + '</table></div>';
}

function bar(label, a, b) {
  return `<div class="card"><div class="row"><span class="grow">${label}</span><b>${a} de ${b} (${pct(a, b)}%)</b></div><div class="bar"><i style="width:${pct(a, b)}%"></i></div></div>`;
}

function progresso() {
  const ex = S.exercises;
  const ess = ex.filter(e => e.prio === 'Essencial');
  const p1 = ess.filter(e => e.date <= S.config.prova_calculo1);
  const feitos = list => list.filter(e => e.status === 'Feito').length;
  const c = S.config;
  return `${bar('Dias de Cálculo concluídos', S.days.filter(d => d.calc_done === 'Sim').length, S.days.length)}
    ${bar('Dias de Algoritmos concluídos', S.days.filter(d => d.alg_done === 'Sim').length, S.days.length)}
    ${bar('Exercícios (todos)', feitos(ex), ex.length)}
    ${bar('Exercícios essenciais', feitos(ess), ess.length)}
    ${bar('Essenciais antes da prova de Cálculo 1', feitos(p1), p1.length)}
    ${bar('Acertos entre os feitos', ex.filter(e => e.correct === 'Sim').length, ex.filter(e => e.correct).length)}
    <div class="card"><b>Questões para refazer:</b> ${ex.filter(e => e.status === 'Refazer').length} &nbsp; <b>Erros anotados:</b> ${S.errors.length}</div>
    <div class="card"><h2>Datas e configurações</h2>
      <div class="row"><label>Prova de Cálculo 1 <input type="date" data-cfg="prova_calculo1" value="${esc(c.prova_calculo1)}"></label>
      <label>Prova de Algoritmos <input type="date" data-cfg="prova_algoritmos" value="${esc(c.prova_algoritmos)}"></label>
      <label>Próxima prova de Cálculo <input type="date" data-cfg="prova_calculo2" value="${esc(c.prova_calculo2)}"></label>
      <label>Linguagem de Algoritmos <input data-cfg="linguagem" value="${esc(c.linguagem)}"></label></div></div>`;
}

function info() {
  return S.info.map(i => `<div class="card"><h2>${esc(i.title)}</h2>${i.lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>`).join('');
}

function render() {
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  counts();
  const views = { dia, cronograma, exercicios, erros, formulas, progresso, info };
  view.innerHTML = views[tab]();
}

document.getElementById('nav').addEventListener('click', ev => {
  if (ev.target.dataset.tab) {
    tab = ev.target.dataset.tab;
    render();
  }
});

view.addEventListener('click', async ev => {
  const go = ev.target.closest('[data-go]');
  if (go && !ev.target.closest('select')) {
    sel = Number(go.dataset.go);
    tab = 'dia';
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (ev.target.id === 'e-add') {
    const v = id => document.getElementById(id).value;
    await api('POST', '/api/errors', { date: v('e-date'), subject: v('e-subject'), ref: v('e-ref'), kind: v('e-kind'), did: v('e-did'), fix: v('e-fix'), review: v('e-review') });
    S = await api('GET', '/api/data');
    render();
  }
  if (ev.target.dataset.del) {
    await api('DELETE', `/api/errors/${ev.target.dataset.del}`);
    S = await api('GET', '/api/data');
    render();
  }
});

view.addEventListener('input', ev => {
  const f = ev.target.dataset.filter;
  if (!f) return;
  filters[f] = ev.target.value;
  document.getElementById('extable').innerHTML = exTable(filtered());
});

view.addEventListener('change', async ev => {
  const el = ev.target;
  if (el.dataset.filter) return;
  if (el.dataset.cfg) {
    S.config[el.dataset.cfg] = el.value;
    await api('PUT', '/api/config', { [el.dataset.cfg]: el.value });
    counts();
    return;
  }
  const f = el.dataset.f;
  if (!f) return;
  const exRow = el.closest('[data-ex]');
  const errRow = el.closest('[data-err]');
  const dayBox = el.closest('[data-day]');
  if (exRow) {
    const e = S.exercises.find(x => x.id === Number(exRow.dataset.ex));
    e[f] = el.value;
    await api('PUT', `/api/exercises/${e.id}`, { [f]: el.value });
    exRow.className = rowClass(e);
  } else if (errRow) {
    const e = S.errors.find(x => x.id === Number(errRow.dataset.err));
    e[f] = el.value;
    await api('PUT', `/api/errors/${e.id}`, { [f]: el.value });
  } else if (dayBox) {
    const d = S.days.find(x => x.n === Number(dayBox.dataset.day));
    d[f] = el.value;
    await api('PUT', `/api/days/${d.n}`, { [f]: el.value });
  }
});

(async () => {
  S = await api('GET', '/api/data');
  sel = todayDay();
  render();
})();
