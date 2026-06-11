import express from 'express';
import { listTrevoCategories, listTrevoProducts, TrevoApiError } from '../../../lib/trevo-client.js';
import { buildCategoryMaps, mapTrevoProduct } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/featured/on-sale', async (_req, res) => {
    try {
        const [categories, productsResponse] = await Promise.all([
            listTrevoCategories(),
            listTrevoProducts({ page: 1, limit: 100 }),
        ]);

        const { byId: categoryById } = buildCategoryMaps(categories);
        const products = productsResponse.products
            .map((product) => mapTrevoProduct(product, categoryById))
            .filter((product) => product.original_price && product.price < product.original_price)
            .sort((a, b) => {
                const aDiscount = a.original_price - a.price;
                const bDiscount = b.original_price - b.price;
                return bDiscount - aDiscount;
            })
            .slice(0, 8);

        res.json(products);
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error(error);
        res.status(500).json({ error: 'Failed to fetch on-sale products from Trevo' });
    }
});

export default router;
