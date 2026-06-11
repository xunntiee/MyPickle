import express from 'express';
import { listTrevoCategories, TrevoApiError } from '../../../lib/trevo-client.js';
import { mapTrevoCategory } from '../../../lib/trevo-mapper.js';

const router = express.Router();

router.get('/:slug', async (req, res) => {
    try {
        const categories = (await listTrevoCategories()).map(mapTrevoCategory);
        const category = categories.find((item) => item.slug === req.params.slug);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        if (error instanceof TrevoApiError) {
            return res.status(error.status || 500).json({
                error: error.message,
                details: error.details,
            });
        }

        console.error('Error fetching category from Trevo:', error);
        res.status(500).json({ error: 'Failed to fetch category from Trevo' });
    }
});

export default router;
