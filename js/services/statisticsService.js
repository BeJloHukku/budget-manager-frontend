/**
 * Statistics Service
 * Рассчитывает статистику по транзакциям
 */

import { Category } from '../models/Category.js';

export class StatisticsService {
  /**
   * Рассчитывает баланс (доходы - расходы)
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @returns {number} Баланс
   */
  calculateBalance(transactions) {
    return transactions.reduce((balance, transaction) => {
      return balance + transaction.getSignedAmount();
    }, 0);
  }

  /**
   * Рассчитывает общую сумму доходов
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @returns {number} Сумма доходов
   */
  calculateTotalIncome(transactions) {
    return transactions
      .filter(t => t.isIncome())
      .reduce((total, t) => total + t.amount, 0);
  }

  /**
   * Рассчитывает общую сумму расходов
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @returns {number} Сумма расходов
   */
  calculateTotalExpenses(transactions) {
    return transactions
      .filter(t => t.isExpense())
      .reduce((total, t) => total + t.amount, 0);
  }

  /**
   * Получает статистику по категориям
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {string} type - Тип транзакций ('income' или 'expense')
   * @returns {Array<Object>} Массив объектов со статистикой по категориям
   */
  getCategoryStatistics(transactions, type) {
    // Фильтруем транзакции по типу
    const filteredTransactions = transactions.filter(t => t.type === type);
    
    if (filteredTransactions.length === 0) {
      return [];
    }

    // Получаем общую сумму для расчета процентов
    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Группируем по категориям
    const categoryMap = new Map();

    filteredTransactions.forEach(transaction => {
      const categoryId = transaction.category;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          total: 0,
          count: 0,
          transactions: []
        });
      }

      const categoryData = categoryMap.get(categoryId);
      categoryData.total += transaction.amount;
      categoryData.count += 1;
      categoryData.transactions.push(transaction);
    });

    // Преобразуем в массив и добавляем информацию о категории
    const statistics = Array.from(categoryMap.values()).map(stat => {
      const category = Category.findById(stat.categoryId);
      
      return {
        categoryId: stat.categoryId,
        categoryName: category ? category.name : 'Неизвестная категория',
        categoryIcon: category ? category.icon : '❓',
        categoryColor: category ? category.color : '#999999',
        total: stat.total,
        count: stat.count,
        percentage: total > 0 ? (stat.total / total) * 100 : 0,
        transactions: stat.transactions
      };
    });

    // Сортируем по сумме (от большей к меньшей)
    return statistics.sort((a, b) => b.total - a.total);
  }

  /**
   * Получает статистику за период
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {string} startDate - Начальная дата (YYYY-MM-DD)
   * @param {string} endDate - Конечная дата (YYYY-MM-DD)
   * @returns {Object} Объект со статистикой за период
   */
  getStatisticsForPeriod(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });

    return {
      balance: this.calculateBalance(periodTransactions),
      income: this.calculateTotalIncome(periodTransactions),
      expenses: this.calculateTotalExpenses(periodTransactions),
      transactionCount: periodTransactions.length,
      incomeCategories: this.getCategoryStatistics(periodTransactions, 'income'),
      expenseCategories: this.getCategoryStatistics(periodTransactions, 'expense')
    };
  }

  /**
   * Получает статистику по месяцам
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {number} monthsCount - Количество месяцев для анализа
   * @returns {Array<Object>} Массив объектов со статистикой по месяцам
   */
  getMonthlyStatistics(transactions, monthsCount = 6) {
    const now = new Date();
    const monthlyStats = [];

    for (let i = 0; i < monthsCount; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      monthlyStats.push({
        month: monthDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' }),
        year: monthDate.getFullYear(),
        monthNumber: monthDate.getMonth() + 1,
        income: this.calculateTotalIncome(monthTransactions),
        expenses: this.calculateTotalExpenses(monthTransactions),
        balance: this.calculateBalance(monthTransactions),
        transactionCount: monthTransactions.length
      });
    }

    return monthlyStats.reverse();
  }

  /**
   * Получает топ категорий по расходам
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {number} limit - Количество категорий
   * @returns {Array<Object>} Топ категорий
   */
  getTopExpenseCategories(transactions, limit = 5) {
    const expenseStats = this.getCategoryStatistics(transactions, 'expense');
    return expenseStats.slice(0, limit);
  }

  /**
   * Получает топ категорий по доходам
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {number} limit - Количество категорий
   * @returns {Array<Object>} Топ категорий
   */
  getTopIncomeCategories(transactions, limit = 5) {
    const incomeStats = this.getCategoryStatistics(transactions, 'income');
    return incomeStats.slice(0, limit);
  }

  /**
   * Рассчитывает средний расход в день
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {number} days - Количество дней для расчета
   * @returns {number} Средний расход в день
   */
  getAverageDailyExpense(transactions, days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && t.isExpense();
    });

    const totalExpenses = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    return totalExpenses / days;
  }

  /**
   * Рассчитывает средний доход в день
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {number} days - Количество дней для расчета
   * @returns {number} Средний доход в день
   */
  getAverageDailyIncome(transactions, days = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && t.isIncome();
    });

    const totalIncome = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    return totalIncome / days;
  }

  /**
   * Получает сводную статистику
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @returns {Object} Объект со сводной статистикой
   */
  getSummaryStatistics(transactions) {
    return {
      balance: this.calculateBalance(transactions),
      totalIncome: this.calculateTotalIncome(transactions),
      totalExpenses: this.calculateTotalExpenses(transactions),
      transactionCount: transactions.length,
      incomeCount: transactions.filter(t => t.isIncome()).length,
      expenseCount: transactions.filter(t => t.isExpense()).length,
      averageDailyExpense: this.getAverageDailyExpense(transactions),
      averageDailyIncome: this.getAverageDailyIncome(transactions),
      topExpenseCategories: this.getTopExpenseCategories(transactions, 3),
      topIncomeCategories: this.getTopIncomeCategories(transactions, 3)
    };
  }

  /**
   * Проверяет, превышен ли бюджет по категории
   * @param {Array<Transaction>} transactions - Массив транзакций
   * @param {string} categoryId - ID категории
   * @param {number} budget - Бюджет категории
   * @param {string} period - Период ('month', 'week', 'day')
   * @returns {Object} Объект с информацией о превышении бюджета
   */
  checkCategoryBudget(transactions, categoryId, budget, period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const categoryTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.category === categoryId && 
             t.isExpense() && 
             transactionDate >= startDate;
    });

    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

    return {
      categoryId,
      budget,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget,
      transactionCount: categoryTransactions.length
    };
  }
}
