import express from 'express';
import { listTrevoOrders, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoOrderToMyPick } from '../../../lib/trevo-mapper.js';

const router = express.Router();

function orderMatchesIdentity(order, { customerId, phone, email }) {
    const deliveryInfo = order.deliveryInfo || {};
    const customer = order.customer || {};

    if (customerId && order.customerId === customerId) {
        return true;
    }

    if (phone) {
        const normalizedQueryPhone = String(phone).replace(/[\s.\-()]/g, '');
        const candidatePhones = [
            deliveryInfo.recipientPhone,
            customer.phone,
        ].filter(Boolean).map((value) => String(value).replace(/[\s.\-()]/g, ''));

        if (candidatePhones.includes(normalizedQueryPhone)) {
            return true;
        }
    }

    if (email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        if (customer.email && String(customer.email).trim().toLowerCase() === normalizedEmail) {
            return true;
        }
    }

    return false;
}

router.get('/history', async (req, res) => {
    try {
        const { customerId, phone, email } = req.query;

        if (!customerId && !phone && !email) {
            return res.status(400).json({ message: 'Missing customer identity.' });
        }

        const response = await listTrevoOrders({
            page: 1,
            limit: Number(req.query.limit || 100),
        });

        const orders = response.orders
            .filter((order) => orderMatchesIdentity(order, { customerId, phone, email }))
            .map(mapTrevoOrderToMyPick)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        res.json(orders);
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching Trevo order history:', error);
        res.status(500).json({ error: 'Unable to fetch order history from Trevo.' });
    }
});

export default router;
