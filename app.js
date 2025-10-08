// TeleCorp - Enhanced Telephone Line Management Application with Connection Fixes

class TeleCorpApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isOnline = false;
        this.operationMode = 'fallback'; // online, offline, fallback
        this.autoRefreshInterval = null;
        this.showNotifications = true;
        this.enableDebug = true;
        this.retryAttempts = 3;
        this.retryDelay = 2000;
        this.lastSync = null;
        this.pendingOperations = [];
        this.debugLogs = [];
        
        // Enhanced configuration
        this.config = {
            databaseUrl: "postgresql://neondb_owner:npg_rLH8DGJBsfk2@ep-holy-firefly-acnw4zp1-pooler.sa-east-1.aws.neon.tech/linhas_db?sslmode=require&channel_binding=require",
            apiBaseUrl: this.getApiBaseUrl(),
            enableLogs: true,
            retryAttempts: 3,
            retryDelay: 2000,
            fallbackMode: true,
            autoRefresh: 30
        };
        
        // Fallback data structure with enhanced data
        this.data = {
            entidades: [
                {
                    nome: "145111",
                    totalLinhas: 45,
                    linhasAtivas: 42,
                    linhasInativas: 3,
                    custoMensal: 4250.80,
                    cor: "#3B82F6"
                },
                {
                    nome: "145112", 
                    totalLinhas: 28,
                    linhasAtivas: 25,
                    linhasInativas: 3,
                    custoMensal: 2890.50,
                    cor: "#10B981"
                },
                {
                    nome: "145121",
                    totalLinhas: 32,
                    linhasAtivas: 30,
                    linhasInativas: 2,
                    custoMensal: 3120.75,
                    cor: "#F59E0B"
                },
                {
                    nome: "145122",
                    totalLinhas: 18,
                    linhasAtivas: 16,
                    linhasInativas: 2,
                    custoMensal: 1650.25,
                    cor: "#8B5CF6"
                }
            ],
            planos: [
                "Básico", "Básico Plus", "Empresarial", "Empresarial Pro",
                "Digital Basic", "Digital Pro", "Corporativo", "Corporativo Max",
                "Executivo", "Premium", "Premium Plus"
            ],
            centrosCusto: [
                "CC001-Administração", "CC002-Vendas", "CC003-Operação",
                "CC004-Logística", "CC005-Suporte"
            ],
            linhas: [
                {
                    id: 1,
                    titular: "João Carlos Silva Santos",
                    numerocelular: "(11) 99876-5432",
                    valor: 120.50,
                    plano: "Empresarial Pro",
                    responsavel: "Maria Santos",
                    contacontabil: "1.2.3.4.001",
                    codigoresponsavel: "RES001",
                    centrocusto: "CC001-Administração",
                    entidade: "145111",
                    status: "ativa"
                },
                {
                    id: 2,
                    titular: "Alexandre Santos Lopes",
                    numerocelular: "(19) 94532-1098",
                    valor: 78.50,
                    plano: "Empresarial",
                    responsavel: "Bruna Tavares",
                    contacontabil: "1.2.3.4.015",
                    codigoresponsavel: "RES015",
                    centrocusto: "CC003-Operação",
                    entidade: "145112",
                    status: "ativa"
                },
                {
                    id: 3,
                    titular: "Maria Silva",
                    numerocelular: "(11) 98765-4321",
                    valor: 95.00,
                    plano: "Premium",
                    responsavel: "Carlos Santos",
                    contacontabil: "1.2.3.4.030",
                    codigoresponsavel: "RES030",
                    centrocusto: "CC002-Vendas",
                    entidade: "145121",
                    status: "ativa"
                },
                {
                    id: 4,
                    titular: "Roberto Oliveira",
                    numerocelular: "(19) 97654-3210",
                    valor: 65.75,
                    plano: "Básico Plus",
                    responsavel: "Ana Costa",
                    contacontabil: "1.2.3.4.045",
                    codigoresponsavel: "RES045",
                    centrocusto: "CC004-Logística",
                    entidade: "145122",
                    status: "ativa"
                },
                {
                    id: 5,
                    titular: "Paula Costa",
                    numerocelular: "(11) 96543-2109",
                    valor: 110.25,
                    plano: "Corporativo",
                    responsavel: "José Lima",
                    contacontabil: "1.2.3.4.060",
                    codigoresponsavel: "RES060",
                    centrocusto: "CC005-Suporte",
                    entidade: "145111",
                    status: "inativa"
                },
                {
                    id: 6,
                    titular: "Fernando Santos",
                    numerocelular: "(19) 95432-1098",
                    valor: 88.50,
                    plano: "Digital Pro",
                    responsavel: "Lucia Silva",
                    contacontabil: "1.2.3.4.075",
                    codigoresponsavel: "RES075",
                    centrocusto: "CC001-Administração",
                    entidade: "145112",
                    status: "ativa"
                }
            ]
        };

        this.filteredLines = [...this.data.linhas];
        this.editingLine = null;
        this.charts = {};

        this.init();
    }

    getApiBaseUrl() {
        // Dynamic API URL based on environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8888/.netlify/functions/api';
        }
        return '/.netlify/functions/api';
    }

    async init() {
        this.debugLog('info', 'Iniciando aplicação TeleCorp...');
        this.bindEvents();
        this.populateDropdowns();
        await this.checkConnection();
        this.showPage('dashboard');
        this.updateDashboard();
        this.renderLineTable();
        this.setupAutoRefresh();
        this.updateSystemInfo();
        this.debugLog('success', 'Aplicação iniciada com sucesso');
    }

    debugLog(level, message, data = null) {
        if (!this.enableDebug) return;
        
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };
        
        this.debugLogs.push(logEntry);
        
        // Keep only last 100 logs
        if (this.debugLogs.length > 100) {
            this.debugLogs = this.debugLogs.slice(-100);
        }
        
        // Update debug console
        this.updateDebugConsole();
        
        // Console log for debugging
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    updateDebugConsole() {
        const debugConsole = document.querySelector('.debug-log');
        if (!debugConsole) return;
        
        const logHTML = this.debugLogs.map(log => `
            <div class="debug-entry">
                <span class="debug-timestamp">${log.timestamp}</span>
                <span class="debug-level-${log.level}">[${log.level.toUpperCase()}]</span>
                ${log.message}
                ${log.data ? `\n${JSON.stringify(log.data, null, 2)}` : ''}
            </div>
        `).join('');
        
        debugConsole.innerHTML = logHTML || 'Aguardando logs...';
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !mobileToggle.contains(e.target) &&
                    sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
                
            document.getElementById('init-database')?.addEventListener('click', async () => {
          app.showLoading(true);
          try {
            const response = await fetch(`${app.config.apiBaseUrl}/init-database`, { method: 'POST' });
            const result = await response.json();
            if (result.success === true) {
              app.showToast('Banco inicializado com sucesso!', 'success');
            } else {
              // Exibe o erro retornado pelo servidor, convertendo em string
              app.showToast('Erro na inicialização: ' + JSON.stringify(result), 'error');
            }
          } catch (error) {
            app.showToast('Erro ao inicializar banco: ' + error.message, 'error');
          } finally {
            // Garantir que o overlay sempre desapareça
            app.showLoading(false);
          }
          });
                showLoading(show) {
          const overlay = document.getElementById('loading-overlay');
          if (!overlay) return;
          if (show) {
            overlay.classList.add('show');
          } else {
            overlay.classList.remove('show');
          }
                }
        };  

        // Navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.menu-link').dataset.page;
                this.showPage(page);
                
                if (window.innerWidth <= 768) {
                    sidebar?.classList.remove('open');
                }
            });
        });

        // Connection and management
        document.getElementById('force-reconnect-btn')?.addEventListener('click', () => this.forceReconnect());
        document.getElementById('add-line-btn')?.addEventListener('click', () => this.openLineModal());
        document.getElementById('refresh-lines-btn')?.addEventListener('click', () => this.refreshData());
        document.getElementById('close-modal')?.addEventListener('click', () => this.closeLineModal());
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.closeLineModal());
        document.getElementById('line-form')?.addEventListener('submit', (e) => this.handleLineForm(e));

        // Filters
        document.getElementById('search-input')?.addEventListener('input', () => this.applyFilters());
        document.getElementById('entity-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('plan-filter')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('status-filter')?.addEventListener('change', () => this.applyFilters());

        // Reports
        document.getElementById('export-pdf-btn')?.addEventListener('click', () => this.exportPDF());
        document.getElementById('export-excel-btn')?.addEventListener('click', () => this.exportExcel());
        
        // Report filters
        document.getElementById('report-entity-filter')?.addEventListener('change', () => this.updateReportPreview());
        document.getElementById('report-status-filter')?.addEventListener('change', () => this.updateReportPreview());
        document.getElementById('report-min-value')?.addEventListener('input', () => this.updateReportPreview());
        document.getElementById('report-max-value')?.addEventListener('input', () => this.updateReportPreview());

        // Settings
        document.getElementById('test-connection-btn')?.addEventListener('click', () => this.testConnectionComplete());
        document.getElementById('db-config-form')?.addEventListener('submit', (e) => this.saveConfig(e));
        document.getElementById('reset-config-btn')?.addEventListener('click', () => this.resetConfig());
        document.getElementById('operation-mode')?.addEventListener('change', (e) => {
            this.operationMode = e.target.value;
            this.debugLog('info', `Modo de operação alterado para: ${this.operationMode}`);
            this.updateConnectionStatus();
        });
        document.getElementById('auto-refresh')?.addEventListener('change', (e) => {
            this.setupAutoRefresh(parseInt(e.target.value));
        });
        document.getElementById('retry-attempts')?.addEventListener('change', (e) => {
            this.retryAttempts = parseInt(e.target.value);
        });
        document.getElementById('retry-delay')?.addEventListener('change', (e) => {
            this.retryDelay = parseInt(e.target.value) * 1000;
        });
        document.getElementById('enable-debug')?.addEventListener('change', (e) => {
            this.enableDebug = e.target.checked;
            this.debugLog('info', `Debug mode: ${this.enableDebug ? 'ativado' : 'desativado'}`);
        });
        document.getElementById('show-notifications')?.addEventListener('change', (e) => {
            this.showNotifications = e.target.checked;
        });

        // Debug console actions
        document.getElementById('clear-debug')?.addEventListener('click', () => {
            this.debugLogs = [];
            this.updateDebugConsole();
        });
        document.getElementById('download-logs')?.addEventListener('click', () => this.downloadLogs());

        // Modal backdrop click
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeLineModal());
    }

    async checkConnection() {
        this.debugLog('info', 'Verificando conexão...');
        
        try {
            this.updateConnectionStatus('checking');
            
            if (this.operationMode === 'offline') {
                this.isOnline = false;
                this.updateConnectionStatus('offline');
                this.debugLog('info', 'Modo offline ativo');
                return;
            }

            const response = await this.retryOperation(() => 
                fetch(this.config.apiBaseUrl + '/test', { 
                    method: 'GET',
                    timeout: 5000 
                })
            );
            
            this.isOnline = response && response.ok;
            
            if (this.isOnline) {
                this.updateConnectionStatus('connected');
                this.debugLog('success', 'Conexão estabelecida com sucesso');
                this.lastSync = new Date();
                
                // Try to load data from API
                if (this.operationMode === 'online' || this.operationMode === 'fallback') {
                    await this.loadDataFromAPI();
                }
            } else {
                throw new Error('API response not ok');
            }
        } catch (error) {
            this.debugLog('error', 'Falha na conexão', error.message);
            this.isOnline = false;
            
            if (this.operationMode === 'fallback') {
                this.updateConnectionStatus('disconnected');
                this.debugLog('warn', 'Usando dados locais como fallback');
            } else {
                this.updateConnectionStatus('disconnected');
            }
        }
        
        this.updateSystemDisplays();
    }

    async retryOperation(operation, attempts = this.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                this.debugLog('info', `Tentativa ${i + 1} de ${attempts}`);
                const result = await operation();
                return result;
            } catch (error) {
                this.debugLog('warn', `Tentativa ${i + 1} falhou: ${error.message}`);
                
                if (i === attempts - 1) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, i);
                this.debugLog('info', `Aguardando ${delay}ms antes da próxima tentativa`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async forceReconnect() {
        this.debugLog('info', 'Forçando reconexão...');
        this.showLoading('Reconnectando...');
        
        try {
            await this.checkConnection();
            this.showToast('Reconexão realizada!', 'success');
        } catch (error) {
            this.showToast('Falha na reconexão', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateConnectionStatus(status = null) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        const subtitle = document.getElementById('status-subtitle');
        const detailedStatus = document.getElementById('detailed-connection-status');
        const operationModeDisplay = document.getElementById('operation-mode-display');
        
        if (!indicator || !text) return;

        if (status === null) {
            status = this.operationMode === 'offline' ? 'offline' : 
                     this.isOnline ? 'connected' : 'disconnected';
        }

        indicator.className = 'status-indicator ' + status;
        
        const statusTexts = {
            checking: 'Verificando...',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            offline: 'Modo Offline'
        };
        
        const statusSubtitles = {
            checking: 'Testando API...',
            connected: 'API respondendo',
            disconnected: 'API não disponível',
            offline: 'Dados locais'
        };
        
        text.textContent = statusTexts[status] || 'Desconhecido';
        if (subtitle) subtitle.textContent = statusSubtitles[status] || '';
        
        if (detailedStatus) {
            detailedStatus.className = 'info-value status-indicator-text ' + status;
            detailedStatus.textContent = statusTexts[status] || 'Desconhecido';
        }
        
        if (operationModeDisplay) {
            const modeTexts = {
                online: 'Online',
                offline: 'Offline',
                fallback: 'Fallback Automático'
            };
            operationModeDisplay.textContent = modeTexts[this.operationMode] || this.operationMode;
        }
    }

    updateSystemDisplays() {
        // Update record counts
        const localRecords = document.getElementById('local-records');
        const remoteRecords = document.getElementById('remote-records');
        const lastSyncDisplay = document.getElementById('last-sync-display');
        const lastSync = document.getElementById('last-sync');
        const pendingOps = document.getElementById('pending-operations');
        const lastApiAttempt = document.getElementById('last-api-attempt');
        const localRecordCount = document.getElementById('local-record-count');
        
        if (localRecords) localRecords.textContent = this.data.linhas.length;
        if (remoteRecords) remoteRecords.textContent = this.isOnline ? this.data.linhas.length : '-';
        
        const syncText = this.lastSync ? this.lastSync.toLocaleString('pt-BR') : 'Nunca';
        if (lastSyncDisplay) lastSyncDisplay.textContent = syncText;
        if (lastSync) lastSync.textContent = syncText;
        
        if (pendingOps) pendingOps.textContent = this.pendingOperations.length;
        if (lastApiAttempt) lastApiAttempt.textContent = new Date().toLocaleString('pt-BR');
        if (localRecordCount) localRecordCount.textContent = this.data.linhas.length;
    }

    async loadDataFromAPI() {
        try {
            this.debugLog('info', 'Carregando dados da API...');
            
            const response = await fetch(this.config.apiBaseUrl + '/linhas');
            if (response.ok) {
                const apiData = await response.json();
                if (apiData.linhas && Array.isArray(apiData.linhas)) {
                    this.data.linhas = apiData.linhas;
                    this.filteredLines = [...this.data.linhas];
                    this.debugLog('success', `${apiData.linhas.length} registros carregados da API`);
                }
            }
        } catch (error) {
            this.debugLog('warn', 'Falha ao carregar dados da API, usando dados locais');
        }
    }

    async testConnectionComplete() {
        const resultsContainer = document.getElementById('connection-test-results');
        if (!resultsContainer) return;
        
        resultsContainer.classList.add('show');
        resultsContainer.innerHTML = '';
        
        const tests = [
            {
                name: 'Conectividade de Rede',
                test: () => fetch('https://httpbin.org/get', { method: 'GET', timeout: 5000 })
            },
            {
                name: 'Endpoint da API',
                test: () => fetch(this.config.apiBaseUrl + '/test', { method: 'GET', timeout: 5000 })
            },
            {
                name: 'Query no Banco',
                test: () => fetch(this.config.apiBaseUrl + '/linhas', { method: 'GET', timeout: 10000 })
            }
        ];
        
        this.debugLog('info', 'Iniciando teste completo de conexão...');
        
        for (const testItem of tests) {
            const stepElement = document.createElement('div');
            stepElement.className = 'test-step testing';
            stepElement.innerHTML = `
                <div class="test-step-icon">⏳</div>
                <div>${testItem.name}: Testando...</div>
            `;
            resultsContainer.appendChild(stepElement);
            
            try {
                const response = await testItem.test();
                if (response.ok) {
                    stepElement.className = 'test-step success';
                    stepElement.innerHTML = `
                        <div class="test-step-icon">✅</div>
                        <div>${testItem.name}: Sucesso (${response.status})</div>
                    `;
                    this.debugLog('success', `Teste ${testItem.name}: Sucesso`);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                stepElement.className = 'test-step error';
                stepElement.innerHTML = `
                    <div class="test-step-icon">❌</div>
                    <div>${testItem.name}: Falha (${error.message})</div>
                `;
                this.debugLog('error', `Teste ${testItem.name}: Falha`, error.message);
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Update connection status after complete test
        await this.checkConnection();
    }

    showPage(pageId) {
        // Update active menu item
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });

        // Show/hide pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('hidden', !page.id.includes(pageId));
        });

        this.currentPage = pageId;

        // Initialize page-specific content
        if (pageId === 'dashboard') {
            this.updateDashboard();
        } else if (pageId === 'management') {
            this.renderLineTable();
        } else if (pageId === 'reports') {
            this.updateReportPreview();
        } else if (pageId === 'settings') {
            this.loadSettings();
        }
    }

    populateDropdowns() {
        // Entity dropdowns
        const entitySelects = [
            'entity-filter', 'report-entity-filter', 'entidade'
        ];

        entitySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && select.children.length <= 1) {
                this.data.entidades.forEach(entidade => {
                    const option = document.createElement('option');
                    option.value = entidade.nome;
                    option.textContent = entidade.nome;
                    select.appendChild(option);
                });
            }
        });

        // Plan dropdowns
        const planSelects = ['plan-filter', 'plano'];
        planSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && select.children.length <= 1) {
                this.data.planos.forEach(plano => {
                    const option = document.createElement('option');
                    option.value = plano;
                    option.textContent = plano;
                    select.appendChild(option);
                });
            }
        });

        // Centro de custo dropdown
        const centroCustoSelect = document.getElementById('centrocusto');
        if (centroCustoSelect && centroCustoSelect.children.length <= 1) {
            this.data.centrosCusto.forEach(centro => {
                const option = document.createElement('option');
                option.value = centro;
                option.textContent = centro;
                centroCustoSelect.appendChild(option);
            });
        }
    }

    updateDashboard() {
        // Recalculate entity statistics based on current lines
        this.recalculateEntityStatistics();
        
        // Calculate overall statistics
        const stats = this.calculateStatistics();
        
        // Update stat cards
        document.getElementById('total-lines').textContent = stats.totalLinhas;
        document.getElementById('active-lines').textContent = stats.linhasAtivas;
        document.getElementById('total-cost').textContent = this.formatCurrency(stats.custoTotal);
        document.getElementById('total-entities').textContent = this.data.entidades.length;

        // Render entity cards
        this.renderEntityCards();

        // Create charts
        setTimeout(() => {
            this.createCharts();
        }, 100);
    }

    recalculateEntityStatistics() {
        this.data.entidades.forEach(entidade => {
            const linhasEntidade = this.data.linhas.filter(linha => linha.entidade === entidade.nome);
            entidade.totalLinhas = linhasEntidade.length;
            entidade.linhasAtivas = linhasEntidade.filter(linha => linha.status === 'ativa').length;
            entidade.linhasInativas = entidade.totalLinhas - entidade.linhasAtivas;
            entidade.custoMensal = linhasEntidade.reduce((total, linha) => total + linha.valor, 0);
        });
    }

    calculateStatistics() {
        const totalLinhas = this.data.linhas.length;
        const linhasAtivas = this.data.linhas.filter(linha => linha.status === 'ativa').length;
        const custoTotal = this.data.linhas.reduce((total, linha) => total + linha.valor, 0);

        return {
            totalLinhas,
            linhasAtivas,
            linhasInativas: totalLinhas - linhasAtivas,
            custoTotal
        };
    }

    renderEntityCards() {
        const container = document.getElementById('entity-cards');
        if (!container) return;

        container.innerHTML = '';

        this.data.entidades.forEach(entidade => {
            const card = document.createElement('div');
            card.className = 'entity-card';
            card.style.setProperty('--entity-color', entidade.cor);

            card.innerHTML = `
                <div class="entity-header">
                    <div class="entity-name">${entidade.nome}</div>
                    <div class="entity-cost">${this.formatCurrency(entidade.custoMensal)}</div>
                </div>
                <div class="entity-stats">
                    <div class="entity-stat">
                        <div class="entity-stat-value">${entidade.totalLinhas}</div>
                        <div class="entity-stat-label">Total</div>
                    </div>
                    <div class="entity-stat">
                        <div class="entity-stat-value">${entidade.linhasAtivas}</div>
                        <div class="entity-stat-label">Ativas</div>
                    </div>
                    <div class="entity-stat">
                        <div class="entity-stat-value">${entidade.linhasInativas}</div>
                        <div class="entity-stat-label">Inativas</div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    createCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        // Entity distribution chart
        const entityCtx = document.getElementById('entity-chart');
        if (entityCtx) {
            this.charts.entity = new Chart(entityCtx, {
                type: 'doughnut',
                data: {
                    labels: this.data.entidades.map(e => e.nome),
                    datasets: [{
                        data: this.data.entidades.map(e => e.totalLinhas),
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Cost distribution chart
        const costCtx = document.getElementById('cost-chart');
        if (costCtx) {
            this.charts.cost = new Chart(costCtx, {
                type: 'bar',
                data: {
                    labels: this.data.entidades.map(e => e.nome),
                    datasets: [{
                        label: 'Custo Mensal',
                        data: this.data.entidades.map(e => e.custoMensal),
                        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    renderLineTable() {
        const tbody = document.getElementById('lines-table-body');
        const filteredCount = document.getElementById('filtered-count');
        const totalCount = document.getElementById('total-count');
        
        if (!tbody) return;

        tbody.innerHTML = '';

        if (filteredCount) filteredCount.textContent = this.filteredLines.length;
        if (totalCount) totalCount.textContent = this.data.linhas.length;

        this.filteredLines.forEach(linha => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${linha.titular}</td>
                <td>${linha.numerocelular}</td>
                <td>${linha.plano}</td>
                <td>${this.formatCurrency(linha.valor)}</td>
                <td>${linha.centrocusto}</td>
                <td>${linha.entidade}</td>
                <td>
                    <span class="status-badge status-badge--${linha.status === 'ativa' ? 'active' : 'inactive'}">
                        ${linha.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn action-btn--edit" onclick="app.editLine(${linha.id})">
                            ✏️ Editar
                        </button>
                        <button class="action-btn action-btn--delete" onclick="app.deleteLine(${linha.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const entityFilter = document.getElementById('entity-filter')?.value || '';
        const planFilter = document.getElementById('plan-filter')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';

        this.filteredLines = this.data.linhas.filter(linha => {
            const matchesSearch = !searchTerm || 
                linha.titular.toLowerCase().includes(searchTerm) ||
                linha.numerocelular.toLowerCase().includes(searchTerm) ||
                linha.plano.toLowerCase().includes(searchTerm) ||
                linha.responsavel.toLowerCase().includes(searchTerm);
            
            const matchesEntity = !entityFilter || linha.entidade === entityFilter;
            const matchesPlan = !planFilter || linha.plano === planFilter;
            const matchesStatus = !statusFilter || linha.status === statusFilter;

            return matchesSearch && matchesEntity && matchesPlan && matchesStatus;
        });

        this.renderLineTable();
    }

    openLineModal(line = null) {
        this.editingLine = line;
        const modal = document.getElementById('line-modal');
        const form = document.getElementById('line-form');
        const title = document.getElementById('modal-title');
        const saveBtn = document.getElementById('save-btn-text');

        if (!modal || !form || !title) return;

        title.textContent = line ? 'Editar Linha' : 'Adicionar Linha';
        if (saveBtn) saveBtn.textContent = line ? 'Atualizar' : 'Salvar';

        if (line) {
            Object.keys(line).forEach(key => {
                const input = document.getElementById(key);
                if (input) {
                    input.value = line[key];
                }
            });
        } else {
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    closeLineModal() {
        const modal = document.getElementById('line-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingLine = null;
    }

    async handleLineForm(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn?.textContent || 'Salvar';
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';
        }

        try {
            const formData = new FormData(e.target);
            const lineData = {};

            const fields = ['titular', 'numerocelular', 'valor', 'plano', 'responsavel', 
                           'codigoresponsavel', 'contacontabil', 'centrocusto', 'entidade', 'status'];
            
            fields.forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    lineData[field] = input.value;
                }
            });

            lineData.valor = parseFloat(lineData.valor);

            if (this.editingLine) {
                lineData.id = this.editingLine.id;
                const index = this.data.linhas.findIndex(l => l.id === this.editingLine.id);
                if (index !== -1) {
                    this.data.linhas[index] = { ...this.data.linhas[index], ...lineData };
                }
                
                if (this.isOnline && this.operationMode !== 'offline') {
                    await this.updateLineAPI(lineData);
                } else {
                    this.queueOperation('update', lineData);
                }
                
                this.showToast('Linha atualizada com sucesso!', 'success');
                this.debugLog('success', 'Linha atualizada', lineData);
            } else {
                lineData.id = Math.max(...this.data.linhas.map(l => l.id), 0) + 1;
                this.data.linhas.push(lineData);
                
                if (this.isOnline && this.operationMode !== 'offline') {
                    await this.addLineAPI(lineData);
                } else {
                    this.queueOperation('create', lineData);
                }
                
                this.showToast('Linha adicionada com sucesso!', 'success');
                this.debugLog('success', 'Nova linha adicionada', lineData);
            }

            this.closeLineModal();
            this.applyFilters();
            this.updateDashboard();
            this.updateSystemDisplays();
        } catch (error) {
            this.debugLog('error', 'Erro ao salvar linha', error.message);
            this.showToast('Erro ao salvar linha', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        }
    }

    queueOperation(type, data) {
        this.pendingOperations.push({
            type,
            data,
            timestamp: new Date()
        });
        this.debugLog('info', `Operação enfileirada: ${type}`, data);
    }

    async processPendingOperations() {
        if (!this.isOnline || this.pendingOperations.length === 0) return;
        
        this.debugLog('info', `Processando ${this.pendingOperations.length} operações pendentes`);
        
        const operations = [...this.pendingOperations];
        this.pendingOperations = [];
        
        for (const operation of operations) {
            try {
                switch (operation.type) {
                    case 'create':
                        await this.addLineAPI(operation.data);
                        break;
                    case 'update':
                        await this.updateLineAPI(operation.data);
                        break;
                    case 'delete':
                        await this.deleteLineAPI(operation.data.id);
                        break;
                }
                this.debugLog('success', `Operação ${operation.type} sincronizada`);
            } catch (error) {
                this.debugLog('error', `Falha ao sincronizar ${operation.type}`, error.message);
                this.pendingOperations.push(operation); // Re-queue failed operation
            }
        }
        
        this.updateSystemDisplays();
    }

    async addLineAPI(lineData) {
        try {
            const response = await fetch(this.config.apiBaseUrl + '/linhas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lineData)
            });
            return response.ok;
        } catch (error) {
            this.debugLog('warn', 'Falha na API ao adicionar linha', error.message);
            return false;
        }
    }

    async updateLineAPI(lineData) {
        try {
            const response = await fetch(this.config.apiBaseUrl + '/linhas/' + lineData.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lineData)
            });
            return response.ok;
        } catch (error) {
            this.debugLog('warn', 'Falha na API ao atualizar linha', error.message);
            return false;
        }
    }

    editLine(id) {
        const line = this.data.linhas.find(l => l.id === id);
        if (line) {
            this.openLineModal(line);
        }
    }

    async deleteLine(id) {
        if (!confirm('Tem certeza que deseja excluir esta linha?')) return;

        try {
            const lineIndex = this.data.linhas.findIndex(l => l.id === id);
            if (lineIndex === -1) return;

            if (this.isOnline && this.operationMode !== 'offline') {
                await this.deleteLineAPI(id);
            } else {
                this.queueOperation('delete', { id });
            }

            this.data.linhas.splice(lineIndex, 1);
            this.applyFilters();
            this.updateDashboard();
            this.updateSystemDisplays();
            this.showToast('Linha excluída com sucesso!', 'success');
            this.debugLog('success', `Linha ${id} excluída`);
        } catch (error) {
            this.debugLog('error', 'Erro ao excluir linha', error.message);
            this.showToast('Erro ao excluir linha', 'error');
        }
    }

    async deleteLineAPI(id) {
        try {
            const response = await fetch(this.config.apiBaseUrl + '/linhas/' + id, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            this.debugLog('warn', 'Falha na API ao excluir linha', error.message);
            return false;
        }
    }

    async refreshData() {
        this.showLoading('Atualizando dados...');
        this.debugLog('info', 'Iniciando atualização de dados');
        
        try {
            await this.checkConnection();
            
            if (this.isOnline) {
                await this.processPendingOperations();
            }
            
            this.applyFilters();
            this.updateDashboard();
            this.showToast('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            this.debugLog('error', 'Erro ao atualizar dados', error.message);
            this.showToast('Erro ao atualizar dados', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateReportPreview() {
        const preview = document.getElementById('report-preview');
        if (!preview) return;

        const entityFilter = document.getElementById('report-entity-filter')?.value || '';
        const statusFilter = document.getElementById('report-status-filter')?.value || '';
        const minValue = parseFloat(document.getElementById('report-min-value')?.value) || 0;
        const maxValue = parseFloat(document.getElementById('report-max-value')?.value) || Infinity;

        const filteredData = this.data.linhas.filter(linha => {
            const matchesEntity = !entityFilter || linha.entidade === entityFilter;
            const matchesStatus = !statusFilter || linha.status === statusFilter;
            const matchesValue = linha.valor >= minValue && linha.valor <= maxValue;
            
            return matchesEntity && matchesStatus && matchesValue;
        });

        const totalValue = filteredData.reduce((sum, linha) => sum + linha.valor, 0);

        preview.innerHTML = `
            <div style="text-align: center;">
                <h4 style="margin-bottom: 16px; color: var(--color-text);">Prévia do Relatório</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-primary);">${filteredData.length}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">LINHAS</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-success);">${this.formatCurrency(totalValue)}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">VALOR TOTAL</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-info);">${filteredData.filter(l => l.status === 'ativa').length}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">ATIVAS</div>
                    </div>
                </div>
            </div>
        `;
    }

    exportPDF() {
        this.showLoading('Gerando relatório PDF...');
        
        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                doc.setFontSize(20);
                doc.text('Relatório de Linhas Telefônicas', 20, 30);
                
                doc.setFontSize(12);
                doc.text('TeleCorp - Sistema de Gerenciamento', 20, 40);
                doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 50);

                const stats = this.calculateStatistics();
                doc.text(`Total de Linhas: ${stats.totalLinhas}`, 20, 70);
                doc.text(`Linhas Ativas: ${stats.linhasAtivas}`, 20, 80);
                doc.text(`Custo Total: ${this.formatCurrency(stats.custoTotal)}`, 20, 90);

                const reportData = this.getReportData();
                
                const tableData = reportData.map(linha => [
                    linha.titular,
                    linha.numerocelular,
                    linha.plano,
                    this.formatCurrency(linha.valor),
                    linha.entidade,
                    linha.status
                ]);

                doc.autoTable({
                    startY: 110,
                    head: [['Titular', 'Número', 'Plano', 'Valor', 'Entidade', 'Status']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [31, 184, 205] },
                    styles: { fontSize: 8 },
                    margin: { left: 20, right: 20 }
                });

                doc.save('relatorio-linhas-telefonicas.pdf');
                this.showToast('PDF exportado com sucesso!', 'success');
                this.debugLog('success', 'Relatório PDF gerado');
            } catch (error) {
                this.debugLog('error', 'Erro ao exportar PDF', error.message);
                this.showToast('Erro ao exportar PDF', 'error');
            } finally {
                this.hideLoading();
            }
        }, 1000);
    }

    exportExcel() {
        try {
            const headers = ['Titular', 'Número', 'Plano', 'Valor', 'Responsável', 'Código Responsável', 'Conta Contábil', 'Centro Custo', 'Entidade', 'Status'];
            
            let csv = headers.join(',') + '\n';
            
            const reportData = this.getReportData();
            reportData.forEach(linha => {
                const row = [
                    `"${linha.titular}"`,
                    `"${linha.numerocelular}"`,
                    `"${linha.plano}"`,
                    linha.valor.toString().replace('.', ','),
                    `"${linha.responsavel}"`,
                    `"${linha.codigoresponsavel}"`,
                    `"${linha.contacontabil}"`,
                    `"${linha.centrocusto}"`,
                    `"${linha.entidade}"`,
                    `"${linha.status}"`
                ];
                csv += row.join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'linhas-telefonicas.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showToast('Excel exportado com sucesso!', 'success');
            this.debugLog('success', 'Relatório Excel gerado');
        } catch (error) {
            this.debugLog('error', 'Erro ao exportar Excel', error.message);
            this.showToast('Erro ao exportar Excel', 'error');
        }
    }

    getReportData() {
        const entityFilter = document.getElementById('report-entity-filter')?.value || '';
        const statusFilter = document.getElementById('report-status-filter')?.value || '';
        const minValue = parseFloat(document.getElementById('report-min-value')?.value) || 0;
        const maxValue = parseFloat(document.getElementById('report-max-value')?.value) || Infinity;

        return this.data.linhas.filter(linha => {
            const matchesEntity = !entityFilter || linha.entidade === entityFilter;
            const matchesStatus = !statusFilter || linha.status === statusFilter;
            const matchesValue = linha.valor >= minValue && linha.valor <= maxValue;
            
            return matchesEntity && matchesStatus && matchesValue;
        });
    }

    saveConfig(e) {
        e.preventDefault();
        
        const databaseUrl = document.getElementById('database-url')?.value || '';
        const apiBaseUrl = document.getElementById('api-base-url')?.value || '';
        
        this.config.databaseUrl = databaseUrl;
        this.config.apiBaseUrl = apiBaseUrl;
        
        this.showToast('Configurações salvas com sucesso!', 'success');
        this.debugLog('success', 'Configurações salvas', this.config);
        
        this.checkConnection();
    }

    resetConfig() {
        document.getElementById('database-url').value = "postgresql://neondb_owner:npg_rLH8DGJBsfk2@ep-holy-firefly-acnw4zp1-pooler.sa-east-1.aws.neon.tech/linhas_db?sslmode=require&channel_binding=require";
        document.getElementById('api-base-url').value = this.getApiBaseUrl();
        
        this.showToast('Configurações restauradas!', 'info');
        this.debugLog('info', 'Configurações restauradas para padrão');
    }

    loadSettings() {
        const operationModeSelect = document.getElementById('operation-mode');
        const autoRefreshInput = document.getElementById('auto-refresh');
        const retryAttemptsInput = document.getElementById('retry-attempts');
        const retryDelayInput = document.getElementById('retry-delay');
        const enableDebugCheck = document.getElementById('enable-debug');
        const showNotificationsCheck = document.getElementById('show-notifications');
        
        if (operationModeSelect) operationModeSelect.value = this.operationMode;
        if (autoRefreshInput) autoRefreshInput.value = 30;
        if (retryAttemptsInput) retryAttemptsInput.value = this.retryAttempts;
        if (retryDelayInput) retryDelayInput.value = this.retryDelay / 1000;
        if (enableDebugCheck) enableDebugCheck.checked = this.enableDebug;
        if (showNotificationsCheck) showNotificationsCheck.checked = this.showNotifications;
    }

    setupAutoRefresh(intervalSeconds = 30) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (intervalSeconds > 0 && this.operationMode !== 'offline') {
            this.autoRefreshInterval = setInterval(async () => {
                this.debugLog('info', 'Auto-refresh executado');
                await this.checkConnection();
                if (this.isOnline) {
                    await this.processPendingOperations();
                }
                this.updateSystemDisplays();
            }, intervalSeconds * 1000);
        }
    }

    updateSystemInfo() {
        this.updateSystemDisplays();
    }

    downloadLogs() {
        const logsText = this.debugLogs.map(log => 
            `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
        ).join('\n\n');
        
        const blob = new Blob([logsText], { type: 'text/plain' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `telecorp-logs-${new Date().toISOString().slice(0, 10)}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Logs baixados com sucesso!', 'success');
    }

    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        if (text) {
            text.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        if (!this.showNotifications) return;
        
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        
        toast.className = `toast toast--${type}`;
        
        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Aviso',
            info: 'Informação'
        };
        
        toast.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px;">
                ${icons[type]} ${titles[type]}
            </div>
            <div>${message}</div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 250);
        }, 4000);
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
} 

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TeleCorpApp();
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    if (app && app.charts) {
        Object.values(app.charts).forEach(chart => {
            if (chart) chart.resize();
        });
    }
});
