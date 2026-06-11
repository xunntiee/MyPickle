import express from 'express';
import { listTrevoOrders, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoOrderToMyPick } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/history/all', async (req, res) => {
    try {
        const response = await listTrevoOrders({
            page: Number(req.query.page || 1),
            limit: Number(req.query.limit || 100),
            status: req.query.status,
            paymentStatus: req.query.paymentStatus,
            shippingStatus: req.query.shippingStatus,
        });

        res.json(response.orders.map(mapTrevoOrderToMyPick));
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching Trevo orders:', error);
        res.status(500).json({ error: 'Unable to fetch orders from Trevo.' });
    }
});

export default router;
