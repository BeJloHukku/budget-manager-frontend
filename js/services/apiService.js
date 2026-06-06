/**
 * API Service — обёртка над fetch с JWT.
 */

import { API_BASE_URL, STORAGE_KEYS } from '../config.js';

function formatApiError(payload, status, statusText) {
    const detail = payload && payload.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item && typeof item.msg === 'string') {
                    const loc = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : '';
                    return loc ? `${loc}: ${item.msg}` : item.msg;
                }
                return JSON.stringify(item);
            })
            .join('; ');
    }
    if (detail && typeof detail === 'object') return JSON.stringify(detail);
    return `HTTP ${status}: ${statusText}`;
}

class ApiService {
    constructor() {
        this.baseUrl = `${API_BASE_URL}/api/v1`;
        this.rootUrl = API_BASE_URL;
    }

    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    setToken(token) {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        } else {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
        }
    }

    setUser(userId, email) {
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    }

    getUserId() {
        return localStorage.getItem(STORAGE_KEYS.USER_ID);
    }

    getUserEmail() {
        return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    logout() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            ...options.headers,
        };
        // Content-Type выставляем только для JSON-body, иначе fetch проставит сам (например, для form-data)
        if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            this.logout();
            throw new Error('Unauthorized. Please login again.');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(formatApiError(error, response.status, response.statusText));
        }

        if (response.status === 204) return null;
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
    }

    patch(endpoint, data) {
        return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== AUTH =====

    async register(email, password) {
        return this.post('/auth/register', { email, password });
    }

    /** /auth/login использует OAuth2PasswordRequestForm — отдаём form-data с полем username. */
    async login(email, password) {
        const body = new URLSearchParams();
        body.append('username', email);
        body.append('password', password);

        const tokenResp = await this.request('/auth/login', {
            method: 'POST',
            body: body.toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        this.setToken(tokenResp.access_token);

        try {
            const me = await this.getMe();
            this.setUser(me.id, me.email);
        } catch (_) {
            // токен сохранён, /me не критичен
        }

        return tokenResp;
    }

    getMe() {
        return this.get('/auth/me');
    }

    // ===== TRANSACTIONS =====

    getTransactions(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.get(qs ? `/transactions?${qs}` : '/transactions');
    }

    createTransaction(data) {
        return this.post('/transactions', data);
    }

    updateTransaction(transactionId, data) {
        return this.patch(`/transactions/${transactionId}`, data);
    }

    deleteTransaction(transactionId) {
        return this.delete(`/transactions/${transactionId}`);
    }

    getStats(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.get(qs ? `/transactions/stats?${qs}` : '/transactions/stats');
    }

    // ===== CATEGORIES =====

    getCategories() {
        return this.get('/categories');
    }

    createCategory(name) {
        return this.post('/categories', { name });
    }

    updateCategory(categoryId, name) {
        return this.patch(`/categories/${categoryId}`, { name });
    }

    deleteCategory(categoryId) {
        return this.delete(`/categories/${categoryId}`);
    }
}

export default new ApiService();
