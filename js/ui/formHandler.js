/**
 * Form Handler — форма добавления/редактирования транзакций.
 */

import { Category } from '../models/Category.js';
import { validateTransactionForm, displayValidationErrors, clearValidationErrors } from '../utils/validators.js';
import { formatDateForInput } from '../utils/formatters.js';

export class FormHandler {
  constructor(formElement, onSubmit) {
    this.form = formElement;
    this.onSubmit = onSubmit;
    this.currentType = 'expense';
    this.editingId = null;

    this.initializeElements();
    this.setupEventListeners();
    this.populateCategories();
    this.setDefaultDate();
  }

  initializeElements() {
    this.expenseTypeBtn = document.getElementById('expenseTypeBtn');
    this.incomeTypeBtn = document.getElementById('incomeTypeBtn');
    this.amountInput = document.getElementById('amountInput');
    this.categorySelect = document.getElementById('categorySelect');
    this.descriptionInput = document.getElementById('descriptionInput');
    this.dateInput = document.getElementById('dateInput');
    this.submitBtn = document.getElementById('submitBtn');
    this.cancelBtn = document.getElementById('cancelBtn');
  }

  setupEventListeners() {
    this.expenseTypeBtn.addEventListener('click', () => this.setType('expense'));
    this.incomeTypeBtn.addEventListener('click', () => this.setType('income'));
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.cancelBtn.addEventListener('click', () => this.cancelEdit());

    this.amountInput.addEventListener('input', () => this.clearFieldError('amount'));
    this.categorySelect.addEventListener('change', () => this.clearFieldError('category'));
    this.descriptionInput.addEventListener('input', () => this.clearFieldError('description'));
    this.dateInput.addEventListener('change', () => this.clearFieldError('date'));
  }

  setType(type) {
    this.currentType = type;

    if (type === 'expense') {
      this.expenseTypeBtn.classList.add('transaction-form__type-button--active');
      this.incomeTypeBtn.classList.remove('transaction-form__type-button--active');
    } else {
      this.incomeTypeBtn.classList.add('transaction-form__type-button--active');
      this.expenseTypeBtn.classList.remove('transaction-form__type-button--active');
    }

    this.populateCategories();
  }

  populateCategories() {
    const categories = Category.getByType(this.currentType);
    this.categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.name}`;
      this.categorySelect.appendChild(option);
    });
  }

  setDefaultDate() {
    this.dateInput.value = formatDateForInput();
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = {
      type: this.currentType,
      amount: this.amountInput.value,
      category: this.categorySelect.value,
      description: this.descriptionInput.value,
      date: this.dateInput.value,
    };

    const validation = validateTransactionForm(formData);
    if (!validation.valid) {
      displayValidationErrors(this.form, validation.errors);
      return;
    }
    clearValidationErrors(this.form);

    try {
      await this.onSubmit(formData, this.editingId);
      this.resetForm();
    } catch (error) {
      console.error('Ошибка при сохранении транзакции:', error);
      alert('Ошибка при сохранении транзакции: ' + error.message);
    }
  }

  fillFormForEdit(transaction) {
    this.editingId = transaction.id;
    this.setType(transaction.type);
    this.amountInput.value = transaction.amount;
    this.categorySelect.value = transaction.category;
    this.descriptionInput.value = transaction.description;
    this.dateInput.value = transaction.date;

    this.submitBtn.textContent = 'Сохранить изменения';
    this.cancelBtn.style.display = 'block';
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  resetForm() {
    this.form.reset();
    this.editingId = null;
    this.setType('expense');
    this.setDefaultDate();
    this.submitBtn.textContent = 'Добавить транзакцию';
    this.cancelBtn.style.display = 'none';
    clearValidationErrors(this.form);
  }

  clearFieldError(fieldName) {
    const errorElement = this.form.querySelector(`#${fieldName}Error`);
    if (errorElement) errorElement.textContent = '';

    const inputElement = this.form.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
      inputElement.classList.remove('transaction-form__input--error');
      inputElement.classList.remove('transaction-form__select--error');
      inputElement.classList.remove('transaction-form__textarea--error');
    }
  }

  getFormData() {
    return {
      type: this.currentType,
      amount: this.amountInput.value,
      category: this.categorySelect.value,
      description: this.descriptionInput.value,
      date: this.dateInput.value,
    };
  }

  isEditing() {
    return this.editingId !== null;
  }

  getEditingId() {
    return this.editingId;
  }

  disable() {
    [this.submitBtn, this.amountInput, this.categorySelect, this.descriptionInput,
      this.dateInput, this.expenseTypeBtn, this.incomeTypeBtn].forEach((el) => { el.disabled = true; });
  }

  enable() {
    [this.submitBtn, this.amountInput, this.categorySelect, this.descriptionInput,
      this.dateInput, this.expenseTypeBtn, this.incomeTypeBtn].forEach((el) => { el.disabled = false; });
  }
}
