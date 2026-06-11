import express from 'express';
import { getTrevoOrder, listTrevoOrders, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoOrderToMyPick } from '../../../lib/trevo-mapper.js';

const router = express.Router();

async function findTrevoOrderByPublicCode(orderCode) {
    try {
        return await getTrevoOrder(orderCode);
    } catch (error) {
        if (!(error instanceof TrevoApiError) || error.status !== 404) {
            throw error;
        }
    }

    const response = await listTrevoOrders({ page: 1, limit: 100 });
    return response.orders.find((order) => {
        return order.id === orderCode || order.orderNumber === orderCode;
    }) || null;
}

router.get('/:orderCode', async (req, res) => {
    try {
        const order = await findTrevoOrderByPublicCode(req.params.orderCode);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(mapTrevoOrderToMyPick(order));
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching Trevo order:', error);
        res.status(500).json({ error: 'Unable to fetch order from Trevo.' });
    }
});

export default router;
