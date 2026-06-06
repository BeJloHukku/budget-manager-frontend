/**
 * Formatters
 * Функции для форматирования данных (суммы, даты и т.д.)
 */

/**
 * Форматирует сумму в валюту
 * @param {number} amount - Сумма для форматирования
 * @param {string} currency - Код валюты (по умолчанию 'RUB')
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @returns {string} Отформатированная сумма
 */
export function formatCurrency(amount, currency = 'RUB', locale = 'ru-RU') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback на простое форматирование
    return `${amount.toFixed(2)} ₽`;
  }
}

/**
 * Форматирует сумму со знаком (+ для доходов, - для расходов)
 * @param {number} amount - Сумма
 * @param {string} type - Тип транзакции ('income' или 'expense')
 * @param {string} currency - Код валюты
 * @param {string} locale - Локаль
 * @returns {string} Отформатированная сумма со знаком
 */
export function formatSignedCurrency(amount, type, currency = 'RUB', locale = 'ru-RU') {
  const formatted = formatCurrency(Math.abs(amount), currency, locale);
  const sign = type === 'income' ? '+' : '-';
  return `${sign}${formatted}`;
}

/**
 * Форматирует дату в читаемый формат
 * @param {string|Date} date - Дата для форматирования
 * @param {string} format - Формат ('full', 'short', 'numeric')
 * @returns {string} Отформатированная дата
 */
export function formatDate(date, format = 'full') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Неверная дата';
  }

  const options = {
    full: { day: 'numeric', month: 'long', year: 'numeric' },
    short: { day: 'numeric', month: 'short' },
    numeric: { day: '2-digit', month: '2-digit', year: 'numeric' }
  };

  try {
    return dateObj.toLocaleDateString('ru-RU', options[format] || options.full);
  } catch (error) {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Форматирует дату относительно текущего момента
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} Относительная дата ('Сегодня', 'Вчера', '3 дня назад' и т.д.)
 */
export function formatRelativeDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Сбрасываем время для корректного сравнения дат
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(dateObj);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Прошедшие даты
  if (diffDays === 0) {
    return 'Сегодня';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays === 2) {
    return 'Позавчера';
  } else if (diffDays > 0 && diffDays < 7) {
    return `${diffDays} ${getDaysWord(diffDays)} назад`;
  } else if (diffDays > 0 && diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${getWeeksWord(weeks)} назад`;
  } else if (diffDays > 0 && diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${getMonthsWord(months)} назад`;
  }

  // Будущие даты (запланированные транзакции)
  const future = -diffDays;
  if (future === 1) {
    return 'Завтра';
  } else if (future === 2) {
    return 'Послезавтра';
  } else if (future > 0 && future < 7) {
    return `Через ${future} ${getDaysWord(future)}`;
  } else if (future > 0 && future < 30) {
    const weeks = Math.floor(future / 7);
    return `Через ${weeks} ${getWeeksWord(weeks)}`;
  } else if (future > 0 && future < 365) {
    const months = Math.floor(future / 30);
    return `Через ${months} ${getMonthsWord(months)}`;
  }

  return formatDate(dateObj, 'short');
}

/**
 * Возвращает правильное склонение слова "день"
 * @param {number} count - Количество дней
 * @returns {string} Склонение слова
 */
function getDaysWord(count) {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['день', 'дня', 'дней'];
  return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
}

/**
 * Возвращает правильное склонение слова "неделя"
 * @param {number} count - Количество недель
 * @returns {string} Склонение слова
 */
function getWeeksWord(count) {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['неделю', 'недели', 'недель'];
  return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
}

/**
 * Возвращает правильное склонение слова "месяц"
 * @param {number} count - Количество месяцев
 * @returns {string} Склонение слова
 */
function getMonthsWord(count) {
  const cases = [2, 0, 1, 1, 1, 2];
  const titles = ['месяц', 'месяца', 'месяцев'];
  return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
}

/**
 * Форматирует процент
 * @param {number} value - Значение процента
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированный процент
 */
export function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Форматирует число с разделителями тысяч
 * @param {number} number - Число для форматирования
 * @returns {string} Отформатированное число
 */
export function formatNumber(number) {
  return new Intl.NumberFormat('ru-RU').format(number);
}

/**
 * Форматирует дату для input[type="date"]
 * @param {Date} date - Дата
 * @returns {string} Дата в формате YYYY-MM-DD
 */
export function formatDateForInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует время
 * @param {string|Date} date - Дата/время
 * @returns {string} Отформатированное время
 */
export function formatTime(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return dateObj.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateObj.toLocaleTimeString();
  }
}

/**
 * Форматирует дату и время
 * @param {string|Date} date - Дата/время
 * @returns {string} Отформатированные дата и время
 */
export function formatDateTime(date) {
  return `${formatDate(date, 'short')} ${formatTime(date)}`;
}

/**
 * Сокращает текст до указанной длины
 * @param {string} text - Текст для сокращения
 * @param {number} maxLength - Максимальная длина
 * @returns {string} Сокращенный текст
 */
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Форматирует размер файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Получает название текущего месяца
 * @returns {string} Название месяца
 */
export function getCurrentMonthName() {
  const now = new Date();
  return now.toLocaleString('ru-RU', { month: 'long' });
}

/**
 * Получает текущую дату в формате для input
 * @returns {string} Текущая дата в формате YYYY-MM-DD
 */
export function getTodayForInput() {
  return formatDateForInput(new Date());
}
