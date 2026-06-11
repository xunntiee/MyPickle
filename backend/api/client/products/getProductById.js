import express from 'express';
import { getTrevoProduct, listTrevoCategories, TrevoApiError } from '../../../lib/trevo-client.js';
import { buildCategoryMaps, mapTrevoProduct } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
    try {
        const [product, categories] = await Promise.all([
            getTrevoProduct(req.params.id),
            listTrevoCategories(),
        ]);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const { byId: categoryById } = buildCategoryMaps(categories);
        res.json(mapTrevoProduct(product, categoryById));
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching product from Trevo:', error);
        res.status(500).json({ error: 'Failed to fetch product from Trevo' });
    }
});

export default router;
