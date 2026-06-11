import express from 'express';
import { listTrevoCategories, listTrevoProducts, TrevoApiError } from '../../../lib/trevo-client.js';
import { buildCategoryMaps, mapTrevoProduct, sortMyPickProducts } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/featured/new-arrivals', async (_req, res) => {
    try {
        const [categories, productsResponse] = await Promise.all([
            listTrevoCategories(),
            listTrevoProducts({ page: 1, limit: 100 }),
        ]);

        const { byId: categoryById } = buildCategoryMaps(categories);
        const products = productsResponse.products.map((product) =>
            mapTrevoProduct(product, categoryById)
        );

        res.json(sortMyPickProducts(products, 'newest').slice(0, 8));
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error(error);
        res.status(500).json({ error: 'Failed to fetch new arrivals from Trevo' });
    }
});

export default router;
