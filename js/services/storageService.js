/**
 * Storage Service
 * Управляет сохранением и загрузкой данных из LocalStorage
 * Легко заменяется на API в будущем
 */

export class StorageService {
  /**
   * Создает новый экземпляр StorageService
   * @param {string} storageKey - Ключ для хранения данных в LocalStorage
   */
  constructor(storageKey = 'budgetManager') {
    this.storageKey = storageKey;
    this.version = '1.0.0';
  }

  /**
   * Получает все данные из хранилища
   * @returns {Promise<Object>} Объект с данными
   */
  async getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return this.getDefaultData();
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка при чтении данных из LocalStorage:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Сохраняет данные в хранилище
   * @param {Object} data - Данные для сохранения
   * @returns {Promise<boolean>} Успешность операции
   */
  async saveData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении данных в LocalStorage:', error);
      return false;
    }
  }

  /**
   * Получает все транзакции
   * @returns {Promise<Array>} Массив транзакций
   */
  async getTransactions() {
    const data = await this.getData();
    return data.transactions || [];
  }

  /**
   * Сохраняет массив транзакций
   * @param {Array} transactions - Массив транзакций
   * @returns {Promise<boolean>} Успешность операции
   */
  async saveTransactions(transactions) {
    const data = await this.getData();
    data.transactions = transactions;
    data.updatedAt = Date.now();
    return await this.saveData(data);
  }

  /**
   * Добавляет новую транзакцию
   * @param {Object} transaction - Транзакция для добавления
   * @returns {Promise<Object>} Добавленная транзакция
   */
  async addTransaction(transaction) {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    await this.saveTransactions(transactions);
    return transaction;
  }

  /**
   * Обновляет существующую транзакцию
   * @param {string} id - ID транзакции
   * @param {Object} updates - Объект с обновлениями
   * @returns {Promise<Object|null>} Обновленная транзакция или null
   */
  async updateTransaction(id, updates) {
    const transactions = await this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error(`Транзакция с ID ${id} не найдена`);
      return null;
    }

    transactions[index] = {
      ...transactions[index],
      ...updates,
      id, // Сохраняем оригинальный ID
      updatedAt: Date.now()
    };

    await this.saveTransactions(transactions);
    return transactions[index];
  }

  /**
   * Удаляет транзакцию
   * @param {string} id - ID транзакции для удаления
   * @returns {Promise<boolean>} Успешность операции
   */
  async deleteTransaction(id) {
    const transactions = await this.getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) {
      console.error(`Транзакция с ID ${id} не найдена`);
      return false;
    }

    return await this.saveTransactions(filteredTransactions);
  }

  /**
   * Находит транзакцию по ID
   * @param {string} id - ID транзакции
   * @returns {Promise<Object|null>} Транзакция или null
   */
  async getTransactionById(id) {
    const transactions = await this.getTransactions();
    return transactions.find(t => t.id === id) || null;
  }

  /**
   * Очищает все данные
   * @returns {Promise<boolean>} Успешность операции
   */
  async clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Ошибка при очистке данных:', error);
      return false;
    }
  }

  /**
   * Экспортирует все данные
   * @returns {Promise<Object>} Все данные для экспорта
   */
  async exportData() {
    return await this.getData();
  }

  /**
   * Импортирует данные
   * @param {Object} data - Данные для импорта
   * @returns {Promise<boolean>} Успешность операции
   */
  async importData(data) {
    try {
      // Валидация структуры данных
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Неверная структура данных');
      }

      return await this.saveData(data);
    } catch (error) {
      console.error('Ошибка при импорте данных:', error);
      return false;
    }
  }

  /**
   * Возвращает структуру данных по умолчанию
   * @returns {Object} Объект с данными по умолчанию
   */
  getDefaultData() {
    return {
      transactions: [],
      settings: {
        currency: 'RUB',
        locale: 'ru-RU'
      },
      version: this.version,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Получает настройки
   * @returns {Promise<Object>} Объект с настройками
   */
  async getSettings() {
    const data = await this.getData();
    return data.settings || this.getDefaultData().settings;
  }

  /**
   * Сохраняет настройки
   * @param {Object} settings - Настройки для сохранения
   * @returns {Promise<boolean>} Успешность операции
   */
  async saveSettings(settings) {
    const data = await this.getData();
    data.settings = { ...data.settings, ...settings };
    data.updatedAt = Date.now();
    return await this.saveData(data);
  }

  /**
   * Проверяет доступность LocalStorage
   * @returns {boolean} Доступен ли LocalStorage
   */
  static isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Получает размер используемого хранилища в байтах
   * @returns {number} Размер в байтах
   */
  getStorageSize() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? new Blob([data]).size : 0;
    } catch (error) {
      return 0;
    }
  }
}
