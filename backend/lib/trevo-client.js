const DEFAULT_TREVO_API_URL = 'http://127.0.0.1:4400/api/external';

export class TrevoApiError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = 'TrevoApiError';
        this.status = status;
        this.details = details;
    }
}

function trimTrailingSlash(value) {
    return String(value ?? '').replace(/\/+$/, '');
}

function getTrevoConfig() {
    const apiUrl = trimTrailingSlash(
        process.env.TREVO_API_URL ||
        process.env.TREVO_EXTERNAL_API_URL ||
        DEFAULT_TREVO_API_URL
    );
    const apiKey = process.env.TREVO_API_KEY?.trim();
    const origin =
        process.env.TREVO_ORIGIN?.trim() ||
        process.env.FRONTEND_URL?.trim() ||
        '';

    if (!apiKey) {
        throw new TrevoApiError(
            'Missing TREVO_API_KEY. Create an API key in Trevo organization settings and put it in MyPick backend env.',
            500
        );
    }

    return { apiUrl, apiKey, origin };
}

function appendQueryParams(url, query = {}) {
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        url.searchParams.set(key, String(value));
    });
}

async function parseResponse(response) {
    const text = await response.text();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export async function trevoRequest(path, options = {}) {
    const { apiUrl, apiKey, origin } = getTrevoConfig();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${apiUrl}${normalizedPath}`);
    appendQueryParams(url, options.query);

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        ...(options.headers || {}),
    };

    if (origin) {
        headers.Origin = origin;
    }

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const payload = await parseResponse(response);
    if (!response.ok || payload?.success === false) {
        throw new TrevoApiError(
            payload?.message || payload?.error || `Trevo API request failed: ${response.status}`,
            response.status,
            payload
        );
    }

    return payload;
}

export async function listTrevoProducts(query = {}) {
    const response = await trevoRequest('/products', { query });

    return {
        products: Array.isArray(response?.data) ? response.data : [],
        meta: response?.meta || null,
    };
}

export async function getTrevoProduct(productId) {
    const response = await trevoRequest(`/products/${encodeURIComponent(productId)}`);
    return response?.data || null;
}

export async function listTrevoCategories() {
    const response = await trevoRequest('/categories');
    return Array.isArray(response?.data) ? response.data : [];
}

export async function createTrevoOrder(orderPayload) {
    const response = await trevoRequest('/orders', {
        method: 'POST',
        body: orderPayload,
    });

    return response?.data || null;
}

export async function getTrevoOrder(orderId) {
    const response = await trevoRequest(`/orders/${encodeURIComponent(orderId)}`);
    return response?.data || null;
}

export async function listTrevoOrders(query = {}) {
    const response = await trevoRequest('/orders', { query });

    return {
        orders: Array.isArray(response?.data) ? response.data : [],
        meta: response?.meta || null,
    };
}

export async function listTrevoCustomers(query = {}) {
    const response = await trevoRequest('/customers', { query });

    return {
        customers: Array.isArray(response?.data) ? response.data : [],
        meta: response?.meta || null,
    };
}

export async function createTrevoCustomer(customerPayload) {
    const response = await trevoRequest('/customers', {
        method: 'POST',
        body: customerPayload,
    });

    return response?.data || null;
}
