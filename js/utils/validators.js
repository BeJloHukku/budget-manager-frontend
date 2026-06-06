/**
 * Validators
 * Функции для валидации данных форм
 */

/**
 * Валидирует сумму транзакции
 * @param {string|number} amount - Сумма для валидации
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateAmount(amount) {
  if (!amount || amount === '') {
    return { valid: false, error: 'Сумма обязательна' };
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Сумма должна быть числом' };
  }

  if (numAmount <= 0) {
    return { valid: false, error: 'Сумма должна быть больше нуля' };
  }

  if (numAmount > 999999999) {
    return { valid: false, error: 'Сумма слишком большая' };
  }

  return { valid: true, error: '' };
}

/**
 * Валидирует дату транзакции
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateDate(date) {
  if (!date || date === '') {
    return { valid: false, error: 'Дата обязательна' };
  }

  const transactionDate = new Date(date);
  
  if (isNaN(transactionDate.getTime())) {
    return { valid: false, error: 'Неверный формат даты' };
  }

  // Проверка на слишком старую дату (более 10 лет назад)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (transactionDate < tenYearsAgo) {
    return { valid: false, error: 'Дата слишком старая' };
  }

  // Проверка на слишком далёкое будущее (более 10 лет вперёд)
  const tenYearsAhead = new Date();
  tenYearsAhead.setFullYear(tenYearsAhead.getFullYear() + 10);

  if (transactionDate > tenYearsAhead) {
    return { valid: false, error: 'Дата слишком далеко в будущем' };
  }

  return { valid: true, error: '' };
}

/**
 * Валидирует категорию
 * @param {string} category - ID категории
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateCategory(category) {
  if (!category || category === '') {
    return { valid: false, error: 'Категория обязательна' };
  }

  return { valid: true, error: '' };
}

/**
 * Валидирует описание транзакции
 * @param {string} description - Описание
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateDescription(description) {
  if (!description || description.trim() === '') {
    return { valid: false, error: 'Описание обязательно' };
  }

  if (description.length > 200) {
    return { valid: false, error: 'Описание не должно превышать 200 символов' };
  }

  if (description.length < 3) {
    return { valid: false, error: 'Описание должно содержать минимум 3 символа' };
  }

  return { valid: true, error: '' };
}

/**
 * Валидирует тип транзакции
 * @param {string} type - Тип транзакции
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateType(type) {
  if (!type || !['income', 'expense'].includes(type)) {
    return { valid: false, error: 'Неверный тип транзакции' };
  }

  return { valid: true, error: '' };
}

/**
 * Валидирует всю форму транзакции
 * @param {Object} data - Данные формы
 * @returns {Object} Результат валидации {valid: boolean, errors: Object}
 */
export function validateTransactionForm(data) {
  const errors = {};
  let isValid = true;

  // Валидация типа
  const typeValidation = validateType(data.type);
  if (!typeValidation.valid) {
    errors.type = typeValidation.error;
    isValid = false;
  }

  // Валидация суммы
  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.valid) {
    errors.amount = amountValidation.error;
    isValid = false;
  }

  // Валидация категории
  const categoryValidation = validateCategory(data.category);
  if (!categoryValidation.valid) {
    errors.category = categoryValidation.error;
    isValid = false;
  }

  // Валидация описания
  const descriptionValidation = validateDescription(data.description);
  if (!descriptionValidation.valid) {
    errors.description = descriptionValidation.error;
    isValid = false;
  }

  // Валидация даты
  const dateValidation = validateDate(data.date);
  if (!dateValidation.valid) {
    errors.date = dateValidation.error;
    isValid = false;
  }

  return {
    valid: isValid,
    errors
  };
}

/**
 * Очищает ошибки валидации в форме
 * @param {HTMLFormElement} form - Форма для очистки
 */
export function clearValidationErrors(form) {
  const errorElements = form.querySelectorAll('.transaction-form__error');
  errorElements.forEach(el => {
    el.textContent = '';
  });

  const inputElements = form.querySelectorAll('.transaction-form__input, .transaction-form__select, .transaction-form__textarea');
  inputElements.forEach(el => {
    el.classList.remove('transaction-form__input--error');
    el.classList.remove('transaction-form__select--error');
    el.classList.remove('transaction-form__textarea--error');
  });
}

/**
 * Отображает ошибки валидации в форме
 * @param {HTMLFormElement} form - Форма
 * @param {Object} errors - Объект с ошибками
 */
export function displayValidationErrors(form, errors) {
  // Сначала очищаем предыдущие ошибки
  clearValidationErrors(form);

  // Отображаем новые ошибки
  Object.keys(errors).forEach(fieldName => {
    const errorMessage = errors[fieldName];
    
    // Находим элемент для отображения ошибки
    const errorElement = form.querySelector(`#${fieldName}Error`);
    if (errorElement) {
      errorElement.textContent = errorMessage;
    }

    // Добавляем класс ошибки к полю ввода
    const inputElement = form.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
      if (inputElement.tagName === 'SELECT') {
        inputElement.classList.add('transaction-form__select--error');
      } else if (inputElement.tagName === 'TEXTAREA') {
        inputElement.classList.add('transaction-form__textarea--error');
      } else {
        inputElement.classList.add('transaction-form__input--error');
      }
    }
  });
}

/**
 * Санитизирует строку (удаляет потенциально опасные символы)
 * @param {string} str - Строка для санитизации
 * @returns {string} Санитизированная строка
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Удаляем < и >
    .substring(0, 200); // Ограничиваем длину
}

/**
 * Валидирует email (для будущего расширения)
 * @param {string} email - Email для валидации
 * @returns {Object} Результат валидации {valid: boolean, error: string}
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email обязателен' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Неверный формат email' };
  }

  return { valid: true, error: '' };
}
