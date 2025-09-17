// Dados da aplicação
let financeData = {
    receitas: [
        { id: 1, descricao: 'Salário', valor: 5000, categoria: 'Trabalho', data: '2024-01-01' },
        { id: 2, descricao: 'Freelance', valor: 800, categoria: 'Extra', data: '2024-01-15' }
    ],
    despesas: [
        { id: 1, descricao: 'Aluguel', valor: 1200, categoria: 'Moradia', data: '2024-01-05' },
        { id: 2, descricao: 'Supermercado', valor: 400, categoria: 'Alimentação', data: '2024-01-10' },
        { id: 3, descricao: 'Combustível', valor: 300, categoria: 'Transporte', data: '2024-01-12' },
        { id: 4, descricao: 'Cinema', valor: 50, categoria: 'Lazer', data: '2024-01-20' }
    ],
    orcamento: {
        'Moradia': 1500,
        'Alimentação': 600,
        'Transporte': 400,
        'Lazer': 200,
        'Outros': 300
    }
};

// Configurações das categorias
const categorias = {
    'Moradia': { icon: 'fas fa-home', color: '#2E8B57' },
    'Alimentação': { icon: 'fas fa-shopping-cart', color: '#FF6B6B' },
    'Transporte': { icon: 'fas fa-car', color: '#4ECDC4' },
    'Lazer': { icon: 'fas fa-gamepad', color: '#45B7D1' },
    'Outros': { icon: 'fas fa-dollar-sign', color: '#96CEB4' }
};

const categoriasReceita = ['Trabalho', 'Extra', 'Investimentos', 'Outros'];

// Variáveis globais
let currentTransactionType = '';
let pieChart = null;
let barChart = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeApp();
    setupEventListeners();
});

// Carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('financeData');
    if (savedData) {
        financeData = JSON.parse(savedData);
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('financeData', JSON.stringify(financeData));
}

// Inicializar aplicação
function initializeApp() {
    updateCurrentMonth();
    updateSummaryCards();
    updateAllViews();
}

// Configurar event listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            switchTab(tabId);
        });
    });

    // Forms
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);

    // Modal close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal();
            closeBudgetModal();
        }
    });
}

// Atualizar mês atual
function updateCurrentMonth() {
    const now = new Date();
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('current-month').textContent = monthName;
}

// Alternar entre tabs
function switchTab(tabId) {
    // Atualizar botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    // Atualizar gráficos se necessário
    if (tabId === 'dashboard') {
        setTimeout(() => {
            updatePieChart();
            updateBudgetProgress();
            updateRecentTransactions();
        }, 100);
    } else if (tabId === 'relatorios') {
        setTimeout(() => {
            updateBarChart();
            updateFinancialSummary();
        }, 100);
    } else if (tabId === 'transacoes') {
        updateTransactionsList();
    } else if (tabId === 'orcamento') {
        updateBudgetView();
    }
}

// Atualizar cards de resumo
function updateSummaryCards() {
    const totalReceitas = financeData.receitas.reduce((acc, receita) => acc + receita.valor, 0);
    const totalDespesas = financeData.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    const totalOrcamento = Object.values(financeData.orcamento).reduce((acc, valor) => acc + valor, 0);

    // Atualizar valores
    document.getElementById('total-receitas').textContent = formatCurrency(totalReceitas);
    document.getElementById('count-receitas').textContent = `+${financeData.receitas.length} transações`;
    
    document.getElementById('total-despesas').textContent = formatCurrency(totalDespesas);
    document.getElementById('count-despesas').textContent = `-${financeData.despesas.length} transações`;
    
    document.getElementById('saldo-total').textContent = formatCurrency(saldo);
    document.getElementById('saldo-status').textContent = saldo >= 0 ? 'Positivo' : 'Negativo';
    
    document.getElementById('total-orcamento').textContent = formatCurrency(totalOrcamento);
    document.getElementById('orcamento-usado').textContent = `${((totalDespesas / totalOrcamento) * 100).toFixed(1)}% usado`;

    // Atualizar cor do card de saldo
    const saldoCard = document.querySelector('.card-saldo');
    if (saldo < 0) {
        saldoCard.classList.add('negative');
    } else {
        saldoCard.classList.remove('negative');
    }
}

// Atualizar todas as views
function updateAllViews() {
    updateSummaryCards();
    updatePieChart();
    updateBudgetProgress();
    updateRecentTransactions();
    updateTransactionsList();
    updateBudgetView();
    updateBarChart();
    updateFinancialSummary();
}

// Gráfico de pizza
function updatePieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    const dadosPorCategoria = Object.keys(categorias).map(categoria => {
        const gastos = financeData.despesas
            .filter(despesa => despesa.categoria === categoria)
            .reduce((acc, despesa) => acc + despesa.valor, 0);
        return {
            categoria,
            gastos
        };
    }).filter(item => item.gastos > 0);

    if (pieChart) {
        pieChart.destroy();
    }

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: dadosPorCategoria.map(item => item.categoria),
            datasets: [{
                data: dadosPorCategoria.map(item => item.gastos),
                backgroundColor: dadosPorCategoria.map(item => categorias[item.categoria].color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Progresso do orçamento
function updateBudgetProgress() {
    const container = document.getElementById('budget-progress-list');
    if (!container) return;

    const dadosPorCategoria = Object.keys(categorias).map(categoria => {
        const gastos = financeData.despesas
            .filter(despesa => despesa.categoria === categoria)
            .reduce((acc, despesa) => acc + despesa.valor, 0);
        const orcado = financeData.orcamento[categoria] || 0;
        return {
            categoria,
            gastos,
            orcado,
            percentual: orcado > 0 ? (gastos / orcado) * 100 : 0
        };
    });

    container.innerHTML = dadosPorCategoria.map(item => {
        const isOverBudget = item.percentual > 100;
        const icon = categorias[item.categoria].icon;
        const color = categorias[item.categoria].color;
        
        return `
            <div class="progress-item">
                <div class="progress-header">
                    <div class="progress-label">
                        <i class="${icon}" style="color: ${color}"></i>
                        <span>${item.categoria}</span>
                        ${isOverBudget ? '<i class="fas fa-exclamation-triangle" style="color: #ef4444"></i>' : ''}
                    </div>
                    <div class="progress-values">
                        <div style="font-weight: 500; font-size: 0.875rem;">
                            ${formatCurrency(item.gastos)} / ${formatCurrency(item.orcado)}
                        </div>
                        <div class="progress-percentage ${isOverBudget ? 'over-budget' : ''}">
                            ${item.percentual.toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" 
                         style="width: ${Math.min(item.percentual, 100)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Transações recentes
function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions-list');
    if (!container) return;

    const todasTransacoes = [
        ...financeData.receitas.map(t => ({...t, tipo: 'receita'})),
        ...financeData.despesas.map(t => ({...t, tipo: 'despesa'}))
    ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    container.innerHTML = todasTransacoes.map(transacao => {
        const isReceita = transacao.tipo === 'receita';
        const icon = isReceita ? 'fas fa-trending-up' : 'fas fa-trending-down';
        
        return `
            <div class="transaction-item ${transacao.tipo}">
                <div class="transaction-info">
                    <div class="transaction-icon ${transacao.tipo}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transacao.descricao}</h4>
                        <p>${transacao.categoria}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${transacao.tipo}">
                        ${isReceita ? '+' : '-'}${formatCurrency(transacao.valor)}
                    </div>
                    <div class="date">${formatDate(transacao.data)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Lista de transações
function updateTransactionsList() {
    updateReceitasList();
    updateDespesasList();
}

function updateReceitasList() {
    const container = document.getElementById('receitas-list');
    const totalElement = document.getElementById('receitas-total');
    
    if (!container || !totalElement) return;

    const total = financeData.receitas.reduce((acc, receita) => acc + receita.valor, 0);
    totalElement.textContent = `Total: ${formatCurrency(total)}`;

    container.innerHTML = financeData.receitas.map(receita => `
        <div class="transaction-item receita">
            <div class="transaction-info">
                <div class="transaction-details">
                    <h4>${receita.descricao}</h4>
                    <p>${receita.categoria}</p>
                </div>
            </div>
            <div class="transaction-amount">
                <div class="amount receita">${formatCurrency(receita.valor)}</div>
                <div class="date">${formatDate(receita.data)}</div>
            </div>
        </div>
    `).join('');
}

function updateDespesasList() {
    const container = document.getElementById('despesas-list');
    const totalElement = document.getElementById('despesas-total');
    
    if (!container || !totalElement) return;

    const total = financeData.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
    totalElement.textContent = `Total: ${formatCurrency(total)}`;

    container.innerHTML = financeData.despesas.map(despesa => {
        const categoria = categorias[despesa.categoria];
        const icon = categoria ? categoria.icon : 'fas fa-dollar-sign';
        const color = categoria ? categoria.color : '#6b7280';
        
        return `
            <div class="transaction-item despesa">
                <div class="transaction-info">
                    <div class="transaction-icon despesa">
                        <i class="${icon}" style="color: ${color}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${despesa.descricao}</h4>
                        <p>${despesa.categoria}</p>
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount despesa">${formatCurrency(despesa.valor)}</div>
                    <div class="date">${formatDate(despesa.data)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// View de orçamento
function updateBudgetView() {
    const container = document.getElementById('budget-categories');
    if (!container) return;

    const dadosPorCategoria = Object.keys(categorias).map(categoria => {
        const gastos = financeData.despesas
            .filter(despesa => despesa.categoria === categoria)
            .reduce((acc, despesa) => acc + despesa.valor, 0);
        const orcado = financeData.orcamento[categoria] || 0;
        const percentual = orcado > 0 ? (gastos / orcado) * 100 : 0;
        const isOverBudget = percentual > 100;
        
        return {
            categoria,
            gastos,
            orcado,
            percentual,
            isOverBudget,
            restante: Math.max(0, orcado - gastos)
        };
    });

    container.innerHTML = dadosPorCategoria.map(item => {
        const categoria = categorias[item.categoria];
        const icon = categoria.icon;
        const color = categoria.color;
        
        return `
            <div class="budget-item ${item.isOverBudget ? 'over-budget' : ''}">
                <div class="budget-header">
                    <div class="budget-icon" style="background-color: ${color}20; color: ${color}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="budget-title">
                        <h4>${item.categoria}</h4>
                        ${item.isOverBudget ? '<span class="budget-alert">Acima do orçamento</span>' : ''}
                    </div>
                    <button class="edit-budget-btn" onclick="openBudgetModal('${item.categoria}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
                <div class="budget-amounts">
                    <span>Gasto: ${formatCurrency(item.gastos)}</span>
                    <span>Orçado: ${formatCurrency(item.orcado)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${item.isOverBudget ? 'over-budget' : ''}" 
                         style="width: ${Math.min(item.percentual, 100)}%"></div>
                </div>
                <div class="budget-stats">
                    <span class="budget-percentage ${item.isOverBudget ? 'over-budget' : ''}">
                        ${item.percentual.toFixed(1)}% usado
                    </span>
                    <span class="budget-remaining">
                        Restante: ${formatCurrency(item.restante)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Gráfico de barras
function updateBarChart() {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;

    const dadosPorCategoria = Object.keys(categorias).map(categoria => {
        const gastos = financeData.despesas
            .filter(despesa => despesa.categoria === categoria)
            .reduce((acc, despesa) => acc + despesa.valor, 0);
        const orcado = financeData.orcamento[categoria] || 0;
        return {
            categoria,
            gastos,
            orcado
        };
    });

    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosPorCategoria.map(item => item.categoria),
            datasets: [
                {
                    label: 'Orçado',
                    data: dadosPorCategoria.map(item => item.orcado),
                    backgroundColor: '#8884d8',
                    borderRadius: 4
                },
                {
                    label: 'Gasto',
                    data: dadosPorCategoria.map(item => item.gastos),
                    backgroundColor: '#82ca9d',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Resumo financeiro
function updateFinancialSummary() {
    const container = document.getElementById('financial-summary');
    if (!container) return;

    const totalReceitas = financeData.receitas.reduce((acc, receita) => acc + receita.valor, 0);
    const totalDespesas = financeData.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    const taxaPoupanca = totalReceitas > 0 ? ((saldo / totalReceitas) * 100).toFixed(1) : 0;
    const maiorDespesa = financeData.despesas.length > 0 ? 
        Math.max(...financeData.despesas.map(d => d.valor)) : 0;
    
    const dadosPorCategoria = Object.keys(categorias).map(categoria => {
        const gastos = financeData.despesas
            .filter(despesa => despesa.categoria === categoria)
            .reduce((acc, despesa) => acc + despesa.valor, 0);
        return { categoria, gastos };
    });
    
    const categoriaMaisGastos = dadosPorCategoria.length > 0 ? 
        dadosPorCategoria.reduce((prev, current) => 
            prev.gastos > current.gastos ? prev : current
        ).categoria : 'N/A';

    container.innerHTML = `
        <div class="summary-row">
            <div class="summary-item receitas">
                <div class="summary-value receitas">${formatCurrency(totalReceitas)}</div>
                <div class="summary-label">Total de Receitas</div>
            </div>
            <div class="summary-item despesas">
                <div class="summary-value despesas">${formatCurrency(totalDespesas)}</div>
                <div class="summary-label">Total de Despesas</div>
            </div>
        </div>
        
        <div class="summary-item saldo ${saldo < 0 ? 'negative' : ''}">
            <div class="summary-value saldo ${saldo < 0 ? 'negative' : ''}">${formatCurrency(saldo)}</div>
            <div class="summary-label">Saldo Final</div>
        </div>

        <div class="summary-stats">
            <div class="stat-row">
                <span class="stat-label">Taxa de Poupança:</span>
                <span class="stat-value">${taxaPoupanca}%</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Maior Despesa:</span>
                <span class="stat-value">${formatCurrency(maiorDespesa)}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Categoria com Mais Gastos:</span>
                <span class="stat-value">${categoriaMaisGastos}</span>
            </div>
        </div>
    `;
}

// Modal functions
function openModal(type) {
    currentTransactionType = type;
    const modal = document.getElementById('transactionModal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const categoriaSelect = document.getElementById('categoria');
    
    title.textContent = type === 'receita' ? 'Nova Receita' : 'Nova Despesa';
    submitBtn.textContent = type === 'receita' ? 'Adicionar Receita' : 'Adicionar Despesa';
    submitBtn.className = `btn ${type === 'receita' ? 'btn-success' : 'btn-danger'}`;
    
    // Preencher categorias
    const categoriasList = type === 'receita' ? categoriasReceita : Object.keys(categorias);
    categoriaSelect.innerHTML = categoriasList.map(cat => 
        `<option value="${cat}">${cat}</option>`
    ).join('');
    
    // Limpar form
    document.getElementById('transactionForm').reset();
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('transactionModal').classList.remove('active');
}

function openBudgetModal(categoria) {
    const modal = document.getElementById('budgetModal');
    const categoriaInput = document.getElementById('budget-categoria');
    const valorInput = document.getElementById('budget-valor');
    
    categoriaInput.value = categoria;
    valorInput.value = financeData.orcamento[categoria] || 0;
    
    modal.classList.add('active');
}

function closeBudgetModal() {
    document.getElementById('budgetModal').classList.remove('active');
}

// Form handlers
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transacao = {
        id: Date.now(),
        descricao: formData.get('descricao'),
        valor: parseFloat(formData.get('valor')),
        categoria: formData.get('categoria'),
        data: new Date().toISOString().split('T')[0]
    };
    
    if (currentTransactionType === 'receita') {
        financeData.receitas.push(transacao);
    } else {
        financeData.despesas.push(transacao);
    }
    
    saveData();
    updateAllViews();
    closeModal();
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const categoria = formData.get('budget-categoria');
    const valor = parseFloat(formData.get('budget-valor'));
    
    financeData.orcamento[categoria] = valor;
    
    saveData();
    updateAllViews();
    closeBudgetModal();
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Inicializar quando a página carregar
window.addEventListener('load', function() {
    // Ativar tab dashboard por padrão
    switchTab('dashboard');
});

