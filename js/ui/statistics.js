/**
 * Statistics
 * Управляет отображением статистики по категориям
 */

import { formatCurrency, formatPercentage } from '../utils/formatters.js';

export class Statistics {
  /**
   * Создает новый экземпляр Statistics
   */
  constructor() {
    this.contentElement = document.getElementById('statisticsContent');
    this.expenseBtn = document.getElementById('statsExpenseBtn');
    this.incomeBtn = document.getElementById('statsIncomeBtn');
    this.currentType = 'expense';

    this.setupEventListeners();
  }

  /**
   * Устанавливает обработчики событий
   */
  setupEventListeners() {
    if (this.expenseBtn) {
      this.expenseBtn.addEventListener('click', () => this.setType('expense'));
    }

    if (this.incomeBtn) {
      this.incomeBtn.addEventListener('click', () => this.setType('income'));
    }
  }

  /**
   * Устанавливает тип статистики
   * @param {string} type - Тип ('income' или 'expense')
   */
  setType(type) {
    this.currentType = type;

    // Обновляем кнопки
    if (type === 'expense') {
      this.expenseBtn?.classList.add('statistics__toggle-button--active');
      this.incomeBtn?.classList.remove('statistics__toggle-button--active');
    } else {
      this.incomeBtn?.classList.add('statistics__toggle-button--active');
      this.expenseBtn?.classList.remove('statistics__toggle-button--active');
    }
  }

  /**
   * Рендерит статистику
   * @param {Object} statistics - Объект со статистикой
   * @param {Array} statistics.incomeCategories - Статистика по категориям доходов
   * @param {Array} statistics.expenseCategories - Статистика по категориям расходов
   */
  render(statistics) {
    if (!this.contentElement) return;

    const categoryStats = this.currentType === 'expense' 
      ? statistics.expenseCategories 
      : statistics.incomeCategories;

    // Очищаем контейнер
    this.contentElement.innerHTML = '';

    // Если нет данных, показываем пустое состояние
    if (!categoryStats || categoryStats.length === 0) {
      this.showEmptyState();
      return;
    }

    // Рендерим каждую категорию
    categoryStats.forEach(stat => {
      const categoryElement = this.createCategoryStatElement(stat);
      this.contentElement.appendChild(categoryElement);
    });
  }

  /**
   * Создает элемент статистики по категории
   * @param {Object} stat - Статистика категории
   * @returns {HTMLElement} Элемент статистики
   */
  createCategoryStatElement(stat) {
    const container = document.createElement('div');
    container.className = 'category-stat';

    // Заголовок (иконка, название, сумма)
    const header = document.createElement('div');
    header.className = 'category-stat__header';

    const info = document.createElement('div');
    info.className = 'category-stat__info';

    const icon = document.createElement('span');
    icon.className = 'category-stat__icon';
    icon.textContent = stat.categoryIcon;

    const name = document.createElement('span');
    name.className = 'category-stat__name';
    name.textContent = stat.categoryName;

    info.appendChild(icon);
    info.appendChild(name);

    const amount = document.createElement('span');
    amount.className = 'category-stat__amount';
    amount.textContent = formatCurrency(stat.total);

    header.appendChild(info);
    header.appendChild(amount);

    // Детали (процент и прогресс-бар)
    const details = document.createElement('div');
    details.className = 'category-stat__details';

    const percentage = document.createElement('span');
    percentage.className = 'category-stat__percentage';
    percentage.textContent = formatPercentage(stat.percentage);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'category-stat__progress';

    const progressBar = document.createElement('div');
    progressBar.className = `category-stat__progress-bar category-stat__progress-bar--${this.currentType}`;
    progressBar.style.width = `${Math.min(stat.percentage, 100)}%`;
    progressBar.style.backgroundColor = stat.categoryColor;

    progressContainer.appendChild(progressBar);

    details.appendChild(percentage);
    details.appendChild(progressContainer);

    // Собираем элемент
    container.appendChild(header);
    container.appendChild(details);

    return container;
  }

  /**
   * Показывает пустое состояние
   */
  showEmptyState() {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="statistics__empty">
        <p class="statistics__empty-text">Нет данных для отображения</p>
      </div>
    `;
  }

  /**
   * Обновляет статистику
   * @param {Object} statistics - Новая статистика
   */
  update(statistics) {
    this.render(statistics);
  }

  /**
   * Очищает статистику
   */
  clear() {
    if (this.contentElement) {
      this.contentElement.innerHTML = '';
    }
    this.showEmptyState();
  }

  /**
   * Показывает состояние загрузки
   */
  showLoading() {
    if (!this.contentElement) return;

    this.contentElement.innerHTML = `
      <div class="statistics__loading">Загрузка статистики...</div>
    `;
  }

  /**
   * Получает текущий тип статистики
   * @returns {string} Текущий тип ('income' или 'expense')
   */
  getCurrentType() {
    return this.currentType;
  }

  /**
   * Переключает тип статистики
   */
  toggleType() {
    this.setType(this.currentType === 'expense' ? 'income' : 'expense');
  }
}
