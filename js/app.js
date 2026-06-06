/**
 * Budget Manager — главный контроллер приложения.
 */

import { StorageService } from './services/storageService.js';
import { TransactionManager } from './services/transactionManager.js';
import { StatisticsService } from './services/statisticsService.js';
import { FormHandler } from './ui/formHandler.js';
import { TransactionList } from './ui/transactionList.js';
import { Dashboard } from './ui/dashboard.js';
import { Statistics } from './ui/statistics.js';
import { formatDate } from './utils/formatters.js';
import apiService from './services/apiService.js';
import authScreen from './ui/authScreen.js';
import { Category } from './models/Category.js';

class BudgetApp {
  constructor() {
    this.storage = new StorageService();
    this.transactionManager = new TransactionManager(this.storage);
    this.statisticsService = new StatisticsService();

    this.state = {
      currentFilter: 'all',
      currentSort: 'date-desc',
      isLoading: false,
      isAuthenticated: false,
    };

    this.formHandler = null;
    this.transactionList = null;
    this.dashboard = null;
    this.statistics = null;
  }

  async init() {
    authScreen.init({
      onSuccess: () => window.location.reload(),
    });

    if (!apiService.isAuthenticated()) {
      this.showAuthScreen();
      return;
    }

    try {
      this.state.isAuthenticated = true;
      this.showAppShell();

      // Категории нужны ДО создания FormHandler — он сразу заполняет <select>
      await this.loadCategories();

      this.initializeUI();
      this.setupEventListeners();
      await this.loadData();
      this.updateUI();
      this.updateCurrentDate();
      this.setupLogoutButton();
    } catch (error) {
      console.error('Ошибка при инициализации приложения:', error);
      alert('Ошибка при загрузке приложения. Пожалуйста, перезагрузите страницу.');
    }
  }

  showAuthScreen() {
    const shell = document.getElementById('appShell');
    if (shell) shell.hidden = true;
    authScreen.show();
  }

  showAppShell() {
    authScreen.hide();
    const shell = document.getElementById('appShell');
    if (shell) shell.hidden = false;
  }

  setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите выйти?')) {
        apiService.logout();
        window.location.reload();
      }
    });
  }

  initializeUI() {
    const formElement = document.getElementById('transactionForm');
    this.formHandler = new FormHandler(
      formElement,
      (data, editingId) => this.handleFormSubmit(data, editingId),
    );

    const listContainer = document.getElementById('transactionList');
    this.transactionList = new TransactionList(
      listContainer,
      (transaction) => this.handleEdit(transaction),
      (id) => this.handleDelete(id),
    );

    this.dashboard = new Dashboard();
    this.statistics = new Statistics();
  }

  setupEventListeners() {
    document.getElementById('filterAll')?.addEventListener('click', () => this.setFilter('all'));
    document.getElementById('filterIncome')?.addEventListener('click', () => this.setFilter('income'));
    document.getElementById('filterExpense')?.addEventListener('click', () => this.setFilter('expense'));

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.setSort(e.target.value);
    });

    document.getElementById('statsExpenseBtn')?.addEventListener('click', () => {
      this.statistics.setType('expense');
      this.updateStatistics();
    });

    document.getElementById('statsIncomeBtn')?.addEventListener('click', () => {
      this.statistics.setType('income');
      this.updateStatistics();
    });
  }

  async loadCategories() {
    try {
      const list = await apiService.getCategories();
      Category.setAll(list || []);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
      Category.setAll([]);
    }
  }

  async loadData() {
    this.state.isLoading = true;
    this.dashboard.showLoading();
    this.transactionList.showLoading();

    try {
      await this.transactionManager.loadTransactions();
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      alert('Ошибка при загрузке данных');
    } finally {
      this.state.isLoading = false;
    }
  }

  async handleFormSubmit(data, editingId) {
    try {
      if (editingId) {
        await this.transactionManager.updateTransaction(editingId, data);
      } else {
        await this.transactionManager.createTransaction(data);
      }

      this.updateUI();
      this.showNotification(
        editingId ? 'Транзакция обновлена' : 'Транзакция добавлена',
        'success',
      );
    } catch (error) {
      console.error('Ошибка при сохранении транзакции:', error);
      this.showNotification('Ошибка при сохранении: ' + error.message, 'error');
      throw error;
    }
  }

  handleEdit(transaction) {
    this.formHandler.fillFormForEdit(transaction);
  }

  async handleDelete(id) {
    try {
      await this.transactionManager.deleteTransaction(id);
      this.updateUI();
      this.showNotification('Транзакция удалена', 'success');
    } catch (error) {
      console.error('Ошибка при удалении транзакции:', error);
      this.showNotification('Ошибка при удалении', 'error');
    }
  }

  setFilter(filter) {
    this.state.currentFilter = filter;

    document.querySelectorAll('.filters__button').forEach((btn) => {
      btn.classList.remove('filters__button--active');
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('filters__button--active');

    this.updateTransactionList();
  }

  setSort(sort) {
    this.state.currentSort = sort;
    this.updateTransactionList();
  }

  updateUI() {
    this.updateDashboard();
    this.updateTransactionList();
    this.updateStatistics();
  }

  updateDashboard() {
    const transactions = this.transactionManager.getAllTransactions();
    const stats = this.statisticsService.getSummaryStatistics(transactions);
    this.dashboard.update({
      balance: stats.balance,
      totalIncome: stats.totalIncome,
      totalExpenses: stats.totalExpenses,
    });
  }

  updateTransactionList() {
    const transactions = this.transactionManager.getFilteredTransactions({
      type: this.state.currentFilter,
      sortBy: this.state.currentSort,
    });
    this.transactionList.render(transactions);
  }

  updateStatistics() {
    const transactions = this.transactionManager.getAllTransactions();
    const stats = {
      incomeCategories: this.statisticsService.getCategoryStatistics(transactions, 'income'),
      expenseCategories: this.statisticsService.getCategoryStatistics(transactions, 'expense'),
    };
    this.statistics.render(stats);
  }

  updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = formatDate(new Date(), 'full');
    }
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async exportData() {
    return this.storage.exportData();
  }

  async importData(data) {
    try {
      await this.storage.importData(data);
      await this.loadData();
      this.updateUI();
      this.showNotification('Данные успешно импортированы', 'success');
    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      this.showNotification('Ошибка при импорте данных', 'error');
      throw error;
    }
  }

  async clearAllData() {
    if (!confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие необратимо!')) return;
    try {
      await this.storage.clearAll();
      await this.loadData();
      this.updateUI();
      this.formHandler.resetForm();
      this.showNotification('Все данные удалены', 'success');
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
      this.showNotification('Ошибка при очистке данных', 'error');
    }
  }

  getAppInfo() {
    return {
      version: '1.0.0',
      transactionCount: this.transactionManager.getTransactionCount(),
      storageSize: this.storage.getStorageSize(),
      hasTransactions: this.transactionManager.hasTransactions(),
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new BudgetApp();
  app.init();
  window.budgetApp = app;
});

export { BudgetApp };
