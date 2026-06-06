const LS_KEY_API_URL = 'budget_api_url';
const PRODUCTION_API_URL = 'https://api.example.com';

const API_BASE_URL = "https://budget-manager-api-ccp9.onrender.com/api/v1"

// Время жизни JWT токена (в миллисекундах)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 60 минут

// Ключи для localStorage
const STORAGE_KEYS = {
    TOKEN: 'budget_token',
    USER_ID: 'budget_user_id',
    USER_EMAIL: 'budget_user_email',
    API_URL: LS_KEY_API_URL,
};

export { API_BASE_URL, TOKEN_EXPIRY_MS, STORAGE_KEYS };
