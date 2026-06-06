/**
 * Category model. Список приходит с бэка и кешируется на классе
 * через Category.setAll(), чтобы консьюмеры не зависели от apiService.
 */

export class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.icon = data.icon || '📦';
    this.color = data.color || '#6b7280';
  }

  isIncome() {
    return this.type === 'income';
  }

  isExpense() {
    return this.type === 'expense';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      icon: this.icon,
      color: this.color,
    };
  }

  static fromJSON(data) {
    return new Category(data);
  }

  static setAll(list) {
    Category._all = Array.isArray(list)
      ? list.map((item) => (item instanceof Category ? item : Category.fromJSON(item)))
      : [];
  }

  static getAllCategories() {
    return Category._all ? [...Category._all] : [];
  }

  static getExpenseCategories() {
    return Category.getAllCategories().filter((c) => c.type === 'expense');
  }

  static getIncomeCategories() {
    return Category.getAllCategories().filter((c) => c.type === 'income');
  }

  static findById(id) {
    if (!id) return null;
    return Category.getAllCategories().find((cat) => cat.id === id) || null;
  }

  static getByType(type) {
    if (type === 'income') return Category.getIncomeCategories();
    if (type === 'expense') return Category.getExpenseCategories();
    return [];
  }
}

Category._all = [];
