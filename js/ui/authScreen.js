/**
 * Auth Screen — управление экраном логина/регистрации.
 * Разметка лежит в index.html (#authScreen). Этот модуль только подключает
 * обработчики, переключает режим login/register и вызывает apiService.
 */

import apiService from '../services/apiService.js';

class AuthScreen {
    constructor() {
        this.mode = 'login'; // 'login' | 'register'
        this.isLoading = false;

        // DOM-элементы (получаем лениво в init)
        this.root = null;
        this.form = null;
        this.tabLogin = null;
        this.tabRegister = null;
        this.emailInput = null;
        this.passwordInput = null;
        this.passwordConfirmInput = null;
        this.passwordConfirmField = null;
        this.errorBox = null;
        this.submitBtn = null;

        this.onSuccess = null;
    }

    /**
     * Инициализирует обработчики на уже существующей разметке.
     * @param {{ onSuccess?: () => void }} [options]
     */
    init(options = {}) {
        this.root = document.getElementById('authScreen');
        if (!this.root) {
            console.warn('AuthScreen: #authScreen не найден в DOM');
            return;
        }

        this.form = document.getElementById('authForm');
        this.tabLogin = document.getElementById('authTabLogin');
        this.tabRegister = document.getElementById('authTabRegister');
        this.emailInput = document.getElementById('authEmail');
        this.passwordInput = document.getElementById('authPassword');
        this.passwordConfirmInput = document.getElementById('authPasswordConfirm');
        this.passwordConfirmField = document.getElementById('authPasswordConfirmField');
        this.errorBox = document.getElementById('authError');
        this.submitBtn = document.getElementById('authSubmit');

        this.onSuccess = options.onSuccess || null;

        this.tabLogin.addEventListener('click', () => this.setMode('login'));
        this.tabRegister.addEventListener('click', () => this.setMode('register'));
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleSubmit();
        });

        this.applyMode();
    }

    /** Показывает экран авторизации. */
    show() {
        if (this.root) {
            this.root.hidden = false;
            this.emailInput?.focus();
        }
    }

    /** Скрывает экран авторизации. */
    hide() {
        if (this.root) {
            this.root.hidden = true;
        }
    }

    /**
     * Переключает режим экрана.
     * @param {'login'|'register'} mode
     */
    setMode(mode) {
        if (mode !== 'login' && mode !== 'register') return;
        this.mode = mode;
        this.clearError();
        this.applyMode();
    }

    /** Применяет текущий режим к DOM. */
    applyMode() {
        const isRegister = this.mode === 'register';

        this.tabLogin?.classList.toggle('auth-screen__tab--active', !isRegister);
        this.tabRegister?.classList.toggle('auth-screen__tab--active', isRegister);

        if (this.passwordConfirmField) {
            this.passwordConfirmField.hidden = !isRegister;
        }

        if (this.passwordConfirmInput) {
            this.passwordConfirmInput.required = isRegister;
            if (!isRegister) {
                this.passwordConfirmInput.value = '';
            }
        }

        if (this.passwordInput) {
            this.passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
        }

        if (this.submitBtn) {
            this.submitBtn.textContent = isRegister ? 'Зарегистрироваться' : 'Войти';
        }
    }

    /** Обрабатывает submit формы. */
    async handleSubmit() {
        if (this.isLoading) return;

        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;

        this.clearError();

        if (!email || !password) {
            this.showError('Заполните все поля');
            return;
        }

        if (this.mode === 'register') {
            const confirm = this.passwordConfirmInput.value;
            if (password !== confirm) {
                this.showError('Пароли не совпадают');
                return;
            }
            if (password.length < 6) {
                this.showError('Пароль должен быть минимум 6 символов');
                return;
            }
        }

        this.setLoading(true);

        try {
            if (this.mode === 'login') {
                await apiService.login(email, password);
            } else {
                await apiService.register(email, password);
                await apiService.login(email, password);
            }

            this.hide();
            if (typeof this.onSuccess === 'function') {
                this.onSuccess();
            } else {
                window.location.reload();
            }
        } catch (error) {
            this.showError(error.message || 'Ошибка авторизации');
        } finally {
            this.setLoading(false);
        }
    }

    /** Управляет состоянием загрузки. */
    setLoading(loading) {
        this.isLoading = loading;
        if (this.submitBtn) {
            this.submitBtn.disabled = loading;
            if (loading) {
                this.submitBtn.textContent = 'Загрузка...';
            } else {
                this.applyMode();
            }
        }
    }

    /** Показывает сообщение об ошибке. */
    showError(message) {
        if (!this.errorBox) return;
        this.errorBox.textContent = message;
        this.errorBox.hidden = false;
    }

    /** Очищает сообщение об ошибке. */
    clearError() {
        if (!this.errorBox) return;
        this.errorBox.textContent = '';
        this.errorBox.hidden = true;
    }
}

export default new AuthScreen();
