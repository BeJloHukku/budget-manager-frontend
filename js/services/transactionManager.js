/**
 * Transaction Manager — бизнес-логика поверх REST API.
 */

import { Transaction } from '../models/Transaction.js';
import apiService from './apiService.js';

export class TransactionManager {
  constructor(storageService) {
    this.storage = storageService;
    this.transactions = [];
  }

  async loadTransactions() {
    try {
      const response = await apiService.getTransactions();
      // API: { items, total, limit, offset }
      const data = response.items || response;
      this.transactions = data.map((t) => Transaction.fromJSON(t));
      return this.transactions;
    } catch (error) {
      console.error('Ошибка при загрузке транзакций:', error);
      this.transactions = [];
      return [];
    }
  }

  async createTransaction(data) {
    const validation = Transaction.validate(data);
    if (!validation.valid) throw new Error(validation.errors.join(', '));

    const created = await apiService.createTransaction({
      type: data.type,
      amount: parseFloat(data.amount),
      category_id: data.category || null,
      description: data.description || '',
      date: data.date,
    });

    const transaction = Transaction.fromJSON(created);
    this.transactions.push(transaction);
    return transaction;
  }

  async updateTransaction(id, updates) {
    const existing = this.transactions.find((t) => t.id === id);
    if (!existing) throw new Error('Транзакция не найдена');

    const merged = { ...existing, ...updates };
    const validation = Transaction.validate(merged);
    if (!validation.valid) throw new Error(validation.errors.join(', '));

    const updated = await apiService.updateTransaction(id, {
      type: updates.type,
      amount: updates.amount ? parseFloat(updates.amount) : undefined,
      category_id: updates.category || null,
      description: updates.description,
      date: updates.date,
    });

    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx !== -1) this.transactions[idx] = Transaction.fromJSON(updated);
    return Transaction.fromJSON(updated);
  }

  async deleteTransaction(id) {
    try {
      await apiService.deleteTransaction(id);
      this.transactions = this.transactions.filter((t) => t.id !== id);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении транзакции:', error);
      return false;
    }
  }

  getTransactionById(id) {
    return this.transactions.find((t) => t.id === id) || null;
  }

  getAllTransactions() {
    return [...this.transactions];
  }

  filterByType(type) {
    if (type === 'all') return this.getAllTransactions();
    return this.transactions.filter((t) => t.type === type);
  }

  filterByCategory(categoryId) {
    return this.transactions.filter((t) => t.category === categoryId);
  }

  filterByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }

  sortTransactions(transactions, sortBy = 'date-desc') {
    const sorted = [...transactions];
    switch (sortBy) {
      case 'date-desc': return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'date-asc':  return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'amount-desc': return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':  return sorted.sort((a, b) => a.amount - b.amount);
      default: return sorted;
    }
  }

  getFilteredTransactions(options = {}) {
    let result = this.getAllTransactions();

    if (options.type && options.type !== 'all') {
      result = result.filter((t) => t.type === options.type);
    }
    if (options.category) {
      result = result.filter((t) => t.category === options.category);
    }
    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate);
      const end = new Date(options.endDate);
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }
    if (options.sortBy) {
      result = this.sortTransactions(result, options.sortBy);
    }

    return result;
  }

  searchTransactions(query) {
    const q = query.toLowerCase();
    return this.transactions.filter((t) => t.description.toLowerCase().includes(q));
  }

  getTransactionCount() {
    return this.transactions.length;
  }

  hasTransactions() {
    return this.transactions.length > 0;
  }
}
