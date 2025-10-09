// app.js — Versão Simplificada usando apenas loadDataFromAPI() e máscara de telefone leve

class TeleCorpApp {
  constructor() {
    this.apiBase = `${window.location.origin}/.netlify/functions/api`;
    this.data = { linhas: [] };
    this.init();
  }

  async init() {
    this.showLoading('Carregando dados...');
    await this.loadDataFromAPI();
    this.hideLoading();
    this.bindEvents();
    this.render();
  }

  async loadDataFromAPI() {
    try {
      const res = await fetch(`${this.apiBase}/linhas`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { linhas } = await res.json();
      this.data.linhas = linhas;
    } catch (err) {
      console.warn('Erro ao carregar do banco:', err);
      this.showToast('Banco indisponível, usando dados de exemplo', 'warning');
      // fallback opcional: this.data.linhas = [...]; 
    }
  }

  bindEvents() {
    document
      .getElementById('add-line-btn')
      .addEventListener('click', () => this.openModal());
    document
      .getElementById('line-form')
      .addEventListener('submit', (e) => this.saveLine(e));
  }

  openModal(line = {}) {
    const modal = document.getElementById('line-modal');
    modal.querySelector('#titular').value = line.titular || '';
    modal.querySelector('#numerocelular').value = line.numerocelular || '';
    modal.classList.remove('hidden');
    this.setupPhoneMask();
  }

  setupPhoneMask() {
    const input = document.getElementById('numerocelular');
    input.setAttribute('maxlength', '15');
    input.oninput = () => {
      input.value = input.value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
    };
  }

  saveLine(e) {
    e.preventDefault();
    const form = e.target;
    const line = {
      titular: form.titular.value.trim(),
      numerocelular: form.numerocelular.value.trim(),
      valor: parseFloat(form.valor.value),
      plano: form.plano.value,
      responsavel: form.responsavel.value,
      codigoresponsavel: form.codigoresponsavel.value,
      contacontabil: form.contacontabil.value,
      centrocusto: form.centrocusto.value,
      entidade: form.entidade.value,
      status: form.status.value
    };

    // Envia ao banco
    fetch(`${this.apiBase}/linhas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(line)
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((saved) => {
        this.data.linhas.push(saved);
        this.render();
        this.showToast('Linha salva com sucesso!', 'success');
      })
      .catch((err) => {
        console.error('Falha ao salvar:', err);
        this.showToast('Erro ao salvar no banco', 'error');
      })
      .finally(() => {
        document.getElementById('line-modal').classList.add('hidden');
      });
  }

  render() {
    const tbody = document.getElementById('lines-tbody');
    tbody.innerHTML = this.data.linhas
      .map(
        (l) => `
      <tr>
        <td>${l.titular}</td>
        <td>${l.numerocelular}</td>
        <td>${l.plano}</td>
        <td>R$ ${l.valor.toFixed(2)}</td>
        <td>${l.centrocusto}</td>
        <td>${l.entidade}</td>
        <td>${l.status}</td>
        <td>
          <button onclick="app.openModal(${JSON.stringify(l)})">Editar</button>
        </td>
      </tr>`
      )
      .join('');
  }

  showLoading(msg) {
    document.getElementById('loader').textContent = msg;
    document.getElementById('loader').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loader').classList.add('hidden');
  }

  showToast(msg, type) {
    // implementa notificação simples
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Inicializa o app
window.addEventListener('DOMContentLoaded', () => {
  window.app = new TeleCorpApp();
});
