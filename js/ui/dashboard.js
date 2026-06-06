/**
 * Dashboard
 * Управляет отображением дашборда с балансом, доходами и расходами
 */

import { formatCurrency } from '../utils/formatters.js';

export class Dashboard {
  /**
   * Создает новый экземпляр Dashboard
   */
  constructor() {
    this.balanceElement = document.getElementById('balanceAmount');
    this.incomeElement = document.getElementById('incomeAmount');
    this.expenseElement = document.getElementById('expenseAmount');
  }

  /**
   * Обновляет дашборд с новыми данными
   * @param {Object} stats - Объект со статистикой
   * @param {number} stats.balance - Баланс
   * @param {number} stats.totalIncome - Общий доход
   * @param {number} stats.totalExpenses - Общие расходы
   */
  update(stats) {
    this.updateBalance(stats.balance);
    this.updateIncome(stats.totalIncome);
    this.updateExpenses(stats.totalExpenses);
  }

  /**
   * Обновляет отображение баланса
   * @param {number} balance - Баланс
   */
  updateBalance(balance) {
    if (!this.balanceElement) return;

    const formatted = formatCurrency(balance);
    this.animateValue(this.balanceElement, formatted);

    // Меняем цвет в зависимости от баланса
    this.balanceElement.classList.remove('dashboard__amount--success', 'dashboard__amount--danger');
    
    if (balance > 0) {
      this.balanceElement.classList.add('dashboard__amount--success');
    } else if (balance < 0) {
      this.balanceElement.classList.add('dashboard__amount--danger');
    }
  }

  /**
   * Обновляет отображение доходов
   * @param {number} income - Сумма доходов
   */
  updateIncome(income) {
    if (!this.incomeElement) return;

    const formatted = formatCurrency(income);
    this.animateValue(this.incomeElement, formatted);
  }

  /**
   * Обновляет отображение расходов
   * @param {number} expenses - Сумма расходов
   */
  updateExpenses(expenses) {
    if (!this.expenseElement) return;

    const formatted = formatCurrency(expenses);
    this.animateValue(this.expenseElement, formatted);
  }

  /**
   * Анимирует изменение значения
   * @param {HTMLElement} element - Элемент для обновления
   * @param {string} newValue - Новое значение
   */
  animateValue(element, newValue) {
    // Простая анимация через CSS transition
    element.style.opacity = '0.5';
    
    setTimeout(() => {
      element.textContent = newValue;
      element.style.opacity = '1';
    }, 150);
  }

  /**
   * Показывает состояние загрузки
   */
  showLoading() {
    if (this.balanceElement) this.balanceElement.textContent = '...';
    if (this.incomeElement) this.incomeElement.textContent = '...';
    if (this.expenseElement) this.expenseElement.textContent = '...';
  }

  /**
   * Сбрасывает дашборд к начальному состоянию
   */
  reset() {
    this.update({
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0
    });
  }

  /**
   * Получает текущие значения дашборда
   * @returns {Object} Объект с текущими значениями
   */
  getCurrentValues() {
    return {
      balance: this.balanceElement ? this.balanceElement.textContent : '0 ₽',
      income: this.incomeElement ? this.incomeElement.textContent : '0 ₽',
      expenses: this.expenseElement ? this.expenseElement.textContent : '0 ₽'
    };
  }
}
