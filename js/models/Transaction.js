/**
 * Transaction model.
 */

export class Transaction {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.type = data.type;
    this.amount = parseFloat(data.amount);
    // backend отдаёт category_id, локально храним как category
    this.category = data.category_id ?? data.category ?? null;
    this.description = data.description || '';
    this.date = data.date;
    this.createdAt = data.createdAt || data.created_at || Date.now();
    this.updatedAt = data.updatedAt || data.updated_at || Date.now();
  }

  generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `txn_${timestamp}_${random}`;
  }

  update(updates) {
    Object.keys(updates).forEach((key) => {
      if (key !== 'id' && key !== 'createdAt') {
        this[key] = updates[key];
      }
    });
    this.updatedAt = Date.now();
  }

  isIncome() {
    return this.type === 'income';
  }

  isExpense() {
    return this.type === 'expense';
  }

  getSignedAmount() {
    return this.isIncome() ? this.amount : -this.amount;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      amount: this.amount,
      category: this.category,
      description: this.description,
      date: this.date,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(data) {
    return new Transaction(data);
  }

  static validate(data) {
    const errors = [];

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Тип транзакции должен быть "income" или "expense"');
    }
    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
      errors.push('Сумма должна быть положительным числом');
    }
    if (!data.category || String(data.category).trim() === '') {
      errors.push('Категория обязательна');
    }
    if (!data.description || data.description.trim() === '') {
      errors.push('Описание обязательно');
    }
    if (data.description && data.description.length > 200) {
      errors.push('Описание не должно превышать 200 символов');
    }
    if (!data.date) {
      errors.push('Дата обязательна');
    } else if (isNaN(new Date(data.date).getTime())) {
      errors.push('Неверный формат даты');
    }

    return { valid: errors.length === 0, errors };
  }
}
