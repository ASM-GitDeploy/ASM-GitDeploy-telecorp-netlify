// TeleCorp - Telephone Line Management Application

class TeleCorpApp {
    constructor() {
        this.currentPage = 'dashboard';
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
                }
            ]
        };
        this.filteredLines = [...this.data.linhas];
        this.editingLine = null;
        this.charts = {};

        this.init();
    }

    init() {
        this.bindEvents();
        this.populateDropdowns();
        this.showPage('dashboard');
        this.updateDashboard();
        this.renderLineTable();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.menu-link').dataset.page;
                this.showPage(page);
            });
        });

        // Line management
        document.getElementById('add-line-btn').addEventListener('click', () => this.openLineModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeLineModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeLineModal());
        document.getElementById('line-form').addEventListener('submit', (e) => this.handleLineForm(e));

        // Filters
        document.getElementById('search-input').addEventListener('input', () => this.applyFilters());
        document.getElementById('entity-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('plan-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('status-filter').addEventListener('change', () => this.applyFilters());

        // Reports
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportPDF());
        document.getElementById('export-excel-btn').addEventListener('click', () => this.exportExcel());

        // Settings
        document.getElementById('test-connection-btn').addEventListener('click', () => this.testConnection());
        document.getElementById('db-config-form').addEventListener('submit', (e) => this.saveConfig(e));

        // Modal backdrop click
        document.querySelector('.modal-backdrop').addEventListener('click', () => this.closeLineModal());
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
        }
    }

    populateDropdowns() {
        // Entity dropdowns
        const entitySelects = [
            document.getElementById('entity-filter'),
            document.getElementById('report-entity-filter'),
            document.getElementById('entidade')
        ];

        entitySelects.forEach(select => {
            if (select) {
                this.data.entidades.forEach(entidade => {
                    const option = document.createElement('option');
                    option.value = entidade.nome;
                    option.textContent = entidade.nome;
                    select.appendChild(option);
                });
            }
        });

        // Plan dropdowns
        const planSelects = [
            document.getElementById('plan-filter'),
            document.getElementById('plano')
        ];

        planSelects.forEach(select => {
            if (select) {
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
        if (centroCustoSelect) {
            this.data.centrosCusto.forEach(centro => {
                const option = document.createElement('option');
                option.value = centro;
                option.textContent = centro;
                centroCustoSelect.appendChild(option);
            });
        }
    }

    updateDashboard() {
        // Calculate statistics
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
        tbody.innerHTML = '';

        this.filteredLines.forEach(linha => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${linha.titular}</td>
                <td>${linha.numerocelular}</td>
                <td>${linha.plano}</td>
                <td>${this.formatCurrency(linha.valor)}</td>
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
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const entityFilter = document.getElementById('entity-filter').value;
        const planFilter = document.getElementById('plan-filter').value;
        const statusFilter = document.getElementById('status-filter').value;

        this.filteredLines = this.data.linhas.filter(linha => {
            const matchesSearch = !searchTerm || 
                linha.titular.toLowerCase().includes(searchTerm) ||
                linha.numerocelular.toLowerCase().includes(searchTerm) ||
                linha.plano.toLowerCase().includes(searchTerm);
            
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

        title.textContent = line ? 'Editar Linha' : 'Adicionar Linha';

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
        document.getElementById('line-modal').classList.add('hidden');
        this.editingLine = null;
    }

    handleLineForm(e) {
        e.preventDefault();
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

        if (this.editingLine) {
            // Update existing line
            lineData.id = this.editingLine.id;
            const index = this.data.linhas.findIndex(l => l.id === this.editingLine.id);
            this.data.linhas[index] = { ...this.data.linhas[index], ...lineData };
            this.showToast('Linha atualizada com sucesso!', 'success');
        } else {
            // Add new line
            lineData.id = Math.max(...this.data.linhas.map(l => l.id), 0) + 1;
            lineData.valor = parseFloat(lineData.valor);
            this.data.linhas.push(lineData);
            this.showToast('Linha adicionada com sucesso!', 'success');
        }

        this.closeLineModal();
        this.applyFilters();
        this.updateDashboard();
    }

    editLine(id) {
        const line = this.data.linhas.find(l => l.id === id);
        if (line) {
            this.openLineModal(line);
        }
    }

    deleteLine(id) {
        if (confirm('Tem certeza que deseja excluir esta linha?')) {
            this.data.linhas = this.data.linhas.filter(l => l.id !== id);
            this.applyFilters();
            this.updateDashboard();
            this.showToast('Linha excluída com sucesso!', 'success');
        }
    }

    exportPDF() {
        this.showLoading();
        
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

                // Table
                const tableData = this.filteredLines.map(linha => [
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
                    styles: { fontSize: 8 }
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
            
            this.filteredLines.forEach(linha => {
                const row = [
                    `"${linha.titular}"`,
                    `"${linha.numerocelular}"`,
                    `"${linha.plano}"`,
                    linha.valor,
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

    testConnection() {
        this.showLoading();
        
        setTimeout(() => {
            // Simulate connection test
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                this.showToast('Conexão testada com sucesso!', 'success');
            } else {
                this.showToast('Falha na conexão. Verifique as credenciais.', 'error');
            }
            
            this.hideLoading();
        }, 2000);
    }

    saveConfig(e) {
        e.preventDefault();
        
        const databaseUrl = document.getElementById('database-url').value;
        const apiBaseUrl = document.getElementById('api-base-url').value;
        
        this.data.credenciais = { databaseUrl, apiBaseUrl };
        
        this.showToast('Configurações salvas com sucesso!', 'success');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'} 
                ${type === 'success' ? 'Sucesso' : type === 'error' ? 'Erro' : type === 'warning' ? 'Aviso' : 'Informação'}
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
        }, 3000);
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