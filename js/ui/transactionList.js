/**
 * Transaction List
 * Управляет отображением списка транзакций
 */

import { Category } from '../models/Category.js';
import { formatSignedCurrency, formatRelativeDate } from '../utils/formatters.js';

export class TransactionList {
  /**
   * Создает новый экземпляр TransactionList
   * @param {HTMLElement} containerElement - Контейнер для списка
   * @param {Function} onEdit - Callback при редактировании
   * @param {Function} onDelete - Callback при удалении
   */
  constructor(containerElement, onEdit, onDelete) {
    this.container = containerElement;
    this.onEdit = onEdit;
    this.onDelete = onDelete;
    this.emptyState = document.getElementById('emptyState');
  }

  /**
   * Рендерит список транзакций
   * @param {Array<Transaction>} transactions - Массив транзакций для отображения
   */
  render(transactions) {
    // Очищаем контейнер
    this.container.innerHTML = '';

    // Если нет транзакций, показываем пустое состояние
    if (!transactions || transactions.length === 0) {
      this.showEmptyState();
      return;
    }

    // Скрываем пустое состояние
    this.hideEmptyState();

    // Рендерим каждую транзакцию
    transactions.forEach(transaction => {
      const card = this.createTransactionCard(transaction);
      this.container.appendChild(card);
    });
  }

  /**
   * Создает карточку транзакции
   * @param {Transaction} transaction - Транзакция
   * @returns {HTMLElement} Элемент карточки
   */
  createTransactionCard(transaction) {
    const card = document.createElement('article');
    card.className = `transaction-card transaction-card--${transaction.type}`;
    card.dataset.id = transaction.id;

    // Получаем информацию о категории
    const category = Category.findById(transaction.category);
    const categoryIcon = category ? category.icon : '❓';
    const categoryName = category ? category.name : 'Неизвестная категория';

    // Иконка категории
    const icon = document.createElement('div');
    icon.className = 'transaction-card__icon';
    icon.textContent = categoryIcon;

    // Контент (описание, категория, дата)
    const content = document.createElement('div');
    content.className = 'transaction-card__content';

    const description = document.createElement('h3');
    description.className = 'transaction-card__description';
    description.textContent = transaction.description;
    description.title = transaction.description; // Tooltip для длинных описаний

    const categoryEl = document.createElement('p');
    categoryEl.className = 'transaction-card__category';
    categoryEl.textContent = categoryName;

    const date = document.createElement('time');
    date.className = 'transaction-card__date';
    date.dateTime = transaction.date;
    date.textContent = formatRelativeDate(transaction.date);

    content.appendChild(description);
    content.appendChild(categoryEl);
    content.appendChild(date);

    // Сумма
    const amount = document.createElement('div');
    amount.className = `transaction-card__amount transaction-card__amount--${transaction.type}`;
    amount.textContent = formatSignedCurrency(transaction.amount, transaction.type);

    // Кнопки действий
    const actions = document.createElement('div');
    actions.className = 'transaction-card__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'transaction-card__button transaction-card__button--edit';
    editBtn.dataset.id = transaction.id;
    editBtn.textContent = '✏️';
    editBtn.title = 'Редактировать';
    editBtn.setAttribute('aria-label', 'Редактировать транзакцию');
    editBtn.addEventListener('click', () => this.handleEdit(transaction));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'transaction-card__button transaction-card__button--delete';
    deleteBtn.dataset.id = transaction.id;
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Удалить';
    deleteBtn.setAttribute('aria-label', 'Удалить транзакцию');
    deleteBtn.addEventListener('click', () => this.handleDelete(transaction));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    // Собираем карточку
    card.appendChild(icon);
    card.appendChild(content);
    card.appendChild(amount);
    card.appendChild(actions);

    return card;
  }

  /**
   * Обрабатывает редактирование транзакции
   * @param {Transaction} transaction - Транзакция для редактирования
   */
  handleEdit(transaction) {
    if (this.onEdit) {
      this.onEdit(transaction);
    }
  }

  /**
   * Обрабатывает удаление транзакции
   * @param {Transaction} transaction - Транзакция для удаления
   */
  async handleDelete(transaction) {
    const confirmed = confirm(
      `Вы уверены, что хотите удалить транзакцию "${transaction.description}"?`
    );

    if (confirmed && this.onDelete) {
      await this.onDelete(transaction.id);
    }
  }

  /**
   * Показывает пустое состояние
   */
  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
    }
  }

  /**
   * Скрывает пустое состояние
   */
  hideEmptyState() {
    if (this.emptyState) {
      this.emptyState.style.display = 'none';
    }
  }

  /**
   * Очищает список
   */
  clear() {
    this.container.innerHTML = '';
    this.showEmptyState();
  }

  /**
   * Показывает состояние загрузки
   */
  showLoading() {
    this.container.innerHTML = '<div class="transaction-list__loading">Загрузка...</div>';
    this.hideEmptyState();
  }

  /**
   * Добавляет одну транзакцию в начало списка
   * @param {Transaction} transaction - Транзакция для добавления
   */
  prependTransaction(transaction) {
    this.hideEmptyState();
    const card = this.createTransactionCard(transaction);
    this.container.insertBefore(card, this.container.firstChild);
  }

  /**
   * Удаляет транзакцию из списка по ID
   * @param {string} id - ID транзакции
   */
  removeTransaction(id) {
    const card = this.container.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.remove();
    }

    // Если список пуст, показываем пустое состояние
    if (this.container.children.length === 0) {
      this.showEmptyState();
    }
  }

  /**
   * Обновляет транзакцию в списке
   * @param {Transaction} transaction - Обновленная транзакция
   */
  updateTransaction(transaction) {
    const oldCard = this.container.querySelector(`[data-id="${transaction.id}"]`);
    if (oldCard) {
      const newCard = this.createTransactionCard(transaction);
      oldCard.replaceWith(newCard);
    }
  }

  /**
   * Получает количество отображаемых транзакций
   * @returns {number}
   */
  getTransactionCount() {
    return this.container.querySelectorAll('.transaction-card').length;
  }

  /**
   * Фильтрует отображаемые транзакции
   * @param {Function} filterFn - Функция фильтрации
   */
  filterTransactions(filterFn) {
    const cards = this.container.querySelectorAll('.transaction-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const id = card.dataset.id;
      if (filterFn(id)) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Показываем пустое состояние, если нет видимых карточек
    if (visibleCount === 0) {
      this.showEmptyState();
    } else {
      this.hideEmptyState();
    }
  }
}
