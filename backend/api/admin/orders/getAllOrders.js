import express from 'express';
import { listTrevoOrders, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoOrderToMyPick } from '../../../lib/trevo-mapper.js';

const router = express.Router();

const LEGACY_STATUS_TO_TREVO = {
    cho_xac_nhan: 'pending',
    da_xac_nhan: 'confirmed',
    dang_giao: 'confirmed',
    da_nhan: 'completed',
    doi_hang: 'completed',
    tra_hang: 'completed',
    hoan_tien: 'cancelled',
    da_huy: 'cancelled',
    huy_sau_xac_nhan: 'cancelled',
    giao_that_bai: 'cancelled',
};

async function listTrevoOrdersForAdmin() {
    const pageSize = 100;
    const allOrders = [];
    let page = 1;

    while (page <= 20) {
        const response = await listTrevoOrders({ page, limit: pageSize });
        allOrders.push(...response.orders);

        const totalPages = Number(
            response.meta?.totalPages ||
            response.meta?.total_pages ||
            Math.ceil(Number(response.meta?.total || allOrders.length) / pageSize)
        );

        if (!response.orders.length || !totalPages || page >= totalPages) {
            break;
        }

        page += 1;
    }

    return allOrders;
}

function buildDashboardStats(orders) {
    const completedOrders = orders.filter((order) => order.status === 'completed');
    const productTotals = new Map();

    for (const order of completedOrders) {
        for (const item of order.items || []) {
            const productName = item.product_name || item.name || 'Unknown product';
            productTotals.set(productName, (productTotals.get(productName) || 0) + Number(item.quantity || 0));
        }
    }

    return {
        totalOrdersFiltered: orders.length,
        totalRevenueFiltered: completedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
        failedOrders: orders.filter((order) => order.status === 'cancelled').length,
        successfulOrders: completedOrders.length,
        totalItemsSold: completedOrders.reduce(
            (sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
            0
        ),
        topSellingProducts: [...productTotals.entries()]
            .map(([product_name, total_sold]) => ({ product_name, total_sold }))
            .sort((a, b) => b.total_sold - a.total_sold)
            .slice(0, 3),
    };
}

function filterOrders(orders, query) {
    const {
        search = '',
        startDate,
        endDate,
        salesType,
        statusFilter,
    } = query;
    const normalizedSearch = String(search).trim().toLowerCase();
    const trevoStatusFilter = LEGACY_STATUS_TO_TREVO[statusFilter] || statusFilter;

    return orders.filter((order) => {
        const haystack = [
            order.order_code,
            order.customer_name,
            order.customer_phone,
            order.customer_email,
        ].join(' ').toLowerCase();
        const createdAt = order.created_at ? new Date(order.created_at) : null;
        const afterStart = !startDate || (createdAt && createdAt >= new Date(String(startDate)));
        const beforeEnd = !endDate || (createdAt && createdAt <= new Date(`${endDate}T23:59:59`));
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
        const matchesSalesType = !salesType || salesType === 'all' || order.order_type === salesType;
        const matchesStatus = !trevoStatusFilter || trevoStatusFilter === 'all' || order.status === trevoStatusFilter;

        return matchesSearch && afterStart && beforeEnd && matchesSalesType && matchesStatus;
    });
}

router.get('/', async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.max(Number(req.query.limit || 5), 1);
        const trevoOrders = await listTrevoOrdersForAdmin();
        const mappedOrders = trevoOrders.map(mapTrevoOrderToMyPick);
        const filteredOrders = filterOrders(mappedOrders, req.query);
        const offset = (page - 1) * limit;

        res.json({
            orders: filteredOrders.slice(offset, offset + limit),
            totalCount: filteredOrders.length,
            dashboardStats: buildDashboardStats(filteredOrders),
        });
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error loading Trevo admin orders:', error);
        res.status(500).json({ error: 'Unable to load orders from Trevo.' });
    }
});

export default router;
