/**
 * EstudosOS - Core Application Framework
 * Arquitetura SPA avançada sem dependências externas.
 */

// --- 1. UTILS & HELPERS ---
const DOM = {
  get: (selector) => document.querySelector(selector),
  getAll: (selector) => document.querySelectorAll(selector),
  create: (tag, className = '', innerHTML = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  },
  escape: (str) => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
};

const Formatter = {
  date: (isoString) => {
    if (!isoString) return '';
    const [y, m, d] = isoString.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  },
  percentage: (value, total) => total > 0 ? Math.round((value / total) * 100) : 0,
  number: (num) => new Intl.NumberFormat('pt-BR').format(num)
};

// --- 2. STATE MANAGEMENT (PROXY-BASED STORE) ---
class Store {
  constructor(initialState = {}) {
    this.events = new Map();
    this.state = this._createProxy(initialState);
  }

  _createProxy(target) {
    return new Proxy(target, {
      get: (obj, prop) => {
        if (typeof obj[prop] === 'object' && obj[prop] !== null) {
          return this._createProxy(obj[prop]);
        }
        return obj[prop];
      },
      set: (obj, prop, value) => {
        const oldValue = obj[prop];
        if (oldValue !== value) {
          obj[prop] = value;
          this.publish('*', this.state);
          this.publish(prop, value);
        }
        return true;
      }
    });
  }

  subscribe(event, callback) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(callback);
    return () => {
      const callbacks = this.events.get(event);
      this.events.set(event, callbacks.filter(cb => cb !== callback));
    };
  }

  publish(event, payload) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(cb => cb(payload));
    }
  }

  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

// --- 3. UI SYSTEM (TOASTS, MODALS) ---
class UISystem {
  constructor() {
    this.toastContainer = DOM.get('#toast-container');
    this.modal = DOM.get('#global-modal');
    this.themeToggle = DOM.get('#theme-toggle');
    this.sidebarToggle = DOM.get('#toggle-sidebar');
    this.setupListeners();
    this.initTheme();
  }

  setupListeners() {
    if (this.modal) {
      DOM.get('.modal-close').addEventListener('click', () => this.closeModal());
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', () => {
        DOM.get('#sidebar').classList.toggle('collapsed');
      });
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.open) this.closeModal();
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        DOM.get('#global-search')?.focus();
      }
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem('estudos_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('estudos_theme', next);
    this.updateThemeIcon(next);
  }

  updateThemeIcon(theme) {
    const icon = this.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  showToast(title, message, type = 'info') {
    const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-exclamation-triangle', warning: 'fa-exclamation-circle' };
    const toast = DOM.create('div', `toast toast-${type}`);
    toast.innerHTML = `
      <i class="fas ${icons[type]} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${DOM.escape(title)}</div>
        <div class="toast-message">${DOM.escape(message)}</div>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    this.toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove());
    };
    
    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, 5000);
  }

  openModal(title, bodyHTML, footerHTML = '') {
    DOM.get('#modal-title').textContent = title;
    DOM.get('#modal-body').innerHTML = bodyHTML;
    DOM.get('#modal-footer').innerHTML = footerHTML;
    this.modal.showModal();
  }

  closeModal() {
    this.modal.close();
  }
}

// --- 4. HTTP CLIENT ---
class ApiClient {
  constructor(ui) {
    this.ui = ui;
    this.syncIndicator = DOM.get('#sync-indicator');
  }

  setSyncing(isSyncing) {
    if (!this.syncIndicator) return;
    const icon = this.syncIndicator.querySelector('i');
    const text = this.syncIndicator.querySelector('span');
    if (isSyncing) {
      this.syncIndicator.classList.remove('active');
      icon.className = 'fas fa-sync fa-spin sync-icon';
      text.textContent = 'Sincronizando...';
    } else {
      this.syncIndicator.classList.add('active');
      icon.className = 'fas fa-cloud-check sync-icon';
      text.textContent = 'Sincronizado';
    }
  }

  async getMockData() {
    this.setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay sim
    this.setSyncing(false);
    
    // MOCK DATA: Focused on Engenharia de Software context
    return {
      user: { name: 'Sávio Salomão', course: 'Engenharia de Software', registration: 906957 },
      modules: [
        { id: 'calc1', name: 'Cálculo 1', progress: 65, totalExercises: 120, completedExercises: 78, nextTopic: 'Regra da Cadeia' },
        { id: 'alg', name: 'Algoritmos e Estruturas', progress: 82, totalExercises: 85, completedExercises: 70, nextTopic: 'Listas Encadeadas' },
        { id: 'engsoft', name: 'Engenharia de Requisitos', progress: 45, totalExercises: 40, completedExercises: 18, nextTopic: 'Diagrama de Casos de Uso' }
      ],
      recentActivity: [
        { id: 1, type: 'exercise', subject: 'Cálculo 1', desc: 'Lista 4: Limites Fundamentais resolvida', date: new Date().toISOString(), status: 'success' },
        { id: 2, type: 'error', subject: 'Algoritmos', desc: 'Falha em alocação dinâmica de ponteiros', date: new Date(Date.now() - 86400000).toISOString(), status: 'warning' },
        { id: 3, type: 'module', subject: 'Engenharia de Requisitos', desc: 'Leitura: Modelagem Ágil concluída', date: new Date(Date.now() - 172800000).toISOString(), status: 'info' }
      ],
      performanceStats: [45, 52, 58, 65, 78, 85, 92] // Chart data
    };
  }
}

// --- 5. COMPONENT BASE CLASS ---
class Component {
  constructor(store, ui) {
    this.store = store;
    this.ui = ui;
    this.container = DOM.get('#app-root');
    this.unsubscribers = [];
  }
  
  async mount() {
    this.container.innerHTML = this.renderSkeleton();
    await this.fetchData();
    this.render();
    this.setupDOM();
  }
  
  unmount() {
    this.unsubscribers.forEach(unsub => unsub());
    this.container.innerHTML = '';
  }

  fetchData() {} // Override
  renderSkeleton() { return '<div class="skeleton" style="height: 100%; width: 100%;"></div>'; }
  render() {} // Override
  setupDOM() {} // Override
  
  updateBreadcrumbs(paths) {
    const bc = DOM.get('#breadcrumbs');
    if (!bc) return;
    bc.innerHTML = paths.map((p, i) => `
      <span>${i > 0 ? '<i class="fas fa-chevron-right" style="font-size:0.6rem"></i>' : ''} ${p}</span>
    `).join('');
  }
}

// --- 6. VIEWS ---

class DashboardView extends Component {
  async fetchData() {
    if (!this.store.state.dashboardLoaded) {
      const api = new ApiClient(this.ui);
      try {
        const data = await api.getMockData();
        this.store.state.user = data.user;
        this.store.state.modules = data.modules;
        this.store.state.recentActivity = data.recentActivity;
        this.store.state.performanceStats = data.performanceStats;
        this.store.state.dashboardLoaded = true;
      } catch (e) {
        this.ui.showToast('Erro Crítico', 'Falha ao carregar dados do servidor.', 'error');
      }
    }
  }

  renderSkeleton() {
    return `
      <div class="page-header">
        <div class="page-title-group"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="width:200px"></div></div>
      </div>
      <div class="grid grid-cols-3" style="margin-bottom: 2rem;">
        <div class="card skeleton" style="height: 160px"></div>
        <div class="card skeleton" style="height: 160px"></div>
        <div class="card skeleton" style="height: 160px"></div>
      </div>
      <div class="card skeleton" style="height: 300px"></div>
    `;
  }

  render() {
    this.updateBreadcrumbs(['Visão Geral', 'Dashboard Analytics']);
    const { modules, recentActivity, performanceStats } = this.store.state;
    
    let totalEx = 0;
    let doneEx = 0;
    modules.forEach(m => { totalEx += m.totalExercises; doneEx += m.completedExercises; });
    const globalProgress = Formatter.percentage(doneEx, totalEx);

    const calcData = modules.find(m => m.id === 'calc1');

    this.container.innerHTML = `
      <header class="page-header">
        <div class="page-title-group">
          <h1>Analytics Acadêmico</h1>
          <p class="page-subtitle">Resumo de desempenho e metas operacionais.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-report"><i class="fas fa-download"></i> Relatório PDF</button>
          <button class="btn btn-primary" id="btn-start"><i class="fas fa-play"></i> Iniciar Sessão</button>
        </div>
      </header>

      <div class="grid grid-cols-3" style="margin-bottom: var(--spacing-xl);">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-chart-line" style="color:var(--color-primary)"></i> Progresso Global</div>
            <i class="fas fa-ellipsis-v card-action"></i>
          </div>
          <div class="stat-value">${globalProgress}<span class="stat-unit">%</span></div>
          <div class="progress-container">
            <div class="progress-meta"><span>Conclusão do Semestre</span><span>${doneEx}/${totalEx} ex.</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width: 0%" data-target="${globalProgress}"></div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-fire" style="color:var(--color-warning)"></i> Foco Prioritário</div>
          </div>
          <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">Cálculo 1</div>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">Meta atual: ${calcData.nextTopic}</p>
          <div class="progress-container" style="margin-top:auto">
            <div class="progress-meta"><span>Status do Módulo</span><span>${calcData.progress}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="background: linear-gradient(90deg, var(--color-warning), #ff7675); width: 0%" data-target="${calcData.progress}"></div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-brain" style="color:var(--color-secondary)"></i> Retenção Estimada</div>
            <span class="stat-trend up"><i class="fas fa-arrow-up"></i> 4%</span>
          </div>
          <div class="stat-value">82<span class="stat-unit">/100</span></div>
          <p style="color: var(--text-tertiary); font-size: 0.85rem; margin-top: auto;">Baseado em acertos nos simulados recentes de Algoritmos.</p>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-wave-square"></i> Curva de Aprendizado</div>
          </div>
          <div class="chart-container" id="mock-chart">
            ${performanceStats.map((val, i) => `
              <div class="chart-bar">
                <div class="chart-bar-fill" style="height: 0%" data-height="${val}%"></div>
                <div class="chart-tooltip">Score: ${val}</div>
                <div class="chart-label">S${i+1}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card" style="padding: 0;">
          <div class="card-header" style="padding: var(--spacing-lg) var(--spacing-lg) 0;">
            <div class="card-title"><i class="fas fa-history"></i> Log de Atividades</div>
          </div>
          <div class="table-wrapper" style="border: none; border-radius: 0 0 var(--radius-lg) var(--radius-lg); margin-top: var(--spacing-md)">
            <table class="data-table">
              <tbody>
                ${recentActivity.map(act => `
                  <tr>
                    <td style="width: 40px; text-align: center;">
                      <i class="fas ${act.type === 'exercise' ? 'fa-dumbbell' : act.type === 'error' ? 'fa-bug' : 'fa-book'}" style="color: var(--color-${act.status})"></i>
                    </td>
                    <td>
                      <div class="td-highlight">${DOM.escape(act.subject)}</div>
                      <div style="font-size: 0.8rem; margin-top: 4px;">${DOM.escape(act.desc)}</div>
                    </td>
                    <td style="text-align: right; font-size: 0.8rem;">${Formatter.date(act.date)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  setupDOM() {
    // Animate Progress bars
    setTimeout(() => {
      DOM.getAll('.progress-fill').forEach(el => {
        el.style.width = el.getAttribute('data-target') + '%';
      });
      DOM.getAll('.chart-bar-fill').forEach(el => {
        el.style.height = el.getAttribute('data-height');
      });
    }, 100);

    DOM.get('#btn-report')?.addEventListener('click', () => {
      this.ui.showToast('Geração de Relatório', 'Compilando dados de Engenharia de Software para PDF...', 'info');
    });

    DOM.get('#btn-start')?.addEventListener('click', () => {
      this.ui.openModal(
        'Configurar Sessão de Estudo',
        `
          <div class="form-group">
            <label class="form-label">Disciplina Alvo</label>
            <select class="form-control" id="session-subject">
              <option>Cálculo 1</option>
              <option>Algoritmos</option>
              <option>Engenharia de Requisitos</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tempo Focado (Minutos)</label>
            <input type="number" class="form-control" value="50" min="15" max="120">
          </div>
        `,
        `
          <button class="btn btn-secondary modal-close" onclick="document.querySelector('#global-modal').close()">Cancelar</button>
          <button class="btn btn-primary" onclick="alert('Timer Pomodoro iniciado!'); document.querySelector('#global-modal').close()">Iniciar Timer</button>
        `
      );
    });
  }
}

class SubjectsView extends Component {
  render() {
    this.updateBreadcrumbs(['Acadêmico', 'Módulos & Disciplinas']);
    this.container.innerHTML = `
      <header class="page-header">
        <div class="page-title-group">
          <h1>Módulos Acadêmicos</h1>
          <p class="page-subtitle">Gestão curricular e material de apoio.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary"><i class="fas fa-plus"></i> Nova Disciplina</button>
        </div>
      </header>
      <div class="card" style="text-align: center; padding: 4rem;">
        <i class="fas fa-tools" style="font-size: 3rem; color: var(--color-primary); margin-bottom: 1rem;"></i>
        <h2>Módulo em Construção</h2>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">A interface de matriz curricular está sendo sincronizada com o sistema da universidade.</p>
      </div>
    `;
  }
}

// --- 7. ROUTER ---
class Router {
  constructor(store, ui) {
    this.store = store;
    this.ui = ui;
    this.routes = {};
    this.currentView = null;
    
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  addRoute(path, ComponentClass) {
    this.routes[path] = ComponentClass;
  }

  handleRoute() {
    const path = window.location.hash.replace('#', '') || '/dashboard';
    
    // Update Sidebar Active State
    DOM.getAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-route') === path) el.classList.add('active');
      else el.classList.remove('active');
    });

    // Unmount previous view
    if (this.currentView) {
      this.currentView.unmount();
    }

    // Mount new view
    const ComponentClass = this.routes[path];
    if (ComponentClass) {
      this.currentView = new ComponentClass(this.store, this.ui);
      this.currentView.mount();
    } else {
      DOM.get('#app-root').innerHTML = `
        <div class="card" style="text-align:center; padding: 5rem 2rem;">
          <h2 style="font-size:4rem; margin-bottom:1rem; color:var(--text-tertiary); font-family:var(--font-mono)">404</h2>
          <p style="font-size:1.2rem">A rota solicitada (<code>${path}</code>) não foi encontrada no roteador client-side.</p>
          <button class="btn btn-primary" style="margin-top:2rem" onclick="window.location.hash='#/dashboard'">Voltar ao Dashboard</button>
        </div>
      `;
    }
  }
}

// --- 8. BOOTSTRAP APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Simulate App Boot
  setTimeout(() => {
    DOM.get('#loader-overlay').classList.add('hidden');
    document.body.classList.remove('spa-loading');
    
    const store = new Store();
    const ui = new UISystem();
    const router = new Router(store, ui);

    router.addRoute('/dashboard', DashboardView);
    router.addRoute('/materias', SubjectsView);
    // Add other mocked routes mapping to SubjectsView for demonstration
    router.addRoute('/exercicios', SubjectsView);
    router.addRoute('/erros', SubjectsView);

    router.handleRoute();
    
    ui.showToast('Sistema Operacional', 'Ambiente de estudos carregado com sucesso. Bem-vindo, Sávio Salomão.', 'success');
  }, 1200);
});