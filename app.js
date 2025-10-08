// TeleCorp - Telephone Line Management Application

class TeleCorpApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.isOnline = false;
        this.operationMode = 'online';
        this.autoRefreshInterval = null;
        this.showNotifications = true;
        
        // Fallback data structure
        this.data = {
            credenciais: {
                databaseUrl: "postgresql://neondb_owner:npg_rLH8DGJBsfk2@ep-holy-firefly-acnw4zp1-pooler.sa-east-1.aws.neon.tech/linhas_db?sslmode=require&channel_binding=require",
                apiBaseUrl: "/.netlify/functions/api"
            },
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
                    titular: "Maria da Silva Costa",
                    numerocelular: "(21) 95678-1234",
                    valor: 95.00,
                    plano: "Digital Pro",
                    responsavel: "Carlos Lima",
                    contacontabil: "1.2.3.4.020",
                    codigoresponsavel: "RES020",
                    centrocusto: "CC002-Vendas",
                    entidade: "145121",
                    status: "ativa"
                },
                {
                    id: 4,
                    titular: "Pedro Oliveira Santos",
                    numerocelular: "(11) 94321-5678",
                    valor: 65.00,
                    plano: "Básico Plus",
                    responsavel: "Ana Silva",
                    contacontabil: "1.2.3.4.005",
                    codigoresponsavel: "RES005",
                    centrocusto: "CC004-Logística",
                    entidade: "145122",
                    status: "inativa"
                },
                {
                    id: 5,
                    titular: "Carlos Eduardo Pereira",
                    numerocelular: "(85) 98765-4321",
                    valor: 135.00,
                    plano: "Corporativo Max",
                    responsavel: "Fernanda Costa",
                    contacontabil: "1.2.3.4.030",
                    codigoresponsavel: "RES030",
                    centrocusto: "CC001-Administração",
                    entidade: "145111",
                    status: "ativa"
                },
                {
                    id: 6,
                    titular: "Ana Paula Rodrigues",
                    numerocelular: "(47) 99123-4567",
                    valor: 85.75,
                    plano: "Digital Basic",
                    responsavel: "Roberto Silva",
                    contacontabil: "1.2.3.4.040",
                    codigoresponsavel: "RES040",
                    centrocusto: "CC002-Vendas",
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

    async init() {
        this.bindEvents();
        this.populateDropdowns();
        await this.checkConnection();
        this.showPage('dashboard');
        this.updateDashboard();
        this.renderLineTable();
        this.setupAutoRefresh();
        this.updateSystemInfo();
    }

    bindEvents() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !sidebar.contains(e.target) && 
                    !mobileToggle.contains(e.target) &&
                    sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        }

        // Navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.menu-link').dataset.page;
                this.showPage(page);
                
                // Close mobile menu after navigation
                if (window.innerWidth <= 768) {
                    sidebar?.classList.remove('open');
                }
            });
        });

        // Line management
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
        document.getElementById('test-connection-btn')?.addEventListener('click', () => this.testConnection());
        document.getElementById('db-config-form')?.addEventListener('submit', (e) => this.saveConfig(e));
        document.getElementById('reset-config-btn')?.addEventListener('click', () => this.resetConfig());
        document.getElementById('operation-mode')?.addEventListener('change', (e) => {
            this.operationMode = e.target.value;
            this.updateConnectionStatus();
        });
        document.getElementById('auto-refresh')?.addEventListener('change', (e) => {
            this.setupAutoRefresh(parseInt(e.target.value));
        });
        document.getElementById('show-notifications')?.addEventListener('change', (e) => {
            this.showNotifications = e.target.checked;
        });

        // Modal backdrop click
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeLineModal());
    }

    async checkConnection() {
        try {
            this.updateConnectionStatus('checking');
            
            if (this.operationMode === 'offline') {
                this.isOnline = false;
                this.updateConnectionStatus('offline');
                return;
            }

            const response = await fetch(this.data.credenciais.apiBaseUrl + '/test');
            this.isOnline = response.ok;
            
            if (this.isOnline) {
                this.updateConnectionStatus('connected');
                // Try to load data from API
                await this.loadDataFromAPI();
            } else {
                this.updateConnectionStatus('disconnected');
            }
        } catch (error) {
            console.warn('API not available, using fallback data:', error);
            this.isOnline = false;
            this.updateConnectionStatus('disconnected');
        }
    }

    updateConnectionStatus(status = null) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        const apiStatus = document.getElementById('api-status');
        
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
        
        text.textContent = statusTexts[status] || 'Desconhecido';
        
        if (apiStatus) {
            apiStatus.textContent = statusTexts[status] || 'Desconhecido';
        }
    }

    async loadDataFromAPI() {
        try {
            // Try to load lines from API
            const response = await fetch(this.data.credenciais.apiBaseUrl + '/linhas');
            if (response.ok) {
                const apiData = await response.json();
                if (apiData.linhas && Array.isArray(apiData.linhas)) {
                    this.data.linhas = apiData.linhas;
                    this.filteredLines = [...this.data.linhas];
                }
            }
        } catch (error) {
            console.warn('Failed to load data from API, using fallback data');
        }
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
            if (select && select.children.length <= 1) { // Only populate if empty
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
            // Populate form with existing data
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

            // Get all form fields
            const fields = ['titular', 'numerocelular', 'valor', 'plano', 'responsavel', 
                           'codigoresponsavel', 'contacontabil', 'centrocusto', 'entidade', 'status'];
            
            fields.forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    lineData[field] = input.value;
                }
            });

            // Convert valor to number
            lineData.valor = parseFloat(lineData.valor);

            if (this.editingLine) {
                // Update existing line
                lineData.id = this.editingLine.id;
                const index = this.data.linhas.findIndex(l => l.id === this.editingLine.id);
                if (index !== -1) {
                    this.data.linhas[index] = { ...this.data.linhas[index], ...lineData };
                }
                
                // Try to update via API if online
                if (this.isOnline && this.operationMode === 'online') {
                    await this.updateLineAPI(lineData);
                }
                
                this.showToast('Linha atualizada com sucesso!', 'success');
            } else {
                // Add new line
                lineData.id = Math.max(...this.data.linhas.map(l => l.id), 0) + 1;
                this.data.linhas.push(lineData);
                
                // Try to add via API if online
                if (this.isOnline && this.operationMode === 'online') {
                    await this.addLineAPI(lineData);
                }
                
                this.showToast('Linha adicionada com sucesso!', 'success');
            }

            this.closeLineModal();
            this.applyFilters();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving line:', error);
            this.showToast('Erro ao salvar linha', 'error');
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }
        }
    }

    async addLineAPI(lineData) {
        try {
            const response = await fetch(this.data.credenciais.apiBaseUrl + '/linhas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lineData)
            });
            return response.ok;
        } catch (error) {
            console.warn('Failed to add line via API:', error);
            return false;
        }
    }

    async updateLineAPI(lineData) {
        try {
            const response = await fetch(this.data.credenciais.apiBaseUrl + '/linhas/' + lineData.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lineData)
            });
            return response.ok;
        } catch (error) {
            console.warn('Failed to update line via API:', error);
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

            // Try to delete via API if online
            if (this.isOnline && this.operationMode === 'online') {
                await this.deleteLineAPI(id);
            }

            this.data.linhas.splice(lineIndex, 1);
            this.applyFilters();
            this.updateDashboard();
            this.showToast('Linha excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting line:', error);
            this.showToast('Erro ao excluir linha', 'error');
        }
    }

    async deleteLineAPI(id) {
        try {
            const response = await fetch(this.data.credenciais.apiBaseUrl + '/linhas/' + id, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.warn('Failed to delete line via API:', error);
            return false;
        }
    }

    async refreshData() {
        this.showLoading('Atualizando dados...');
        
        try {
            await this.checkConnection();
            this.applyFilters();
            this.updateDashboard();
            this.showToast('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
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

                // Header
                doc.setFontSize(20);
                doc.text('Relatório de Linhas Telefônicas', 20, 30);
                
                doc.setFontSize(12);
                doc.text('TeleCorp - Sistema de Gerenciamento', 20, 40);
                doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 50);

                // Statistics
                const stats = this.calculateStatistics();
                doc.text(`Total de Linhas: ${stats.totalLinhas}`, 20, 70);
                doc.text(`Linhas Ativas: ${stats.linhasAtivas}`, 20, 80);
                doc.text(`Custo Total: ${this.formatCurrency(stats.custoTotal)}`, 20, 90);

                // Get filtered data for report
                const reportData = this.getReportData();
                
                // Table
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
            } catch (error) {
                console.error('Erro ao exportar PDF:', error);
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
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
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

    async testConnection() {
        this.showLoading('Testando conexão...');
        
        try {
            const response = await fetch(this.data.credenciais.apiBaseUrl + '/test', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                this.isOnline = true;
                this.updateConnectionStatus('connected');
                this.showToast('Conexão testada com sucesso!', 'success');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.isOnline = false;
            this.updateConnectionStatus('disconnected');
            this.showToast('Falha na conexão. Verifique as credenciais.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    saveConfig(e) {
        e.preventDefault();
        
        const databaseUrl = document.getElementById('database-url')?.value || '';
        const apiBaseUrl = document.getElementById('api-base-url')?.value || '';
        
        this.data.credenciais = { databaseUrl, apiBaseUrl };
        
        this.showToast('Configurações salvas com sucesso!', 'success');
        
        // Re-check connection with new settings
        this.checkConnection();
    }

    resetConfig() {
        document.getElementById('database-url').value = "postgresql://neondb_owner:npg_rLH8DGJBsfk2@ep-holy-firefly-acnw4zp1-pooler.sa-east-1.aws.neon.tech/linhas_db?sslmode=require&channel_binding=require";
        document.getElementById('api-base-url').value = "/.netlify/functions/api";
        
        this.showToast('Configurações restauradas!', 'info');
    }

    loadSettings() {
        const operationModeSelect = document.getElementById('operation-mode');
        const autoRefreshInput = document.getElementById('auto-refresh');
        const showNotificationsCheck = document.getElementById('show-notifications');
        
        if (operationModeSelect) operationModeSelect.value = this.operationMode;
        if (autoRefreshInput) autoRefreshInput.value = 30;
        if (showNotificationsCheck) showNotificationsCheck.checked = this.showNotifications;
    }

    setupAutoRefresh(intervalSeconds = 30) {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        if (intervalSeconds > 0 && this.operationMode === 'online') {
            this.autoRefreshInterval = setInterval(() => {
                this.checkConnection();
            }, intervalSeconds * 1000);
        }
    }

    updateSystemInfo() {
        const lastUpdate = document.getElementById('last-update');
        const totalRecords = document.getElementById('total-records');
        
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleString('pt-BR');
        }
        
        if (totalRecords) {
            totalRecords.textContent = this.data.linhas.length.toString();
        }
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